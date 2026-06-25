// setup-app.jsx — Settings → Component setup. Routes between the types list, the
// questions library, and the unified config page. Shell variant + annotation layer
// are Tweaks so the 2–3 directions can be compared live.

function SettingsApp() {
  const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
    "shell": "rail"
  }/*EDITMODE-END*/;
  // URL escape hatch (?shell=rail|tabs|accordion|express) for deep-linking a shell.
  const _p = new URLSearchParams(location.search);
  if (['rail','tabs','accordion','express'].includes(_p.get('shell'))) TWEAK_DEFAULTS.shell = _p.get('shell');
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const [route, setRoute] = React.useState('settings');
  // Cross-page nav: routes that exist as their own prototype page navigate there;
  // everything else flips the in-page route (and falls through to the empty state).
  const PAGE_ROUTES = { buildings: 'Component Grouping v3.html' };
  const go = (id) => { if (PAGE_ROUTES[id]) { location.href = PAGE_ROUTES[id]; return; } setRoute(id); };
  const [tab, setTab] = React.useState('types');           // types | questions
  const [view, setView] = React.useState('list');           // list | config
  const [types, setTypes] = React.useState(window.SETUP_TYPES);
  const [editing, setEditing] = React.useState(null);       // type being edited, or null = new
  const [seed, setSeed] = React.useState(null);             // initial draft for the wizard
  const [wizardKey, setWizardKey] = React.useState(0);      // bump to remount the wizard fresh
  const [toast, setToast] = React.useState(null);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(null), 2600); };

  // build a config draft from an existing type (edit mode — no "starting point")
  const draftFromType = (ty) => {
    const qs = window.QUESTION_SETS.find(q => q.id === ty.questionSet);
    return {
      ...ty,
      startMode: null, copiedFrom: null, copiedFromId: null,
      questionSetId: ty.questionSet,
      sourceQuestionSet: null, questionMode: null,
      questions: qs ? qs.questions.map(x => ({ ...x })) : [],
      compatible: [...(ty.compatible || [])],
      defaultSubs: { ...(ty.defaultSubs || {}) },
      advanced: {}, customFields: ty.customFields ? ty.customFields.map(f => ({ ...f })) : [],
    };
  };
  const blankDraft = () => ({
    id: 't-' + Date.now(), startMode: null, copiedFrom: null, copiedFromId: null,
    path: null, system: null, attach: null,
    name: '', category: '', abbr: '', description: '',
    compatible: [], questionSetId: null, sourceQuestionSet: null, questionMode: null, questions: [],
    autoInclude: false, defaultQty: 0, defaultSubs: {}, advanced: {}, customFields: [], inUse: 0,
  });

  const openType = (ty) => { setEditing(ty); setSeed(draftFromType(ty)); setWizardKey(k => k + 1); setView('config'); };
  const newType = () => { setEditing(null); setSeed(blankDraft()); setWizardKey(k => k + 1); setView('config'); };
  // Duplicate / use-as-template: clone an existing type into a fresh draft.
  const duplicateType = (ty) => {
    const draft = draftFromType(ty);
    draft.id = 't-' + Date.now();
    draft.name = (ty.name || 'Untitled') + ' (copy)';
    draft.startMode = 'copy'; draft.copiedFrom = ty.name; draft.copiedFromId = ty.id;
    draft.sourceQuestionSet = ty.questionSet || null; draft.questionMode = 'shared';
    draft.inUse = 0;
    setEditing(null); setSeed(draft); setWizardKey(k => k + 1); setView('config');
  };
  // Inline list edits (qty, auto-include, rename) without opening the wizard.
  const updateType = (id, patch) => setTypes(prev => prev.map(x => x.id === id ? { ...x, ...patch } : x));
  const closeConfig = () => { setView('list'); setEditing(null); setSeed(null); };

  // shared persist — registers a new question set then upserts the type record
  const persist = (d) => {
    let questionSetId = d.questionSetId;
    if (d.questionSetId === '__new' && (d.questions || []).length > 0) {
      const name = (d.newSetName || '').trim() || `${d.name || 'Untitled'} questions`;
      const code = name.split(/\s+/).map(w => w[0]).join('').toUpperCase().slice(0, 5) || 'SET';
      questionSetId = 'qs-' + Date.now();
      window.QUESTION_SETS.push({
        id: questionSetId, name, code,
        category: d.newSetCategory || d.category || 'Other',
        usedBy: 0, updated: 'Just now',
        questions: (d.questions || []).map(q => ({ ...q })),
      });
    } else if (d.questionSetId === '__new') {
      questionSetId = null;
    }
    const rec = {
      id: d.id, name: d.name, category: d.category, path: d.path,
      system: d.system, attach: d.attach, questionSet: questionSetId,
      compatible: d.compatible || [], defaultQty: d.defaultQty || 0,
      autoInclude: !!d.autoInclude, defaultSubs: d.defaultSubs || {}, inUse: d.inUse || 0,
    };
    setTypes(prev => prev.some(x => x.id === rec.id) ? prev.map(x => x.id === rec.id ? rec : x) : [rec, ...prev]);
    // Register the type name so the building's add-component Type dropdown sees it.
    try {
      const custom = JSON.parse(localStorage.getItem('ip_custom_types') || '[]');
      if (rec.name && !custom.includes(rec.name)) { custom.push(rec.name); localStorage.setItem('ip_custom_types', JSON.stringify(custom)); }
    } catch (e) {}
  };
  const saveType = (d) => { const wasEdit = !!editing; persist(d); showToast(wasEdit ? 'Component type updated' : 'Component type created'); closeConfig(); };
  // Save & create another — keep the wizard open, carry over placement + category.
  const saveAndNew = (d) => {
    persist(d);
    showToast('Saved — add another');
    const next = blankDraft();
    next.path = d.path; next.system = d.system; next.attach = d.attach; next.category = d.category;
    next.startMode = 'blank';
    setEditing(null); setSeed(next); setWizardKey(k => k + 1);
    const m = document.querySelector('.qmb-main'); if (m) m.scrollTo({ top: 0 });
  };

  const crumbs = [
    { label: 'Acme Fire & Safety', href: '#' },
    { label: 'Settings', href: '#', onClick: (e) => { e.preventDefault(); setView('list'); setTab('types'); } },
    ...(view === 'config'
      ? [
          { label: 'Component Setup', href: '#', onClick: (e) => { e.preventDefault(); closeConfig(); } },
          { label: editing ? editing.name : 'New component type' },
        ]
      : [{ label: 'Component Setup' }]),
  ];

  return (
    <Shell user={{ initials: 'VG' }} route={route} go={go} crumbs={crumbs} onAI={() => {}}>
      {route === 'settings' ? (
        <div className="set-page">
          {view === 'config' ? (
            <ConfigPage
              key={wizardKey}
              shell={t.shell}
              initial={seed || (editing ? draftFromType(editing) : blankDraft())}
              isEdit={!!editing}
              onClose={closeConfig}
              onSave={saveType}
              onSaveNext={saveAndNew}
            />
          ) : (
            <>
              <header className="qmb-ui-header qmb-ui-header--workspace" style={{ paddingBottom: 0, marginBottom: -16 }}>
                <div className="header__row">
                  <h1 className="header__title"><span className="header__title-text">Component Setup</span></h1>
                </div>
              </header>
              <div className="qmb-ui-tabs set-tabview">
                <ul className="qmb-ui-tabs__list">
                  <li>
                    <button className={`qmb-ui-tabs__option ${tab === 'types' ? 'qmb-ui-tabs__option--current' : ''}`} onClick={() => setTab('types')}>Component Types</button>
                  </li>
                  <li>
                    <button className={`qmb-ui-tabs__option ${tab === 'questions' ? 'qmb-ui-tabs__option--current' : ''}`} onClick={() => setTab('questions')}>Component Questions</button>
                  </li>
                </ul>
              </div>
              {tab === 'types'
                ? <TypesList types={types} onOpen={openType} onNew={newType} onDuplicate={duplicateType} onUpdate={updateType} />
                : <QuestionsLibrary />}
            </>
          )}
        </div>
      ) : (
        <div className="ctab"><div className="ctab-empty"><i className="fa-light fa-compass"></i><h4>Not in this prototype</h4><p>This prototype focuses on Settings → Component Setup. Use the Settings item in the nav.</p></div></div>
      )}

      {toast && (
        <div className="qmb-ui-toast qmb-ui-toast--success">
          <div className="notification__content">
            <span className="notification__icon"><i className="fa-light fa-circle-check"></i></span>
            <span className="notification__message">{toast}</span>
          </div>
        </div>
      )}

      <TweaksPanel>
        <TweakSection label="Wizard shell" />
        <TweakRadio label="Layout" value={t.shell}
          options={[{ label: 'Rail', value: 'rail' }, { label: 'Express', value: 'express' }, { label: 'Tabs', value: 'tabs' }, { label: 'Accordion', value: 'accordion' }]}
          onChange={(v) => setTweak('shell', v)} />
      </TweaksPanel>
    </Shell>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<SettingsApp />);
