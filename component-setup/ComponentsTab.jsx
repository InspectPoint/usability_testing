// ComponentsTab.jsx — Building → Components, on real Quimby components:
// qmb-ui-accordion (section = Systems, inline = Groups), qmb-ui-tag, qmb-filters,
// qmb-ui-button. Drag-and-drop is POINTER-BASED (reliable across browsers and
// inside the scrollable workspace) with a drag ghost + drop indicators.

function Tag({ variant='gray', style='pastry', icon, className='', children }) {
  return (
    <span className={`qmb-ui-tag qmb-ui-tag--${variant} qmb-ui-tag--${style} ${className}`.trim()}>
      {icon && <i className={`qmb-ui-tag__icon ${icon}`} aria-hidden="true"></i>}
      <span className="qmb-ui-tag__label">{children}</span>
    </span>
  );
}
const STATUS_TAG = {
  passed:    { variant:'green', label:'Passed' },
  deficient: { variant:'red',   label:'Deficient' },
  untested:  { variant:'gray',  label:'Untested' },
};
// Type chip. A group reads "[layer] <Full type> · <count>" (icon kept, no
// "Group:" prefix, full component type spelled out). `count` is the bulk
// quantity on a single-row group, or the listed-member count once it's an
// accordion. Individuals get the outlined type chip.
function CompTypeTag({ comp, count }) {
  if (comp.role === 'group') {
    return (
      <Tag variant="gray" className="comp-grouptag" icon="fa-light fa-layer-group">
        {comp.type}
        {count != null && <span className="comp-grouptag__count">{count}</span>}
      </Tag>
    );
  }
  return <Tag variant="gray" className="comp-typetag">{comp.type}</Tag>;
}
const TYPE_FAMILY = {
  'Alarm Device':'alarm', 'Alarm Group':'alarm', 'Control Panel':'alarm',
  'Sprinkler Head':'sprinkler', 'Sprinkler Head Group':'sprinkler',
  'Control Valve':'valve', 'Backflow':'valve', 'Standpipe':'valve', 'Hydrant':'valve',
  'Compressor':'pump', 'Hood':'hood', 'Extinguisher':'extinguisher',
};
const familyOf = (t) => TYPE_FAMILY[t] || 'other';
const sameFamily = (a, b) => familyOf(a) === familyOf(b);

function rollup(children) {
  const r = { total: children.length, passed:0, deficient:0, untested:0 };
  children.forEach(c => { const k = c.status || 'untested'; r[k] = (r[k]||0) + 1; });
  return r;
}
const noToggle = (fn) => (e) => { e.preventDefault(); e.stopPropagation(); fn && fn(e); };

// Replay the present-note slide-in for an accordion that just opened. Native
// <details> hides collapsed content with display:none, and browsers won't restart
// a CSS animation across a display:none→visible toggle — so on each open we clear
// and re-apply the animation (forced reflow) to replay it every time. Driven from a
// useLayoutEffect (NOT the async `toggle` event): the reset must land BEFORE the
// browser paints the newly-shown content, otherwise the note flashes its end-state
// for one frame. The CSS keyframe stays the single source of truth; this just
// re-fires it. Scoped to the accordion's OWN present notes (leaf-row + nested header).
function replayNoteIn(detailsEl) {
  if (!detailsEl || !detailsEl.open) return;
  const content = detailsEl.querySelector(':scope > .qmb-ui-accordion__content');
  if (!content) return;
  content.querySelectorAll(':scope > .comp-sublist > .comp-leaf > .comp-note--filled, :scope > .comp-sublist > .qmb-ui-accordion--inline > .qmb-ui-accordion__summary > .comp-note--filled')
    .forEach(n => { n.style.animation = 'none'; void n.offsetWidth; n.style.animation = ''; });
}

function IconBtn({ icon, title, onClick, variant }) {
  const v = variant === 'default' ? '' : 'qmb-ui-button--highlighted';
  return (
    <Tooltip content={title} position="top">
      <button className={`qmb-ui-button ${v} comp-iconbtn`} aria-label={title} onClick={noToggle(onClick)}>
        <i className={icon}></i>
      </button>
    </Tooltip>
  );
}

function RollupSummary({ r }) {
  const total = r.total || 0;
  const pct = (n) => total ? (n / total) * 100 : 0;
  const parts = [];
  if (r.passed)    parts.push(`${r.passed} passed`);
  if (r.deficient) parts.push(`${r.deficient} deficient`);
  if (r.untested)  parts.push(`${r.untested} untested`);
  if (!window.SHOW_STATUS) {
    return (
      <div className="comp-rollup">
        <span className="comp-rollup__count">{total}</span>
      </div>
    );
  }
  return (
    <Tooltip content={parts.join(' · ')} position="top">
      <div className="comp-rollup">
        <span className="comp-rollup__count">{total}</span>
        {window.SHOW_STATUS && (
          <div className="comp-rollup__bar" role="img" aria-label={parts.join(', ')}>
            {r.passed>0    && <span className="comp-rollup__seg comp-rollup__seg--passed"    style={{ width: pct(r.passed)+'%' }}></span>}
            {r.deficient>0 && <span className="comp-rollup__seg comp-rollup__seg--deficient" style={{ width: pct(r.deficient)+'%' }}></span>}
            {r.untested>0  && <span className="comp-rollup__seg comp-rollup__seg--untested"  style={{ width: pct(r.untested)+'%' }}></span>}
          </div>
        )}
      </div>
    </Tooltip>
  );
}

// Drag handle — initiates pointer drag; also focusable for keyboard reorder (↑/↓)
function Handle({ onStart, gripId, onKeyMove }) {
  return (
    <span className="comp-handle" role="button" tabIndex={0}
      title="Drag to move — or focus and use ↑ / ↓ keys"
      aria-label="Reorder: drag, or press up and down arrow keys to move"
      data-grip-id={gripId}
      onPointerDown={onStart}
      onClick={(e)=>{ e.preventDefault(); e.stopPropagation(); }}
      onKeyDown={(e)=>{
        if (e.key === 'ArrowUp') { e.preventDefault(); e.stopPropagation(); onKeyMove && onKeyMove('up'); }
        else if (e.key === 'ArrowDown') { e.preventDefault(); e.stopPropagation(); onKeyMove && onKeyMove('down'); }
        else if (e.key === ' ') { e.preventDefault(); }
      }}>
      <i className="fa-solid fa-grip-dots-vertical"></i>
    </span>
  );
}

// ─── Leaf (individual) row ──────────────────────────────────────────────────
// ─── Note affordance — lives in the right gutter, aligned to its row ─────────
// ─── Avatar — port of molecules/Avatar (initials variant) ───────────────────
function getInitials(label) {
  if (!label) return '';
  const w = String(label).trim().split(/\s+/).filter(Boolean);
  if (!w.length) return '';
  if (w.length === 1) return (w[0][0] || '').toUpperCase();
  return ((w[0][0] || '') + (w[w.length - 1][0] || '')).toUpperCase();
}
function Avatar({ label, color = '#763584', size = '24', className }) {
  const initials = getInitials(label);
  const px = Number(size) || 24;
  return (
    <span className={`qmb-ui-avatar qmb-ui-avatar--${size}${className ? ' ' + className : ''}`} role="img" aria-label={label} style={{ width: px, height: px }}>
      <svg width={px} height={px} viewBox="0 0 16 16" aria-hidden="true" focusable="false">
        <circle cx="8" cy="8" r="8" style={{ fill: color }} />
        <text x="50%" y="55%" dominantBaseline="middle" textAnchor="middle" style={{ fill: '#fff' }}>{initials}</text>
      </svg>
    </span>
  );
}

// Note author roster — deterministic per component id so each noted row shows a
// stable but varied avatar (different initials + Quimby accent colors).
const NOTE_AUTHORS = [
  { name: 'Val Genova', color: 'var(--purple-500)' },
  { name: 'Marcus Hale', color: 'var(--blue-500)' },
  { name: 'Priya Nair', color: 'var(--green-600)' },
  { name: 'Dana Brooks', color: 'var(--indigo-500)' },
  { name: 'Theo Park', color: 'var(--brand-04)' },
];
function authorFor(id) {
  const s = String(id); let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return NOTE_AUTHORS[h % NOTE_AUTHORS.length];
}

// Note affordance — lives in the row markup (direct child of the row/summary) but is
// absolutely positioned out into the right gutter via left:100%. The --depth term
// cancels the per-tier right inset (24px/level) so every note lands in one column.
function NoteGutter({ comp, depth, onOpen }) {
  const has = !!(comp.notes && String(comp.notes).trim());
  const author = authorFor(comp.id);
  const open = (e) => { e.stopPropagation(); onOpen(comp); };
  return (
    <div className={`comp-note ${has ? 'comp-note--filled' : 'comp-note--empty'}`} style={{ '--depth': depth }}>
      {has
        ? <button type="button" className="comp-note__preview" title={`${author.name}: ${comp.notes}`} onClick={open}>
            <Avatar label={author.name} color={author.color} className="comp-note__avatar" />
            <span className="comp-note__text">{comp.notes}</span>
          </button>
        : <Tooltip content="Add note" position="top"><button type="button" className="qmb-ui-button comp-iconbtn comp-note__add" aria-label="Add note" onClick={open}>
            <i className="fa-light fa-comment-plus"></i>
          </button></Tooltip>}
    </div>
  );
}

// ─── Leaf (individual) row ───────────────────────────────────────────────────
function LeafRow({ c, depth, tier, onEdit, onMenu, onAdd, onDragStart, onKeyMove, hintClass }) {
  const st = STATUS_TAG[c.status || 'untested'];
  return (
    <div className={`comp-leaf ${tier||''} ${hintClass||''}`}
      data-row-id={c.id} data-row-role={c.role || 'individual'}>
      <div className="comp-leaf__left">
        <Handle onStart={(e)=>onDragStart(e, c)} gripId={c.id} onKeyMove={onKeyMove} />
        <span className="comp-leaf__chev" aria-hidden="true"></span>
        <div className="comp-leaf__titles">
          <span className="comp-leaf__name comp-title-link" role="link" tabIndex={0}
            onClick={noToggle(()=>onEdit(c))}
            onKeyDown={(e)=>{ if(e.key==='Enter'||e.key===' '){ e.preventDefault(); e.stopPropagation(); onEdit(c); } }}>{c.name}</span>
          <CompTypeTag comp={c} count={c.role === 'group' ? (c.quantity ?? 0) : null} />
          {c.location && <span className="comp-row__loc"><i className="fa-light fa-location-dot"></i>{c.location}</span>}
          {window.SHOW_STATUS && <Tag variant={st.variant}>{st.label}</Tag>}
        </div>
      </div>
      <div className="comp-leaf__actions">
        <Tooltip content={c.role === 'group' ? 'Add component to group' : 'Add sub-component'} position="top"><button className="qmb-ui-button comp-iconbtn" aria-label={c.role === 'group' ? 'Add component to group' : 'Add sub-component'} onClick={(e)=>{ e.stopPropagation(); onAdd(c); }}><i className="fa-light fa-plus"></i></button></Tooltip>
        <Tooltip content="More actions" position="top"><button className="qmb-ui-button qmb-ui-button--highlighted comp-iconbtn comp-leaf__menu" aria-label="More actions" onClick={(e)=>{ e.stopPropagation(); onMenu(e, c); }}><i className="fa-light fa-ellipsis"></i></button></Tooltip>
      </div>
      <span className="comp-incompat-veil" aria-hidden="true">Incompatible</span>
      <NoteGutter comp={c} depth={depth} onOpen={onEdit} />
    </div>
  );
}

// ─── Group children list — compact flat list used in 'children-list' groupView ─
// Renders when isGroup && groupView==='children-list': each child is a slim row
// (name link + type + location) without the full row machinery.  A trailing
// '+ Add component' button opens the add-brushaway pre-set to this group.
function GroupChildrenList({ comp, kids, onCreateChild, onDeactivateChild }) {
  const [adding, setAdding] = React.useState(false);
  const defaultType = (comp.type || '').replace(/\s*Group$/i, '').trim();
  const [name, setName] = React.useState('');
  const [type, setType] = React.useState(defaultType);
  const [loc,  setLoc]  = React.useState('');
  const types = (window.COMPONENT_TYPES || [defaultType].filter(Boolean));

  const commit = () => {
    if (!name.trim()) return;
    onCreateChild && onCreateChild({ name: name.trim(), type: type || defaultType, location: loc, system: comp.system, parentId: comp.id, role: 'individual' });
    setName(''); setType(defaultType); setLoc(''); setAdding(false);
  };
  const cancel = () => { setName(''); setType(defaultType); setLoc(''); setAdding(false); };

  return (
    <div className="comp-childlist">
      {kids.length === 0 && !adding
        ? <div className="comp-childlist__empty">No components yet — click below to add one.</div>
        : kids.map(c => (
            <div className="comp-childlist__item" key={c.id}>
              <span className="comp-childlist__name">{c.name}</span>
              {c.type && <Tag variant="gray" className="comp-typetag comp-typetag--outline">{c.type}</Tag>}
              {c.location && <span className="comp-row__loc"><i className="fa-light fa-location-dot"></i>{c.location}</span>}
              <span className="comp-childlist__spacer"></span>
              <Tooltip content="Deactivate" position="top">
                <button type="button" className="qmb-ui-button comp-iconbtn comp-childlist__remove" aria-label="Deactivate"
                  onClick={(e)=>{ e.stopPropagation(); onDeactivateChild && onDeactivateChild(c); }}>
                  <i className="fa-light fa-ban"></i>
                </button>
              </Tooltip>
            </div>
          ))}
      {adding && (
        <div className="comp-childlist__newrow">
          <input className="cn-name" placeholder="Name" autoFocus value={name} onChange={e=>setName(e.target.value)}
            onKeyDown={e=>{ if(e.key==='Enter') commit(); if(e.key==='Escape') cancel(); }} />
          <select className="cn-type" value={type} onChange={e=>setType(e.target.value)}>
            <option value="">Type…</option>
            {types.map(t=><option key={t} value={t}>{t}</option>)}
          </select>
          <input className="cn-loc" placeholder="Location" value={loc} onChange={e=>setLoc(e.target.value)}
            onKeyDown={e=>{ if(e.key==='Enter') commit(); if(e.key==='Escape') cancel(); }} />
          <div className="comp-childlist__newrow-acts">
            <button type="button" className="qmb-ui-button qmb-ui-button--primary qmb-ui-button--sm" onClick={commit}>Add</button>
            <button type="button" className="qmb-ui-button qmb-ui-button--sm" onClick={cancel}>Cancel</button>
          </div>
        </div>
      )}
      {!adding && (
        <button type="button" className="qmb-ui-button qmb-ui-button--secondary" style={{margin:'4px 12px 8px', alignSelf:'flex-start'}} onClick={()=>setAdding(true)}>
          <i className="fa-light fa-plus"></i> Add component
        </button>
      )}
    </div>
  );
}

// ─── Node — INLINE accordion (any component with children, or a group) ──────
function GroupAccordion({ comp, kids, depth, tier, expanded, onToggle, onEdit, onAdd, onMenu, onDragStart, onKeyMove, hintClass, renderNode, stickyBase = 64, groupView, onCreateChild, onRemoveChild }) {
  const r = rollup(kids);
  const types = Array.from(new Set(kids.map(k => k.type)));
  const assetType = types.length === 1 ? types[0] : null;
  const isGroup = comp.role === 'group';
  const bulkModel = window.__GROUP_MODEL === 'bulk';
  const st = STATUS_TAG[comp.status || 'untested'];
  // group chip name comes from the group's own type (drop a redundant trailing "Group")
  const groupTypeName = (comp.type || '').replace(/\s*Group$/i, '');
  // sticky stack: base offset (tabs bar = 64, or 0 on the tab-less scoped page) + one
  // full header height (48) per ancestor level, so each nested header sits flush below its parent
  const stickyTop = stickyBase + 48 * depth;
  return (
    <details className={`qmb-ui-accordion qmb-ui-accordion--inline ${tier||''} qmb-ui-accordion--${expanded?'expanded':'collapsed'} ${hintClass||''}`} open={expanded}>
      <summary className={`qmb-ui-accordion__summary ${depth === 0 ? 'comp-stickyhdr' : ''}`} data-row-id={comp.id} data-row-role={comp.role} style={depth === 0 ? { '--sticky-top': stickyTop + 'px', zIndex: 5 } : undefined} onClick={noToggle(onToggle)}>
        <div className="qmb-ui-accordion__header">
          <div className="qmb-ui-accordion__header-left">
            <Handle onStart={(e)=>onDragStart(e, comp)} gripId={comp.id} onKeyMove={onKeyMove} />
            <span className="qmb-ui-accordion__chevron" aria-hidden="true"><i className="fa-solid fa-chevron-right"></i></span>
            <div className="qmb-ui-accordion__title-container">
              <span className="qmb-ui-accordion__title comp-title-link" role="link" tabIndex={0}
                onClick={noToggle(()=>onEdit(comp))}
                onKeyDown={(e)=>{ if(e.key==='Enter'||e.key===' '){ e.preventDefault(); e.stopPropagation(); onEdit(comp); } }}>{comp.name}</span>
              {isGroup
                ? (bulkModel
                    ? <CompTypeTag comp={comp} count={kids.length} />
                    : <Tag variant="gray" className="comp-grouptag" icon="fa-light fa-layer-group">Group: {groupTypeName}</Tag>)
                : <Tag variant="gray" className="comp-typetag">{comp.type}</Tag>}
              {comp.location && <span className="comp-row__loc"><i className="fa-light fa-location-dot"></i>{comp.location}</span>}
              {!isGroup && window.SHOW_STATUS && <Tag variant={st.variant}>{st.label}</Tag>}
            </div>
          </div>
          {kids.length > 0 && !(isGroup && bulkModel) && <RollupSummary r={r} />}
          <div className="qmb-ui-accordion__actions">
            <IconBtn icon="fa-light fa-plus" title="Add sub-component" variant="default" onClick={()=>onAdd(comp)} />
            <IconBtn icon="fa-light fa-ellipsis" title="More actions" onClick={(e)=>onMenu(e, comp)} />
          </div>
          <span className="comp-incompat-veil" aria-hidden="true">Incompatible</span>
        </div>
        <NoteGutter comp={comp} depth={depth} onOpen={onEdit} />
      </summary>
      <div className="qmb-ui-accordion__content">
        <div className="comp-sublist">
          {kids.length === 0 && !(groupView === 'children-list' && isGroup)
            ? <div className="drop-hint"><i className="fa-light fa-arrow-down-to-bracket"></i>Drag components here, or use + to add one</div>
            : groupView === 'children-list' && isGroup
              ? <GroupChildrenList comp={comp} kids={kids} onCreateChild={onCreateChild} onDeactivateChild={(c)=>{ onRemoveChild && onRemoveChild(c); }} />
              : kids.map(c => renderNode(c, depth + 1))}
        </div>
      </div>
    </details>
  );
}

function FilterOpt({ active, label, value, onClick, anchorRef }) {
  return (
    <button ref={anchorRef} className={`filters__option ${active ? 'filters__option--active' : ''}`} onClick={onClick} type="button">
      <span className="filters__option-label">{label}</span>
      {active && value && <span className="filters__option-value">{value}</span>}
    </button>
  );
}

function ComponentsTab({ systems, components, onEdit, onAdd, onMove, onNotify, onMenu, onSystemMenu, onReorder, onReorderSystem, search, setSearch, tw, stickyBase = 64, onCreateChild, onRemoveChild }) {
  const groupView = window.__GROUP_VIEW || 'tree';
  const [openSystems, setOpenSystems] = React.useState(() => Object.fromEntries(systems.map(s => [s.id, true])));
  const [openGroups, setOpenGroups] = React.useState({});
  const [openLoose, setOpenLoose] = React.useState(true);
  const [statusFilter, setStatusFilter] = React.useState('active');
  const [typeFilter, setTypeFilter] = React.useState('all');
  const [filterMenu, setFilterMenu] = React.useState(null); // { key, anchor }

  // pointer drag state
  const [dragComp, setDragComp] = React.useState(null);
  const [hint, setHint] = React.useState(null);   // {id,pos} | {band:'system'|'detach', system?}
  const [ghost, setGhost] = React.useState(null);
  const [flashId, setFlashId] = React.useState(null);
  const [focusGrip, setFocusGrip] = React.useState(null);
  // after a keyboard reorder, return focus to the moved item's grip
  React.useEffect(() => {
    if (!focusGrip) return;
    const sel = (window.CSS && CSS.escape) ? CSS.escape(focusGrip) : focusGrip;
    const el = document.querySelector(`[data-grip-id="${sel}"]`);
    if (el) el.focus();
    setFocusGrip(null);
  }, [components, systems, focusGrip]);
  const keyMove = (id, dir) => { setFocusGrip(id); onReorder && onReorder(id, dir); };
  const keyMoveSys = (id, dir) => { setFocusGrip(id); onReorderSystem && onReorderSystem(id, dir); };
  // toggle .is-stuck on sticky headers while they're actually pinned (drives the
  // floating-header shadow). Recomputed on scroll/resize and when layout changes.
  const stickyOn = !!(tw && tw.sticky);
  React.useEffect(() => {
    const sc = document.querySelector('.qmb-main');
    if (!sc || !stickyOn) return;
    let raf = 0;
    const update = () => {
      raf = 0;
      const cTop = sc.getBoundingClientRect().top;
      document.querySelectorAll('.ctab.tw-sticky .comp-stickyhdr').forEach(el => {
        const v = parseFloat(el.style.getPropertyValue('--sticky-top'));
        const target = cTop + (isNaN(v) ? 64 : v);
        el.classList.toggle('is-stuck', Math.abs(el.getBoundingClientRect().top - target) < 1.5);
      });
    };
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(update); };
    sc.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    update();
    return () => {
      sc.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      cancelAnimationFrame(raf);
      document.querySelectorAll('.ctab .qmb-ui-accordion__summary.is-stuck').forEach(el => el.classList.remove('is-stuck'));
    };
  });
  const dragRef = React.useRef(null);
  const startRef = React.useRef(null);
  const movingRef = React.useRef(false);
  const scrollerRef = React.useRef(null);
  const lastPt = React.useRef({ x: 0, y: 0 });
  const rafRef = React.useRef(0);

  const toggleSystem = (id) => setOpenSystems(s => ({ ...s, [id]: !s[id] }));
  const toggleGroup  = (id) => setOpenGroups(s => ({ ...s, [id]: !s[id] }));
  const byId = React.useMemo(() => Object.fromEntries(components.map(c => [c.id, c])), [components]);
  // Restart the note slide-in whenever an accordion goes collapsed→expanded.
  // useLayoutEffect runs after the DOM shows `open` but before paint, so the
  // animation reset is invisible (no end-state flash). First run has no snapshot,
  // so initial-load notes animate from the CSS `--expanded` rule instead.
  const prevOpenRef = React.useRef(null);
  React.useLayoutEffect(() => {
    const esc = (id) => (window.CSS && CSS.escape) ? CSS.escape(String(id)) : id;
    const cur = {};
    systems.forEach(s => { cur['sys:' + s.id] = !!openSystems[s.id]; });
    Object.keys(openGroups).forEach(id => { cur['grp:' + id] = !!openGroups[id]; });
    const prev = prevOpenRef.current;
    if (prev) {
      Object.keys(cur).forEach(k => {
        if (!(cur[k] && !prev[k])) return; // only just-expanded
        const id = k.slice(4);
        let details;
        if (k.startsWith('sys:')) details = document.querySelector(`.ctab-systems > details[data-sys="${esc(id)}"]`);
        else { const row = document.querySelector(`[data-row-id="${esc(id)}"]`); details = row && row.closest('details.qmb-ui-accordion--inline'); }
        replayNoteIn(details);
      });
    }
    prevOpenRef.current = cur;
  }, [openSystems, openGroups, systems]);
  const depthOf = (id) => { let n = 0, cur = byId[id]; while (cur && cur.parentId) { n++; cur = byId[cur.parentId]; } return n; }; // 0 = top level
  // is `id` inside `ancestorId`'s subtree? (used to stop dropping a group/component into its own descendants)
  const isWithin = (id, ancestorId) => { let cur = byId[id]; while (cur && cur.parentId) { if (cur.parentId === ancestorId) return true; cur = byId[cur.parentId]; } return false; };

  const expandAll = () => {
    setOpenSystems(Object.fromEntries(systems.map(s => [s.id, true])));
    const expandable = components.filter(c => components.some(k => k.parentId === c.id));
    setOpenGroups(Object.fromEntries(expandable.map(c => [c.id, true])));
    setOpenLoose(true);
  };
  const collapseAll = () => {
    setOpenSystems(Object.fromEntries(systems.map(s => [s.id, false])));
    setOpenGroups({});
    setOpenLoose(false);
  };

  const matches = (c) => {
    if (statusFilter === 'inactive') return false; // sample data is all active
    if (typeFilter !== 'all' && c.type !== typeFilter) return false;
    if (!search) return true;
    return `${c.name} ${c.type} ${c.location||''}`.toLowerCase().includes(search.toLowerCase());
  };

  // ── pointer-based drag and drop ─────────────────────────────────────────
  const barGeom = (box, pos, half) => {
    const cont = document.querySelector('.ctab-systems'); const cr = cont.getBoundingClientRect();
    const rb = box.getBoundingClientRect();
    const yEdge = pos === 'before' ? rb.top - half : rb.bottom + half;
    return { y: yEdge - cr.top, x: rb.left - cr.left - 8, w: rb.width + 16 };
  };
  const computeTarget = (x, y, d) => {
    const el = document.elementFromPoint(x, y);
    if (!el) return null;
    if (d.role === 'system') {
      const sysEl = el.closest('details[data-sys]');
      if (sysEl && sysEl.dataset.sys !== d.id) {
        const rect = sysEl.getBoundingClientRect();
        const pos = (y - rect.top) < rect.height/2 ? 'before' : 'after';
        return { hint: { sysId: sysEl.dataset.sys, pos, ...barGeom(sysEl, pos, 8) }, move: { kind:'sys', refId: sysEl.dataset.sys, pos } };
      }
      return null;
    }
    // Row wins over band — every row is nested inside a System's [data-band] content,
    // so checking band first would turn every drop into a "move to system".
    const row = el.closest('[data-row-id]');
    if (row) {
      const id = row.dataset.rowId;
      if (id === d.id) return null;
      if (isWithin(id, d.id)) return null; // can't drop a group/component into its own subtree
      const tc = byId[id], role = row.dataset.rowRole;
      const rect = row.getBoundingClientRect();
      const ry = y - rect.top, h = rect.height;
      // groups and individuals share the same before / inside / after zones
      let pos = ry < h*0.3 ? 'before' : (ry > h*0.7 ? 'after' : 'inside');
      if (pos === 'inside' && depthOf(id) >= 4) pos = ry < h/2 ? 'before' : 'after'; // cap at 5 tiers
      if (pos === 'inside' && tc && !sameFamily(d.type, tc.type)) return { hint: { id, pos: 'nope' }, move: null }; // can't nest across families
      if (pos === 'inside') return { hint: { id, pos: 'inside' }, move: { kind:'group', groupId:id } };
      const box = role === 'group' ? (row.closest('details') || row) : row;
      return { hint: { id, pos, ...barGeom(box, pos, 0) }, move: { kind:pos, refId:id } };
    }
    const band = el.closest('[data-band]');
    if (band) {
      if (band.dataset.band === 'system') return { hint: { band:'system', system: band.dataset.systemId }, move: { kind:'system', system: band.dataset.systemId } };
      if (band.dataset.band === 'detach') return { hint: { band:'detach' }, move: { kind:'detach' } };
    }
    const cont = el.closest('.ctab-systems');
    if (cont) {
      const top = y - cont.getBoundingClientRect().top;
      let after = null;
      cont.querySelectorAll('details[data-sys]').forEach(s => { if (s.getBoundingClientRect().top < y) after = s.dataset.sys; });
      return { hint: { band:'detach', y: top }, move: { kind:'detach', after } };
    }
    return null;
  };

  const autoScroll = () => {
    const d = dragRef.current;
    if (!d) { rafRef.current = 0; return; }
    const sc = scrollerRef.current;
    if (sc && movingRef.current) {
      const r = sc.getBoundingClientRect();
      const y = lastPt.current.y, edge = 72, max = 18;
      let dv = 0;
      if (y < r.top + edge) dv = -Math.round(max * Math.min(1, (r.top + edge - y) / edge));
      else if (y > r.bottom - edge) dv = Math.round(max * Math.min(1, (y - (r.bottom - edge)) / edge));
      if (dv) { sc.scrollTop += dv; const t = computeTarget(lastPt.current.x, lastPt.current.y, d); setHint(t ? t.hint : null); }
    }
    rafRef.current = requestAnimationFrame(autoScroll);
  };

  const onPointerMove = (e) => {
    const d = dragRef.current; if (!d) return;
    lastPt.current = { x: e.clientX, y: e.clientY };
    if (!movingRef.current) {
      if (Math.hypot(e.clientX - startRef.current.x, e.clientY - startRef.current.y) < 5) return;
      movingRef.current = true; setDragComp(d);
    }
    setGhost({ x: e.clientX, y: e.clientY, name: d.name });
    const t = computeTarget(e.clientX, e.clientY, d);
    setHint(t ? t.hint : null);
  };
  const onPointerUp = (e) => {
    window.removeEventListener('pointermove', onPointerMove);
    window.removeEventListener('pointerup', onPointerUp);
    if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = 0; }
    const d = dragRef.current; dragRef.current = null;
    const wasMoving = movingRef.current; movingRef.current = false;
    setDragComp(null); setGhost(null); setHint(null);
    if (!wasMoving || !d) return;
    const t = computeTarget(e.clientX, e.clientY, d);
    if (t && t.move) { onMove(d.id, t.move); if (t.move.kind === 'group') setOpenGroups(s => ({ ...s, [t.move.groupId]: true })); setFlashId(d.id); setTimeout(()=>setFlashId(null), 1150); }
    else if (t && t.hint && t.hint.pos === 'nope') { onNotify && onNotify("Couldn't attach — those component types aren't compatible.", 'error'); }
  };
  const onDragStart = (e, comp) => {
    e.preventDefault(); e.stopPropagation();
    dragRef.current = comp; startRef.current = { x: e.clientX, y: e.clientY }; movingRef.current = false;
    lastPt.current = { x: e.clientX, y: e.clientY };
    scrollerRef.current = (e.currentTarget.closest && e.currentTarget.closest('.qmb-main')) || document.querySelector('.qmb-main');
    if (!rafRef.current) rafRef.current = requestAnimationFrame(autoScroll);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
  };

  const hintClassFor = (comp) => {
    let c = dragComp && dragComp.id === comp.id ? 'is-dragging' : '';
    if (flashId === comp.id) c += ' comp-flash';
    if (dragComp && dragComp.id !== comp.id && (dragComp.role === 'system' || !sameFamily(dragComp.type, comp.type))) c += ' comp-incompatible';
    if (hint && hint.id === comp.id && hint.pos !== 'nope') c += ' drop-' + hint.pos;
    return c.trim();
  };

  const addToComponent = (comp) => onAdd({ systemId: comp.system, parentId: comp.id, parentComp: comp });

  const renderNode = (comp, depth) => {
    const kids = components.filter(c => c.parentId === comp.id);
    // all rows white — hierarchy is carried by indent + borders, not fills
    const tier = 'comp-tier--white';
    // v3 bulk model: role no longer forces an accordion — only real sub-components do
    const bulkModel = window.__GROUP_MODEL === 'bulk';
    const isAccordion = bulkModel ? kids.length > 0 : (comp.role === 'group' || kids.length > 0);
    if (!isAccordion) {
      if (!matches(comp)) return null;
      return <LeafRow key={comp.id} c={comp} depth={depth} tier={tier} onEdit={onEdit} onMenu={onMenu} onAdd={addToComponent} onDragStart={onDragStart} onKeyMove={(dir)=>keyMove(comp.id, dir)} hintClass={hintClassFor(comp)} />;
    }
    if (!matches(comp) && !kids.some(matches)) return null;
    const shownKids = (search || typeFilter !== 'all') ? kids.filter(matches) : kids;
    const expanded = !!openGroups[comp.id] || (!!(search||typeFilter!=='all') && shownKids.length>0);
    return (
      <GroupAccordion key={comp.id} comp={comp} kids={shownKids} depth={depth} tier={tier}
        expanded={expanded} onToggle={()=>toggleGroup(comp.id)}
        onEdit={onEdit} onAdd={addToComponent} onMenu={onMenu}
        onDragStart={onDragStart} onKeyMove={(dir)=>keyMove(comp.id, dir)} hintClass={hintClassFor(comp)} renderNode={renderNode} stickyBase={stickyBase} groupView={groupView} onCreateChild={onCreateChild} onRemoveChild={onRemoveChild} />
    );
  };

  const renderTopLevel = (list, base = 0) => list.map(item => renderNode(item, base));

  const looseItems = components.filter(c => !c.parentId && !c.system);
  const anyLoose = looseItems.length > 0;
  const looseAt = (a) => looseItems.filter(c => (c.anchor || null) === a);

  // filter popup options
  const typeOptions = ['all', ...Array.from(new Set(components.map(c => c.type)))];
  const statusOptions = [['all','All'],['active','Active'],['inactive','Inactive']];
  const statusValue = statusOptions.find(o => o[0] === statusFilter)?.[1] || 'Active';

  // Gutter widens only when a note is actually *visible*. A note tucked inside a
  // collapsed system or accordion doesn't count — so collapsing a noted row's
  // parent shrinks the gutter back to default. A row's OWN note (rendered on its
  // summary) stays visible when it collapses, so we only test its ancestors.
  const filterActive = !!(search || typeFilter !== 'all');
  const noteVisible = (c) => {
    if (!(c.notes && String(c.notes).trim())) return false;
    if (!matches(c)) return false;
    if (c.system && !openSystems[c.system]) return false;
    let cur = c;
    while (cur.parentId) {
      const p = byId[cur.parentId];
      if (!p) break;
      if (!(openGroups[p.id] || filterActive)) return false;
      cur = p;
    }
    return true;
  };
  const anyNote = components.some(noteVisible);

  return (
    <div className={`ctab ${tw && tw.rails ? 'tw-rails' : ''} ${tw && tw.sticky ? 'tw-sticky' : ''} ${tw && tw.hoverActions ? 'tw-hover-actions' : ''} ${tw && tw.notes ? 'comp-notes-on' : ''} ${tw && tw.notes && anyNote ? 'comp-notes-wide' : ''}`}>
      {/* Toolbar — qmb-filters */}
      <div className="qmb-filters ctab-filters" role="toolbar" aria-label="Components filters">
        <div className="filters__search ctab-search">
          <i className="fa-light fa-magnifying-glass"></i>
          <input type="search" placeholder="Search by name, location, or barcode…" value={search} onChange={e=>setSearch(e.target.value)} />
        </div>
        <span className="filters__label">Filter:</span>
        <div className="filters__group">
          <FilterOpt active label="Status" value={statusValue} onClick={(e)=>setFilterMenu(m => m && m.key==='status' ? null : { key:'status', anchor: e.currentTarget })} />
          <FilterOpt active={typeFilter!=='all'} label="Component Type" value={typeFilter!=='all'?typeFilter:null}
            onClick={(e)=>setFilterMenu(m => m && m.key==='type' ? null : { key:'type', anchor: e.currentTarget })} />
        </div>
        <div className="filters__group filters__group--push">
          <button className="qmb-ui-button qmb-ui-button--highlighted"><i className="fa-light fa-rotate-left"></i>Reset</button>
          <button className="qmb-ui-button"><i className="fa-light fa-gear"></i>Configure</button>
          <button className="qmb-ui-button qmb-ui-button--primary" onClick={()=>onAdd(null)}><i className="fa-light fa-plus"></i>Add Component</button>
        </div>
      </div>

      {/* Filter value popups (Quimby Popup) */}
      <BodyPopup open={!!filterMenu && filterMenu.key==='status'} anchor={filterMenu && filterMenu.anchor} width={200} onClose={()=>setFilterMenu(null)}>
        <div className="popup__section">
          <ul className="qmb-ui-popup__action-list">
            {statusOptions.map(([k,l]) => (
              <li key={k}><button className={`qmb-ui-button ${statusFilter===k?'is-selected':''}`} onClick={()=>{ setStatusFilter(k); setFilterMenu(null); }}>{l}{statusFilter===k && <i className="fa-light fa-check" style={{marginLeft:'auto'}}></i>}</button></li>
            ))}
          </ul>
        </div>
      </BodyPopup>
      <BodyPopup open={!!filterMenu && filterMenu.key==='type'} anchor={filterMenu && filterMenu.anchor} width={220} onClose={()=>setFilterMenu(null)}>
        <div className="popup__section" style={{maxHeight:300, overflowY:'auto'}}>
          <ul className="qmb-ui-popup__action-list">
            {typeOptions.map(t => (
              <li key={t}><button className={`qmb-ui-button ${typeFilter===t?'is-selected':''}`} onClick={()=>{ setTypeFilter(t); setFilterMenu(null); }}>{t==='all'?'All types':t}{typeFilter===t && <i className="fa-light fa-check" style={{marginLeft:'auto'}}></i>}</button></li>
            ))}
          </ul>
        </div>
      </BodyPopup>

      {/* Grouped list */}
      <div className="ctab-bulkrow">
        <span className="ctab-count"><b>{components.filter(matches).length}</b> component{components.filter(matches).length===1?'':'s'}{systems.length>1 && <> · <b>{systems.length}</b> systems</>}</span>
        <div className="ctab-bulk-actions">
          <button className="qmb-ui-button" onClick={expandAll}>Expand all</button>
          <span className="ctab-bulk-sep" aria-hidden="true">/</span>
          <button className="qmb-ui-button" onClick={collapseAll}>Collapse all</button>
        </div>
      </div>
      <div className="ctab-systems">
        {looseAt(null).length > 0 && (
          <div className="comp-sublist comp-looselist">{renderTopLevel(looseAt(null).filter(matches))}</div>
        )}
        {systems.map(sys => {
          const topLevel = components.filter(c => c.system === sys.id && !c.parentId);
          const count = components.filter(c => c.system === sys.id && matches(c)).length;
          const open = openSystems[sys.id];
          const after = looseAt(sys.id);
          return (
            <React.Fragment key={sys.id}>
            <details data-sys={sys.id} className={`qmb-ui-accordion qmb-ui-accordion--inline comp-tier--white qmb-ui-accordion--${open?'expanded':'collapsed'} ${hint && hint.band==='system' && hint.system===sys.id ? 'drop-system' : ''} ${dragComp && dragComp.id===sys.id ? 'is-dragging' : ''} ${flashId===sys.id ? 'comp-flash' : ''}`} open={open}>
              <summary className="qmb-ui-accordion__summary comp-stickyhdr" data-band="system" data-system-id={sys.id} style={{ '--sticky-top': stickyBase + 'px', zIndex: 5 }} onClick={noToggle(()=>toggleSystem(sys.id))}>
                <div className="qmb-ui-accordion__header">
                  <div className="qmb-ui-accordion__header-left">
                    <Handle onStart={(e)=>onDragStart(e, { id: sys.id, role: 'system', name: sys.name })} gripId={sys.id} onKeyMove={(dir)=>keyMoveSys(sys.id, dir)} />
                    <span className="qmb-ui-accordion__chevron" aria-hidden="true"><i className="fa-solid fa-chevron-right"></i></span>
                    <div className="qmb-ui-accordion__title-container">
                      <span className="qmb-ui-accordion__title">{sys.name}</span>
                      <Tag variant="gray" style="solid">System</Tag>
                      {!open && <span className="qmb-ui-accordion__preview-text">{count} component{count===1?'':'s'}</span>}
                    </div>
                    <div className="qmb-ui-accordion__divider-line"></div>
                  </div>
                  <div className="qmb-ui-accordion__actions">
                    <IconBtn icon="fa-light fa-plus" title="Add component to this system" variant="default" onClick={()=>onAdd({ systemId: sys.id, parentId: null })} />
                    <IconBtn icon="fa-light fa-ellipsis" title="More actions" onClick={(e)=>onSystemMenu(e, sys)} />
                  </div>
                </div>
              </summary>
              <div className="qmb-ui-accordion__content" data-band="system" data-system-id={sys.id}>
                <div className="comp-sublist">{renderTopLevel(topLevel, 1)}</div>
              </div>
            </details>
            {after.length > 0 && <div className="comp-sublist comp-looselist">{renderTopLevel(after.filter(matches))}</div>}
            </React.Fragment>
          );
        })}
        {hint && hint.y != null && <div className="drop-bar" style={hint.x != null ? { top: hint.y, left: hint.x, width: hint.w } : { top: hint.y, left: 0, right: 0 }}></div>}
      </div>

      {/* drag ghost */}
      {ghost && (
        <div className="comp-drag-ghost" style={{ top: ghost.y + 12, left: ghost.x + 12 }}>
          <i className="fa-light fa-grip-dots-vertical"></i>{ghost.name}
        </div>
      )}
    </div>
  );
}

Object.assign(window, { ComponentsTab, Tag, sameFamily });
