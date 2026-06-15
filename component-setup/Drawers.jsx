// Drawers.jsx — Add + Edit panels built on the real qmb-ui-brushaway molecule.
// Fields use qmb-ui-input / qmb-ui-select (floating labels). The Group vs
// Individual control is a qmb-ui-radio group (Quimby's single-select). The
// "Attached to" control is a hierarchical System → Group picker.

function RoleRadio({ value, onChange }) {
  const opts = [
    { v:'group', label:'Group', desc:'Condenses its member components into one high-level row.' },
    { v:'individual', label:'Single', desc:'A standalone device — on its own or nested in a group.' },
  ];
  return (
    <div className="qmb-ui-radio-group">
      <span className="qmb-ui-radio-group__label">Item type</span>
      <div className="qmb-ui-radio-group__options" role="radiogroup" aria-label="Item type">
        {opts.map(o => (
          <label key={o.v} className={`qmb-ui-radio ${value===o.v ? 'qmb-ui-radio--selected' : ''}`}>
            <input type="radio" name="role" checked={value===o.v} onChange={()=>onChange(o.v)} />
            <span className="qmb-ui-radio__label qmb-ui-radio__label--bold">{o.label}</span>
            <span className="qmb-ui-radio__description">{o.desc}</span>
          </label>
        ))}
      </div>
    </div>
  );
}

// Hierarchical attach picker (System → Groups), single-select.
function AttachedTo({ systems, components, role, type, system, parentId, onChange, required }) {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef(null);
  React.useEffect(() => {
    if (!open) return;
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [open]);

  const sysName = (id) => (systems.find(s => s.id === id) || {}).name;
  const isAttached = !!(system || parentId);
  let label;
  if (parentId) {
    const g = components.find(c => c.id === parentId);
    label = g ? `${g.name} · ${sysName(g.system)}` : 'Not attached (top level)';
  } else if (system) {
    label = `${sysName(system)} (System)`;
  } else {
    label = 'Not attached (top level)';
  }

  const pick = (sysId, pId) => { onChange({ system: sysId, parentId: pId }); setOpen(false); };
  const clear = (e) => { e.stopPropagation(); onChange({ system: null, parentId: null }); setOpen(false); };

  return (
    <div className={`qmb-ui-select ${open ? 'is-open' : ''}`} ref={ref}>
      <div className={`qmb-ui-select__trigger ${isAttached ? '' : 'is-placeholder'} ${isAttached ? 'has-clear' : ''}`} role="button"
        aria-expanded={open} tabIndex={0} onClick={()=>setOpen(o=>!o)}>
        {label}
        {isAttached && (
          <button type="button" className="qmb-ui-select__clear" aria-label="Clear — make top level" onClick={clear}>
            <i className="fa-light fa-xmark"></i>
          </button>
        )}
      </div>
      <label>Attached to{required && <span className="req"></span>}</label>
      {open && (
        <div className="qmb-ui-popup qmb-ui-popup--block qmb-ui-hier-popup">
          <div className="k-popup">
            <div className="popup__section">
              <button className={`qmb-ui-button qmb-ui-hier-opt qmb-ui-hier-opt--none ${!isAttached ? 'qmb-ui-hier-opt--selected' : ''}`} onClick={()=>pick(null, null)}>
                <i className="lead fa-light fa-ban"></i>None — top level (not attached)
              </button>
              {systems.map(sys => {
            const groups = components.filter(c => c.role === 'group' && c.system === sys.id && type && window.sameFamily && window.sameFamily(type, c.type));
            return (
              <React.Fragment key={sys.id}>
                <button className={`qmb-ui-button qmb-ui-hier-opt qmb-ui-hier-opt--system ${(!parentId && system===sys.id) ? 'qmb-ui-hier-opt--selected' : ''}`}
                  onClick={()=>pick(sys.id, null)}>
                  <i className="lead fa-light fa-diagram-project"></i>{sys.name} (System)
                </button>
                {role === 'individual' && groups.map(g => (
                  <button key={g.id} className={`qmb-ui-button qmb-ui-hier-opt qmb-ui-hier-opt--child ${parentId===g.id ? 'qmb-ui-hier-opt--selected' : ''}`}
                    onClick={()=>pick(g.id, g.id)}>
                    <i className="lead fa-light fa-layer-group"></i>{g.name}
                  </button>
                ))}
              </React.Fragment>
            );
          })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function CloseBtn({ onClose }) {
  return <button className="qmb-ui-button qmb-ui-button--highlighted comp-iconbtn" aria-label="Close" onClick={onClose}><i className="fa-light fa-xmark"></i></button>;
}

// ─── Edit panel ─────────────────────────────────────────────────────────────
function EditDrawer({ comp, systems, components, onClose, onSave }) {
  const [d, setD] = React.useState(comp);
  const [hMenu, setHMenu] = React.useState(false);
  const hMenuRef = React.useRef(null);
  React.useEffect(()=>{ setD(comp); }, [comp]);
  if (!comp) return null;
  const set = (k,v) => setD(s => ({ ...s, [k]: v }));
  const isGroup = d.role === 'group';
  const members = components.filter(c => c.parentId === d.id);

  return ReactDOM.createPortal(
    <>
      <div className="qmb-ui-brushaway" style={{ width: 480 }}>
        <div className="qmb-ui-brushaway__main">
          <div className="qmb-ui-brushaway-header">
            <div className="qmb-ui-brushaway-header__row qmb-ui-brushaway-header__row--title">
              <div className="qmb-ui-brushaway-header__title">
                <span className="qmb-ui-text">Component: <b>{d.name || 'Untitled'}</b></span>
              </div>
              <div className="qmb-ui-brushaway-header__actions">
                <button ref={hMenuRef} className="qmb-ui-button qmb-ui-button--highlighted comp-iconbtn" aria-label="More actions" aria-expanded={hMenu} onClick={()=>setHMenu(v=>!v)}><i className="fa-light fa-ellipsis"></i></button>
                <CloseBtn onClose={onClose} />
              </div>
            </div>
            <hr className="qmb-ui-brushaway-header__divider" aria-hidden="true" />
          </div>
          <div className="qmb-ui-brushaway-body">
            <div className="brush-form">
              <RoleRadio value={d.role} onChange={(r)=>set('role', r)} />

              <div className="qmb-ui-select">
                <select className="qmb-ui-select__trigger" value={d.type} onChange={e=>set('type', e.target.value)}>
                  {window.COMPONENT_TYPES.map(t => <option key={t}>{t}</option>)}
                </select>
                <label>Type</label>
              </div>

              <div className="qmb-ui-input">
                <input value={d.name} placeholder=" " onChange={e=>set('name', e.target.value)} />
                <label>Component Name</label>
              </div>

              <div className="qmb-ui-input">
                <textarea value={d.description||''} placeholder=" " onChange={e=>set('description', e.target.value)} />
                <label>Description</label>
              </div>

              <AttachedTo systems={systems} components={components} role={d.role} type={d.type}
                system={d.system} parentId={d.parentId}
                onChange={({system, parentId})=>setD(s=>({ ...s, system, parentId }))} />

              {isGroup && (
                <div className="members-card">
                  <div className="members-card__head"><h5>{members.length} component{members.length===1?'':'s'} in this group</h5></div>
                  {members.length === 0
                    ? <div className="members-empty">No members yet. Drag components onto this group, or set their “Attached to” to “{d.name}”.</div>
                    : members.map(m => (
                        <div className="member-item" key={m.id}>
                          <span className="member-item__name">{m.name}</span>
                          <span className="qmb-ui-tag qmb-ui-tag--gray qmb-ui-tag--pastry"><span className="qmb-ui-tag__label">{m.type}</span></span>
                        </div>
                      ))}
                </div>
              )}

              <div className="qmb-ui-input">
                <input value={d.location||''} placeholder=" " onChange={e=>set('location', e.target.value)} />
                <label>Location</label>
              </div>

              {!isGroup && (
                <div className="brush-grid">
                  <div className="qmb-ui-input">
                    <input value={d.barcode||''} placeholder=" " onChange={e=>set('barcode', e.target.value)} />
                    <label>Barcode</label>
                  </div>
                  <div className="qmb-ui-input">
                    <input value={d.externalId||''} placeholder=" " onChange={e=>set('externalId', e.target.value)} />
                    <label>External ID</label>
                  </div>
                </div>
              )}

              <div className="qmb-ui-input">
                <textarea value={d.notes||''} placeholder=" " onChange={e=>set('notes', e.target.value)} />
                <label>Notes</label>
              </div>
            </div>
          </div>
          <div className="qmb-ui-brushaway-footer">
            <div className="qmb-ui-brushaway-footer__content">
              <div className="qmb-ui-brushaway-footer__start"></div>
              <div className="qmb-ui-brushaway-footer__actions">
                <button className="qmb-ui-button qmb-ui-button--highlighted" onClick={onClose}>Cancel</button>
                <button className="qmb-ui-button qmb-ui-button--primary" onClick={()=>onSave(d)}>Save changes</button>
              </div>
            </div>
          </div>
        </div>
      </div>
      <BodyPopup open={hMenu} anchor={hMenuRef.current} position="bottom-right" width={200} onClose={()=>setHMenu(false)}>
        <div className="popup__section">
          <ul className="qmb-ui-popup__action-list">
            <li><button className="qmb-ui-button is-danger" onClick={()=>{ setHMenu(false); onClose(); }}><i className="fa-light fa-ban"></i>Deactivate</button></li>
          </ul>
        </div>
      </BodyPopup>
    </>,
    document.body
  );
}

// ─── Add panel ──────────────────────────────────────────────────────────────
function AddBrushaway({ context, systems, components, onClose, onCreate }) {
  const presetParent = context && context.parentId ? components.find(c => c.id === context.parentId) : null;
  const presetSystem = (presetParent && presetParent.system) || (context && context.systemId) || systems[0].id;
  const presetType = (() => {
    const p = presetParent;
    if (!p) return '';
    if (p.role === 'group') {
      const kt = Array.from(new Set(components.filter(c => c.parentId === p.id).map(c => c.type)));
      if (kt.length === 1) return kt[0];
      const stripped = p.type.replace(/ Group$/, '');
      return (window.COMPONENT_TYPES || []).includes(stripped) ? stripped : '';
    }
    return '';
  })();

  const [role, setRole] = React.useState('individual');
  const [name, setName] = React.useState('');
  const [type, setType] = React.useState(presetType);
  const [attach, setAttach] = React.useState({ system: presetSystem, parentId: presetParent ? presetParent.id : null });
  const [location, setLocation] = React.useState('');
  const [barcode, setBarcode] = React.useState('');
  const [externalId, setExternalId] = React.useState('');
  const [notes, setNotes] = React.useState('');

  const isGroup = role === 'group';
  // a group attaches to a system only — clear any group parent when switching to group
  React.useEffect(() => { if (isGroup && attach.parentId) setAttach(a => ({ system: a.system, parentId: null })); }, [isGroup]);

  const [pendingMembers, setPendingMembers] = React.useState([]);
  const [addingMember, setAddingMember] = React.useState(false);
  const [mName, setMName] = React.useState('');
  const [mType, setMType] = React.useState('');
  const [mLoc,  setMLoc]  = React.useState('');
  // reset pending members when role changes to single
  React.useEffect(() => { if (!isGroup) { setPendingMembers([]); setAddingMember(false); } }, [isGroup]);

  const commitMember = () => {
    if (!mName.trim()) return;
    const memberDefaultType = type.replace(/\s*Group$/i,'').trim();
    setPendingMembers(pm => [...pm, { id: 'pm-' + Date.now(), name: mName.trim(), type: mType || memberDefaultType, location: mLoc }]);
    setMName(''); setMType(''); setMLoc('');
  };
  const removeMember = (id) => setPendingMembers(pm => pm.filter(m => m.id !== id));

  const canCreate = name.trim() && type;
  const create = () => {
    if (!canCreate) return;
    onCreate({
      id: 'c-' + Math.random().toString(36).slice(2,8),
      system: attach.system, role, name: name.trim(), type,
      parentId: isGroup ? null : (attach.parentId || null),
      location, barcode, externalId, notes,
      status: isGroup ? undefined : 'untested',
      pendingMembers: isGroup ? pendingMembers : [],
    });
  };

  return ReactDOM.createPortal(
    <>
      <div className="qmb-ui-brushaway" style={{ width: 460 }}>
        <div className="qmb-ui-brushaway__main">
          <div className="qmb-ui-brushaway-header">
            <div className="qmb-ui-brushaway-header__row qmb-ui-brushaway-header__row--title">
              <div className="qmb-ui-brushaway-header__title"><span className="qmb-ui-text">Add Component</span></div>
              <div className="qmb-ui-brushaway-header__actions"><CloseBtn onClose={onClose} /></div>
            </div>
            <hr className="qmb-ui-brushaway-header__divider" aria-hidden="true" />
          </div>
          <div className="qmb-ui-brushaway-body">
            <div className="brush-form">
              {presetParent && (
                <div className="brush-parent-ctx">
                  <i className={`fa-light ${presetParent.role === 'group' ? 'fa-layer-group' : 'fa-cube'}`}></i>
                  <span>Adding to <strong>{presetParent.name}</strong></span>
                </div>
              )}
              <RoleRadio value={role} onChange={setRole} />
              <hr className="brush-split" />

              <div className="qmb-ui-input">
                <input value={name} placeholder=" " autoFocus onChange={e=>setName(e.target.value)} />
                <label>Component Name<span className="req"></span></label>
              </div>

              <div className="qmb-ui-select">
                <select className={`qmb-ui-select__trigger ${type ? '' : 'is-placeholder'}`} value={type} onChange={e=>setType(e.target.value)}>
                  <option value="">Select an Option</option>
                  {window.COMPONENT_TYPES.map(t => <option key={t}>{t}</option>)}
                </select>
                <label>Type<span className="req"></span></label>
              </div>

              <AttachedTo systems={systems} components={components} role={role} type={type}
                system={attach.system} parentId={attach.parentId} onChange={setAttach} />

              <div className="qmb-ui-input">
                <input value={location} placeholder=" " onChange={e=>setLocation(e.target.value)} />
                <label>Location</label>
              </div>

              {!isGroup && (
                <div className="brush-grid">
                  <div className="qmb-ui-input">
                    <input value={barcode} placeholder=" " onChange={e=>setBarcode(e.target.value)} />
                    <label>Barcode</label>
                  </div>
                  <div className="qmb-ui-input">
                    <input value={externalId} placeholder=" " onChange={e=>setExternalId(e.target.value)} />
                    <label>External ID</label>
                  </div>
                </div>
              )}

              {isGroup && window.__GROUP_VIEW === 'children-list' && (
                <>
                  <hr className="brush-split" />
                  <div className="brush-members">
                    <div className="brush-members__head">
                      <span className="brush-members__title">Components in this group</span>
                    </div>
                    {pendingMembers.length > 0 && (
                      <div className="comp-childlist" style={{padding:'0 0 4px'}}>
                        {pendingMembers.map(m => (
                          <div className="comp-childlist__item" key={m.id}>
                            <span className="comp-childlist__name">{m.name}</span>
                            {m.type && <Tag variant="gray" className="comp-typetag comp-typetag--outline">{m.type}</Tag>}
                            {m.location && <span className="comp-row__loc"><i className="fa-light fa-location-dot"></i>{m.location}</span>}
                            <span className="comp-childlist__spacer"></span>
                            <button type="button" className="qmb-ui-button comp-iconbtn comp-childlist__remove" aria-label="Remove"
                              onClick={()=>removeMember(m.id)}>
                              <i className="fa-light fa-ban"></i>
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                    {addingMember && (
                      <div className="comp-childlist__newrow">
                        <input className="cn-name" placeholder="Name" autoFocus value={mName} onChange={e=>setMName(e.target.value)}
                          onKeyDown={e=>{ if(e.key==='Enter') commitMember(); if(e.key==='Escape') setAddingMember(false); }} />
                        <select className="cn-type" value={mType} onChange={e=>setMType(e.target.value)}>
                          <option value="">{type.replace(/\s*Group$/i,'').trim() || 'Type…'}</option>
                          {(window.COMPONENT_TYPES||[]).map(t=><option key={t} value={t}>{t}</option>)}
                        </select>
                        <input className="cn-loc" placeholder="Location" value={mLoc} onChange={e=>setMLoc(e.target.value)}
                          onKeyDown={e=>{ if(e.key==='Enter') commitMember(); if(e.key==='Escape') setAddingMember(false); }} />
                        <div className="comp-childlist__newrow-acts">
                          <button type="button" className="qmb-ui-button qmb-ui-button--primary qmb-ui-button--sm" onClick={commitMember}>Add</button>
                          <button type="button" className="qmb-ui-button qmb-ui-button--sm" onClick={()=>setAddingMember(false)}>Cancel</button>
                        </div>
                      </div>
                    )}
                    {!addingMember && (
                      <button type="button" className="qmb-ui-button qmb-ui-button--secondary" style={{margin:'4px 12px 8px', alignSelf:'flex-start'}} onClick={()=>setAddingMember(true)}>
                        <i className="fa-light fa-plus"></i> Add component
                      </button>
                    )}
                  </div>
                </>
              )}

              {isGroup && window.__GROUP_VIEW !== 'children-list' && (
                <div className="brush-note">
                  <i className="fa-light fa-layer-group"></i>
                  This group appears as one condensed row. Add member components to it afterward from the list, or drag them in.
                </div>
              )}

              <div className="qmb-ui-input">
                <textarea value={notes} placeholder=" " onChange={e=>setNotes(e.target.value)} />
                <label>Notes</label>
              </div>
            </div>
          </div>
          <div className="qmb-ui-brushaway-footer">
            <div className="qmb-ui-brushaway-footer__content">
              <div className="qmb-ui-brushaway-footer__start"></div>
              <div className="qmb-ui-brushaway-footer__actions">
                <button className="qmb-ui-button qmb-ui-button--highlighted" onClick={onClose}>Cancel</button>
                <button className="qmb-ui-button qmb-ui-button--primary" disabled={!canCreate} onClick={create}>Create Component</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>,
    document.body
  );
}

Object.assign(window, { EditDrawer, AddBrushaway, RoleRadio, AttachedTo });
