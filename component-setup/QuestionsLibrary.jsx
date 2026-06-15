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

function QuestionsLibrary() {
  const seed = () => window.QUESTION_SETS.map(s => ({
    id: s.id, name: s.name, code: s.code, category: s.category, usedBy: s.usedBy, updated: s.updated,
    active: s.active !== false,
    questions: s.questions.map(q => ({ id: nextId('q'), q: q.q, type: q.type, frequency: q.frequency || 'Annual' })),
  }));
  const [sets, setSets] = React.useState(seed);
  const [q, setQ] = React.useState('');
  const [openId, setOpenId] = React.useState(null);     // set open in the modal/brushaway
  const [creating, setCreating] = React.useState(false); // add flow → brushaway; edit → modal
  const [draft, setDraft] = React.useState(null);       // working copy of that set
  const drag = React.useRef(null);
  const [dropHint, setDropHint] = React.useState(null);
  const [dragId, setDragId] = React.useState(null);

  const codeFor = (name) => (name || 'SET').split(/\s+/).map(w => w[0]).join('').toUpperCase().slice(0, 5);
  const commit = (next) => {
    setSets(next);
    window.QUESTION_SETS.length = 0;
    next.forEach(s => window.QUESTION_SETS.push({
      id: s.id, name: s.name, code: s.code || codeFor(s.name), category: s.category,
      active: s.active !== false,
      usedBy: s.usedBy || 0, updated: 'Just now',
      questions: s.questions.map(x => ({ q: x.q, type: x.type, frequency: x.frequency })),
    }));
  };
  const typesUsing = (setId) => window.SETUP_TYPES.filter(t => t.questionSet === setId);

  // ── open / create / save a set via the modal ──
  const appliesFor = (setId) => window.SETUP_TYPES.filter(t => t.questionSet === setId).map(t => t.id);
  const openSet = (s) => { setCreating(false); setOpenId(s.id); setDraft({ ...s, questions: s.questions.map(x => ({ ...x })), appliesTo: appliesFor(s.id) }); };
  const addSet = () => {
    const s = { id: nextId('qs'), name: '', code: '', category: 'Other', questions: [], appliesTo: [] };
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
    commit(exists ? sets.map(s => s.id === draft.id ? draft : s) : [...sets, draft]);
    syncAppliesTo(draft);
    closeModal();
  };
  const deleteSet = () => { commit(sets.filter(s => s.id !== draft.id)); syncAppliesTo({ ...draft, appliesTo: [] }); closeModal(); };

  // ── draft mutations (modal only) ──
  const setDraftField = (patch) => setDraft(d => ({ ...d, ...patch }));
  const setQ_ = (qId, patch) => setDraft(d => ({ ...d, questions: d.questions.map(x => x.id === qId ? { ...x, ...patch } : x) }));
  const addQ = () => setDraft(d => ({ ...d, questions: [...d.questions, { id: nextId('q'), q: '', type: 'Pass / Fail / N/A', frequency: 'Annual' }] }));
  const removeQ = (qId) => setDraft(d => ({ ...d, questions: d.questions.filter(x => x.id !== qId) }));
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
    const rows = listRef.current ? [...listRef.current.querySelectorAll('.qset-qrow')] : [];
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

  // Shared body (questions + component types) used by BOTH the edit modal and the
  // add brushaway, so the two shells stay identical inside.
  const setBodyInner = draft && (
    <>
      <div className="qset-modal__section">
        <div className="qset-modal__sectionhead">
          <h3 className="qset-modal__sectiontitle">Component types</h3>
          <span className="qsec__meta">{(draft.appliesTo || []).length} selected</span>
        </div>
        <p className="qset-apply__intro">Add the component types that use this question set. These questions appear on inspections for every type listed here.</p>
        <TypePicker
          selected={draft.appliesTo || []}
          currentSetId={draft.id}
          sets={sets}
          onAdd={id => toggleApplies(id)}
          onRemove={id => toggleApplies(id)}
        />
      </div>
      <div className="qset-modal__section">
        <div className="qset-modal__sectionhead">
          <h3 className="qset-modal__sectiontitle">Questions</h3>
          <span className="qsec__meta">{draft.questions.length} question{draft.questions.length === 1 ? '' : 's'}</span>
        </div>
        <div className="qmb-ui-table qmb-ui-table--detail qmb-ui-table--x-full qset-qtable">
          <table>
            <thead>
              <tr>
                <th className="qset-qcol-grip"></th>
                <th className="table-column--primary">Question</th>
                <th className="qset-qcol-type">Answer type</th>
                <th className="qset-qcol-freq">Frequency</th>
                <th className="qset-qcol-act"></th>
              </tr>
            </thead>
            <tbody ref={listRef}>
              {draft.questions.map(qq => {
                const hint = dropHint && dropHint.qId === qq.id ? ' qrow--drop-' + dropHint.pos : '';
                return (
                  <tr key={qq.id} data-qid={qq.id} className={`qset-qrow ${dragId === qq.id ? 'is-dragging' : ''}${hint}`}>
                    <td className="qset-qcol-grip">
                      <span className="comp-handle" role="button" tabIndex={0} title="Drag to reorder" onPointerDown={e => onGripDown(e, qq.id)}>
                        <i className="fa-light fa-grip-dots-vertical"></i>
                      </span>
                    </td>
                    <td className="table-column--primary">
                      <QInlineText value={qq.q} placeholder="Question name…" onCommit={v => setQ_(qq.id, { q: v })} />
                    </td>
                    <td className="qset-qcol-type">
                      <InlineSelect value={qq.type} options={window.QUESTION_TYPES.map(t => ({ value: t, label: t }))} onChange={v => setQ_(qq.id, { type: v })} />
                    </td>
                    <td className="qset-qcol-freq">
                      <InlineSelect value={qq.frequency || 'Annual'} options={FREQUENCIES.map(f => ({ value: f, label: f }))} onChange={v => setQ_(qq.id, { frequency: v })} />
                    </td>
                    <td className="qset-qcol-act">
                      <button className="set-rowact" aria-label="Remove question" title="Remove" onClick={() => removeQ(qq.id)}><i className="fa-light fa-xmark"></i></button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {draft.questions.length === 0 && <div className="qsec__empty" style={{ padding: '20px 4px' }}>No questions yet — add the first one below.</div>}
        <button className="qsec__add" onClick={addQ}><i className="fa-light fa-plus"></i>Add question</button>
      </div>
    </>
  );

  return (
    <div className="set-body">
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
      {filtered.length === 0 && <div className="compat-empty" style={{ padding: 24, textAlign: 'center' }}>No question sets{q ? ' match your search' : ' yet'}.</div>}

      {draft && creating && (
        <Portal>
          <div className="qmb-ui-brushaway-scrim" onClick={closeModal}></div>
          <div className="qmb-ui-brushaway qset-brushaway" style={{ width: 560 }}>
            <div className="qmb-ui-brushaway__main">
              <div className="qmb-ui-brushaway-header">
                <div className="qmb-ui-brushaway-header__row qmb-ui-brushaway-header__row--title">
                  <div className="qmb-ui-brushaway-header__title"><span className="qmb-ui-text">New question set</span></div>
                  <div className="qmb-ui-brushaway-header__actions">
                    <button className="qmb-ui-button qmb-ui-button--highlighted comp-iconbtn" aria-label="Close" onClick={closeModal}><i className="fa-light fa-xmark" aria-hidden="true"></i></button>
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
                  <div className="qmb-ui-select">
                    <select className="qmb-ui-select__trigger" value={draft.category} onChange={e => setDraftField({ category: e.target.value })}>
                      {Object.keys(window.CATEGORY_COLOR).map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                    <label>Category</label>
                  </div>
                </div>
                {setBodyInner}
              </div>
              <div className="qmb-ui-brushaway-footer">
                <div className="qmb-ui-brushaway-footer__content">
                  <div className="qmb-ui-brushaway-footer__actions" style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
                    <button className="qmb-ui-button" onClick={closeModal}>Cancel</button>
                    <button className="qmb-ui-button qmb-ui-button--primary" disabled={!draft.name.trim()} onClick={saveModal}>Create set</button>
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
            <div className="qmb-ui-modal qset-list-modal" role="dialog" aria-modal="true" aria-label="Edit question set">
              <header className="qmb-ui-modal-header">
                <div className="qmb-ui-modal-header__row qmb-ui-modal-header__row--title">
                  <div className="qmb-ui-modal-header__title">
                    <input className="qsec__name qset-list-modal__name" value={draft.name} placeholder="Question set name" onChange={e => setDraftField({ name: e.target.value })} />
                  </div>
                  <div className="qmb-ui-modal-header__actions">
                    <button className={`modal-deact ${draft.active === false ? '' : 'is-danger'}`} onClick={() => setDraftField({ active: draft.active === false })}>
                      <i className={`fa-light ${draft.active === false ? 'fa-circle-check' : 'fa-ban'}`}></i>{draft.active === false ? 'Activate' : 'Deactivate'}
                    </button>
                    <button className="qmb-ui-button qmb-ui-button--highlighted comp-iconbtn qmb-ui-modal-header__close" aria-label="Close" onClick={closeModal}><i className="fa-light fa-xmark" aria-hidden="true"></i></button>
                  </div>
                </div>
                <div className="qmb-ui-modal-header__row qset-list-modal__sub">
                  <span className="header__label">Category:</span>
                  <InlineSelect value={draft.category} options={Object.keys(window.CATEGORY_COLOR).map(c => ({ value: c, label: c }))} onChange={v => setDraftField({ category: v })} />
                </div>
                <hr className="qmb-ui-modal-header__divider" aria-hidden="true" />
              </header>
              <div className="qmb-ui-modal-body qset-list-modal__body">
                {setBodyInner}
              </div>
              <footer className="qmb-ui-modal-footer qmb-ui-modal-footer--divider">
                <div className="qmb-ui-modal-footer__content">
                  <div className="qmb-ui-modal-footer__start">
                    <button className="qmb-ui-button qmb-ui-button--highlighted" onClick={deleteSet}><i className="fa-light fa-trash-can"></i>Delete set</button>
                  </div>
                  <div className="qmb-ui-modal-footer__actions">
                    <button className="qmb-ui-button" onClick={closeModal}>Cancel</button>
                    <button className="qmb-ui-button qmb-ui-button--primary" onClick={saveModal}>Save set</button>
                  </div>
                </div>
              </footer>
            </div>
          </div>
        </Portal>
      )}
    </div>
  );
}

window.QuestionsLibrary = QuestionsLibrary;
