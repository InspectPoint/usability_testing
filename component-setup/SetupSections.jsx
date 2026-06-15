// SetupSections.jsx — the content of every step in the unified type-config page.
// Shell-agnostic: the same bodies render inside the rail, tabs, or accordion shell.
// Each Body takes { d, set } where d = the draft type and set(patch) merges fields.

// ── small Quimby tag (local, avoids global name clashes) ────────────────────
function STag({ color = 'gray', icon, children }) {
  return (
    <span className={`qmb-ui-tag qmb-ui-tag--pastry qmb-ui-tag--${color}`}>
      {icon && <i className={`qmb-ui-tag__icon fa-light ${icon}`}></i>}
      <span className="qmb-ui-tag__label">{children}</span>
    </span>
  );
}

// ── Quimby toggle ───────────────────────────────────────────────────────────
function Toggle({ checked, onChange, id }) {
  return (
    <label className="qmb-ui-toggle" htmlFor={id}>
      <input id={id} className="qmb-ui-toggle__input" type="checkbox" checked={!!checked} onChange={e => onChange(e.target.checked)} />
      <span className="qmb-ui-toggle__slider"></span>
    </label>
  );
}

const CATEGORIES = ['Sprinkler','Valve','Alarm','Standpipe','Backflow','Extinguisher','Hood','Pump','Other'];

// ── Step 2: Path fork ───────────────────────────────────────────────────────
function SectionPathFork({ d, set, goId }) {
  const pick = (path) => { set({ path }); if (goId) setTimeout(() => goId('target'), 120); };
  const Card = ({ value, icon, title, desc }) => (
    <button type="button" className={`fork-card ${d.path === value ? 'fork-card--active' : ''}`} onClick={() => pick(value)}>
      <div className="fork-card__icon"><i className={`fa-light ${icon}`}></i></div>
      <div className="fork-card__title">{title}<span className="fork-card__check"><i className="fa-solid fa-circle-check"></i></span></div>
      <div className="fork-card__desc">{desc}</div>
    </button>
  );
  return (
    <div className="fork">
      <Card value="system" icon="fa-diagram-project" title="System component"
        desc="Part of a fire system — a sprinkler head on a wet system, a device on a fire alarm panel. Inspected as part of that system's report." />
      <Card value="non-system" icon="fa-cube" title="Non-system component"
        desc="Stands on its own on a building or asset — like an extinguisher or backflow preventer. Not tied to a system's test cycle." />
    </div>
  );
}

// ── Step 3: System type / Attach to ─────────────────────────────────────────
function SectionTarget({ d, set, goId }) {
  const [showMore, setShowMore] = React.useState(false);
  const advance = () => { if (goId) setTimeout(() => goId('details'), 120); };
  if (d.path === 'non-system') {
    const Opt = (o) => (
      <button key={o.id} type="button" className={`pick-opt ${d.attach === o.id ? 'pick-opt--active' : ''}`} onClick={() => { set({ attach: o.id }); advance(); }}>
        <span className="pick-opt__icon"><i className="fa-light fa-location-dot"></i></span>
        <span>
          <span className="pick-opt__name">{o.name}</span>
          <span className="pick-opt__blurb">{o.blurb}</span>
        </span>
      </button>
    );
    return (
      <div>
        {window.ATTACH_GROUPS.map(g => (
          <div className="pick-group" key={g.id}>
            <div className="pick-group__label">{g.label}</div>
            <div className="pick-group__blurb">{g.blurb}</div>
            <div className="pick-grid">{g.options.map(Opt)}</div>
          </div>
        ))}
        {showMore && (
          <div className="pick-group">
            <div className="pick-group__label">Rarely used</div>
            <div className="pick-group__blurb">Tucked away to reduce noise — most setups don't need these.</div>
            <div className="pick-grid">{window.ATTACH_MORE.map(Opt)}</div>
          </div>
        )}
        {!showMore && (
          <button type="button" className="pick-more" onClick={() => setShowMore(true)}>
            <i className="fa-light fa-plus"></i>Show more types ({window.ATTACH_MORE.length})
          </button>
        )}
      </div>
    );
  }
  // system path
  return (
    <div className="pick-grid">
      {window.SETUP_SYSTEMS.map(s => (
        <button key={s.id} type="button" className={`pick-opt ${d.system === s.id ? 'pick-opt--active' : ''}`} onClick={() => { set({ system: s.id }); advance(); }}>
          <span className="pick-opt__icon"><i className={`fa-light ${s.icon}`}></i></span>
          <span>
            <span className="pick-opt__name">{s.name}</span>
            <span className="pick-opt__blurb">{s.blurb}</span>
          </span>
        </button>
      ))}
    </div>
  );
}

// ── Step 1 (front): Starting point ──────────────────────────────────────────
// A "template" is just a pre-configured component type. So the starting point is:
// start blank, copy one of THIS account's existing types, or begin from a curated
// recommended type. Copy/recommended pre-fills the whole draft and skips ahead to
// Details; only "Start blank" runs the full step-by-step path.
function startCounts(t) {
  const qs = window.QUESTION_SETS.find(q => q.id === t.questionSet);
  return { questions: qs ? qs.questions.length : 0, fields: (t.customFields || []).length, qty: t.defaultQty || 0 };
}
function startPlacement(t) {
  if (t.path === 'non-system') {
    const a = [...window.ATTACH_GROUPS.flatMap(g => g.options), ...window.ATTACH_MORE].find(o => o.id === t.attach);
    return a ? a.name : 'Standalone';
  }
  const s = window.SETUP_SYSTEMS.find(x => x.id === t.system);
  return s ? s.name : 'System';
}
function SectionStart({ d, set, goId }) {
  const [browse, setBrowse] = React.useState(d.startMode === 'copy' ? 'copy' : d.startMode === 'recommended' ? 'recommended' : null);

  const startBlank = () => {
    set({
      startMode: 'blank', copiedFrom: null, copiedFromId: null, sourceQuestionSet: null, questionMode: null,
      path: null, system: null, attach: null, name: '', category: '', abbr: '', description: '',
      compatible: [], customFields: [], questionSetId: null, questions: [],
      autoInclude: false, defaultQty: 0, defaultSubs: {},
    });
    setBrowse(null);
    goId('path');
  };
  const useSource = (src, mode) => {
    const qs = window.QUESTION_SETS.find(q => q.id === src.questionSet);
    set({
      startMode: mode, copiedFrom: src.name, copiedFromId: src.id,
      path: src.path, system: src.system || null, attach: src.attach || null,
      category: src.category, name: src.name,
      compatible: [...(src.compatible || [])],
      customFields: (src.customFields || []).map(f => ({ ...f })),
      sourceQuestionSet: src.questionSet || null,
      questionSetId: src.questionSet || null,
      questions: qs ? qs.questions.map(x => ({ ...x })) : [],
      questionMode: 'shared',
      autoInclude: !!src.autoInclude, defaultQty: src.defaultQty || 0,
      defaultSubs: { ...(src.defaultSubs || {}) },
    });
    goId('path');
  };

  const Card = ({ mode, icon, title, desc, onClick, active }) => (
    <button type="button" className={`fork-card ${active ? 'fork-card--active' : ''}`} onClick={onClick}>
      <div className="fork-card__icon"><i className={`fa-light ${icon}`}></i></div>
      <div className="fork-card__title">{title}<span className="fork-card__check"><i className="fa-solid fa-circle-check"></i></span></div>
      <div className="fork-card__desc">{desc}</div>
    </button>
  );

  return (
    <div>
      <div className="fork">
        <Card mode="blank" icon="fa-file" title="Start blank"
          active={d.startMode === 'blank' && !browse}
          desc="Build everything from scratch with the full step-by-step setup." onClick={startBlank} />
        <Card mode="copy" icon="fa-copy" title="Copy an existing type"
          active={browse === 'copy' || d.startMode === 'copy'}
          desc="Start from one of your account’s component types, then rename and tweak." onClick={() => setBrowse('copy')} />
        <Card mode="recommended" icon="fa-wand-magic-sparkles" title="Use a recommended type"
          active={browse === 'recommended' || d.startMode === 'recommended'}
          desc="Begin from an Inspect Point–curated starter, prefilled with questions and fields." onClick={() => setBrowse('recommended')} />
      </div>

      {browse === 'copy' && (
        <div className="pick-group" style={{ marginTop: 20 }}>
          <div className="pick-group__label">Your component types</div>
          <div className="pick-group__blurb">Copies the placement, fields, compatibility, questions, and defaults. Changes only affect the new type.</div>
          <div className="pick-grid">
            {window.SETUP_TYPES.map(t => (
              <button key={t.id} type="button" className={`pick-opt ${d.copiedFromId === t.id ? 'pick-opt--active' : ''}`} onClick={() => useSource(t, 'copy')}>
                <span className="pick-opt__icon"><i className="fa-light fa-copy"></i></span>
                <span>
                  <span className="pick-opt__name">Copy {t.name}</span>
                  <span className="pick-opt__blurb">{t.category} · {startPlacement(t)} · in use on {t.inUse.toLocaleString()}</span>
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {browse === 'recommended' && (
        <div className="pick-group" style={{ marginTop: 20 }}>
          <div className="pick-group__label">Recommended types</div>
          <div className="pick-group__blurb">Inspect Point–curated starters. Prefilled with questions and fields you can edit.</div>
          <div className="pick-grid">
            {window.RECOMMENDED_TYPES.map(t => {
              const c = startCounts(t);
              return (
                <button key={t.id} type="button" className={`pick-opt ${d.copiedFromId === t.id ? 'pick-opt--active' : ''}`} onClick={() => useSource(t, 'recommended')}>
                  <span className="pick-opt__icon"><i className="fa-light fa-wand-magic-sparkles"></i></span>
                  <span>
                    <span className="pick-opt__name">Start from {t.name} <span className="start-rec">(recommended)</span></span>
                    <span className="pick-opt__blurb">{c.questions} questions · {c.fields} fields{c.qty > 0 ? ` · default ${c.qty}` : ''}</span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Step 4: Component details (+ advanced) ──────────────────────────────────
function SectionDetails({ d, set, locked }) {
  const [advOpen, setAdvOpen] = React.useState(false);
  const adv = d.advanced || {};
  const setAdv = (patch) => set({ advanced: { ...adv, ...patch } });
  const fields = d.customFields || [];
  const setFields = (f) => set({ customFields: f });
  return (
    <div>
      {locked > 0 && (
        <div className="cfg-guard">
          <i className="fa-solid fa-lock"></i>
          <div className="cfg-guard__text">
            <b>This type already has {locked} components in use.</b> Name and category can still change, but
            custom fields can't be removed once components exist — only added. We'll flag any locked field below.
          </div>
        </div>
      )}
      <div className="cfg-fields" style={{ marginTop: locked ? 16 : 0 }}>
        <div className="cfg-field cfg-field--full">
          <label className="cfg-field__label">Component type name <span className="req">*</span></label>
          <input className="cfg-input" value={d.name || ''} placeholder="e.g. Wet sprinkler head" onChange={e => set({ name: e.target.value })} />
        </div>
        <div className="cfg-field">
          <label className="cfg-field__label">Category <span className="req">*</span></label>
          <select className="cfg-input" value={d.category || ''} onChange={e => set({ category: e.target.value })}>
            <option value="" disabled>Choose a category…</option>
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div className="cfg-field">
          <label className="cfg-field__label">Abbreviation</label>
          <input className="cfg-input" value={d.abbr || ''} placeholder="e.g. SPK" onChange={e => set({ abbr: e.target.value })} />
        </div>
        <div className="cfg-field cfg-field--full">
          <label className="cfg-field__label">Description</label>
          <textarea className="cfg-input" value={d.description || ''} placeholder="What this type represents and when to use it." onChange={e => set({ description: e.target.value })}></textarea>
        </div>
      </div>

      {/* custom fields */}
      <div style={{ marginTop: 18 }}>
        <div className="cfg-field__label" style={{ marginBottom: 8 }}>Custom fields</div>
        {fields.length === 0 && <div className="compat-empty">No custom fields yet — add attributes technicians fill in per component (e.g. K-factor, serial number).</div>}
        <div className="q-list">
          {fields.map((f, i) => (
            <div className="q-item" key={i}>
              <span className="q-item__num">{i + 1}</span>
              <span className="q-item__text">{f.label}</span>
              <span className="q-item__type"><STag color="gray">{f.kind}</STag></span>
              <button className="q-item__x" onClick={() => setFields(fields.filter((_, j) => j !== i))} aria-label="Remove field"><i className="fa-light fa-xmark"></i></button>
            </div>
          ))}
        </div>
        <AddFieldRow onAdd={(f) => setFields([...fields, f])} />
      </div>

      {/* advanced */}
      {/* advanced — Quimby inline accordion */}
      <details className={`qmb-ui-accordion qmb-ui-accordion--inline qmb-ui-accordion--${advOpen ? 'expanded' : 'collapsed'} cfg-adv-acc`} open={advOpen}>
        <summary className="qmb-ui-accordion__summary" onClick={e => { e.preventDefault(); setAdvOpen(o => !o); }}>
          <div className="qmb-ui-accordion__header">
            <div className="qmb-ui-accordion__header-left">
              <span className="qmb-ui-accordion__chevron" aria-hidden="true"><i className="fa-solid fa-chevron-right"></i></span>
              <div className="qmb-ui-accordion__title-container">
                <span className="qmb-ui-accordion__title">Advanced settings</span>
                <span className="qmb-ui-accordion__subtitle">Joint Commission, ServiceTrade — most admins skip this</span>
              </div>
            </div>
          </div>
        </summary>
        <div className="qmb-ui-accordion__content">
          <div className="cfg-fields" style={{ padding: '4px 0 8px' }}>
            <div className="cfg-field">
              <label className="cfg-field__label">Joint Commission EP code</label>
              <input className="cfg-input" value={adv.jcCode || ''} placeholder="e.g. EC.02.03.05" onChange={e => setAdv({ jcCode: e.target.value })} />
            </div>
            <div className="cfg-field">
              <label className="cfg-field__label">ServiceTrade line code</label>
              <input className="cfg-input" value={adv.stCode || ''} placeholder="e.g. ST-114" onChange={e => setAdv({ stCode: e.target.value })} />
            </div>
          </div>
        </div>
      </details>
    </div>
  );
}
function AddFieldRow({ onAdd }) {
  const [label, setLabel] = React.useState('');
  const [kind, setKind] = React.useState('Text');
  const add = () => { if (!label.trim()) return; onAdd({ label: label.trim(), kind }); setLabel(''); setKind('Text'); };
  return (
    <div className="q-add">
      <input className="cfg-input" placeholder="Add a custom field…" value={label}
        onChange={e => setLabel(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') add(); }} />
      <select className="cfg-input q-add__type" value={kind} onChange={e => setKind(e.target.value)}>
        {['Text','Number','Date','Single select','Yes / No'].map(k => <option key={k}>{k}</option>)}
      </select>
      <button className="qmb-ui-button qmb-ui-button--highlighted" onClick={add}><i className="fa-light fa-plus"></i>Add</button>
    </div>
  );
}

// ── Step 5: Compatible sub-components ───────────────────────────────────────
function SectionCompat({ d, set }) {
  const selected = d.compatible || [];
  const selfName = (d.name || '').trim().toLowerCase();
  const add = (t) => { if (!selected.includes(t)) set({ compatible: [...selected, t] }); };
  const remove = (t) => set({ compatible: selected.filter(x => x !== t) });
  const options = window.SUBCOMPONENT_TYPES;
  return (
    <div>
      {selected.length > 0 ? (
        <div className="compat-tags">
          {selected.map(t => (
            <span className="compat-tag" key={t}>{t}
              <button className="compat-tag__x" onClick={() => remove(t)} aria-label={`Remove ${t}`}><i className="fa-light fa-xmark"></i></button>
            </span>
          ))}
        </div>
      ) : (
        <div className="compat-empty">Nothing nests under this type yet. Pick the sub-component types it can contain.</div>
      )}
      <div className="compat-add__menu">
        {options.map(t => {
          const isSelf = t.toLowerCase() === selfName;             // prevent self
          const taken = selected.includes(t);
          return (
            <button key={t} type="button" className="compat-opt" disabled={isSelf || taken}
              title={isSelf ? "A type can't contain itself" : undefined} onClick={() => add(t)}>
              <i className="fa-light fa-plus" style={{ fontSize: 10, marginRight: 6 }}></i>{t}
            </button>
          );
        })}
      </div>
      {selected.length > 0 && (
        <div className="compat-summary">
          <i className="fa-solid fa-diagram-project"></i>
          <div className="compat-summary__text">
            A <b>{d.name || 'this component'}</b> can contain {selected.map((t, i) => (
              <React.Fragment key={t}>{i > 0 ? (i === selected.length - 1 ? ' and ' : ', ') : ''}<b>{t}</b></React.Fragment>
            ))}. Those appear as nestable rows when technicians add one in the field.
          </div>
        </div>
      )}
    </div>
  );
}

// ── Step 6: Inspection questions (attach existing OR create a new set) ───────
function SectionQuestions({ d, set }) {
  const [showPicker, setShowPicker] = React.useState(false);
  const creating = d.questionSetId === '__new';
  const qs = window.QUESTION_SETS.find(q => q.id === d.questionSetId);
  const questions = d.questions || [];
  const setQuestions = (q) => set({ questions: q });
  const chooseSet = (id) => {
    const s = window.QUESTION_SETS.find(x => x.id === id);
    set({ questionSetId: id, questions: s ? s.questions.map(x => ({ ...x })) : [], newSetName: '', newSetCategory: '' });
    setShowPicker(false);
  };
  const startCreate = () => { set({ questionSetId: '__new', questions: [], newSetName: '', newSetCategory: d.category || '' }); setShowPicker(false); };
  const discard = () => set({ questionSetId: null, questions: [], newSetName: '', newSetCategory: '' });
  const hasTarget = !!qs || creating;

  // When this draft was copied from another type, the source's question set is
  // SHARED by default (many-to-many in the real app). Offer to duplicate it so
  // edits stay local to this new type. This choice is explicit, never silent.
  const sourceSet = d.copiedFrom && d.sourceQuestionSet ? window.QUESTION_SETS.find(s => s.id === d.sourceQuestionSet) : null;
  const useShared = () => {
    const s = window.QUESTION_SETS.find(x => x.id === d.sourceQuestionSet);
    set({ questionMode: 'shared', questionSetId: d.sourceQuestionSet, questions: s ? s.questions.map(x => ({ ...x })) : [], newSetName: '', newSetCategory: '' });
  };
  const duplicateForType = () => {
    const s = window.QUESTION_SETS.find(x => x.id === d.sourceQuestionSet);
    set({ questionMode: 'duplicate', questionSetId: '__new', questions: s ? s.questions.map(x => ({ ...x })) : (d.questions || []).map(x => ({ ...x })), newSetName: `${d.name || sourceSet?.name || 'Untitled'} questions`, newSetCategory: d.category || '' });
  };

  return (
    <div>
      {sourceSet && (
        <div className="q-sharemode">
          <div className="q-sharemode__title">Questions copied from <b>{d.copiedFrom}</b></div>
          <label className="q-sharemode__opt">
            <input type="radio" name="q-sharemode" checked={d.questionMode !== 'duplicate'} onChange={useShared} />
            <span className="q-sharemode__text"><b>Use the shared set</b> — “{sourceSet.name}” stays linked. Edits here affect every type that uses it.</span>
          </label>
          <label className="q-sharemode__opt">
            <input type="radio" name="q-sharemode" checked={d.questionMode === 'duplicate'} onChange={duplicateForType} />
            <span className="q-sharemode__text"><b>Duplicate these questions</b> so I can edit them separately for this type.</span>
          </label>
        </div>
      )}

      {/* attached existing set */}
      {qs && (
        <div className="q-attach">
          <div className="q-attach__icon"><i className="fa-light fa-clipboard-list-check"></i></div>
          <div className="q-attach__body">
            <div className="q-attach__name">{qs.name}</div>
            <div className="q-attach__meta">{questions.length} questions · {qs.code} · reused on {qs.usedBy} other type{qs.usedBy === 1 ? '' : 's'}</div>
          </div>
          <div className="q-attach__actions">
            <button className="qmb-ui-button" onClick={() => setShowPicker(p => !p)}><i className="fa-light fa-arrows-rotate"></i>Change set</button>
          </div>
        </div>
      )}

      {/* authoring a new reusable set (name + category, like the platform) */}
      {creating && (
        <div className="q-newset-head">
          <div className="q-attach__icon"><i className="fa-light fa-clipboard-list-check"></i></div>
          <div className="cfg-fields">
            <div className="cfg-field">
              <label className="cfg-field__label">New question set name <span className="req">*</span></label>
              <input className="cfg-input" value={d.newSetName || ''} placeholder="e.g. Dry valve trip test" onChange={e => set({ newSetName: e.target.value })} />
            </div>
            <div className="cfg-field">
              <label className="cfg-field__label">Category</label>
              <select className="cfg-input" value={d.newSetCategory || ''} onChange={e => set({ newSetCategory: e.target.value })}>
                <option value="" disabled>Choose…</option>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
        </div>
      )}

      {/* empty / picker */}
      {!hasTarget && <div className="compat-empty">No questions yet. Reuse an existing set, or create a new reusable set.</div>}
      {(showPicker || !hasTarget) && (
        <div className="pick-grid" style={{ marginBottom: 12 }}>
          {window.QUESTION_SETS.map(s => (
            <button key={s.id} type="button" className={`pick-opt ${d.questionSetId === s.id ? 'pick-opt--active' : ''}`} onClick={() => chooseSet(s.id)}>
              <span className="pick-opt__icon"><i className="fa-light fa-clipboard-list"></i></span>
              <span>
                <span className="pick-opt__name">{s.name}</span>
                <span className="pick-opt__blurb">{s.questions.length} questions · {s.code}</span>
              </span>
            </button>
          ))}
          <button type="button" className={`pick-opt pick-opt--blank ${creating ? 'pick-opt--active' : ''}`} onClick={startCreate}>
            <span className="pick-opt__icon"><i className="fa-light fa-file"></i></span>
            <span>
              <span className="pick-opt__name">Start blank</span>
              <span className="pick-opt__blurb">Build a new reusable set from scratch.</span>
            </span>
          </button>
        </div>
      )}

      {/* question editor — for both an attached set and a new one */}
      {hasTarget && (
        <>
          <div className="q-list" style={{ marginTop: 14 }}>
            {questions.map((q, i) => (
              <div className="q-item" key={i}>
                <span className="q-item__num">{i + 1}</span>
                <span className="q-item__text">{q.q}</span>
                <span className="q-item__type"><STag color="purple">{q.type}</STag></span>
                <button className="q-item__x" onClick={() => setQuestions(questions.filter((_, j) => j !== i))} aria-label="Remove question"><i className="fa-light fa-xmark"></i></button>
              </div>
            ))}
          </div>
          <AddQuestionRow onAdd={(q) => setQuestions([...questions, q])} />
          {creating && (
            <button className="qmb-ui-button q-discard" onClick={discard}><i className="fa-light fa-arrow-left"></i>Discard new set</button>
          )}
        </>
      )}
    </div>
  );
}
function AddQuestionRow({ onAdd }) {
  const [text, setText] = React.useState('');
  const [type, setType] = React.useState('Pass / Fail / N/A');
  const add = () => { if (!text.trim()) return; onAdd({ q: text.trim(), type }); setText(''); };
  return (
    <div className="q-add">
      <input className="cfg-input" placeholder="Write a new question…" value={text}
        onChange={e => setText(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') add(); }} />
      <select className="cfg-input q-add__type" value={type} onChange={e => setType(e.target.value)}>
        {window.QUESTION_TYPES.map(t => <option key={t}>{t}</option>)}
      </select>
      <button className="qmb-ui-button qmb-ui-button--highlighted" onClick={add}><i className="fa-light fa-plus"></i>Add</button>
    </div>
  );
}

// ── Step 7: Defaults ────────────────────────────────────────────────────────
function SectionDefaults({ d, set }) {
  const sys = window.SETUP_SYSTEMS.find(s => s.id === d.system);
  const sysName = sys ? sys.name.toLowerCase() : 'this system';
  const qty = d.defaultQty || 0;
  const setQty = (n) => set({ defaultQty: Math.max(0, Math.min(99, n)) });
  const summaryActive = d.autoInclude || qty > 0;
  // default sub-components: per compatible sub-type, how many auto-created inside each one
  const compat = d.compatible || [];
  const subs = d.defaultSubs || {};
  const setSub = (type, n) => set({ defaultSubs: { ...subs, [type]: Math.max(0, Math.min(99, n)) } });
  const subTotal = compat.reduce((sum, t) => sum + (subs[t] || 0), 0);
  return (
    <div>
      <div className="def-row">
        <Toggle id="def-autoinc" checked={d.autoInclude} onChange={v => set({ autoInclude: v })} />
        <div className="def-row__body">
          <div className="def-row__title">Always include this with the system</div>
          <div className="def-row__desc">Certain items are always present with a system. When on, this component is auto-attached to every building that has {d.path === 'system' ? `a ${sysName} system` : 'this asset'} and can't be removed per-building.</div>
        </div>
      </div>

      <div className="def-row">
        <div className="def-row__icon"><i className="fa-light fa-hashtag"></i></div>
        <div className="def-row__body">
          <div className="def-row__title">Default quantity per building</div>
          <div className="def-row__desc">How many of these to pre-populate on each building so it isn't built by hand.</div>
          <div className="def-qty">
            <div className="def-stepper">
              <button onClick={() => setQty(qty - 1)} disabled={qty <= 0} aria-label="Decrease"><i className="fa-light fa-minus"></i></button>
              <input type="text" inputMode="numeric" value={qty} onChange={e => setQty(parseInt(e.target.value.replace(/\D/g, ''), 10) || 0)} />
              <button onClick={() => setQty(qty + 1)} aria-label="Increase"><i className="fa-light fa-plus"></i></button>
            </div>
            <span className="cfg-field__hint">Set 0 to add them manually instead.</span>
          </div>
        </div>
      </div>

      <div className="def-row">
        <div className="def-row__icon"><i className="fa-light fa-diagram-subtask"></i></div>
        <div className="def-row__body">
          <div className="def-row__title">Default sub-components</div>
          <div className="def-row__desc">Sub-components automatically created inside every new {d.name || 'component'} — e.g. a riser that always ships with a gauge and a tamper switch.</div>
          {compat.length === 0 ? (
            <div className="compat-empty" style={{ marginTop: 10, marginBottom: 0 }}>No compatible sub-components yet. Add them in the <b>Compatibility</b> step to set defaults here.</div>
          ) : (
            <div className="defsub-list">
              {compat.map(type => {
                const n = subs[type] || 0;
                return (
                  <div className="defsub-row" key={type}>
                    <span className="defsub-row__name">{type}</span>
                    <div className="def-stepper">
                      <button onClick={() => setSub(type, n - 1)} disabled={n <= 0} aria-label={`Fewer ${type}`}><i className="fa-light fa-minus"></i></button>
                      <input type="text" inputMode="numeric" value={n} onChange={e => setSub(type, parseInt(e.target.value.replace(/\D/g, ''), 10) || 0)} />
                      <button onClick={() => setSub(type, n + 1)} aria-label={`More ${type}`}><i className="fa-light fa-plus"></i></button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div className={`def-summary ${summaryActive || subTotal > 0 ? '' : 'def-summary--muted'}`}>
        <i className={`fa-solid ${summaryActive || subTotal > 0 ? 'fa-circle-check' : 'fa-circle-info'}`}></i>
        <div className="def-summary__text">
          {summaryActive
            ? <><b>{qty > 0 ? qty : 'These'}</b> {qty === 1 ? 'is' : 'are'} added automatically on every building with {d.path === 'system' ? `a ${sysName} system` : 'this asset'}{d.autoInclude ? ' and can\u2019t be removed per-building' : ''}.</>
            : <>Not auto-included. Technicians add these by hand when configuring a building.</>}
          {subTotal > 0 && <> Each one is created with <b>{subTotal}</b> default sub-component{subTotal === 1 ? '' : 's'}.</>}
        </div>
      </div>
    </div>
  );
}

// ── Step 8: Review ──────────────────────────────────────────────────────────
function SectionReview({ d, goId }) {
  const sys = window.SETUP_SYSTEMS.find(s => s.id === d.system);
  const attach = [...window.ATTACH_GROUPS.flatMap(g => g.options), ...window.ATTACH_MORE].find(o => o.id === d.attach);
  const qs = window.QUESTION_SETS.find(q => q.id === d.questionSetId);
  const qty = d.defaultQty || 0;
  const startedFrom = d.startMode === 'copy' ? `Copied from ${d.copiedFrom}`
    : d.startMode === 'recommended' ? `From recommended type · ${d.copiedFrom}`
    : 'Started blank';
  const Line = ({ label, step, children }) => (
    <div className="review-line">
      <div className="review-line__label">{label}</div>
      <div className="review-line__value">{children}</div>
      {step != null && <button className="review-line__edit" onClick={() => goId(step)}>Edit</button>}
    </div>
  );
  return (
    <div>
      <div className="cfg-guard" style={{ marginBottom: 16 }}>
        <i className="fa-solid fa-shield-check"></i>
        <div className="cfg-guard__text">
          Review before saving. <b>Custom fields can't be changed once components of this type exist</b> — only added.
          Everything else (questions, compatibility, defaults) stays editable.
        </div>
      </div>
      <div className="review-card">
        <Line label="Starting point" step="start">{startedFrom}</Line>
        <Line label="Path" step="path">{d.path === 'system' ? 'System component' : d.path === 'non-system' ? 'Non-system component' : <span className="set-cell-empty">Not set</span>}</Line>
        <Line label={d.path === 'non-system' ? 'Attaches to' : 'System'} step="target">
          {d.path === 'non-system'
            ? (attach ? attach.name : <span className="set-cell-empty">Not set</span>)
            : (sys ? <STag color="blue" icon={sys.icon}>{sys.name}</STag> : <span className="set-cell-empty">Not set</span>)}
        </Line>
        <Line label="Name" step="details">{d.name || <span className="set-cell-empty">Unnamed</span>} {d.category && <STag color="gray">{d.category}</STag>}</Line>
        <Line label="Compatible with" step="compat">
          {(d.compatible || []).length ? d.compatible.join(', ') : <span className="set-cell-empty">Nothing nests under it</span>}
        </Line>
        <Line label="Questions" step="questions">
          {(d.questions || []).length} question{(d.questions || []).length === 1 ? '' : 's'}{qs ? ` · ${qs.name}${d.questionMode === 'shared' ? ' (shared)' : ''}` : (d.questionSetId === '__new' ? ` · ${d.newSetName || 'New set'} (new)` : '')}
        </Line>
        <Line label="Defaults" step="defaults">
          {d.autoInclude ? 'Auto-included with the system' : 'Added manually'}{qty > 0 ? ` · ${qty} per building` : ''}
        </Line>
        {(() => {
          const subs = d.defaultSubs || {};
          const entries = (d.compatible || []).filter(t => (subs[t] || 0) > 0).map(t => `${subs[t]} ${t}`);
          return entries.length > 0 ? <Line label="Default sub-components" step="defaults">{entries.join(', ')}</Line> : null;
        })()}
      </div>
    </div>
  );
}

// ── Section registry (shared by all shells) ────────────────────────────────
const SETUP_SECTIONS = [
  { id:'start',    label:'Start',          meta:'Blank, copy, or recommended', title:'How do you want to start?',
    desc:'Start blank, copy one of your existing component types, or begin from a recommended type.', Body: SectionStart },
  { id:'path',     label:'Path',           meta:'System or standalone', title:'How is this component used?',
    desc:'This choice shapes the rest of setup.', Body: SectionPathFork },
  { id:'target',   label:'Placement',      meta:'Where it lives',
    titleFor: d => d.path === 'non-system' ? 'What does it attach to?' : 'Which system does it belong to?',
    descFor:  d => d.path === 'non-system' ? 'Grouped and described — the noisy raw model names are tucked away.' : 'Pick the fire system this component is inspected as part of.',
    Body: SectionTarget },
  { id:'details',  label:'Details',        meta:'Name & fields', title:'Component details',
    desc:'Name it, categorize it, and add any custom fields. Advanced codes stay collapsed.', Body: SectionDetails },
  { id:'compat',   label:'Compatibility',  meta:'What nests under it', title:'Compatible sub-components',
    desc:'Define what can nest under this type. A type can\u2019t contain itself.', Body: SectionCompat },
  { id:'questions',label:'Questions',      meta:'Inspection checks', title:'Inspection questions',
    desc:'Attach a reusable set or write questions inline — no separate Questions page needed.', Body: SectionQuestions },
  { id:'defaults', label:'Defaults',       meta:'Auto-include & qty', title:'Defaults',
    desc:'Decide whether this is always included and how many to pre-populate per building.', Body: SectionDefaults },
  { id:'review',   label:'Review',         meta:'Confirm & save', title:'Review',
    desc:'A plain-language summary, with field-edit restrictions surfaced up front.', Body: SectionReview },
];

function sectionTitle(s, d) { return s.titleFor ? s.titleFor(d) : s.title; }
function sectionDesc(s, d) { return s.descFor ? s.descFor(d) : s.desc; }

// completion logic — required steps by content, optional by "visited"
function stepDone(id, d, visited) {
  switch (id) {
    case 'start': return !!d.startMode;
    case 'path': return !!d.path;
    case 'target': return d.path === 'non-system' ? !!d.attach : !!d.system;
    case 'details': return !!(d.name && d.category);
    case 'compat': return visited.has('compat') || (d.compatible || []).length > 0;
    case 'questions': return visited.has('questions') || (d.questions || []).length > 0;
    case 'defaults': return visited.has('defaults');
    case 'review': return false;
    default: return false;
  }
}

Object.assign(window, {
  STag, Toggle,
  SETUP_SECTIONS, sectionTitle, sectionDesc, stepDone,
});
