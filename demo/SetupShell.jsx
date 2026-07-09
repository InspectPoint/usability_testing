// SetupShell.jsx — the unified type-config page. Renders SETUP_SECTIONS in one of
// three switchable shells (Tweak `shell`): 'rail' (guided left rail + single scroll),
// 'tabs' (top section tabs, one panel at a time), 'accordion' (stacked sections).
// All three share the exact same section bodies — only the chrome differs.

// Inline-edit select — faithful to Quimby's InlineSelect (molecules/inputs/inline):
// a `qmb-ui-inline-edit--dropdown` trigger rendering "Label: value", opening a real
// qmb-ui-popup action list. Mirrors Inspect Point's Deficiency-brushaway header.
function InlineSelect({ label, value, options, placeholder, onChange, track }) {
  const [open, setOpen] = React.useState(false);
  const anchorRef = React.useRef(null);
  const cur = options.find(o => o.value === value);
  return (
    <span className="qmb-ui-inline-select">
      <span ref={anchorRef} className="qmb-ui-inline-edit qmb-ui-inline-edit--dropdown" tabIndex={0}
        role="button" aria-haspopup="listbox" aria-expanded={open} data-track={track}
        onClick={() => setOpen(o => !o)}
        onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setOpen(o => !o); } }}>
        <span className={`selectValue ${cur ? '' : 'selectValue--empty'}`}>{cur ? cur.label : (placeholder || 'Choose…')}</span>
        <i className="ie-caret fa-solid fa-angle-down" aria-hidden="true"></i>
      </span>
      <BodyPopup open={open} anchor={anchorRef.current} position="bottom-left" width={240}
        onClose={() => setOpen(false)} className="qmb-ui-popup--action-list">
        <div className="popup__section" style={{ maxHeight: 300, overflowY: 'auto' }}>
          <ul className="qmb-ui-popup__action-list">
            {options.map(o => (
              <li key={o.value}>
                <button type="button" className={`qmb-ui-button ${o.value === value ? 'is-selected' : ''}`} onClick={() => { onChange(o.value); setOpen(false); }}>
                  {o.label}{o.value === value && <i className="fa-light fa-check" style={{ marginLeft: 'auto' }}></i>}
                </button>
              </li>
            ))}
          </ul>
        </div>
      </BodyPopup>
    </span>
  );
}

function ConfigPage({ shell = 'rail', initial, isEdit, onClose, onSave, onSaveNext, chrome = 'page' }) {
  const modal = chrome === 'modal';
  // Edit mode has no "starting point" — you're editing an existing type, not choosing
  // how to begin. Hide the start step there.
  const sections = isEdit ? window.SETUP_SECTIONS.filter(s => s.id !== 'start') : window.SETUP_SECTIONS;
  const [d, setD] = React.useState(initial);
  const set = React.useCallback((patch) => setD(prev => ({ ...prev, ...patch })), []);
  const [dirty, setDirty] = React.useState(false);
  const [confirmCancel, setConfirmCancel] = React.useState(false);
  const setTracked = React.useCallback((patch) => { setDirty(true); setD(prev => ({ ...prev, ...patch })); }, []);
  const requestClose = () => { if (dirty) setConfirmCancel(true); else onClose && onClose(); };
  const [active, setActive] = React.useState(0);
  const [visited, setVisited] = React.useState(() => new Set([sections[0].id]));
  const [openAcc, setOpenAcc] = React.useState(() => new Set([sections[0].id]));
  const scrollRef = React.useRef(null);
  const sectionRefs = React.useRef({});
  const headerRef = React.useRef(null);
  const cfgRef = React.useRef(null);

  // Sticky workspace header: measure its height and expose it as --cfg-head-h so
  // the sticky rail / tab bar can offset themselves to sit just below it.
  React.useLayoutEffect(() => {
    const hw = headerRef.current, root = cfgRef.current;
    if (hw && root) root.style.setProperty('--cfg-head-h', hw.offsetHeight + 'px');
  });
  React.useEffect(() => {
    const hw = headerRef.current, root = cfgRef.current;
    if (!hw || !root) return;
    const apply = () => root.style.setProperty('--cfg-head-h', hw.offsetHeight + 'px');
    const ro = new ResizeObserver(apply);
    ro.observe(hw);
    window.addEventListener('resize', apply);
    return () => { ro.disconnect(); window.removeEventListener('resize', apply); };
  }, [shell]);

  const markVisited = React.useCallback((id) => setVisited(v => v.has(id) ? v : new Set(v).add(id)), []);

  const doneCount = sections.filter(s => stepDone(s.id, d, visited)).length;
  const progress = Math.round((doneCount / (sections.length - 1)) * 100); // review never "done"
  const canSave = !!d.path && (d.path === 'non-system' ? !!d.attach : !!d.system) && !!d.name && !!d.category
    && (d.questionSetId !== '__new' || !!(d.newSetName && d.newSetName.trim()));

  // path summary chips (header)
  const sys = window.SETUP_SYSTEMS.find(s => s.id === d.system);
  const attach = [...window.ATTACH_GROUPS.flatMap(g => g.options), ...window.ATTACH_MORE].find(o => o.id === d.attach);

  // ── rail: scrollspy ──
  // The page scrolls at .qmb-main now (no inner scroll region), so the spy must
  // listen there and measure section positions by rect, offsetting past the
  // sticky header so the step under the header is the "active" one.
  const getScroller = () => {
    if (cfgRef.current) {
      const mb = cfgRef.current.querySelector && cfgRef.current.querySelector('.typewiz-modal__body');
      if (mb) return mb;
    }
    let n = sectionRefs.current[sections[0] && sections[0].id] || cfgRef.current;
    while (n && n !== document.body) {
      const o = getComputedStyle(n).overflowY;
      if (o === 'auto' || o === 'scroll') return n;
      n = n.parentElement;
    }
    return (cfgRef.current && cfgRef.current.closest('.qmb-main')) || document.querySelector('.qmb-main');
  };
  const headH = () => parseInt((cfgRef.current && getComputedStyle(cfgRef.current).getPropertyValue('--cfg-head-h')) || '0', 10) || 0;

  React.useEffect(() => {
    if (shell !== 'rail') return;
    const scroller = getScroller(); if (!scroller) return;
    const onScroll = () => {
      // A section goes "active" once its top crosses 96px below the sticky header
      // (header height + 96px from the top of the single-scroll viewport).
      const probe = scroller.getBoundingClientRect().top + headH() + 96;
      let idx = 0;
      sections.forEach((s, i) => { const n = sectionRefs.current[s.id]; if (n && n.getBoundingClientRect().top <= probe) idx = i; });
      setActive(idx); markVisited(sections[idx].id);
    };
    onScroll();
    const raf = requestAnimationFrame(onScroll);
    scroller.addEventListener('scroll', onScroll, { passive: true });
    return () => { cancelAnimationFrame(raf); scroller.removeEventListener('scroll', onScroll); };
  }, [shell, sections, markVisited]);

  const scrollToSection = (i) => {
    setActive(i); markVisited(sections[i].id);
    const n = sectionRefs.current[sections[i].id];
    const scroller = getScroller();
    if (n && scroller) {
      const top = scroller.scrollTop + n.getBoundingClientRect().top - scroller.getBoundingClientRect().top - headH() - 12;
      try { scroller.scrollTo({ top, behavior: 'smooth' }); } catch (e) {}
      scroller.scrollTop = top;
    }
  };
  const goToStep = (i) => {
    if (shell === 'rail' || shell === 'express') scrollToSection(i);
    else if (shell === 'tabs') { setActive(i); markVisited(sections[i].id); const s = getScroller(); s && s.scrollTo({ top: 0, behavior: 'smooth' }); }
    else {
      setOpenAcc(new Set([sections[i].id])); markVisited(sections[i].id);
      const scroller = getScroller();
      setTimeout(() => {
        const n = sectionRefs.current[sections[i].id];
        if (n && scroller) scroller.scrollTo({ top: scroller.scrollTop + n.getBoundingClientRect().top - scroller.getBoundingClientRect().top - headH() - 12, behavior: 'smooth' });
      }, 60);
    }
  };
  // id-based jump so steps resolve correctly even when the section list is filtered
  // (e.g. the start step is hidden in edit mode).
  const goId = (id) => { const i = sections.findIndex(s => s.id === id); if (i >= 0) goToStep(i); };

  const renderBody = (s) => {
    const Body = s.Body;
    return <Body d={d} set={setTracked} locked={isEdit ? d.inUse : 0} goTo={goToStep} goId={goId} />;
  };

  // ── header — real WorkspaceHeader component (Shell.jsx), sticky ──
  const headerActions = modal ? null : (
    <>
      {!isEdit && (
        <div className="cfg-meter">
          <div className="cfg-meter__track"><div className={`cfg-meter__fill ${progress >= 100 ? 'cfg-meter__fill--complete' : ''}`} style={{ width: progress + '%' }}></div></div>
          <span className={`cfg-meter__label ${progress >= 100 ? 'cfg-meter__label--complete' : ''}`}>{progress}%</span>
        </div>
      )}
      <button className="qmb-ui-button" onClick={requestClose}>Cancel</button>
      <button className="qmb-ui-button qmb-ui-button--primary" data-track="save:type" disabled={!canSave} onClick={() => onSave(d)}>
        <i className="fa-light fa-check"></i>{isEdit ? 'Save changes' : 'Save type'}
      </button>
    </>
  );
  const headerFields = [];
  const catOpts = Object.keys(window.CATEGORY_COLOR).map(c => ({ value: c, label: c }));
  const attachOpts = [...window.ATTACH_GROUPS.flatMap(g => g.options), ...window.ATTACH_MORE].map(o => ({ value: o.id, label: o.name }));
  const sysOpts = window.SETUP_SYSTEMS.map(s => ({ value: s.id, label: s.name }));
  if (d.path) headerFields.push({ label: '', value: (
    <><span className="header__label">Path:</span><InlineSelect value={d.path} options={[{ value: 'system', label: 'System' }, { value: 'non-system', label: 'Non-system' }]} onChange={v => set({ path: v })} /></>
  ) });
  if (d.path === 'system') headerFields.push({ label: '', value: (
    <><span className="header__label">System:</span><InlineSelect value={d.system || ''} placeholder="Choose a system…" options={sysOpts} onChange={v => set({ system: v })} /></>
  ) });
  if (d.path === 'non-system') headerFields.push({ label: '', value: (
    <><span className="header__label">Attaches to:</span><InlineSelect value={d.attach || ''} placeholder="Choose…" options={attachOpts} onChange={v => set({ attach: v })} /></>
  ) });
  headerFields.push({ label: '', value: (
    <><span className="header__label">Category:</span><InlineSelect value={d.category || ''} placeholder="Choose a category…" options={catOpts} onChange={v => set({ category: v })} /></>
  ) });
  const header = (
    <div className="cfg-headwrap" ref={headerRef}>
      <WorkspaceHeader
        title={isEdit ? (d.name || 'Edit component type') : 'New component type'}
        actions={headerActions}
        fields={isEdit ? headerFields : null}
        split={false}
      />
    </div>
  );

  // persistent provenance banner when the draft was copied from another type
  const banner = (!isEdit && d.copiedFrom) ? (
    <div className="cfg-canvas" style={{ paddingTop: 16, paddingBottom: 0 }}>
      <div className="cfg-copybanner">
        <i className="fa-solid fa-copy"></i>
        <span>{d.startMode === 'recommended' ? 'Started from recommended type ' : 'Copied from '}<b>{d.copiedFrom}</b>. Everything below is editable; changes only affect this new type.</span>
      </div>
    </div>
  ) : null;

  // unsaved-changes guard, shared across shells
  const confirmEl = confirmCancel && window.ConfirmDialog && (
    <window.ConfirmDialog
      title="Discard changes?"
      message="You have unsaved changes. Leaving now discards them. This can't be undone."
      confirmLabel="Discard changes"
      variant="primary"
      onConfirm={() => { setConfirmCancel(false); onClose && onClose(); }}
      onCancel={() => setConfirmCancel(false)}
    />
  );

  // ── shell: RAIL / EXPRESS (single scroll; Express drops the rail + compacts) ──
  if (shell === 'rail' || shell === 'express') {
    const express = shell === 'express';
    const railMain = (
        <div className="cfg-main">
          <div className="cfg-scroll" ref={scrollRef}>
            <div className="cfg-canvas">
              {sections.map(s => (
                <section key={s.id} className="cfg-section" ref={n => sectionRefs.current[s.id] = n}>
                  <div className="cfg-section__head">
                    <SectionTitle title={sectionTitle(s, d)} />
                    <p className="cfg-section__desc">{sectionDesc(s, d)}</p>
                  </div>
                  {renderBody(s)}
                </section>
              ))}
            </div>
          </div>
          {!express && (
            <nav className="cfg-toc" aria-label="Configure steps">
              {sections.map((s, i) => {
                const done = stepDone(s.id, d, visited);
                return (
                  <button key={s.id} className={`cfg-toc__item ${active === i ? 'cfg-toc__item--active' : ''} ${done ? 'cfg-toc__item--done' : ''}`}
                    onClick={() => scrollToSection(i)} title={s.label}>
                    <span className="cfg-toc__label">{s.label}</span>
                  </button>
                );
              })}
            </nav>
          )}
        </div>
    );
    if (modal) {
      return (
        <div className="qmb-ui-modal-wrapper typewiz-modal-wrap">
          <div className="qmb-ui-modal-overlay" onClick={requestClose}></div>
          <div className="qmb-ui-modal typewiz-modal cfg cfg--rail" role="dialog" aria-modal="true" aria-label="New component type" ref={cfgRef}>
            <header className="qmb-ui-modal-header">
              <div className="qmb-ui-modal-header__row qmb-ui-modal-header__row--title">
                <div className="qmb-ui-modal-header__title"><span className="qmb-ui-text"><b>New component type</b></span></div>
                <div className="qmb-ui-modal-header__actions">
                  <button className="qmb-ui-button comp-iconbtn qmb-ui-modal-header__close" aria-label="Close" onClick={requestClose}><i className="fa-light fa-xmark"></i></button>
                </div>
              </div>
              <hr className="qmb-ui-modal-header__divider" aria-hidden="true" />
            </header>
            <div className="qmb-ui-modal-body typewiz-modal__body">{banner}{railMain}</div>
            <footer className="qmb-ui-modal-footer qmb-ui-modal-footer--divider">
              <div className="qmb-ui-modal-footer__content">
                <div className="qmb-ui-modal-footer__start">
                  <div className="cfg-meter">
                    <div className="cfg-meter__track"><div className={`cfg-meter__fill ${progress >= 100 ? 'cfg-meter__fill--complete' : ''}`} style={{ width: progress + '%' }}></div></div>
                    <span className={`cfg-meter__label ${progress >= 100 ? 'cfg-meter__label--complete' : ''}`}>{progress}%</span>
                  </div>
                </div>
                <div className="qmb-ui-modal-footer__actions">
                  <button className="qmb-ui-button" onClick={requestClose}>Cancel</button>
                  <button className="qmb-ui-button qmb-ui-button--primary" data-track="save:type" disabled={!canSave} onClick={() => onSave(d)}><i className="fa-light fa-check"></i>Save type</button>
                </div>
              </div>
            </footer>
          </div>
          {confirmEl}
        </div>
      );
    }
    return (
      <div className={`cfg ${express ? 'cfg--express' : 'cfg--rail'}`} ref={cfgRef}>
        {header}
        {banner}
        {railMain}
        {confirmEl}
      </div>
    );
  }

  // ── shell: TABS ──
  if (shell === 'tabs') {
    const s = sections[active];
    return (
      <div className="cfg cfg--tabs" ref={cfgRef}>
        {header}
        {banner}
        <div className="cfg-tabbar">
          {sections.map((sec, i) => {
            const done = stepDone(sec.id, d, visited);
            return (
              <button key={sec.id} className={`cfg-tab ${active === i ? 'cfg-tab--current' : ''} ${done ? 'cfg-tab--done' : ''}`} onClick={() => goToStep(i)}>
                <span className="cfg-tab__dot"></span>{sec.label}
              </button>
            );
          })}
        </div>
        <div className="cfg-main">
          <div className="cfg-scroll" ref={scrollRef}>
            <div className="cfg-canvas">
              <section className="cfg-section" style={{ borderBottom: 0 }}>
                <div className="cfg-section__head">
                  <SectionTitle title={sectionTitle(s, d)} />
                  <p className="cfg-section__desc">{sectionDesc(s, d)}</p>
                </div>
                {renderBody(s)}
              </section>
            </div>
          </div>
        </div>
        {confirmEl}
      </div>
    );
  }

  // ── shell: ACCORDION ──
  const toggleAcc = (id) => setOpenAcc(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); if (!prev.has(id)) markVisited(id); return n; });
  return (
    <div className="cfg cfg--accordion" ref={cfgRef}>
      {header}
      {banner}
      <div className="cfg-main">
        <div className="cfg-scroll" ref={scrollRef}>
          <div className="cfg-canvas">
            {sections.map((s, i) => {
              const open = openAcc.has(s.id);
              const done = stepDone(s.id, d, visited);
              return (
                <div key={s.id} className={`cfg-acc ${open ? 'cfg-acc--open' : ''} ${done ? 'cfg-acc--done' : ''}`} ref={n => sectionRefs.current[s.id] = n}>
                  <button className="cfg-acc__head" onClick={() => toggleAcc(s.id)}>
                    <span className="cfg-acc__num">{done && !open ? <i className="fa-solid fa-check" style={{ fontSize: 11 }}></i> : i + 1}</span>
                    <span>
                      <span className="cfg-acc__title">{sectionTitle(s, d)}</span>
                      <span className="cfg-acc__sub">{sectionDesc(s, d)}</span>
                    </span>
                    <i className="fa-solid fa-chevron-right cfg-acc__chev"></i>
                  </button>
                  {open && <div className="cfg-acc__body">{renderBody(s)}</div>}
                </div>
              );
            })}
          </div>
        </div>
      </div>
      {confirmEl}
    </div>
  );
}

window.ConfigPage = ConfigPage;
window.InlineSelect = InlineSelect;
