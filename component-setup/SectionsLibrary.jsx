// SectionsLibrary.jsx — Settings → Sections. Inspection sections group questions
// within a form. Table of sections; Add via Brushaway, Edit via Modal.

let _secId = 1;
const nextSecId = () => `sec-${Date.now().toString(36)}-${_secId++}`;

function SectionsLibrary({ emptyMode }) {
  const seed = () => window.SECTIONS.map(s => ({ ...s }));
  const [sections, setSections] = React.useState(seed);
  // First-run demo: creating the first section reveals the full seeded library.
  const revealedRef = React.useRef(false);
  const [q, setQ] = React.useState('');
  const [openId, setOpenId] = React.useState(null);   // section open in modal/brushaway
  const [creating, setCreating] = React.useState(false);
  const [draft, setDraft] = React.useState(null);
  const [confirmDel, setConfirmDel] = React.useState(false);
  const Portal = window.Portal;

  const commit = (next) => {
    setSections(next);
    window.SECTIONS.length = 0;
    next.forEach(s => window.SECTIONS.push({ ...s }));
  };
  const openSection = (s) => { setCreating(false); setOpenId(s.id); setDraft({ ...s }); };
  const addSection = () => { setCreating(true); setOpenId('new'); setDraft({ id: nextSecId(), name: '', description: '', questions: 0 }); };
  const close = () => { setOpenId(null); setDraft(null); setCreating(false); setConfirmDel(false); };
  const setField = (p) => setDraft(d => ({ ...d, ...p }));
  const save = () => {
    const exists = sections.some(s => s.id === draft.id);
    let next = exists ? sections.map(s => s.id === draft.id ? draft : s) : [...sections, draft];
    // First-run demo: creating the first section reveals the full seeded library.
    if (!exists && emptyMode && !revealedRef.current && sections.length === 0) {
      revealedRef.current = true;
      const seedSecs = (window.__seedSnap ? window.__seedSnap.secs : []).map(s => ({ ...s }));
      next = [draft, ...seedSecs];
    }
    commit(next);
    close();
  };
  const del = () => { commit(sections.filter(s => s.id !== draft.id)); close(); };

  const filtered = q ? sections.filter(s => s.name.toLowerCase().includes(q.toLowerCase()) || (s.description || '').toLowerCase().includes(q.toLowerCase())) : sections;

  return (
    <div className={`set-body${sections.length === 0 ? ' set-body--empty' : ''}`}>
      {sections.length === 0 ? (
        <window.EmptyState icon="fa-layer-group" title="No sections yet"
          text="Sections group related questions into logical blocks on the inspection report — like &quot;Visual inspection&quot; or &quot;Functional test&quot;. Create your first section to get started."
          actionLabel="Add section" onAction={addSection} />
      ) : (
      <>
      <div className="set-toolbar">
        <div className="set-toolbar__search">
          <i className="fa-light fa-magnifying-glass"></i>
          <input placeholder="Search sections" value={q} onChange={e => setQ(e.target.value)} />
        </div>
        <span className="cell-muted" style={{ fontSize: 13 }}>{sections.length} sections</span>
        <div className="set-toolbar__spacer"></div>
        <button className="qmb-ui-button qmb-ui-button--primary" onClick={addSection}><i className="fa-light fa-plus"></i>Add section</button>
      </div>

      <div className="qmb-ui-table qmb-ui-table--detail qmb-ui-table--x-full">
        <table>
          <thead>
            <tr>
              <th className="table-column--primary">Section</th>
              <th>Description</th>
              <th>Questions</th>
              <th className="table-cell--align-right"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(s => (
              <tr key={s.id} className="table-row--clickable" onClick={() => openSection(s)}>
                <td className="table-column--primary"><span className="cell-link">{s.name}</span></td>
                <td><span className="cell-muted">{s.description || '—'}</span></td>
                <td><span className="cell-muted">{s.questions} question{s.questions === 1 ? '' : 's'}</span></td>
                <td className="table-cell--align-right"><i className="fa-light fa-chevron-right" style={{ color: 'var(--gray-400)' }}></i></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {filtered.length === 0 && q && <div className="compat-empty" style={{ padding: 24, textAlign: 'center' }}>No sections match your search.</div>}
      </>
      )}

      {/* ADD — Quimby Brushaway (no overlay) */}
      {draft && creating && (
        <Portal>
          <div className="qmb-ui-brushaway qedit-brushaway">
            <div className="qmb-ui-brushaway__main">
              <div className="qmb-ui-brushaway-header">
                <div className="qmb-ui-brushaway-header__row qmb-ui-brushaway-header__row--title">
                  <div className="qmb-ui-brushaway-header__title"><span className="qmb-ui-text"><b>Add section</b></span></div>
                  <div className="qmb-ui-brushaway-header__actions">
                    <button className="qmb-ui-button comp-iconbtn" aria-label="Close" onClick={close}><i className="fa-light fa-xmark"></i></button>
                  </div>
                </div>
                <hr className="qmb-ui-brushaway-header__divider" aria-hidden="true" />
              </div>
              <div className="qmb-ui-brushaway-body">
                <p className="cfg-section__desc" style={{ marginTop: 0, marginBottom: 16 }}>Sections group related questions within an inspection form — like “Visual inspection” or “Functional test” — so technicians can work through a report in logical blocks and findings stay organized.</p>
                <div className="qedit-form">
                  <div className="qmb-ui-input">
                    <input value={draft.name} placeholder=" " autoFocus onChange={e => setField({ name: e.target.value })} />
                    <label>Section name<span className="req"></span></label>
                  </div>
                  <div className="qmb-ui-input">
                    <textarea value={draft.description || ''} placeholder=" " onChange={e => setField({ description: e.target.value })}></textarea>
                    <label>Description</label>
                  </div>
                </div>
              </div>
              <div className="qmb-ui-brushaway-footer">
                <div className="qmb-ui-brushaway-footer__content">
                  <div className="qmb-ui-brushaway-footer__start"></div>
                  <div className="qmb-ui-brushaway-footer__actions">
                    <button className="qmb-ui-button" onClick={close}>Cancel</button>
                    <button className="qmb-ui-button qmb-ui-button--primary" data-track="save:section" disabled={!draft.name.trim()} onClick={save}>Add section</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Portal>
      )}

      {/* EDIT — Quimby Modal */}
      {draft && !creating && (
        <Portal>
          <div className="qmb-ui-modal-wrapper">
            <div className="qmb-ui-modal-overlay" onClick={close}></div>
            <div className="qmb-ui-modal cmodal qedit-modal" role="dialog" aria-modal="true" aria-label="Edit section">
              <header className="qmb-ui-modal-header">
                <div className="qmb-ui-modal-header__row qmb-ui-modal-header__row--title">
                  <div className="qmb-ui-modal-header__title cmodal__titlefield">
                    <span className="qmb-ui-text"><b>Section:</b></span>
                    <InlineText value={draft.name} placeholder="Section name…" onCommit={v => setField({ name: v })} width="auto" ariaLabel="Section name" />
                  </div>
                  <div className="qmb-ui-modal-header__actions">
                    <button className="qmb-ui-button qmb-ui-button--highlighted" onClick={() => setConfirmDel(true)}><i className="fa-light fa-trash-can"></i>Delete</button>
                    <button className="qmb-ui-button comp-iconbtn qmb-ui-modal-header__close" aria-label="Close" onClick={close}><i className="fa-light fa-xmark"></i></button>
                  </div>
                </div>
                <hr className="qmb-ui-modal-header__divider" aria-hidden="true" />
              </header>
              <div className="qmb-ui-modal-body">
                <div className="cform">
                  <div className="cform__label">Description:</div>
                  <div className="cform__field"><InlineText value={draft.description || ''} placeholder="What this section covers…" multiline onCommit={v => setField({ description: v })} ariaLabel="Description" /></div>
                </div>
              </div>
              <footer className="qmb-ui-modal-footer qmb-ui-modal-footer--divider">
                <div className="qmb-ui-modal-footer__content">
                  <div className="qmb-ui-modal-footer__start"></div>
                  <div className="qmb-ui-modal-footer__actions">
                    <button className="qmb-ui-button" onClick={close}>Cancel</button>
                    <button className="qmb-ui-button qmb-ui-button--primary" data-track="save:section" onClick={save}>Save section</button>
                  </div>
                </div>
              </footer>
            </div>
          </div>
          {confirmDel && <ConfirmDialog title="Delete section?" message={`This deletes “${draft.name || 'this section'}”. Questions in it won’t be deleted but will become unsectioned. This can’t be undone.`} confirmLabel="Delete section" onConfirm={del} onCancel={() => setConfirmDel(false)} />}
        </Portal>
      )}
    </div>
  );
}

window.SectionsLibrary = SectionsLibrary;
