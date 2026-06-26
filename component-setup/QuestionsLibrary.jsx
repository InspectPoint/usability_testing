// QuestionsLibrary.jsx — Settings → Component Questions.
// Lists question SETS in a Quimby detail table. Clicking a set opens a modal that
// holds that set's questions — add, edit (name / answer type / frequency), reorder,
// and remove — then save. window.QUESTION_SETS stays in sync for the type wizard.

let _qid = 1;
const nextId = (p) => `${p}-${Date.now().toString(36)}-${_qid++}`;
const FREQUENCIES = ['Annual', 'Semi-annual', 'Quarterly', 'Monthly', 'Weekly', '3-year', '5-year'];

// Quimby InlineText — qmb-ui-inline-edit contentEditable, commits on blur.
function QInlineText({ value, placeholder, onCommit, className = '' }) {
  const ref = React.useRef(null);
  React.useEffect(() => { if (ref.current && ref.current.textContent !== (value || '')) ref.current.textContent = value || ''; }, [value]);
  return (
    <div ref={ref} className={`qmb-ui-inline-edit qmb-ui-inline-edit--x-full ${className}`} contentEditable suppressContentEditableWarning
      role="textbox" tabIndex={0} data-placeholder={placeholder}
      onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); e.currentTarget.blur(); } if (e.key === 'Escape') { e.currentTarget.textContent = value || ''; e.currentTarget.blur(); } }}
      onBlur={e => { const n = (e.currentTarget.textContent || '').trim(); if (n !== (value || '')) onCommit(n); }}>
      {value || ''}
    </div>
  );
}

// Searchable token input — selected component types as removable tags + a filter
// field that suggests and adds the rest. Mirrors a typeahead/combobox.
function TypePicker({ selected, currentSetId, sets, onAdd, onRemove }) {
  const [query, setQuery] = React.useState('');
  const [open, setOpen] = React.useState(false);
  const [active, setActive] = React.useState(0);
  const wrapRef = React.useRef(null);
  React.useEffect(() => {
    const onDoc = (e) => { if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);
  const setName = (id) => { const s = sets.find(x => x.id === id); return s ? s.name : null; };
  const matches = window.SETUP_TYPES
    .filter(t => !selected.includes(t.id))
    .filter(t => !query || t.name.toLowerCase().includes(query.toLowerCase()) || (t.category || '').toLowerCase().includes(query.toLowerCase()));
  const add = (t) => { onAdd(t.id); setQuery(''); setActive(0); setOpen(true); };
  return (
    <div className="typepick" ref={wrapRef}>
      <div className={`typepick__control ${open ? 'is-open' : ''}`} onClick={() => { setOpen(true); wrapRef.current.querySelector('input').focus(); }}>
        {selected.map(id => {
          const t = window.SETUP_TYPES.find(x => x.id === id);
          if (!t) return null;
          return (
            <span className="compat-tag" key={id} onClick={e => e.stopPropagation()}>{t.name}
              <button className="compat-tag__x" onClick={() => onRemove(id)} aria-label={`Remove ${t.name}`}><i className="fa-light fa-xmark"></i></button>
            </span>
          );
        })}
        <input className="typepick__input" value={query} placeholder={selected.length ? 'Add another type…' : 'Search component types…'}
          onChange={e => { setQuery(e.target.value); setOpen(true); setActive(0); }}
          onFocus={() => setOpen(true)}
          onKeyDown={e => {
            if (e.key === 'ArrowDown') { e.preventDefault(); setActive(a => Math.min(a + 1, matches.length - 1)); }
            else if (e.key === 'ArrowUp') { e.preventDefault(); setActive(a => Math.max(a - 1, 0)); }
            else if (e.key === 'Enter') { e.preventDefault(); if (matches[active]) add(matches[active]); }
            else if (e.key === 'Backspace' && !query && selected.length) { onRemove(selected[selected.length - 1]); }
          }} />
      </div>
      {open && matches.length > 0 && (
        <div className="typepick__menu">
          {matches.map((t, i) => {
            const other = t.questionSet && t.questionSet !== currentSetId ? setName(t.questionSet) : null;
            return (
              <button key={t.id} type="button" className={`typepick__opt ${i === active ? 'is-active' : ''}`}
                onMouseEnter={() => setActive(i)} onClick={() => add(t)}>
                <span className="typepick__optname">{t.name}</span>
                <span className="qmb-ui-tag qmb-ui-tag--pastry qmb-ui-tag--gray"><span className="qmb-ui-tag__label">{t.category}</span></span>
                {other && <span className="typepick__warn">replaces {other}</span>}
              </button>
            );
          })}
        </div>
      )}
      {open && matches.length === 0 && <div className="typepick__menu typepick__menu--empty">No more component types{query ? ' match' : ''}.</div>}
    </div>
  );
}

function QuestionsLibrary({ emptyMode }) {
  const seed = () => window.QUESTION_SETS.map(s => ({
    id: s.id, name: s.name, code: s.code, category: s.category, description: s.description || '', usedBy: s.usedBy, updated: s.updated,
    active: s.active !== false,
    questions: s.questions.map(q => ({ id: nextId('q'), q: q.q, type: q.type, frequency: q.frequency || 'Annual', section: q.section || '' })),
  }));
  const [sets, setSets] = React.useState(seed);
  const [q, setQ] = React.useState('');
  const [openId, setOpenId] = React.useState(null);     // set open in the modal/brushaway
  const [creating, setCreating] = React.useState(false); // add flow → brushaway; edit → modal
  const [draft, setDraft] = React.useState(null);       // working copy of that set
  const drag = React.useRef(null);
  const [dropHint, setDropHint] = React.useState(null);
  const [dragId, setDragId] = React.useState(null);
  const [qEdit, setQEdit] = React.useState(null); // null | qId | 'new'
  const [confirmDelSet, setConfirmDelSet] = React.useState(false);
  // First-run demo: creating the first set reveals the full seeded library.
  const revealedRef = React.useRef(false);

  const codeFor = (name) => (name || 'SET').split(/\s+/).map(w => w[0]).join('').toUpperCase().slice(0, 5);
  const commit = (next) => {
    setSets(next);
    window.QUESTION_SETS.length = 0;
    next.forEach(s => window.QUESTION_SETS.push({
      id: s.id, name: s.name, code: s.code || codeFor(s.name), category: s.category, description: s.description || '',
      active: s.active !== false,
      usedBy: s.usedBy || 0, updated: 'Just now',
      questions: s.questions.map(x => ({ q: x.q, type: x.type, frequency: x.frequency, section: x.section || '' })),
    }));
  };
  const typesUsing = (setId) => window.SETUP_TYPES.filter(t => t.questionSet === setId);

  // ── open / create / save a set via the modal ──
  const appliesFor = (setId) => window.SETUP_TYPES.filter(t => t.questionSet === setId).map(t => t.id);
  const openSet = (s) => { setCreating(false); setOpenId(s.id); setDraft({ ...s, questions: s.questions.map(x => ({ ...x })), appliesTo: appliesFor(s.id) }); };
  const addSet = () => {
    const s = { id: nextId('qs'), name: '', code: '', category: 'Other', description: '', questions: [], appliesTo: [] };
    setCreating(true); setOpenId(s.id); setDraft(s);
  };
  const closeModal = () => { setOpenId(null); setDraft(null); setCreating(false); setDropHint(null); drag.current = null; setDragId(null); };
  const syncAppliesTo = (d) => {
    window.SETUP_TYPES.forEach(t => {
      const sel = (d.appliesTo || []).includes(t.id);
      if (sel) t.questionSet = d.id;
      else if (t.questionSet === d.id) t.questionSet = null;
    });
  };
  const saveModal = () => {
    const exists = sets.some(s => s.id === draft.id);
    let next = exists ? sets.map(s => s.id === draft.id ? draft : s) : [...sets, draft];
    // First-run demo: creating the first question set reveals the full seeded library.
    if (!exists && emptyMode && !revealedRef.current && sets.length === 0) {
      revealedRef.current = true;
      const seedSets = (window.__seedSnap ? window.__seedSnap.qs : []).map(s => ({
        id: s.id, name: s.name, code: s.code, category: s.category, description: s.description || '',
        active: s.active !== false, usedBy: s.usedBy, updated: s.updated,
        questions: s.questions.map(qq => ({ id: nextId('q'), q: qq.q, type: qq.type, frequency: qq.frequency || 'Annual', section: qq.section || '' })),
      }));
      next = [draft, ...seedSets];
    }
    commit(next);
    syncAppliesTo(draft);
    closeModal();
  };
  const deleteSet = () => { commit(sets.filter(s => s.id !== draft.id)); syncAppliesTo({ ...draft, appliesTo: [] }); closeModal(); };

  // ── draft mutations (modal only) ──
  const setDraftField = (patch) => setDraft(d => ({ ...d, ...patch }));
  const setQ_ = (qId, patch) => setDraft(d => ({ ...d, questions: d.questions.map(x => x.id === qId ? { ...x, ...patch } : x) }));
  const addQ = () => setDraft(d => ({ ...d, questions: [...d.questions, { id: nextId('q'), q: '', type: 'Pass / Fail / N/A', frequency: 'Annual', section: '' }] }));
  const removeQ = (qId) => setDraft(d => ({ ...d, questions: d.questions.filter(x => x.id !== qId) }));
  const saveQ = (qId, nq) => { const clean = { ...nq }; delete clean.__isNew; setDraft(d => ({ ...d, questions: d.questions.map(x => x.id === qId ? { ...clean, id: qId } : x) })); };
  const addNewQ = (nq) => { const clean = { ...nq }; delete clean.__isNew; setDraft(d => ({ ...d, questions: [...d.questions, { ...clean, id: nextId('q') }] })); };
  const toggleApplies = (typeId) => setDraft(d => {
    const has = (d.appliesTo || []).includes(typeId);
    return { ...d, appliesTo: has ? d.appliesTo.filter(x => x !== typeId) : [...(d.appliesTo || []), typeId] };
  });

  // ── pointer-based reorder of questions (works inside the modal/brushaway, with
  //    edge auto-scroll). HTML5 DnD was unreliable over contentEditable rows. ──
  const listRef = React.useRef(null);
  const dragState = React.useRef(null);
  const findScrollParent = (el) => {
    let n = el;
    while (n) { if (n.classList && (n.classList.contains('qmb-ui-modal-body') || n.classList.contains('qmb-ui-brushaway-body'))) return n; n = n.parentElement; }
    return null;
  };
  const computeHint = (clientY) => {
    const rows = listRef.current ? [...listRef.current.querySelectorAll('.qedit-row')] : [];
    if (!rows.length) return null;
    for (const row of rows) {
      const id = row.getAttribute('data-qid');
      if (id === dragState.current.id) continue;
      const r = row.getBoundingClientRect();
      if (clientY >= r.top && clientY <= r.bottom) return { qId: id, pos: (clientY - r.top) < r.height / 2 ? 'before' : 'after' };
    }
    const firstR = rows[0].getBoundingClientRect();
    if (clientY < firstR.top) return { qId: rows[0].getAttribute('data-qid'), pos: 'before' };
    const lastR = rows[rows.length - 1].getBoundingClientRect();
    if (clientY > lastR.bottom) return { qId: rows[rows.length - 1].getAttribute('data-qid'), pos: 'after' };
    return null;
  };
  const tick = () => {
    const st = dragState.current; if (!st) return;
    const el = st.scrollEl;
    if (el) {
      const r = el.getBoundingClientRect();
      const edge = 56, max = 16;
      if (st.pointerY < r.top + edge) el.scrollTop -= max * Math.min(1, (r.top + edge - st.pointerY) / edge);
      else if (st.pointerY > r.bottom - edge) el.scrollTop += max * Math.min(1, (st.pointerY - (r.bottom - edge)) / edge);
      const h = computeHint(st.pointerY); st.hint = h; setDropHint(h);
    }
    st.raf = requestAnimationFrame(tick);
  };
  const onPointerMove = (e) => {
    const st = dragState.current; if (!st) return;
    st.pointerY = e.clientY;
    const h = computeHint(e.clientY); st.hint = h; setDropHint(h);
  };
  const onPointerUp = () => {
    const st = dragState.current;
    window.removeEventListener('pointermove', onPointerMove);
    window.removeEventListener('pointerup', onPointerUp);
    if (st) {
      cancelAnimationFrame(st.raf);
      if (st.hint && st.hint.qId !== st.id) {
        setDraft(d => {
          const arr = [...d.questions];
          const from = arr.findIndex(x => x.id === st.id); if (from < 0) return d;
          const [moved] = arr.splice(from, 1);
          let to = arr.findIndex(x => x.id === st.hint.qId); if (to < 0) to = arr.length; else if (st.hint.pos === 'after') to += 1;
          arr.splice(to, 0, moved);
          return { ...d, questions: arr };
        });
      }
    }
    dragState.current = null;
    setDragId(null); setDropHint(null);
  };
  const onGripDown = (e, qId) => {
    e.preventDefault();
    dragState.current = { id: qId, scrollEl: findScrollParent(e.currentTarget), pointerY: e.clientY, hint: null, raf: 0 };
    setDragId(qId);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    dragState.current.raf = requestAnimationFrame(tick);
  };

  const filtered = q
    ? sets.filter(s => s.name.toLowerCase().includes(q.toLowerCase()) || s.questions.some(x => x.q.toLowerCase().includes(q.toLowerCase())))
    : sets;
  const totalQ = sets.reduce((n, s) => n + s.questions.length, 0);

  // Top fields differ by shell: the Add brushaway uses boxed Quimby inputs;
  // the Edit modal uses the EditModal cform pattern (label-left InlineText rows).
  const topFieldsBrushaway = draft && (
    <>
      <div className="qset-modal__section">
        {window.QInput && <window.QInput id="qset-desc" label="Description" value={draft.description || ''} onChange={v => setDraftField({ description: v })} multiline />}
      </div>
      <div className="qset-modal__section">
        <div className="qmb-ui-input qmb-ui-input--picker">
          <TypePicker selected={draft.appliesTo || []} currentSetId={draft.id} sets={sets} onAdd={id => toggleApplies(id)} onRemove={id => toggleApplies(id)} />
          <label>Allowed component types</label>
        </div>
      </div>
    </>
  );
  const topFieldsModal = draft && (
    <div className="cform qset-cform">
      <div className="cform__label">Description:</div>
      <div className="cform__field"><InlineText value={draft.description || ''} placeholder="What this set covers…" multiline onCommit={v => setDraftField({ description: v })} ariaLabel="Description" /></div>
      <div className="cform__label">Allowed component types:</div>
      <div className="cform__field">
        <TypePicker selected={draft.appliesTo || []} currentSetId={draft.id} sets={sets} onAdd={id => toggleApplies(id)} onRemove={id => toggleApplies(id)} />
      </div>
    </div>
  );
  // Shared questions section (identical in both shells)
  const questionsSection = draft && (
      <div className="qset-modal__section qset-modal__section--questions">
        <div className="qset-modal__sectionhead">
          <h3 className="qset-modal__sectiontitle">Questions</h3>
          <span className="qsec__meta">{draft.questions.length} question{draft.questions.length === 1 ? '' : 's'}</span>
        </div>
        <div className={`qedit-list ${draft.questions.length === 0 ? 'qedit-list--empty' : ''}`} ref={listRef}>
          {draft.questions.map(qq => {
            const hint = dropHint && dropHint.qId === qq.id ? ' qrow--drop-' + dropHint.pos : '';
            return (
            <div className={`qedit-row ${dragId === qq.id ? 'is-dragging' : ''}${hint}`} key={qq.id} data-qid={qq.id} role="button" tabIndex={0} onClick={() => setQEdit(qq.id)}
              onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setQEdit(qq.id); } }}>
              <span className="comp-handle" title="Drag to reorder" onPointerDown={e => onGripDown(e, qq.id)} onClick={e => e.stopPropagation()}><i className="fa-light fa-grip-dots-vertical"></i></span>
              <span className="qedit-row__text">{qq.q ? qq.q : <span className="set-cell-empty">Untitled question</span>}{qq.required && <span className="qedit-row__req" title="Required">*</span>}</span>
              <span className="qmb-ui-tag qmb-ui-tag--pastry qmb-ui-tag--purple"><span className="qmb-ui-tag__label">{qq.type}</span></span>
              {(() => { const sec = (window.SECTIONS || []).find(s => s.id === qq.section); return sec ? <span className="qmb-ui-tag qmb-ui-tag--pastry qmb-ui-tag--gray"><span className="qmb-ui-tag__label">{sec.name}</span></span> : null; })()}
              <span className="qrow__freqtag"><i className="fa-light fa-arrows-rotate"></i>{qq.frequency || 'Annual'}</span>
              <button className="set-rowact" aria-label="Remove question" title="Remove" onClick={e => { e.stopPropagation(); removeQ(qq.id); }}><i className="fa-light fa-xmark"></i></button>
            </div>
            );
          })}
        </div>
        {draft.questions.length === 0 && <div className="qsec__empty" style={{ padding: '20px 4px' }}>No questions yet — add the first one below.</div>}
        <button className="qsec__add" onClick={() => setQEdit('new')}><i className="fa-light fa-plus"></i>Add question</button>
        {qEdit != null && (() => {
          const QE = window.QuestionEditor;
          const cur = qEdit === 'new' ? { q: '', type: 'Pass / Fail / N/A', frequency: 'Annual', section: '', __isNew: true } : draft.questions.find(x => x.id === qEdit);
          return <QE initial={cur} mode={creating ? 'modal' : 'brushaway'} onClose={() => setQEdit(null)}
            onDelete={() => { removeQ(qEdit); setQEdit(null); }}
            onSave={(nq) => { if (qEdit === 'new') addNewQ(nq); else saveQ(qEdit, nq); setQEdit(null); }} />;
        })()}
      </div>
  );
  const setBodyInner = draft && (<>{topFieldsBrushaway}{questionsSection}</>);

  return (
    <div className={`set-body${sets.length === 0 ? ' set-body--empty' : ''}`}>
      {sets.length === 0 ? (
        <window.EmptyState icon="fa-clipboard-list" title="No question sets yet"
          text="Question sets hold the checks your technicians answer during an inspection. Create your first set, then attach it to a component type."
          actionLabel="Add question set" onAction={addSet} />
      ) : (
      <>
      <div className="set-toolbar">
        <div className="set-toolbar__search">
          <i className="fa-light fa-magnifying-glass"></i>
          <input placeholder="Search question sets" value={q} onChange={e => setQ(e.target.value)} />
        </div>
        <span className="cell-muted" style={{ fontSize: 13 }}>{sets.length} sets · {totalQ} questions</span>
        <div className="set-toolbar__spacer"></div>
        <button className="qmb-ui-button qmb-ui-button--primary" onClick={addSet}><i className="fa-light fa-plus"></i>Add question set</button>
      </div>

      <div className="qmb-ui-table qmb-ui-table--detail qmb-ui-table--x-full">
        <table>
          <thead>
            <tr>
              <th className="table-column--primary">Question set</th>
              <th>Category</th>
              <th>Questions</th>
              <th>Used by</th>
              <th className="table-cell--align-right"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(s => {
              const used = typesUsing(s.id).length || s.usedBy || 0;
              return (
                <tr key={s.id} className={`table-row--clickable ${s.active === false ? 'qset-row--inactive' : ''}`} onClick={() => openSet(s)}>
                  <td className="table-column--primary"><span className="cell-link">{s.name}</span>{s.active === false && <span className="qmb-ui-tag qmb-ui-tag--pastry qmb-ui-tag--gray qset-inactive-tag"><span className="qmb-ui-tag__label">Inactive</span></span>}</td>
                  <td><span className="qmb-ui-tag qmb-ui-tag--pastry qmb-ui-tag--gray"><span className="qmb-ui-tag__label">{s.category}</span></span></td>
                  <td><span className="cell-muted">{s.questions.length} question{s.questions.length === 1 ? '' : 's'}</span></td>
                  <td><span className="cell-muted">{used} type{used === 1 ? '' : 's'}</span></td>
                  <td className="table-cell--align-right"><i className="fa-light fa-chevron-right" style={{ color: 'var(--gray-400)' }}></i></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {filtered.length === 0 && q && <div className="compat-empty" style={{ padding: 24, textAlign: 'center' }}>No question sets match your search.</div>}
      </>
      )}

      {draft && creating && (
        <Portal>
          <div className="qmb-ui-brushaway qset-brushaway" style={{ width: 560 }}>
            <div className="qmb-ui-brushaway__main">
              <div className="qmb-ui-brushaway-header">
                <div className="qmb-ui-brushaway-header__row qmb-ui-brushaway-header__row--title">
                  <div className="qmb-ui-brushaway-header__title"><span className="qmb-ui-text">New question set</span></div>
                  <div className="qmb-ui-brushaway-header__actions">
                    <button className="qmb-ui-button comp-iconbtn" aria-label="Close" onClick={closeModal}><i className="fa-light fa-xmark" aria-hidden="true"></i></button>
                  </div>
                </div>
                <hr className="qmb-ui-brushaway-header__divider" aria-hidden="true" />
              </div>
              <div className="qmb-ui-brushaway-body">
                <div className="qset-brushaway__top">
                  <div className="qmb-ui-input">
                    <input value={draft.name} placeholder=" " autoFocus onChange={e => setDraftField({ name: e.target.value })} />
                    <label>Question set name<span className="req"></span></label>
                  </div>
                </div>
                {setBodyInner}
              </div>
              <div className="qmb-ui-brushaway-footer">
                <div className="qmb-ui-brushaway-footer__content">
                  <div className="qmb-ui-brushaway-footer__actions" style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
                    <button className="qmb-ui-button" onClick={closeModal}>Cancel</button>
                    <button className="qmb-ui-button qmb-ui-button--primary" data-track="save:set" disabled={!draft.name.trim()} onClick={saveModal}>Create set</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Portal>
      )}

      {draft && !creating && (
        <Portal>
          <div className="qmb-ui-modal-wrapper">
            <div className="qmb-ui-modal-overlay" onClick={closeModal}></div>
            <div className="qmb-ui-modal qset-list-modal cmodal" role="dialog" aria-modal="true" aria-label="Edit question set">
              <header className="qmb-ui-modal-header">
                <div className="qmb-ui-modal-header__row qmb-ui-modal-header__row--title">
                  <div className="qmb-ui-modal-header__title cmodal__titlefield">
                    <span className="qmb-ui-text"><b>Question set:</b></span>
                    <InlineText value={draft.name} placeholder="Question set name" width="auto" onCommit={v => setDraftField({ name: v })} ariaLabel="Question set name" />
                  </div>
                  <div className="qmb-ui-modal-header__actions">
                    <button className={`modal-deact ${draft.active === false ? '' : 'is-danger'}`} onClick={() => setDraftField({ active: draft.active === false })}>
                      <i className={`fa-light ${draft.active === false ? 'fa-circle-check' : 'fa-ban'}`}></i>{draft.active === false ? 'Activate' : 'Deactivate'}
                    </button>
                    <button className="qmb-ui-button comp-iconbtn qmb-ui-modal-header__close" aria-label="Close" onClick={closeModal}><i className="fa-light fa-xmark" aria-hidden="true"></i></button>
                  </div>
                </div>
                <hr className="qmb-ui-modal-header__divider" aria-hidden="true" />
              </header>
              <div className="qmb-ui-modal-body qset-list-modal__body">
                {topFieldsModal}
                {questionsSection}
              </div>
              <footer className="qmb-ui-modal-footer qmb-ui-modal-footer--divider">
                <div className="qmb-ui-modal-footer__content">
                  <div className="qmb-ui-modal-footer__start">
                    <button className="qmb-ui-button qmb-ui-button--highlighted" onClick={() => setConfirmDelSet(true)}><i className="fa-light fa-trash-can"></i>Delete set</button>
                  </div>
                  <div className="qmb-ui-modal-footer__actions">
                    <button className="qmb-ui-button" onClick={closeModal}>Cancel</button>
                    <button className="qmb-ui-button qmb-ui-button--primary" data-track="save:set" onClick={saveModal}>Save set</button>
                  </div>
                </div>
              </footer>
            </div>
          </div>
          {confirmDelSet && <ConfirmDialog title="Delete question set?" message={`This deletes “${draft.name || 'this set'}” and removes it from any component types using it. This can't be undone.`} confirmLabel="Delete set" onConfirm={() => { setConfirmDelSet(false); deleteSet(); }} onCancel={() => setConfirmDelSet(false)} />}
        </Portal>
      )}
    </div>
  );
}

window.QuestionsLibrary = QuestionsLibrary;
