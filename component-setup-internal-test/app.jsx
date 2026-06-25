// app.jsx — Building detail page + Components tab, wired with state.

function ContextMenu({ menu, components, onClose, onEdit, onAddChild, onConvert, onRemove, onMoveUp, onMoveDown, onMoveTo }) {
  const comp = menu && menu.comp;
  const isGroup = comp && comp.role === 'group';
  const sibs = comp ? components.filter(c => (c.system||null) === (comp.system||null) && (c.parentId||null) === (comp.parentId||null)) : [];
  const idx = comp ? sibs.findIndex(c => c.id === comp.id) : -1;
  const canUp = idx > 0, canDown = idx >= 0 && idx < sibs.length - 1;
  return (
    <BodyPopup open={!!menu} anchor={menu && menu.anchor} position="bottom-right" width={224} onClose={onClose} className="ctx-menu">
      <div className="popup__section">
        <ul className="qmb-ui-popup__action-list">
          <li><button className="qmb-ui-button" onClick={()=>{ onEdit(comp); onClose(); }}><i className="fa-light fa-pen"></i>Edit component</button></li>
          {isGroup && <li><button className="qmb-ui-button" onClick={()=>{ onAddChild(comp); onClose(); }}><i className="fa-light fa-plus"></i>Add component to group</button></li>}
          <li><button className="qmb-ui-button" onClick={()=>{ onConvert(comp); onClose(); }}><i className={`fa-light ${isGroup ? 'fa-cube' : 'fa-layer-group'}`}></i>{isGroup ? 'Convert to single' : 'Convert to group'}</button></li>
        </ul>
      </div>
      <hr className="popup__split" />
      <div className="popup__section">
        <ul className="qmb-ui-popup__action-list">
          <li><button className="qmb-ui-button" disabled={!canUp} onClick={()=>{ onMoveUp(comp); onClose(); }}><i className="fa-light fa-arrow-up"></i>Move up</button></li>
          <li><button className="qmb-ui-button" disabled={!canDown} onClick={()=>{ onMoveDown(comp); onClose(); }}><i className="fa-light fa-arrow-down"></i>Move down</button></li>
          <li><button className="qmb-ui-button" onClick={()=>{ onMoveTo(comp, menu.anchor); onClose(); }}><i className="fa-light fa-arrow-right-to-bracket"></i>Move to…</button></li>
        </ul>
      </div>
      <hr className="popup__split" />
      <div className="popup__section">
        <ul className="qmb-ui-popup__action-list">
          <li><button className="qmb-ui-button is-danger" onClick={()=>{ onRemove(comp); onClose(); }}><i className="fa-light fa-ban"></i>Deactivate</button></li>
        </ul>
      </div>
    </BodyPopup>
  );
}

// Move-to destination picker — systems (top level) and compatible groups
function MoveToMenu({ moveTo, systems, components, onClose, onMove }) {
  if (!moveTo) return null;
  const comp = moveTo.comp;
  const byId = Object.fromEntries(components.map(c => [c.id, c]));
  const within = (id, anc) => { let cur = byId[id]; while (cur && cur.parentId) { if (cur.parentId === anc) return true; cur = byId[cur.parentId]; } return false; };
  const same = (a, b) => (window.sameFamily ? window.sameFamily(a, b) : true);
  return (
    <BodyPopup open={!!moveTo} anchor={moveTo.anchor} position="bottom-right" width={264} onClose={onClose} className="ctx-menu">
      <div className="popup__section ctx-moveto">
        <div className="ctx-moveto__label">Move to</div>
        <ul className="qmb-ui-popup__action-list">
          {systems.map(sys => {
            const groups = components.filter(g => g.role === 'group' && g.system === sys.id && g.id !== comp.id && !within(g.id, comp.id) && same(comp.type, g.type));
            const atTop = comp.system === sys.id && !comp.parentId;
            return (
              <React.Fragment key={sys.id}>
                <li><button className="qmb-ui-button" disabled={atTop} onClick={()=>{ onMove(comp.id, { kind:'system', system: sys.id }); onClose(); }}><i className="fa-light fa-diagram-project"></i>{sys.name}<span className="ctx-moveto__hint">top level</span></button></li>
                {groups.map(g => (
                  <li key={g.id}><button className="qmb-ui-button ctx-moveto__child" disabled={comp.parentId === g.id} onClick={()=>{ onMove(comp.id, { kind:'group', groupId: g.id }); onClose(); }}><i className="fa-light fa-layer-group"></i>{g.name}</button></li>
                ))}
              </React.Fragment>
            );
          })}
        </ul>
      </div>
    </BodyPopup>
  );
}

// System ⋯ menu — add component, reorder, deactivate
function SystemMenu({ sysMenu, systems, onClose, onAdd, onMoveUp, onMoveDown, onDeactivate }) {
  if (!sysMenu) return null;
  const sys = sysMenu.sys;
  const idx = systems.findIndex(s => s.id === sys.id);
  const canUp = idx > 0, canDown = idx >= 0 && idx < systems.length - 1;
  return (
    <BodyPopup open={!!sysMenu} anchor={sysMenu.anchor} position="bottom-right" width={224} onClose={onClose} className="ctx-menu">
      <div className="popup__section">
        <ul className="qmb-ui-popup__action-list">
          <li><button className="qmb-ui-button" onClick={()=>{ onClose(); location.href = 'System Components.html?sys=' + sys.id; }}><i className="fa-light fa-arrow-up-right-from-square"></i>Open system page</button></li>
          <li><button className="qmb-ui-button" onClick={()=>{ onAdd(sys); onClose(); }}><i className="fa-light fa-plus"></i>Add component</button></li>
        </ul>
      </div>
      <hr className="popup__split" />
      <div className="popup__section">
        <ul className="qmb-ui-popup__action-list">
          <li><button className="qmb-ui-button" disabled={!canUp} onClick={()=>{ onMoveUp(sys); onClose(); }}><i className="fa-light fa-arrow-up"></i>Move up</button></li>
          <li><button className="qmb-ui-button" disabled={!canDown} onClick={()=>{ onMoveDown(sys); onClose(); }}><i className="fa-light fa-arrow-down"></i>Move down</button></li>
        </ul>
      </div>
      <hr className="popup__split" />
      <div className="popup__section">
        <ul className="qmb-ui-popup__action-list">
          <li><button className="qmb-ui-button is-danger" onClick={()=>{ onDeactivate(sys); onClose(); }}><i className="fa-light fa-ban"></i>Deactivate system</button></li>
        </ul>
      </div>
    </BodyPopup>
  );
}

function BuildingPage({ tw, scopeSystem }) {
  const [components, setComponents] = React.useState(window.SEED_COMPONENTS);
  const [tab, setTab] = React.useState('components');
  const [search, setSearch] = React.useState('');
  const [editing, setEditing] = React.useState(null);     // component being edited
  const [adding, setAdding] = React.useState(null);       // {systemId, parentId} or null-context object
  const [menu, setMenu] = React.useState(null);           // {x,y,comp}
  const [moveTo, setMoveTo] = React.useState(null);        // {comp, anchor}
  const [sysMenu, setSysMenu] = React.useState(null);      // {sys, anchor}
  const [hdrMenu, setHdrMenu] = React.useState(false);     // header overflow menu
  const [toast, setToast] = React.useState(null);

  React.useEffect(() => {
    if (!hdrMenu) return;
    const close = () => setHdrMenu(false);
    document.addEventListener('click', close);
    return () => document.removeEventListener('click', close);
  }, [hdrMenu]);

  const [systems, setSystems] = React.useState(window.SEED_SYSTEMS);
  const showToast = (msg, variant='success') => { setToast({ msg, variant }); setTimeout(()=>setToast(null), 2800); };

  const componentCount = components.length;
  // system-scoped sub-page: show only one system + its components
  const scoped = !!scopeSystem;
  const viewSystems = scoped ? systems.filter(s => s.id === scopeSystem) : systems;
  // show this system's components PLUS any orphaned/top-level (no-system) components, so a
  // component can be dragged out of the system to top level and stay visible as a loose row.
  const viewComponents = scoped ? components.filter(c => c.system === scopeSystem || !c.system) : components;

  // ── handlers ──────────────────────────────────────────────────────────
  const handleSave = (draft) => {
    setComponents(cs => cs.map(c => c.id === draft.id ? draft : c));
    setEditing(null);
    showToast('Component updated');
  };
  // inline edits commit per-field and keep the modal open
  const handleInlineSave = (draft) => {
    setComponents(cs => cs.map(c => c.id === draft.id ? draft : c));
    setEditing(draft);
    showToast('Changes saved');
  };
  // reorder a component within its sibling group (keyboard / menu)
  const handleReorder = (id, dir) => {
    setComponents(cs => {
      const arr = [...cs];
      const me = arr.find(c => c.id === id);
      if (!me) return cs;
      const sib = [];
      arr.forEach((c, i) => { if ((c.system||null) === (me.system||null) && (c.parentId||null) === (me.parentId||null)) sib.push(i); });
      const pos = sib.findIndex(i => arr[i].id === id);
      const swap = dir === 'up' ? pos - 1 : pos + 1;
      if (swap < 0 || swap >= sib.length) return cs;
      const a = sib[pos], b = sib[swap];
      const t = arr[a]; arr[a] = arr[b]; arr[b] = t;
      return arr;
    });
  };
  const handleCreateChild = (data) => {
    const id = 'c-' + Date.now() + Math.random().toString(36).slice(2,6);
    setComponents(cs => [...cs, { id, status: 'untested', notes: '', barcode: '', externalId: '', description: '', ...data }]);
    showToast('Component added');
  };
  const handleReorderSystem = (id, dir) => {
    setSystems(ss => {
      const arr = [...ss];
      const pos = arr.findIndex(s => s.id === id);
      const swap = dir === 'up' ? pos - 1 : pos + 1;
      if (pos < 0 || swap < 0 || swap >= arr.length) return ss;
      const t = arr[pos]; arr[pos] = arr[swap]; arr[swap] = t;
      return arr;
    });
  };
  const handleDeactivateSystem = (sys) => {
    setSystems(ss => ss.filter(s => s.id !== sys.id));
    setComponents(cs => cs.filter(c => c.system !== sys.id));
    showToast('System deactivated');
  };
  const handleCreate = (newComp) => {
    const { pendingMembers: pm = [], ...comp } = newComp;
    const toAdd = [comp];
    pm.forEach(m => {
      const { id: _pmId, ...rest } = m;
      toAdd.push({ id: 'c-' + Date.now() + Math.random().toString(36).slice(2,6), system: comp.system, parentId: comp.id, role: 'individual', status: 'untested', notes: '', barcode: '', externalId: '', description: '', ...rest });
    });
    setComponents(cs => [...cs, ...toAdd]);
    setAdding(null);
    showToast(comp.role === 'group' ? 'Group created' : 'Component created');
  };
  const handleMove = (dragId, target) => {
    if (target.kind === 'sys') {
      setSystems(ss => {
        const arr = [...ss];
        const di = arr.findIndex(s => s.id === dragId);
        if (di < 0) return ss;
        const [d] = arr.splice(di, 1);
        const ri = arr.findIndex(s => s.id === target.refId);
        arr.splice(target.pos === 'after' ? ri + 1 : ri, 0, d);
        return arr;
      });
      return;
    }
    setComponents(cs => {
      const arr = [...cs];
      const di = arr.findIndex(c => c.id === dragId);
      if (di < 0) return cs;
      const [dragged] = arr.splice(di, 1);
      const isGroup = dragged.role === 'group';
      const moved = { ...dragged };
      const appendIdx = (system, parentId) => {
        let last = -1;
        arr.forEach((c, i) => { if ((c.system||null) === (system||null) && (c.parentId||null) === (parentId||null)) last = i; });
        return last + 1;
      };
      if (target.kind === 'detach') {
        moved.system = null; moved.parentId = null; moved.anchor = target.after || null;
        arr.splice(appendIdx(null, null), 0, moved);
      } else if (target.kind === 'system') {
        moved.system = target.system; moved.parentId = null;
        arr.splice(appendIdx(target.system, null), 0, moved);
      } else if (target.kind === 'group') {
        const g = arr.find(c => c.id === target.groupId);
        moved.system = g.system; moved.parentId = g.id; arr.splice(appendIdx(g.system, g.id), 0, moved);
      } else { // before | after a reference row
        const ri = arr.findIndex(c => c.id === target.refId);
        const ref = arr[ri];
        moved.system = ref.system; moved.parentId = ref.parentId || null;
        const idx = arr.findIndex(c => c.id === target.refId);
        arr.splice(target.kind === 'after' ? idx + 1 : idx, 0, moved);
      }
      return arr;
    });
  };
  const handleConvert = (comp) => {
    setComponents(cs => cs.map(c => {
      if (c.id !== comp.id) return c;
      if (comp.role === 'group') return { ...c, role:'individual', status: c.status || 'untested' };
      return { ...c, role:'group', parentId: null };
    }));
    showToast(comp.role === 'group' ? 'Converted to single' : 'Converted to group');
  };
  const handleRemove = (comp) => {
    setComponents(cs => cs.filter(c => c.id !== comp.id && c.parentId !== comp.id));
    showToast('Component deactivated');
  };

  const openMenu = (e, comp) => {
    setMenu({ anchor: e.currentTarget, comp });
  };
  const onAdd = (ctx) => {
    setAdding(ctx || { systemId: systems[0].id, parentId: null });
  };

  const tabs = [
    ['details', 'Details'],
    ['components', 'Components', componentCount],
    ['inspections', 'Inspections', 6],
    ['deficiencies', 'Deficiencies', 3],
    ['attachments', 'Attachments'],
  ];

  return (
    <div className={`bldg-page ${scoped ? 'is-scoped' : ''}`}>
      {/* Workspace header — qmb-ui-header (workspace variant) */}
      <header role="banner" aria-label={scoped ? 'System Components' : 'IP Test Building'} className="qmb-ui-header qmb-ui-header--workspace">
        <div className="header__row">
          <h1 className="header__title"><span className="header__title-text">{scoped ? 'System Components' : 'IP Test Building'}</span></h1>
          {!scoped && <nav className="header__actions" aria-label="Workspace actions">
          <div className="header-tools">
            <div className="qmb-ui-toolbar">
              <div className="qmb-ui-toolbar__group">
                <button className="qmb-ui-button"><i className="fa-light fa-pen"></i>Edit</button>
              </div>
              <div className="qmb-ui-toolbar__divider"></div>
              <div className="qmb-ui-toolbar__overflow">
                <button className="qmb-ui-toolbar__overflow-trigger" aria-label="More actions" aria-expanded={hdrMenu}
                  onClick={(e)=>{ e.stopPropagation(); setHdrMenu(v=>!v); }}>
                  <i className="fa-light fa-ellipsis"></i>
                </button>
              </div>
            </div>
            {hdrMenu && (
              <div className="qmb-ui-popup hdr-menu" onClick={e=>e.stopPropagation()}>
                <div className="k-popup">
                  <div className="popup__section">
                    <ul className="qmb-ui-popup__action-list">
                      <li><button className="qmb-ui-button" onClick={()=>{ setHdrMenu(false); showToast('Building link copied'); }}><i className="fa-light fa-copy"></i>Copy building</button></li>
                      <li><button className="qmb-ui-button is-danger" onClick={()=>{ setHdrMenu(false); showToast('Building deactivated'); }}><i className="fa-light fa-ban"></i>Deactivate</button></li>
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </div>
          </nav>}
        </div>
        {scoped && <hr className="header__divider" />}
      </header>
      {/* Sub-tabs — qmb-ui-tabs (hidden on the system-scoped sub-page) */}
      {!scoped && <div className="qmb-ui-tabs bldg-tabview">
        <ul className="qmb-ui-tabs__list">
          {tabs.map(([k,l,c]) => (
            <li key={k}>
              <button className={`qmb-ui-tabs__option ${tab===k ? 'qmb-ui-tabs__option--current' : ''}`} onClick={()=>{ if (k===tab) { const m=document.querySelector('.qmb-main'); m && m.scrollTo({ top:0, behavior:'smooth' }); } setTab(k); }}>
                {l}
              </button>
            </li>
          ))}
        </ul>
      </div>}

      {tab === 'components' ? (
        <ComponentsTab
          systems={viewSystems} components={viewComponents}
          search={search} setSearch={setSearch}
          onEdit={setEditing}
          onAdd={onAdd}
          onMove={handleMove}
          onNotify={showToast}
          onMenu={openMenu}
          onReorder={handleReorder}
          onReorderSystem={handleReorderSystem}
          onCreateChild={handleCreateChild}
          onRemoveChild={(c)=>{ handleRemove(c); }}
          onSystemMenu={(e, sys)=>setSysMenu({ sys, anchor: e.currentTarget })}
          tw={tw}
          stickyBase={scoped ? 0 : 64}
        />
      ) : (
        <div className="ctab">
          <div className="ctab-empty">
            <i className="fa-light fa-layer-group"></i>
            <h4>{tabs.find(t=>t[0]===tab)[1]}</h4>
            <p>This tab is out of scope for the component-grouping pass — open the Components tab to try the grouping flow.</p>
          </div>
        </div>
      )}

      {editing && (
        <EditModal comp={editing} systems={viewSystems} components={viewComponents}
          onClose={()=>setEditing(null)} onSave={handleInlineSave}
          onDeactivate={(c)=>{ handleRemove(c); setEditing(null); }}
          onAdd={(ctx)=>{ setEditing(null); setTimeout(()=>onAdd(ctx), 50); }}
          onCreateChild={handleCreateChild}
          onDeactivateChild={(c)=>{ handleRemove(c); }} />
      )}
      {adding && (
        <AddBrushaway context={adding} systems={viewSystems} components={viewComponents}
          onClose={()=>setAdding(null)} onCreate={handleCreate} />
      )}
      <ContextMenu menu={menu} components={viewComponents} onClose={()=>setMenu(null)}
        onEdit={setEditing}
        onAddChild={(g)=>onAdd({ systemId: g.system, parentId: g.id, parentComp: g })}
        onConvert={handleConvert}
        onRemove={handleRemove}
        onMoveUp={(c)=>handleReorder(c.id, 'up')}
        onMoveDown={(c)=>handleReorder(c.id, 'down')}
        onMoveTo={(c, anchor)=>setMoveTo({ comp: c, anchor })} />
      <MoveToMenu moveTo={moveTo} systems={viewSystems} components={viewComponents}
        onClose={()=>setMoveTo(null)}
        onMove={(id, t)=>{ handleMove(id, t); showToast('Component moved'); }} />
      <SystemMenu sysMenu={sysMenu} systems={viewSystems} onClose={()=>setSysMenu(null)}
        onAdd={(sys)=>onAdd({ systemId: sys.id, parentId: null })}
        onMoveUp={(sys)=>handleReorderSystem(sys.id, 'up')}
        onMoveDown={(sys)=>handleReorderSystem(sys.id, 'down')}
        onDeactivate={handleDeactivateSystem} />

      {toast && (
        <div className={`qmb-ui-toast qmb-ui-toast--${toast.variant}`}>
          <div className="notification__content">
            <span className="notification__icon"><i className={`fa-light ${toast.variant==='error' ? 'fa-circle-exclamation' : 'fa-circle-check'}`}></i></span>
            <span className="notification__message">{toast.msg}</span>
          </div>
        </div>
      )}
    </div>
  );
}

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "rails": true,
  "sticky": true,
  "hoverActions": true,
  "notes": true
}/*EDITMODE-END*/;

function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const [route, setRoute] = React.useState('buildings');
  // view scope — driven by window.__VIEW (set inline per HTML file) or ?view=system&sys=…
  const params = new URLSearchParams(location.search);
  const view = window.__VIEW || params.get('view') || 'building';
  const scopeSystem = view === 'system' ? (window.__SCOPE_SYSTEM || params.get('sys') || 'sys-wet') : null;
  const sysName = (window.SEED_SYSTEMS.find(s => s.id === scopeSystem) || {}).name || 'System';
  const goBuilding = (e) => { if (e) e.preventDefault(); location.href = 'Component Grouping.html'; };
  // Cross-page nav: Settings has its own prototype page; other routes stay in-page.
  const SETUP_PAGE_ROUTES = { settings: 'Component Setup.html' };
  const go = (id) => { if (SETUP_PAGE_ROUTES[id]) { location.href = SETUP_PAGE_ROUTES[id]; return; } setRoute(id); };
  const crumbs = scopeSystem
    ? [
        { label: 'Acme Fire & Safety', href: '#' },
        { label: 'Buildings', href: '#' },
        { label: 'IP Test Building', href: 'Component Grouping.html', onClick: goBuilding },
        { label: `${sysName} — Components` },
      ]
    : [
        { label: 'Acme Fire & Safety', href: '#' },
        { label: 'Buildings', href: '#' },
        { label: 'IP Test Building' },
      ];
  return (
    <Shell user={{ initials:'VG' }} route={route} go={go} crumbs={crumbs} onAI={()=>{}}>
      {route === 'buildings'
        ? <BuildingPage tw={t} scopeSystem={scopeSystem} />
        : <div className="ctab"><div className="ctab-empty"><i className="fa-light fa-compass"></i><h4>Not in this prototype</h4><p>This prototype focuses on the Buildings → Components grouping flow.</p></div></div>}
      <TweaksPanel>
        <TweakSection label="Hierarchy & polish" />
        <TweakToggle label="Indent guide rails" value={t.rails} onChange={(v)=>setTweak('rails', v)} />
        <TweakToggle label="Sticky parent headers" value={t.sticky} onChange={(v)=>setTweak('sticky', v)} />
        <TweakToggle label="Hover-reveal row actions" value={t.hoverActions} onChange={(v)=>setTweak('hoverActions', v)} />
        <TweakToggle label="Notes in gutter" value={t.notes} onChange={(v)=>setTweak('notes', v)} />
      </TweaksPanel>
    </Shell>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
