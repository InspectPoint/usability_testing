// Popup.jsx — body-level portal popup, faithful to the Quimby Popup molecule
// (qmb-ui-popup > .k-popup card). Renders into <body> with a high z-index so it
// never gets clipped by the brushaway scroll / accordion stacking contexts, and
// closes on outside-click or Escape. Positioned against an anchor element.

function BodyPopup({ open, anchor, position = 'bottom-left', matchWidth = false, width, onClose, className = '', children }) {
  const [rect, setRect] = React.useState(null);
  const popRef = React.useRef(null);

  React.useLayoutEffect(() => {
    if (!open || !anchor) { setRect(null); return; }
    const update = () => setRect(anchor.getBoundingClientRect());
    update();
    window.addEventListener('scroll', update, true);
    window.addEventListener('resize', update);
    return () => { window.removeEventListener('scroll', update, true); window.removeEventListener('resize', update); };
  }, [open, anchor]);

  React.useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    const onDown = (e) => {
      if (popRef.current && popRef.current.contains(e.target)) return;
      if (anchor && anchor.contains(e.target)) return;
      onClose();
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onDown, true);
    return () => { document.removeEventListener('keydown', onKey); document.removeEventListener('mousedown', onDown, true); };
  }, [open, onClose, anchor]);

  if (!open || !rect) return null;
  const gap = 4;
  const w = matchWidth ? rect.width : (width || 240);
  const style = { position: 'fixed', zIndex: 10005, width: w };
  style.top = Math.min(rect.bottom + gap, window.innerHeight - 12);
  style.left = position.endsWith('right') ? (rect.right - w) : rect.left;
  style.left = Math.max(8, Math.min(style.left, window.innerWidth - w - 8));

  return ReactDOM.createPortal(
    <div ref={popRef} className={`qmb-ui-popup ${matchWidth ? 'qmb-ui-popup--block' : ''} ${className}`} style={style}>
      <div className="k-popup">{children}</div>
    </div>,
    document.body
  );
}

window.BodyPopup = BodyPopup;

// Tooltip — faithful port of atoms/Tooltip: hover/focus, 200ms delay, portal,
// viewport-aware position with an arrow. Wraps a single trigger child.
function Tooltip({ content, children, position = 'top', delay = 200, multiline = false }) {
  const [visible, setVisible] = React.useState(false);
  const [pos, setPos] = React.useState({ top: 0, left: 0, position });
  const [placed, setPlaced] = React.useState(false);
  const containerRef = React.useRef(null);
  const tipRef = React.useRef(null);
  const timer = React.useRef(null);

  React.useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  const calc = () => {
    if (!containerRef.current || !tipRef.current) return;
    const c = containerRef.current.getBoundingClientRect();
    const t = tipRef.current.getBoundingClientRect();
    const vh = window.innerHeight, vw = window.innerWidth;
    const sx = window.pageXOffset || 0, sy = window.pageYOffset || 0;
    let best = position, top = 0, left = 0;
    if (position === 'top')    { top = c.top + sy - t.height - 8; left = c.left + sx + c.width/2 - t.width/2; }
    if (position === 'bottom') { top = c.bottom + sy + 8;         left = c.left + sx + c.width/2 - t.width/2; }
    if (position === 'left')   { top = c.top + sy + c.height/2 - t.height/2; left = c.left + sx - t.width - 8; }
    if (position === 'right')  { top = c.top + sy + c.height/2 - t.height/2; left = c.right + sx + 8; }
    if (top < sy) { best = 'bottom'; top = c.bottom + sy + 8; }
    else if (top + t.height > sy + vh) { best = 'top'; top = c.top + sy - t.height - 8; }
    if (left < sx) left = sx + 8;
    else if (left + t.width > sx + vw) left = sx + vw - t.width - 8;
    setPos({ top, left, position: best });
  };

  const enter = () => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      setVisible(true); setPlaced(false);
      requestAnimationFrame(() => { calc(); setPlaced(true); });
    }, delay);
  };
  const leave = () => { if (timer.current) { clearTimeout(timer.current); timer.current = null; } setVisible(false); setPlaced(false); };
  // Only open on *keyboard* focus — a click leaves the button :focus (but not
  // :focus-visible), which previously re-opened the tooltip and left it stuck on
  // after the click opened a menu/modal or the row scrolled away.
  const focusEnter = (e) => {
    const t = e.target;
    if (t && t.matches && !t.matches(':focus-visible')) return;
    enter();
  };

  // While shown, any scroll or press elsewhere dismisses it — a tooltip whose
  // trigger gets covered (modal), removed (re-render), or scrolled never receives
  // mouseleave, so it would otherwise hang around.
  React.useEffect(() => {
    if (!visible) return;
    const hide = () => leave();
    const sc = document.querySelector('.qmb-main');
    if (sc) sc.addEventListener('scroll', hide, { passive: true });
    window.addEventListener('scroll', hide, { passive: true });
    window.addEventListener('wheel', hide, { passive: true });
    window.addEventListener('pointerdown', hide, true);
    return () => {
      if (sc) sc.removeEventListener('scroll', hide);
      window.removeEventListener('scroll', hide);
      window.removeEventListener('wheel', hide);
      window.removeEventListener('pointerdown', hide, true);
    };
  }, [visible]);

  return (
    <>
      <span ref={containerRef} className="qmb-ui-tooltip__container" onMouseEnter={enter} onMouseLeave={leave} onMouseDown={leave} onFocus={focusEnter} onBlur={leave} tabIndex={0}>
        {children}
      </span>
      {visible && content && ReactDOM.createPortal(
        <div ref={tipRef} className={`qmb-ui-tooltip qmb-ui-tooltip--${pos.position}${multiline ? ' qmb-ui-tooltip--multiline' : ''}`}
          style={{ position: 'absolute', top: pos.top, left: pos.left, zIndex: 10010, opacity: placed ? 1 : 0, transition: 'opacity 0.1s ease-in-out' }}
          role="tooltip" aria-live="polite">
          {content}
        </div>,
        document.body
      )}
    </>
  );
}

window.Tooltip = Tooltip;
