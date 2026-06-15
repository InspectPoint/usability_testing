// Shell.jsx — QMB app shell, faithful to /Global/section in the .fig.
// Global Nav (left vertical sidebar, expandable/collapsible)
// Global Header (bottom indigo breadcrumb bar)
// Workspace Header (in-page section header — qmb-header--workspace)

function Icon({ name, size = 16, weight = "light" }) {
  // Quimby default: fa-classic fa-light. Pass weight="solid" for status emphasis.
  return <i className={`fa-classic fa-${weight} fa-${name}`} style={{ fontSize: size }} />;
}

// ─── Inspect Point flame mark (inline SVG, white via currentColor) ──────────
const FlameMark = () => (
  <svg viewBox="0 0 23.959 32.729" fill="currentColor" aria-hidden="true">
    <path d="M 11.669 0 C 11.669 0 8.247 1.338 8.365 4.796 C 8.483 8.252 9.692 11.577 7.509 14.474 C 7.509 14.474 7.789 11.018 6.742 8.943 C 5.694 6.869 4.322 6.06 4.322 6.06 C 4.322 6.06 5.546 9.678 3.613 13.149 C 1.681 16.621 0 19.02 0 22.8 C 0 26.58 2.714 31.772 8.247 32.611 C 8.247 32.611 6.807 30.299 7.052 28.449 C 7.524 24.89 10.4 23.536 9.619 17.976 C 9.619 17.976 12.481 21.036 12.599 25.037 C 12.717 29.038 11.507 30.891 11.507 30.891 C 11.507 30.891 15.255 28.377 14.812 24.007 C 14.812 24.007 18.514 27.11 15.137 32.729 C 15.137 32.729 23.959 29.979 23.959 21.358 C 23.959 15.945 20.035 12.93 19.563 10.297 C 19.091 7.665 19.534 5.648 19.534 5.648 C 19.534 5.648 17.35 6.501 17.499 9.238 C 17.646 11.974 18.532 13.784 17.351 16.284 C 17.351 16.284 17.484 12.254 15.374 9.9 C 13.762 8.101 9.65 4.766 11.672 0 L 11.669 0 Z"/>
  </svg>
);

// ─── Nav header (logo block) — qmb-global-nav__header ───────────────────────
function NavHeader({ collapsed, onHome }) {
  return (
    <div className="qmb-global-nav__header">
      <span className="qmb-global-nav__header-corner" aria-hidden="true"/>
      <a className="qmb-global-nav__logo-mark" href="#" aria-label="Inspect Point home"
         onClick={(e) => { e.preventDefault(); onHome && onHome(); }}>
        <FlameMark/>
      </a>
      {!collapsed && (
        <span className="qmb-global-nav__logo-text">Inspect&nbsp;Point</span>
      )}
    </div>
  );
}

// ─── Single nav link — qmb-global-nav__link ─────────────────────────────────
function NavLink({ id, icon, label, current, collapsed, badge, onClick }) {
  const hasNotification = badge != null;
  const cls = [
    'qmb-global-nav__link',
    current && 'qmb-global-nav__link--current',
    hasNotification && 'has-notification',
  ].filter(Boolean).join(' ');
  return (
    <a
      className={cls}
      href="#"
      onClick={(e) => { e.preventDefault(); onClick && onClick(); }}
      aria-current={current ? 'page' : undefined}
      title={collapsed ? label : undefined}>
      <span className="qmb-global-nav__link-icon"><Icon name={icon}/></span>
      <span className="qmb-global-nav__link-label">{label}</span>
      {hasNotification && (
        <span className="qmb-global-nav__link-badge">
          <span className="qmb-global-nav__link-badge-count">{badge}</span>
          <span className="qmb-global-nav__link-indicator" aria-hidden="true"/>
        </span>
      )}
    </a>
  );
}

// ─── Global Nav — qmb-global-nav (faithful to /Global/section) ──────────────
function GlobalNav({ route, go, collapsed, onToggle }) {
  const link = (id, icon, label, opts = {}) => (
    <NavLink key={id} id={id} icon={icon} label={label}
      current={route === id} collapsed={collapsed} badge={opts.badge}
      onClick={() => go(id)}/>
  );
  return (
    <nav className={`qmb-global-nav ${collapsed ? 'qmb-global-nav--collapsed' : ''}`} aria-label="Primary">
      <NavHeader collapsed={collapsed} onHome={() => go('dashboard')}/>

      <div className="qmb-global-nav__group">
        {link('dashboard', 'house-chimney', 'Dashboard')}
      </div>
      <hr className="qmb-global-nav__hr"/>

      <div className="qmb-global-nav__group qmb-global-nav__group--scroll">
        {link('calendar',     'calendar-days',           'Calendar')}
        {link('schedule',     'map-location-dot',        'Schedule & Dispatch')}
        {link('accounts',     'list',                    'Accounts')}
        {link('buildings',    'building',                'Buildings')}
        {link('contacts',     'address-book',            'Contacts')}
        {link('inspections',  'clipboard-check',         'Inspections')}
        {link('deficiencies', 'triangle-exclamation',    'Deficiencies')}
        {link('workorders',   'screwdriver-wrench',      'Work Orders')}
        {link('proposals',    'briefcase',               'Proposals')}
        {link('invoices',     'file-invoice-dollar',     'Invoices')}
        {link('reports',      'file-lines',              'Inspection Reports')}
        {link('analytics',    'chart-line',              'Analytic Reports')}
        {link('time',         'stopwatch',               'Time Entries')}
      </div>

      <hr className="qmb-global-nav__hr"/>

      <div className="qmb-global-nav__footer">
        <div className="qmb-global-nav__group">
          {link('settings', 'gear', 'Settings')}
        </div>
        <div className="qmb-global-nav__toggle-row">
          <button
            type="button"
            className="qmb-global-nav__toggle"
            onClick={onToggle}
            aria-expanded={!collapsed}
            aria-label={collapsed ? 'Expand navigation' : 'Collapse navigation'}>
            <Icon name={collapsed ? 'arrow-right-from-line' : 'arrow-left-from-line'}/>
          </button>
        </div>
      </div>
    </nav>
  );
}

// ─── Global Header (bottom indigo breadcrumb bar) ───────────────────────────
// /Global/section: 64px tall, #3D1B9D, pink corner triangle, Inter 14 white crumbs
// separated by 45° purple slashes (rgb(114,79,212) = purple-400)
function GlobalHeader({ crumbs }) {
  return (
    <div className="qmb-global-header" role="navigation" aria-label="Breadcrumb">
      <span className="qmb-global-header__corner" aria-hidden="true"/>
      <ol className="qmb-global-header__crumbs">
        {crumbs.map((c, i) => {
          const last = i === crumbs.length - 1;
          return (
            <React.Fragment key={i}>
              <li className={`qmb-crumb ${last ? 'qmb-crumb--current' : ''}`}>
                {last
                  ? <span aria-current="page">{c.label}</span>
                  : <a href={c.href || '#'} onClick={c.onClick}>{c.label}</a>}
              </li>
              {!last && <li className="qmb-crumb__sep" aria-hidden="true">/</li>}
            </React.Fragment>
          );
        })}
      </ol>
    </div>
  );
}

// ─── AI launcher (kept; references AITriggerButtonStyles.scss verbatim) ─────
function AITriggerButton({ onClick }) {
  return (
    <button type="button" className="ai-trigger-button" onClick={onClick} aria-label="Open AI Assistant">
      <span className="ai-trigger-button__inner">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M7.30656 3C3.30553 4.96875 7.48719 9.63542 4.70224 12.2872C4.85208 10.3902 4.45683 7.94582 2.70644 6.88813C4.00729 10.8301 0 13.7732 0 17.6287C0 20.0542 1.69942 23.3858 5.16299 23.9245C5.16299 23.9245 4.2614 22.4407 4.41499 21.2538C4.71054 18.9699 6.51123 18.1012 6.02225 14.5338C6.02225 14.5338 7.81382 16.4969 7.8877 19.0641C7.91345 19.9586 7.8383 20.6859 7.72944 21.2538C7.67902 21.5168 8.02302 22.2399 8.61529 21.2538C9.05009 20.5298 9.38864 19.5695 9.2733 18.4032C9.2733 18.4032 11.5912 20.3944 9.4767 24C9.4767 24 15 22.2354 15 16.7039C15 12.9345 11.3937 10.5239 12.2296 6.62344C12.2296 6.62344 10.8623 7.17065 10.9553 8.9268C11.0483 10.6829 11.602 11.8435 10.8631 13.4478C10.2772 7.375 5.63413 7.03901 7.30656 3Z" fill="white"/>
          <path d="M20.5363 0.183023C20.4852 0.0708476 20.373 0 20.251 0C20.129 0 20.0168 0.0708476 19.9656 0.183023L18.9265 2.42653L16.683 3.46366C16.5708 3.51483 16.5 3.627 16.5 3.75098C16.5 3.87497 16.5708 3.98517 16.683 4.03634L18.9285 5.07347L19.9637 7.31698C20.0148 7.42915 20.127 7.5 20.249 7.5C20.371 7.5 20.4832 7.42915 20.5344 7.31698L21.5715 5.0715L23.817 4.03437C23.9292 3.98321 24 3.87103 24 3.74902C24 3.627 23.9292 3.51483 23.817 3.46366L21.5735 2.4285L20.5363 0.183023Z" fill="white"/>
        </svg>
      </span>
    </button>
  );
}

// ─── Workspace header (qmb-header--workspace) ───────────────────────────────
// Per /Headers/section: title (Hanken Grotesk 500 24/32) + light context link,
// actions row, optional fields row (Label: Value pairs), optional split divider
function WorkspaceHeader({ title, context, actions, fields, split = true }) {
  return (
    <header className={`qmb-header qmb-header--workspace ${split ? 'qmb-header--split' : ''}`}>
      <div className="qmb-header__row qmb-header__row--main">
        <div className="qmb-header__title">
          <span className="qmb-header__title-text">{title}</span>
          {context && <span className="qmb-header__context">{context}</span>}
        </div>
        {actions && <div className="qmb-header__actions">{actions}</div>}
      </div>
      {fields && fields.length > 0 && (
        <div className="qmb-header__row qmb-header__row--fields">
          {fields.map((f, i) => (
            <div className="qmb-field" key={i}>
              <span className="qmb-field__label">{f.label}</span>
              <span className="qmb-field__value">{f.value}{f.dropdown && <Icon name="chevron-down" size={11}/>}</span>
            </div>
          ))}
        </div>
      )}
      {split && <hr className="qmb-header__split"/>}
    </header>
  );
}

// ─── Section title (header__row + hr + actions, per /Headers/section) ───────
function SectionTitle({ title, actions }) {
  return (
    <div className="qmb-section-title">
      <span className="qmb-section-title__text">{title}</span>
      <hr className="qmb-section-title__hr"/>
      {actions && <div className="qmb-section-title__actions">{actions}</div>}
    </div>
  );
}

// ─── Shell ──────────────────────────────────────────────────────────────────
function Shell({ user, route, go, children, onAI, crumbs }) {
  const [collapsed, setCollapsed] = React.useState(false);
  return (
    <div className={`qmb-app ${collapsed ? 'qmb-app--nav-collapsed' : ''}`}>
      <GlobalNav route={route} go={go} collapsed={collapsed} onToggle={() => setCollapsed(c => !c)}/>
      <GlobalHeader crumbs={crumbs || [{ label: 'Inspect Point', href: '#' }]}/>
      <main className="qmb-main">{children}</main>
      <AITriggerButton onClick={onAI}/>
    </div>
  );
}

Object.assign(window, { Shell, Icon, WorkspaceHeader, SectionTitle, GlobalHeader, Portal });

// ─── Portal — render into <body> so overlays (brushaways, scrims) sit above the
// app shell's global header/nav instead of being trapped in the .qmb-main cell ──
function Portal({ children }) {
  const elRef = React.useRef(null);
  if (!elRef.current) { elRef.current = document.createElement('div'); elRef.current.className = 'qmb-portal'; }
  React.useEffect(() => {
    const el = elRef.current;
    document.body.appendChild(el);
    return () => { document.body.removeChild(el); };
  }, []);
  return ReactDOM.createPortal(children, elRef.current);
}
