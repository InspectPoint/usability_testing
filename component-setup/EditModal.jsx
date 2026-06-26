// EditModal.jsx — Component detail/edit MODAL (replaces the edit drawer).
// Built on the real Quimby molecules:
//   • Modal            — molecules/Modal (qmb-ui-modal-wrapper > overlay + qmb-ui-modal)
//   • InlineText       — molecules/inputs/inline/InlineText (qmb-ui-inline-edit, contentEditable)
//   • InlineSelect     — molecules/inputs/inline/InlineSelect (dropdown trigger + Popup action list)
// Creation still happens in the brushaway; this modal is the edit surface, and
// every field commits inline (on blur / selection) the way Quimby inline-edit does.

const MODAL_STATUS_TAG = {
  passed:    { variant: 'green', label: 'Passed' },
  deficient: { variant: 'red',   label: 'Deficient' },
  untested:  { variant: 'gray',  label: 'Untested' },
};

// ─── InlineText — contentEditable, commits on blur; Enter blurs, Esc reverts ──
function InlineText({ value, onCommit, placeholder = '', multiline = false, width = 'full', disableEdit = false, label, ariaLabel }) {
  const ref = React.useRef(null);
  // keep the DOM text in sync when the underlying value changes externally
  React.useEffect(() => {
    if (ref.current && ref.current.textContent !== (value || '')) ref.current.textContent = value || '';
  }, [value]);

  const cls = [
    'qmb-ui-inline-edit',
    width === 'full' ? 'qmb-ui-inline-edit--x-full' : '',
    multiline ? 'qmb-ui-inline-edit--multiline' : '',
    disableEdit ? 'qmb-ui-inline-edit--disabled' : '',
  ].filter(Boolean).join(' ');

  const onKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey && !multiline) { e.preventDefault(); e.currentTarget.blur(); }
    else if (e.key === 'Escape') { e.preventDefault(); e.currentTarget.textContent = value || ''; e.currentTarget.blur(); }
  };
  const onBlur = (e) => {
    const next = (e.currentTarget.textContent || '').trim();
    if (next !== (value || '')) onCommit(next);
  };

  return (
    <div
      ref={ref}
      className={cls}
      contentEditable={!disableEdit}
      suppressContentEditableWarning
      role={disableEdit ? undefined : 'textbox'}
      tabIndex={disableEdit ? -1 : 0}
      spellCheck={!disableEdit}
      aria-label={ariaLabel}
      data-placeholder={placeholder}
      data-label={label || ''}
      onKeyDown={disableEdit ? undefined : onKeyDown}
      onBlur={disableEdit ? undefined : onBlur}>
      {value || ''}
    </div>
  );
}

// ─── InlineSelect — dropdown trigger + Popup action list ──────────────────────
function InlineSelect({ value, options, onChange, placeholder = 'None', label, width = 'full', disabled = false, includeNone = false, track }) {
  const [open, setOpen] = React.useState(false);
  const anchorRef = React.useRef(null);
  const opts = options.map(o => (typeof o === 'string' ? { value: o, label: o } : o));
  const current = opts.find(o => o.value === value);

  const cls = [
    'qmb-ui-inline-edit',
    'qmb-ui-inline-edit--dropdown',
    width === 'full' ? 'qmb-ui-inline-edit--x-full' : '',
  ].filter(Boolean).join(' ');

  return (
    <div className={`qmb-ui-inline-select ${width === 'full' ? 'is-full' : ''}`}>
      <div
        ref={anchorRef}
        className={cls}
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-haspopup="listbox"
        aria-expanded={open}
        data-track={track}
        onClick={() => !disabled && setOpen(o => !o)}
        onKeyDown={(e) => { if (!disabled && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); setOpen(o => !o); } }}>
        {label ? <span style={{ color: 'var(--gray-500)', marginRight: 4 }}>{label}: </span> : null}
        <span className="selectValue" style={!current ? { color: 'var(--gray-500)' } : null}>
          {current ? current.label : placeholder}
        </span>
        <i className="ie-caret fa-solid fa-angle-down" aria-hidden="true"></i>
      </div>
      <BodyPopup open={open} anchor={anchorRef.current} matchWidth={width === 'full'} width={220}
        className="qmb-ui-popup--action-list" onClose={() => setOpen(false)}>
        <div className="popup__section" style={{ maxHeight: 280, overflowY: 'auto' }}>
          <ul className="qmb-ui-popup__action-list">
            {includeNone && (
              <li>
                <button className={`qmb-ui-button ${!value ? 'is-selected' : ''}`}
                  onClick={() => { onChange(''); setOpen(false); }}>
                  None
                  {!value && <i className="fa-light fa-check" style={{ marginLeft: 'auto' }}></i>}
                </button>
              </li>
            )}
            {opts.map(o => (
              <li key={String(o.value)}>
                <button className={`qmb-ui-button ${o.value === value ? 'is-selected' : ''}`}
                  onClick={() => { onChange(o.value); setOpen(false); }}>
                  {o.label}
                  {o.value === value && <i className="fa-light fa-check" style={{ marginLeft: 'auto' }}></i>}
                </button>
              </li>
            ))}
          </ul>
        </div>
      </BodyPopup>
    </div>
  );
}

// One label + field row in the modal's two-column grid.
function Row({ label, children }) {
  return (
    <>
      <div className="cform__label">{label}</div>
      <div className="cform__field">{children}</div>
    </>
  );
}

// ─── Component modal ──────────────────────────────────────────────────────────
function EditModal({ comp, systems, components, onClose, onSave, onDeactivate, onAdd, onCreateChild, onDeactivateChild }) {
  if (!comp) return null;
  const isGroup = comp.role === 'group';
  const [addingInline, setAddingInline] = React.useState(false);
  const defType = (comp.type || '').replace(/\s*Group$/i, '').trim();
  const [newName, setNewName] = React.useState('');
  const [newType, setNewType] = React.useState(defType);
  const [newLoc,  setNewLoc]  = React.useState('');
  const types = window.COMPONENT_TYPES || [];
  const commitInline = () => {
    if (!newName.trim()) return;
    onCreateChild && onCreateChild({ name: newName.trim(), type: newType || defType, location: newLoc, system: comp.system, parentId: comp.id, role: 'individual' });
    setNewName(''); setNewType(defType); setNewLoc(''); setAddingInline(false);
  };
  const cancelInline = () => { setNewName(''); setNewType(defType); setNewLoc(''); setAddingInline(false); };
  const specs = window.specsFor(comp.type);
  const members = components.filter(c => c.parentId === comp.id);

  // commit one top-level field
  const set = (k, v) => onSave({ ...comp, [k]: v });
  // commit one type-specific spec answer
  const setSpec = (k, v) => onSave({ ...comp, specs: { ...(comp.specs || {}), [k]: v } });

  const statusOpts = [
    { value: 'passed', label: 'Passed' },
    { value: 'deficient', label: 'Deficient' },
    { value: 'untested', label: 'Untested' },
  ];
  const roleOpts = [
    { value: 'individual', label: 'Single' },
    { value: 'group', label: 'Group' },
  ];
  // flip the component between group and individual config in place
  const setRole = (r) => {
    if (r === comp.role) return;
    if (r === 'group') onSave({ ...comp, role: 'group', status: undefined });
    else onSave({ ...comp, role: 'individual', status: comp.status || 'untested' });
  };
  const memberOpts = members.map(m => ({ value: m.id, label: m.name }));

  // “Attached to” destinations: each system (top level) + compatible groups within,
  // excluding self and any descendant (no cycles), filtered to the same family.
  const byId = Object.fromEntries(components.map(c => [c.id, c]));
  const isDescendant = (id, anc) => { let cur = byId[id]; while (cur && cur.parentId) { if (cur.parentId === anc) return true; cur = byId[cur.parentId]; } return false; };
  const attachOpts = [];
  systems.forEach(sys => {
    attachOpts.push({ value: `sys:${sys.id}`, label: <span className="cmodal-dest"><i className="fa-light fa-diagram-project"></i>{sys.name}<span className="cmodal-dest__hint">top level</span></span> });
    components
      .filter(g => g.role === 'group' && g.system === sys.id && g.id !== comp.id && !isDescendant(g.id, comp.id) && (window.sameFamily ? window.sameFamily(comp.type, g.type) : true))
      .forEach(g => attachOpts.push({ value: `grp:${g.id}`, label: <span className="cmodal-dest cmodal-dest--child"><i className="fa-light fa-layer-group"></i>{g.name}</span> }));
  });
  const attachValue = comp.parentId ? `grp:${comp.parentId}` : (comp.system ? `sys:${comp.system}` : '');
  const setAttach = (v) => {
    if (v.startsWith('grp:')) { const g = byId[v.slice(4)]; if (g) onSave({ ...comp, parentId: g.id, system: g.system }); }
    else if (v.startsWith('sys:')) onSave({ ...comp, parentId: null, system: v.slice(4) });
  };

  return ReactDOM.createPortal(
    <div className="qmb-ui-modal-wrapper">
      <div className="qmb-ui-modal-overlay" onClick={onClose}></div>
      <div className="qmb-ui-modal cmodal" role="dialog" aria-modal="true" aria-label={`Component: ${comp.name}`}>
        <header className="qmb-ui-modal-header">
          <div className="qmb-ui-modal-header__row qmb-ui-modal-header__row--title">
            <div className="qmb-ui-modal-header__title">
              <span className="qmb-ui-text">Component: <b>{comp.name || 'Untitled'}</b></span>
            </div>
            <div className="qmb-ui-modal-header__actions">
              <button className="modal-deact is-danger" onClick={() => onDeactivate(comp)}>
                <i className="fa-light fa-ban"></i>Deactivate
              </button>
              <button className="qmb-ui-button comp-iconbtn" aria-label="Close" onClick={onClose}>
                <i className="fa-light fa-xmark"></i>
              </button>
            </div>
          </div>
          <hr className="qmb-ui-modal-header__divider" aria-hidden="true" />
        </header>

        <div className="qmb-ui-modal-body">
          <div className="cform">
            <Row label="Type:">
              <div className="cform__field--ro">{comp.type}{isGroup && comp.role === 'group' && !/Group$/.test(comp.type) ? ' Group' : ''}</div>
            </Row>

            <Row label="Item type:">
              <div className="qmb-ui-radio-group__options cform__radiorow" role="radiogroup" aria-label="Item type">
                {roleOpts.map(o => (
                  <label key={o.value} className={`qmb-ui-radio ${comp.role === o.value ? 'qmb-ui-radio--selected' : ''}`}>
                    <input type="radio" name={`role-${comp.id}`} checked={comp.role === o.value} onChange={() => setRole(o.value)} />
                    <span className="qmb-ui-radio__label">{o.label}</span>
                  </label>
                ))}
              </div>
            </Row>

            <Row label="Name:">
              <InlineText value={comp.name} onCommit={v => set('name', v)} ariaLabel="Name" />
            </Row>

            <Row label="Description:">
              <InlineText value={comp.description} onCommit={v => set('description', v)} multiline ariaLabel="Description" />
            </Row>

            <Row label="Attached to:">
              <InlineSelect value={attachValue} options={attachOpts} onChange={setAttach} width="auto" />
            </Row>

            {!isGroup && window.SHOW_STATUS && (
              <Row label="Status:">
                <InlineSelect value={comp.status || 'untested'} options={statusOpts} onChange={v => set('status', v)} width="auto" />
              </Row>
            )}

            {isGroup && (
              <Row label="Main component:">
                <InlineSelect value={comp.mainComponent || ''} options={memberOpts} onChange={v => set('mainComponent', v)} includeNone width="auto" />
              </Row>
            )}

            <Row label="Location:">
              <InlineText value={comp.location} onCommit={v => set('location', v)} ariaLabel="Location" />
            </Row>

            <Row label="Barcode:">
              <InlineText value={comp.barcode} onCommit={v => set('barcode', v)} ariaLabel="Barcode" />
            </Row>

            <Row label="External ID:">
              <InlineText value={comp.externalId} onCommit={v => set('externalId', v)} ariaLabel="External ID" />
            </Row>

            <Row label="Notes:">
              <InlineText value={comp.notes} onCommit={v => set('notes', v)} multiline ariaLabel="Notes" />
            </Row>

            {isGroup && (
              <div className="cform__members">
                <div className="members-card">
                  <div className="members-card__head">
                    <h5>{members.length} component{members.length === 1 ? '' : 's'} in this group</h5>
                    <button type="button" className="qmb-ui-button comp-iconbtn" title="Add component to group" onClick={()=>setAddingInline(true)}>
                      <i className="fa-light fa-plus"></i>
                    </button>
                  </div>
                  {members.length === 0 && !addingInline
                    ? <div className="members-empty">No members yet. Drag components onto this group in the list, or click + to add.</div>
                    : members.map(m => {
                        const st = MODAL_STATUS_TAG[m.status || 'untested'];
                        return (
                          <div className="member-item" key={m.id}>
                            <span className="member-item__name">{m.name}</span>
                            <span className="qmb-ui-tag qmb-ui-tag--gray qmb-ui-tag--pastry"><span className="qmb-ui-tag__label">{m.type}</span></span>
                            <span className="member-item__sp"></span>
                            {window.SHOW_STATUS && <span className={`qmb-ui-tag qmb-ui-tag--${st.variant} qmb-ui-tag--pastry`}><span className="qmb-ui-tag__label">{st.label}</span></span>}
                            <button type="button" className="qmb-ui-button comp-iconbtn member-item__remove" aria-label="Deactivate" title="Deactivate"
                              onClick={()=>onDeactivateChild && onDeactivateChild(m)}>
                              <i className="fa-light fa-ban"></i>
                            </button>
                          </div>
                        );
                      })}
                  {addingInline && (
                    <div className="comp-childlist__newrow" style={{margin:'8px 0 4px'}}>
                      <input className="cn-name" placeholder="Name" autoFocus value={newName} onChange={e=>setNewName(e.target.value)}
                        onKeyDown={e=>{ if(e.key==='Enter') commitInline(); if(e.key==='Escape') cancelInline(); }} />
                      <select className="cn-type" value={newType} onChange={e=>setNewType(e.target.value)}>
                        <option value="">Type…</option>
                        {types.map(t=><option key={t} value={t}>{t}</option>)}
                      </select>
                      <input className="cn-loc" placeholder="Location" value={newLoc} onChange={e=>setNewLoc(e.target.value)}
                        onKeyDown={e=>{ if(e.key==='Enter') commitInline(); if(e.key==='Escape') cancelInline(); }} />
                      <div className="comp-childlist__newrow-acts">
                        <button type="button" className="qmb-ui-button qmb-ui-button--primary qmb-ui-button--sm" onClick={commitInline}>Add</button>
                        <button type="button" className="qmb-ui-button qmb-ui-button--sm" onClick={cancelInline}>Cancel</button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {specs.length > 0 && (
              <>
                <hr className="cform__sep" />
                <div className="cform__section"><i className="fa-light fa-clipboard-list-check"></i>{comp.type} details</div>
                <div className="cform__note">Configured when this component was created — update any time.</div>
                {specs.map(q => (
                  <Row key={q.key} label={q.label + ':'}>
                    {q.kind === 'select'
                      ? <InlineSelect value={(comp.specs || {})[q.key] || ''} options={q.options} onChange={v => setSpec(q.key, v)} includeNone width="auto" />
                      : <InlineText value={(comp.specs || {})[q.key]} onCommit={v => setSpec(q.key, v)} multiline={q.kind === 'multiline'} ariaLabel={q.label} />}
                  </Row>
                ))}
              </>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

Object.assign(window, { EditModal, InlineText, InlineSelect });