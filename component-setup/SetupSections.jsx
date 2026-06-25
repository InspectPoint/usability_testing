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

// Shared empty-state for the Settings tabs (gray canvas + guidance + CTA).
function EmptyState({ icon, title, text, actionLabel, onAction }) {
  return (
    <div className="set-empty">
      <div className="set-empty__art"><i className={`fa-light ${icon}`}></i></div>
      <h3 className="set-empty__title">{title}</h3>
      <p className="set-empty__text">{text}</p>
      <button className="qmb-ui-button qmb-ui-button--primary" onClick={onAction}><i className="fa-light fa-plus"></i>{actionLabel}</button>
    </div>
  );
}
window.EmptyState = EmptyState;
const QUESTION_FREQS = ['Annual','Semi-annual','Quarterly','Monthly','Weekly','3-year','5-year'];
const FIELD_TYPES = ['Text','Number','Date','Single select','Yes / No'];

// ── Options editor — revealed when an answer/field type is Single/Multi select.
// Mirrors how Inspect Point asks for the choice list. ──
function OptionsEditor({ value, onChange }) {
  const opts = value && value.length ? value : [''];
  const update = (arr) => onChange(arr);
  return (
    <div className="qopts">
      <div className="qopts__label">Options</div>
      {opts.map((o, i) => (
        <div className="qopts__row" key={i}>
          <i className="fa-light fa-circle-dot qopts__bullet"></i>
          <input className="qopts__input" value={o} placeholder={`Option ${i + 1}`}
            onChange={e => update(opts.map((x, j) => j === i ? e.target.value : x))} />
          <button className="set-rowact" aria-label="Remove option" title="Remove option"
            onClick={() => update(opts.filter((_, j) => j !== i).length ? opts.filter((_, j) => j !== i) : [''])}><i className="fa-light fa-xmark"></i></button>
        </div>
      ))}
      <button type="button" className="qopts__add" onClick={() => update([...opts, ''])}><i className="fa-light fa-plus"></i>Add option</button>
    </div>
  );
}

// ── Quimby form fields — qmb-ui-input / qmb-ui-select, styled by the existing
// quimby-components.css implementation (single source of truth). Markup matches its
// conventions: floating <label> with a `.req` asterisk span, and a `.is-open` /
// `.is-placeholder` select trigger. ──
function QInput({ id, label, required, value, onChange, multiline }) {
  if (multiline) {
    const taRef = React.useRef(null);
    React.useLayoutEffect(() => {
      const el = taRef.current; if (!el) return;
      el.style.height = 'auto';
      el.style.height = Math.max(el.scrollHeight, 48) + 'px';
    }, [value]);
    return (
      <div className="qmb-ui-input">
        <textarea ref={taRef} id={id} className="qmb-ui-input__autogrow" value={value || ''} placeholder=" " required={required} onChange={e => onChange(e.target.value)}></textarea>
        <label htmlFor={id}>{label}{required && <span className="req"></span>}</label>
      </div>
    );
  }
  return (
    <div className="qmb-ui-input">
      <input id={id} type="text" value={value || ''} placeholder=" " required={required} onChange={e => onChange(e.target.value)} />
      <label htmlFor={id}>{label}{required && <span className="req"></span>}</label>
    </div>
  );
}
function QSelect({ id, label, required, value, onChange, options, placeholder = 'Choose…', onCreate, createLabel }) {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef(null);
  React.useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);
  const opts = options.map(o => (o.value != null ? o : { value: o, label: o }));
  const sel = opts.find(o => o.value === value);
  return (
    <div className={`qmb-ui-select ${open ? 'is-open' : ''}`} ref={ref}>
      <div className={`qmb-ui-select__trigger ${sel ? '' : 'is-placeholder'}`} role="button" tabIndex={0} aria-expanded={open} aria-haspopup="listbox"
        onClick={() => setOpen(o => !o)}
        onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setOpen(o => !o); } if (e.key === 'Escape') setOpen(false); }}>
        {sel ? sel.label : placeholder}
      </div>
      <label>{label}{required && <span className="req"></span>}</label>
      {open && (
        <div className="qmb-ui-select__popup">
          <div className="qmb-ui-select__options">
            <ul>
              {opts.map(o => (
                <li key={o.value}>
                  <button type="button" className={`qmb-ui-select__option ${value === o.value ? 'qmb-ui-select__option--selected' : ''}`}
                    onClick={() => { onChange(o.value); setOpen(false); }}>{o.label}</button>
                </li>
              ))}
            </ul>
          </div>
          {onCreate && (
            <button type="button" className="qmb-ui-select__create" onClick={() => { setOpen(false); onCreate(); }}>
              <i className="fa-light fa-plus"></i>{createLabel || 'Create new'}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

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
  const [recQuery, setRecQuery] = React.useState('');

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

  const Card = ({ mode, icon, title, desc, onClick, active, disabled, tooltip }) => {
    const card = (
      <button type="button" className={`fork-card ${active ? 'fork-card--active' : ''} ${disabled ? 'fork-card--disabled' : ''}`}
        onClick={disabled ? undefined : onClick} disabled={disabled} aria-disabled={disabled}>
        <div className="fork-card__icon"><i className={`fa-light ${icon}`}></i></div>
        <div className="fork-card__title">{title}<span className="fork-card__check"><i className="fa-solid fa-circle-check"></i></span></div>
        <div className="fork-card__desc">{desc}</div>
      </button>
    );
    if (disabled && tooltip && window.Tooltip) {
      return <window.Tooltip content={tooltip} position="top" multiline><span className="fork-card__tipwrap">{card}</span></window.Tooltip>;
    }
    return card;
  };

  const closeBrowse = () => setBrowse(null);

  return (
    <div>
      <div className="fork">
        <Card mode="blank" icon="fa-file" title="Start blank"
          active={d.startMode === 'blank'}
          desc="Build everything from scratch with the full step-by-step setup." onClick={startBlank} />
        <Card mode="copy" icon="fa-copy" title="Copy an existing type"
          active={d.startMode === 'copy'}
          disabled={(window.SETUP_TYPES || []).length === 0}
          tooltip="You don’t have any component types yet to copy from."
          desc="Start from one of your account’s component types, then rename and tweak." onClick={() => setBrowse('copy')} />
        <Card mode="recommended" icon="fa-wand-magic-sparkles" title="Use a recommended type"
          active={d.startMode === 'recommended'}
          desc="Begin from an Inspect Point–curated starter, prefilled with questions and fields." onClick={() => setBrowse('recommended')} />
      </div>

      {browse && window.Portal && (
        <window.Portal>
          <div className="qmb-ui-modal-wrapper" style={{ zIndex: 10084 }}>
            <div className="qmb-ui-modal-overlay" onClick={closeBrowse}></div>
            <div className="qmb-ui-modal startpick-modal" role="dialog" aria-modal="true"
              aria-label={browse === 'copy' ? 'Copy an existing type' : 'Inspect Point Recommended Component Types'}
              style={{ width: browse === 'recommended' ? 860 : 600, maxWidth: 'calc(100vw - 48px)' }}>
              <header className="qmb-ui-modal-header">
                <div className="qmb-ui-modal-header__row qmb-ui-modal-header__row--title">
                  <div className="qmb-ui-modal-header__title"><span className="qmb-ui-text"><b>{browse === 'copy' ? 'Copy an existing type' : 'Inspect Point Recommended Component Types'}</b></span></div>
                  <div className="qmb-ui-modal-header__actions">
                    <button className="qmb-ui-button comp-iconbtn qmb-ui-modal-header__close" aria-label="Close" onClick={closeBrowse}><i className="fa-light fa-xmark"></i></button>
                  </div>
                </div>
                <hr className="qmb-ui-modal-header__divider" aria-hidden="true" />
              </header>
              <div className="qmb-ui-modal-body">
                {browse === 'copy' ? (
                  <>
                    <p className="guide-modal__intro">Copies the placement, fields, compatibility, questions, and defaults into a new type. Changes only affect the new type.</p>
                    <div className="pick-grid">
                      {window.SETUP_TYPES.length === 0 && (
                        <div className="compat-empty" style={{ padding: '8px 0' }}>You don’t have any component types to copy yet. Start blank or use a recommended type instead.</div>
                      )}
                      {window.SETUP_TYPES.map(t => (
                        <button key={t.id} type="button" className="pick-opt" onClick={() => { useSource(t, 'copy'); closeBrowse(); }}>
                          <span className="pick-opt__icon"><i className="fa-light fa-copy"></i></span>
                          <span>
                            <span className="pick-opt__name">{t.name}</span>
                            <span className="pick-opt__blurb">{t.category} · {startPlacement(t)} · in use on {t.inUse.toLocaleString()}</span>
                          </span>
                        </button>
                      ))}
                    </div>
                  </>
                ) : (
                  <>
                    <p className="guide-modal__intro">These are pre-configured component type templates recommended by Inspect Point.</p>
                    <div className="rec-search">
                      <input placeholder="Search" value={recQuery} onChange={e => setRecQuery(e.target.value)} />
                      <i className="fa-light fa-magnifying-glass"></i>
                    </div>
                    <div className="qmb-ui-table qmb-ui-table--detail qmb-ui-table--x-full rec-table">
                      <table>
                        <thead>
                          <tr>
                            <th className="table-column--primary">Type Name</th>
                            <th>Category</th>
                            <th>Allowed Device Types</th>
                            <th className="table-cell--align-right"><span className="set-sr">Import</span></th>
                          </tr>
                        </thead>
                        <tbody>
                          {window.RECOMMENDED_TYPES
                            .filter(t => !recQuery || `${t.name} ${t.category}`.toLowerCase().includes(recQuery.toLowerCase()))
                            .map(t => (
                              <tr key={t.id}>
                                <td className="table-column--primary">{t.name}</td>
                                <td>{t.category}</td>
                                <td>
                                  <div className="rec-devtypes">
                                    {(t.allowedDeviceTypes || []).map(dt => (
                                      <span key={dt} className="qmb-ui-tag qmb-ui-tag--pastry qmb-ui-tag--gray"><span className="qmb-ui-tag__label">{dt}</span></span>
                                    ))}
                                  </div>
                                </td>
                                <td className="table-cell--align-right">
                                  <button type="button" className="rec-import" onClick={() => { useSource(t, 'recommended'); closeBrowse(); }}>Import</button>
                                </td>
                              </tr>
                            ))}
                          {window.RECOMMENDED_TYPES.filter(t => !recQuery || `${t.name} ${t.category}`.toLowerCase().includes(recQuery.toLowerCase())).length === 0 && (
                            <tr><td colSpan={4}><div className="compat-empty" style={{ padding: '16px 0', textAlign: 'center' }}>No recommended types match “{recQuery}”.</div></td></tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </window.Portal>
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
      <div className="cfg-fields" style={{ marginTop: locked > 0 ? 16 : 0 }}>
        <div className="cfg-field--full">
          <QInput id="ct-name" label="Component type name" required value={d.name} onChange={v => set({ name: v })} />
        </div>
        <QSelect id="ct-category" label="Category" required value={d.category} onChange={v => set({ category: v })} options={CATEGORIES.map(c => ({ value: c, label: c }))} />
        <QInput id="ct-abbr" label="Abbreviation" value={d.abbr} onChange={v => set({ abbr: v })} />
        <div className="cfg-field--full">
          <QInput id="ct-desc" label="Description" multiline value={d.description} onChange={v => set({ description: v })} />
        </div>
      </div>

      {/* custom fields — opt-in: a quiet add button reveals editable rows */}
      <div style={{ marginTop: 18 }}>
        <div className="cfield-heading">Component-specific fields</div>
        <p className="cfg-section__desc" style={{ marginTop: 2 }}>Device attributes technicians record per component — like a sprinkler head's K-factor, a backflow preventer's serial number, or a panel's model. Separate from inspection questions.</p>
        {fields.length === 0 && <div className="compat-empty">No fields yet — add the attributes your technicians should capture for this component type.</div>}
        <div className="cfield-cards">
          {fields.map((f, i) => {
            const ITextC = window.InlineText, ISelectC = window.InlineSelect;
            const upd = (patch) => setFields(fields.map((x, j) => j === i ? { ...x, ...patch } : x));
            const showLen = f.kind === 'Text' || f.kind === 'Number';
            return (
              <div className="cfield-card" key={i}>
                <button className="cfield-card__del set-rowact" onClick={() => setFields(fields.filter((_, j) => j !== i))} aria-label="Remove field" title="Remove"><i className="fa-light fa-trash-can"></i></button>
                <div className="cform">
                  <div className="cform__label">Field label:</div>
                  <div className="cform__field"><ITextC value={f.label} placeholder="Field label…" onCommit={v => upd({ label: v })} ariaLabel="Field label" /></div>
                  <div className="cform__label">Field type:</div>
                  <div className="cform__field"><ISelectC value={f.kind} options={FIELD_TYPES.map(k => ({ value: k, label: k }))} onChange={v => upd({ kind: v })} width="auto" /></div>
                  {showLen && <>
                    <div className="cform__label">Max length:</div>
                    <div className="cform__field"><ITextC value={f.maxLength || ''} placeholder="—" onCommit={v => upd({ maxLength: v.replace(/\D/g, '') })} width="auto" ariaLabel="Max length" /></div>
                  </>}
                  <div className="cform__label">Default value:</div>
                  <div className="cform__field"><ITextC value={f.defaultValue || ''} placeholder="—" onCommit={v => upd({ defaultValue: v })} width="auto" ariaLabel="Default value" /></div>
                  <div className="cform__checks">
                    <label className="cfield-check"><Toggle id={`cf-req-${i}`} checked={!!f.required} onChange={v => upd({ required: v })} /><span>Required</span></label>
                    <label className="cfield-check"><Toggle id={`cf-def-${i}`} checked={!!f.setDefault} onChange={v => upd({ setDefault: v })} /><span>Set as default</span></label>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        <button type="button" className="qsec__add" onClick={() => setFields([...fields, { label: '', kind: 'Text' }])}>
          <i className="fa-light fa-plus"></i>Add custom field
        </button>
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
                <span className="qmb-ui-accordion__subtitle">Joint Commission EP code</span>
              </div>
            </div>
          </div>
        </summary>
        <div className="qmb-ui-accordion__content">
          <div className="cfg-fields" style={{ padding: '4px 0 8px' }}>
            <QInput id="adv-jc" label="Joint Commission EP code" value={adv.jcCode} onChange={v => setAdv({ jcCode: v })} />
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

// ── Generic searchable token input — selected values as removable tags + a filter
// field that suggests/adds the rest (same pattern as the question-set picker). ──
function TokenPicker({ selected, options, onAdd, onRemove, placeholder, disabledValue, disabledNote }) {
  const [query, setQuery] = React.useState('');
  const [open, setOpen] = React.useState(false);
  const [active, setActive] = React.useState(0);
  const wrapRef = React.useRef(null);
  React.useEffect(() => {
    const onDoc = (e) => { if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);
  const matches = options
    .filter(o => !selected.includes(o) && o !== disabledValue)
    .filter(o => !query || o.toLowerCase().includes(query.toLowerCase()));
  const add = (o) => { onAdd(o); setQuery(''); setActive(0); setOpen(true); };
  return (
    <div className="typepick" ref={wrapRef}>
      <div className={`typepick__control ${open ? 'is-open' : ''}`} onClick={() => { setOpen(true); wrapRef.current.querySelector('input').focus(); }}>
        {selected.map(t => (
          <span className="compat-tag" key={t} onClick={e => e.stopPropagation()}>{t}
            <button className="compat-tag__x" onClick={() => onRemove(t)} aria-label={`Remove ${t}`}><i className="fa-light fa-xmark"></i></button>
          </span>
        ))}
        <input className="typepick__input" value={query} placeholder={selected.length ? 'Add another…' : (placeholder || 'Search…')}
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
          {matches.map((o, i) => (
            <button key={o} type="button" className={`typepick__opt ${i === active ? 'is-active' : ''}`}
              onMouseEnter={() => setActive(i)} onClick={() => add(o)}>
              <span className="typepick__optname">{o}</span>
            </button>
          ))}
        </div>
      )}
      {open && matches.length === 0 && <div className="typepick__menu typepick__menu--empty">{disabledValue && query && disabledValue.toLowerCase().includes(query.toLowerCase()) ? (disabledNote || 'Unavailable.') : `No${query ? ' matching' : ' more'} types.`}</div>}
    </div>
  );
}

// ── Step 5: Compatible sub-components ───────────────────────────────────────
function SectionCompat({ d, set }) {
  const norm = (s) => (s || '').trim().toLowerCase().replace(/s$/, '').replace(/\s+/g, ' ');
  const selfName = norm(d.name);
  const isSelf = (t) => selfName && norm(t) === selfName;
  const selfMatch = window.SUBCOMPONENT_TYPES.find(isSelf);
  // never let a type list itself, even if a copy/recommended preset brought it in
  const selected = (d.compatible || []).filter(t => !isSelf(t));
  const add = (t) => { if (!isSelf(t) && !selected.includes(t)) set({ compatible: [...selected, t] }); };
  const remove = (t) => set({ compatible: selected.filter(x => x !== t) });
  return (
    <div>
      {selected.length === 0 && <div className="compat-empty">Nothing nests under this type yet. Add the sub-component types it can contain.</div>}
      <TokenPicker
        selected={selected}
        options={window.SUBCOMPONENT_TYPES}
        onAdd={add}
        onRemove={remove}
        placeholder="Search sub-component types…"
        disabledValue={selfMatch}
        disabledNote="A type can’t contain itself."
      />
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

// ── Searchable single-select for question sets — a qmb-ui-select trigger that opens
// a popup with a search field, the reusable sets, and a "Create new set" action. ──
function SetPicker({ value, creating, onChoose, onCreate }) {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState('');
  const ref = React.useRef(null);
  React.useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);
  const sets = window.QUESTION_SETS;
  const sel = sets.find(s => s.id === value);
  const matches = sets.filter(s => !query || s.name.toLowerCase().includes(query.toLowerCase()) || (s.code || '').toLowerCase().includes(query.toLowerCase()));
  const triggerText = creating ? 'New question set' : (sel ? sel.name : 'Choose a question set…');
  return (
    <div className={`qmb-ui-select setpicker ${open ? 'is-open' : ''}`} ref={ref}>
      <div className={`qmb-ui-select__trigger ${(sel || creating) ? '' : 'is-placeholder'}`} role="button" tabIndex={0} aria-expanded={open} aria-haspopup="listbox"
        onClick={() => setOpen(o => !o)}
        onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setOpen(o => !o); } if (e.key === 'Escape') setOpen(false); }}>
        {triggerText}
      </div>
      <label>Question set</label>
      {open && (
        <div className="qmb-ui-select__popup">
          <div className="qmb-ui-select__search">
            <i className="fa-light fa-magnifying-glass"></i>
            <input autoFocus value={query} placeholder="Search question sets…" onChange={e => setQuery(e.target.value)} />
          </div>
          <div className="qmb-ui-select__options" style={{ maxHeight: 240 }}>
            <ul>
              {matches.map(s => (
                <li key={s.id}>
                  <button type="button" className={`qmb-ui-select__option ${value === s.id ? 'qmb-ui-select__option--selected' : ''}`}
                    onClick={() => { onChoose(s.id); setOpen(false); setQuery(''); }}>
                    <span className="setpicker__name">{s.name}</span>
                    <span className="setpicker__meta">{s.questions.length} · {s.code}</span>
                  </button>
                </li>
              ))}
              {matches.length === 0 && <li><div className="qmb-ui-select__option qmb-ui-select__option--empty">No sets match “{query}”.</div></li>}
            </ul>
          </div>
          <button type="button" className="setpicker__create" onClick={() => { onCreate(); setOpen(false); setQuery(''); }}>
            <i className="fa-light fa-plus"></i>Create new set
          </button>
        </div>
      )}
    </div>
  );
}

// ── Per-question editor (Brushaway) — type-aware fields: select types reveal an
// options list; plus frequency, required, and help text. Reused for add + edit. ──
function QuestionEditor({ initial, onSave, onClose, onDelete, scope, mode = 'brushaway' }) {
  const [q, setQ] = React.useState(initial);
  const [confirmDel, setConfirmDel] = React.useState(false);
  const [addingSection, setAddingSection] = React.useState(false);
  // While the "add section" modal is open, suppress the editor's own outside-click /
  // Escape close (the modal renders in a Portal, i.e. outside this panel).
  const suppressClose = React.useRef(false);
  const upd = (p) => setQ(s => ({ ...s, ...p }));
  const isSelect = q.type === 'Single select' || q.type === 'Multi select';
  const Portal = window.Portal;
  const valid = !!(q.q && q.q.trim());
  const isNew = !!initial.__isNew;
  const title = isNew ? 'Add question' : 'Edit question';
  const panelRef = React.useRef(null);
  React.useEffect(() => {
    const onDoc = (e) => { if (suppressClose.current) return; if (panelRef.current && !panelRef.current.contains(e.target)) onClose(); };
    const onEsc = (e) => { if (suppressClose.current) return; if (e.key === 'Escape') onClose(); };
    // defer so the opening click doesn't immediately close it
    const t = setTimeout(() => document.addEventListener('mousedown', onDoc), 0);
    document.addEventListener('keydown', onEsc);
    return () => { clearTimeout(t); document.removeEventListener('mousedown', onDoc); document.removeEventListener('keydown', onEsc); };
  }, [onClose]);

  const form = (
    <div className="qedit-form">
      <QInput id="qe-text" label="Question" required value={q.q} onChange={v => upd({ q: v })} multiline />
      <QSelect id="qe-type" label="Answer type" required value={q.type} onChange={v => upd({ type: v })} options={window.QUESTION_TYPES.map(t => ({ value: t, label: t }))} />
      {isSelect && <OptionsEditor value={q.options || []} onChange={o => upd({ options: o })} />}
      <QSelect id="qe-freq" label="Frequency" value={q.frequency || 'Annual'} onChange={v => upd({ frequency: v })} options={QUESTION_FREQS.map(f => ({ value: f, label: f }))} />
      <QSelect id="qe-section" label="Section" value={q.section || ''} onChange={v => upd({ section: v })} options={[{ value: '', label: 'No section' }, ...(window.SECTIONS || []).map(s => ({ value: s.id, label: s.name }))]}
        onCreate={() => { suppressClose.current = true; setAddingSection(true); }} createLabel="Create new section" />
      <label className="qedit-toggle"><Toggle id="qe-req" checked={q.required} onChange={v => upd({ required: v })} /><span>Required to complete the inspection</span></label>
      <QInput id="qe-help" label="Help text (optional)" multiline value={q.help} onChange={v => upd({ help: v })} />
    </div>
  );

  const bodyInner = (
    <>
      {form}
      {scope && (
        <div className="q-globalscope">
          <label className="q-globalscope__opt">
            <input type="radio" name="qe-scope" checked={scope.value !== 'this'} onChange={() => scope.onChange('global')} />
            <span className="q-globalscope__text"><b>Update the question set everywhere</b> — changes to “{scope.setName}” apply to all {scope.usedBy} component type{scope.usedBy === 1 ? '' : 's'} that use this question set.</span>
          </label>
          <label className="q-globalscope__opt">
            <input type="radio" name="qe-scope" checked={scope.value === 'this'} onChange={() => scope.onChange('this')} />
            <span className="q-globalscope__text"><b>Update for this type only</b> — save a separate copy of the question set just for this component type.</span>
          </label>
        </div>
      )}
    </>
  );
  const footerStart = !isNew ? <button className="qmb-ui-button qmb-ui-button--highlighted" onClick={() => setConfirmDel(true)}><i className="fa-light fa-trash-can"></i>Delete</button> : null;
  const footerActions = (
    <>
      <button className="qmb-ui-button" onClick={onClose}>Cancel</button>
      <button className="qmb-ui-button qmb-ui-button--primary" disabled={!valid} onClick={() => onSave(q)}>{isNew ? 'Add question' : 'Save'}</button>
    </>
  );
  const confirmEl = confirmDel && <ConfirmDialog title="Delete question?" message="This removes the question from the set. This can't be undone." confirmLabel="Delete question" onConfirm={() => { setConfirmDel(false); onDelete(); }} onCancel={() => setConfirmDel(false)} />;
  const closeSection = () => { setAddingSection(false); suppressClose.current = false; };
  const sectionModalEl = addingSection && window.SectionAddModal && (
    <window.SectionAddModal
      onClose={closeSection}
      onSave={(sec) => { window.SECTIONS = window.SECTIONS || []; window.SECTIONS.push(sec); upd({ section: sec.id }); closeSection(); }}
    />
  );

  if (mode === 'modal') {
    return (
      <Portal>
        <div className="qmb-ui-modal-wrapper qedit-modal-wrap">
          <div className="qmb-ui-modal-overlay" onClick={onClose}></div>
          <div className="qmb-ui-modal qedit-modal" role="dialog" aria-modal="true" aria-label={title}>
            <header className="qmb-ui-modal-header">
              <div className="qmb-ui-modal-header__row qmb-ui-modal-header__row--title">
                <div className="qmb-ui-modal-header__title"><span className="qmb-ui-text"><b>{title}</b></span></div>
                <div className="qmb-ui-modal-header__actions">
                  <button className="qmb-ui-button comp-iconbtn qmb-ui-modal-header__close" aria-label="Close" onClick={onClose}><i className="fa-light fa-xmark"></i></button>
                </div>
              </div>
              <hr className="qmb-ui-modal-header__divider" aria-hidden="true" />
            </header>
            <div className="qmb-ui-modal-body">{bodyInner}</div>
            <footer className="qmb-ui-modal-footer qmb-ui-modal-footer--divider">
              <div className="qmb-ui-modal-footer__content">
                <div className="qmb-ui-modal-footer__start">{footerStart}</div>
                <div className="qmb-ui-modal-footer__actions">{footerActions}</div>
              </div>
            </footer>
          </div>
        </div>
        {confirmEl}
        {sectionModalEl}
      </Portal>
    );
  }

  return (
    <Portal>
      <div className="qmb-ui-brushaway qedit-brushaway" ref={panelRef}>
        <div className="qmb-ui-brushaway__main">
          <div className="qmb-ui-brushaway-header">
            <div className="qmb-ui-brushaway-header__row qmb-ui-brushaway-header__row--title">
              <div className="qmb-ui-brushaway-header__title"><span className="qmb-ui-text"><b>{title}</b></span></div>
              <div className="qmb-ui-brushaway-header__actions">
                <button className="qmb-ui-button comp-iconbtn" aria-label="Close" onClick={onClose}><i className="fa-light fa-xmark"></i></button>
              </div>
            </div>
            <hr className="qmb-ui-brushaway-header__divider" aria-hidden="true" />
          </div>
          <div className="qmb-ui-brushaway-body">{bodyInner}</div>
          <div className="qmb-ui-brushaway-footer">
            <div className="qmb-ui-brushaway-footer__content">
              <div className="qmb-ui-brushaway-footer__start">{footerStart}</div>
              <div className="qmb-ui-brushaway-footer__actions">{footerActions}</div>
            </div>
          </div>
        </div>
      </div>
      {confirmEl}
      {sectionModalEl}
    </Portal>
  );
}
window.QuestionEditor = QuestionEditor;

// ── Add-section modal — same fields as the Sections-tab add flow, in a Modal so
// it can sit above the question editor when assigning a question to a new section. ──
function SectionAddModal({ onSave, onClose }) {
  const Portal = window.Portal;
  const [name, setName] = React.useState('');
  const [description, setDescription] = React.useState('');
  const save = () => {
    if (!name.trim()) return;
    onSave({ id: 'sec-' + Date.now().toString(36), name: name.trim(), description: description.trim(), questions: 0 });
  };
  return (
    <Portal>
      <div className="qmb-ui-modal-wrapper" style={{ zIndex: 10095 }}>
        <div className="qmb-ui-modal-overlay" onClick={onClose}></div>
        <div className="qmb-ui-modal qedit-modal" role="dialog" aria-modal="true" aria-label="Add section">
          <header className="qmb-ui-modal-header">
            <div className="qmb-ui-modal-header__row qmb-ui-modal-header__row--title">
              <div className="qmb-ui-modal-header__title"><span className="qmb-ui-text"><b>Add section</b></span></div>
              <div className="qmb-ui-modal-header__actions">
                <button className="qmb-ui-button comp-iconbtn qmb-ui-modal-header__close" aria-label="Close" onClick={onClose}><i className="fa-light fa-xmark"></i></button>
              </div>
            </div>
            <hr className="qmb-ui-modal-header__divider" aria-hidden="true" />
          </header>
          <div className="qmb-ui-modal-body">
            <p className="cfg-section__desc" style={{ marginTop: 0, marginBottom: 16 }}>Sections group related questions within an inspection form — like “Visual inspection” or “Functional test” — so technicians can work through a report in logical blocks and findings stay organized.</p>
            <div className="qedit-form">
              <div className="qmb-ui-input">
                <input value={name} placeholder=" " autoFocus onChange={e => setName(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') save(); }} />
                <label>Section name<span className="req"></span></label>
              </div>
              <div className="qmb-ui-input">
                <textarea value={description} placeholder=" " onChange={e => setDescription(e.target.value)}></textarea>
                <label>Description</label>
              </div>
            </div>
          </div>
          <footer className="qmb-ui-modal-footer qmb-ui-modal-footer--divider">
            <div className="qmb-ui-modal-footer__content">
              <div className="qmb-ui-modal-footer__start"></div>
              <div className="qmb-ui-modal-footer__actions">
                <button className="qmb-ui-button" onClick={onClose}>Cancel</button>
                <button className="qmb-ui-button qmb-ui-button--primary" disabled={!name.trim()} onClick={save}>Add section</button>
              </div>
            </div>
          </footer>
        </div>
      </div>
    </Portal>
  );
}
window.SectionAddModal = SectionAddModal;

// ── Quimby ConfirmDialog — destructive-action confirm (qmb-ui-modal). ──
function ConfirmDialog({ title, message, confirmLabel = 'Delete', variant = 'danger', onConfirm, onCancel }) {
  const Portal = window.Portal;
  React.useEffect(() => {
    const onEsc = (e) => { if (e.key === 'Escape') onCancel(); };
    document.addEventListener('keydown', onEsc);
    return () => document.removeEventListener('keydown', onEsc);
  }, [onCancel]);
  return (
    <Portal>
      <div className="qmb-ui-modal-wrapper qconfirm-wrap">
        <div className="qmb-ui-modal-overlay" onClick={onCancel}></div>
        <div className="qmb-ui-modal qconfirm" role="alertdialog" aria-modal="true" aria-label={title}>
          <header className="qmb-ui-modal-header">
            <div className="qmb-ui-modal-header__row qmb-ui-modal-header__row--title">
              <div className="qmb-ui-modal-header__title"><span className="qmb-ui-text"><b>{title}</b></span></div>
            </div>
          </header>
          <div className="qmb-ui-modal-body"><p className="qconfirm__msg">{message}</p></div>
          <footer className="qmb-ui-modal-footer qmb-ui-modal-footer--divider">
            <div className="qmb-ui-modal-footer__content">
              <div className="qmb-ui-modal-footer__start"></div>
              <div className="qmb-ui-modal-footer__actions">
                <button className="qmb-ui-button" onClick={onCancel}>Cancel</button>
                <button className={`qmb-ui-button qmb-ui-button--${variant}`} onClick={onConfirm}>{confirmLabel}</button>
              </div>
            </div>
          </footer>
        </div>
      </div>
    </Portal>
  );
}
window.ConfirmDialog = ConfirmDialog;

// ── Step 6: Inspection questions (attach existing OR create a new set) ───────
function SectionQuestions({ d, set }) {
  const [showPicker, setShowPicker] = React.useState(false);
  const [editIdx, setEditIdx] = React.useState(null); // null | index | 'new'
  // pointer-drag reorder (by index) — mirrors the Question-set modal
  const qListRef = React.useRef(null);
  const qDrag = React.useRef(null);
  const [qDragIdx, setQDragIdx] = React.useState(null);
  const [qHint, setQHint] = React.useState(null); // { idx, pos }
  const creating = d.questionSetId === '__new';
  const qs = window.QUESTION_SETS.find(q => q.id === d.questionSetId);
  const questions = d.questions || [];
  const setQuestions = (q) => set({ questions: q });
  const qComputeHint = (clientY) => {
    const rows = qListRef.current ? [...qListRef.current.querySelectorAll('.qedit-row')] : [];
    if (!rows.length) return null;
    for (let i = 0; i < rows.length; i++) {
      if (i === qDrag.current.idx) continue;
      const r = rows[i].getBoundingClientRect();
      if (clientY >= r.top && clientY <= r.bottom) return { idx: i, pos: (clientY - r.top) < r.height / 2 ? 'before' : 'after' };
    }
    const f = rows[0].getBoundingClientRect(); if (clientY < f.top) return { idx: 0, pos: 'before' };
    const l = rows[rows.length - 1].getBoundingClientRect(); if (clientY > l.bottom) return { idx: rows.length - 1, pos: 'after' };
    return null;
  };
  const qMove = (e) => { const st = qDrag.current; if (!st) return; const h = qComputeHint(e.clientY); st.hint = h; setQHint(h); };
  const qUp = () => {
    const st = qDrag.current;
    window.removeEventListener('pointermove', qMove); window.removeEventListener('pointerup', qUp);
    if (st && st.hint) {
      const arr = [...questions]; const [moved] = arr.splice(st.idx, 1);
      let to = st.hint.idx; if (st.hint.pos === 'after') to += 1; if (st.idx < to) to -= 1;
      arr.splice(Math.max(0, to), 0, moved); setQuestions(arr);
    }
    qDrag.current = null; setQDragIdx(null); setQHint(null);
  };
  const qGripDown = (e, i) => {
    e.preventDefault(); e.stopPropagation();
    qDrag.current = { idx: i, hint: null }; setQDragIdx(i);
    window.addEventListener('pointermove', qMove); window.addEventListener('pointerup', qUp);
  };
  const chooseSet = (id) => {
    const s = window.QUESTION_SETS.find(x => x.id === id);
    set({ questionSetId: id, questions: s ? s.questions.map(x => ({ ...x })) : [], newSetName: '', newSetDescription: '' });
    setShowPicker(false);
  };
  const startCreate = () => { set({ questionSetId: '__new', questions: [], newSetName: '', newSetDescription: '' }); setShowPicker(false); };
  const discard = () => set({ questionSetId: null, questions: [], newSetName: '', newSetDescription: '' });
  const hasTarget = !!qs || creating;

  // When this draft was copied from another type, the source's question set is
  // SHARED by default (many-to-many in the real app). Offer to duplicate it so
  // edits stay local to this new type. This choice is explicit, never silent.
  const sourceSet = d.copiedFrom && d.sourceQuestionSet ? window.QUESTION_SETS.find(s => s.id === d.sourceQuestionSet) : null;
  const useShared = () => {
    const s = window.QUESTION_SETS.find(x => x.id === d.sourceQuestionSet);
    set({ questionMode: 'shared', questionSetId: d.sourceQuestionSet, questions: s ? s.questions.map(x => ({ ...x })) : [], newSetName: '', newSetDescription: '' });
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

      {/* searchable set picker — replaces the transient pick grid + Change-set button */}
      <SetPicker value={creating ? null : d.questionSetId} creating={creating} onChoose={chooseSet} onCreate={startCreate} />
      {qs && !creating && (
        <div className="q-setmeta">{questions.length} question{questions.length === 1 ? '' : 's'} · {qs.code} · reused on {qs.usedBy} other type{qs.usedBy === 1 ? '' : 's'}</div>
      )}

      {/* authoring a new reusable set (name + description, like the platform) */}
      {creating && (
        <div className="q-newset">
          <div className="cfg-fields">
            <div className="cfg-field--full">
              <QInput id="newset-name" label="New question set name" required value={d.newSetName} onChange={v => set({ newSetName: v })} />
            </div>
            <div className="cfg-field--full">
              <QInput id="newset-desc" label="Description" multiline value={d.newSetDescription} onChange={v => set({ newSetDescription: v })} />
            </div>
          </div>
        </div>
      )}

      {/* question list — compact, reorderable; click a row to edit in a Brushaway */}
      {hasTarget && (
        <>
          <div className="qedit-list" ref={qListRef} style={{ marginTop: 14 }}>
            {questions.map((q, i) => {
              const hint = qHint && qHint.idx === i ? ' qrow--drop-' + qHint.pos : '';
              return (
              <div className={`qedit-row ${qDragIdx === i ? 'is-dragging' : ''}${hint}`} key={i} role="button" tabIndex={0} onClick={() => setEditIdx(i)}
                onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setEditIdx(i); } }}>
                <span className="comp-handle" title="Drag to reorder" onPointerDown={e => qGripDown(e, i)} onClick={e => e.stopPropagation()}><i className="fa-light fa-grip-dots-vertical"></i></span>
                <span className="qedit-row__text">{q.q ? q.q : <span className="set-cell-empty">Untitled question</span>}{q.required && <span className="qedit-row__req" title="Required">*</span>}</span>
                <span className="qmb-ui-tag qmb-ui-tag--pastry qmb-ui-tag--purple"><span className="qmb-ui-tag__label">{q.type}</span></span>
                <span className="qrow__freqtag"><i className="fa-light fa-arrows-rotate"></i>{q.frequency || 'Annual'}</span>
                <button className="set-rowact" aria-label="Remove question" title="Remove" onClick={e => { e.stopPropagation(); setQuestions(questions.filter((_, j) => j !== i)); }}><i className="fa-light fa-xmark"></i></button>
              </div>
              );
            })}
          </div>
          {questions.length === 0 && <div className="qsec__empty">No questions yet — add the first one below.</div>}
          <button type="button" className="qsec__add" onClick={() => setEditIdx('new')}><i className="fa-light fa-plus"></i>Add question</button>
          {editIdx != null && (
            <QuestionEditor
              initial={editIdx === 'new' ? { q: '', type: 'Pass / Fail / N/A', frequency: 'Annual', __isNew: true } : questions[editIdx]}
              scope={(qs && !creating) ? { value: d.questionScope || 'global', onChange: (v) => set({ questionScope: v }), usedBy: qs.usedBy, setName: qs.name } : null}
              onClose={() => setEditIdx(null)}
              onDelete={() => { setQuestions(questions.filter((_, j) => j !== editIdx)); setEditIdx(null); }}
              onSave={(nq) => { const clean = { ...nq }; delete clean.__isNew; if (editIdx === 'new') setQuestions([...questions, clean]); else setQuestions(questions.map((x, j) => j === editIdx ? clean : x)); setEditIdx(null); }}
            />
          )}
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
      {d.path === 'system' && (
        <div className="def-row">
          <Toggle id="def-autoinc" checked={d.autoInclude} onChange={v => set({ autoInclude: v })} />
          <div className="def-row__body">
            <div className="def-row__title">Always include this with the system</div>
            <div className="def-row__desc">Certain items are always present with a system. When on, this component is auto-attached to every building that has a {sysName} system and can't be removed per-building.</div>
          </div>
        </div>
      )}
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
  STag, Toggle, QInput, QSelect, TokenPicker,
  SETUP_SECTIONS, sectionTitle, sectionDesc, stepDone,
});
