/*
 * Site-wide UI behavior shared by every page:
 *   - sidebar drawer open/close (hamburger + backdrop + Esc)
 *   - submenu disclosure for the Projects / Cheatsheets nav dropdowns
 *   - top-bar Gmail popup (click-to-show, click-outside to close, copy)
 *   - sidebar-drawer Gmail popup (same UX, anchored inside the drawer)
 */

/* ── Submenu open/close (Projects, Cheatsheets) ───────────────────── */
function toggleSubmenu(event) {
  event.preventDefault();
  const submenu = event.currentTarget.nextElementSibling;
  if (!submenu) return;
  const arrow = event.currentTarget.querySelector('.arrow');
  const isOpen = submenu.classList.toggle('open');
  if (arrow) {
    arrow.style.transform = isOpen ? 'rotate(90deg)' : 'rotate(0deg)';
  }
}

/* ── Drawer (sidebar) open/close ──────────────────────────────────── */
function toggleMenu() {
  const open = document.body.classList.toggle('is-menu-open');
  const trigger = document.querySelector('.menu-trigger');
  if (trigger) trigger.setAttribute('aria-expanded', open ? 'true' : 'false');
}
function closeMenu() {
  document.body.classList.remove('is-menu-open');
  const trigger = document.querySelector('.menu-trigger');
  if (trigger) trigger.setAttribute('aria-expanded', 'false');
}

/* ── Generic email popup helpers (used by both topbar + sidebar) ──── */
function _toggleEmailPopup(popupId, btn) {
  const popup = document.getElementById(popupId);
  if (!popup) return;
  const opened = popup.classList.toggle('is-open');
  btn.setAttribute('aria-expanded', opened ? 'true' : 'false');
}
function _copyEmail(btn) {
  const icon = btn.querySelector('i');
  navigator.clipboard.writeText('xuewencheng156@gmail.com').then(() => {
    icon.className = 'bi bi-check2';
    btn.classList.add('is-copied');
    setTimeout(() => {
      icon.className = 'bi bi-clipboard';
      btn.classList.remove('is-copied');
    }, 1200);
  });
}

/* Topbar Gmail popup */
function toggleTopbarEmail(e) { e.stopPropagation(); _toggleEmailPopup('topbar-email-popup', e.currentTarget); }
function copyTopbarEmail(e)   { e.stopPropagation(); _copyEmail(e.currentTarget); }

/* Sidebar (drawer) Gmail popup */
function toggleSidebarEmail(e) { e.stopPropagation(); _toggleEmailPopup('sidebar-email-popup', e.currentTarget); }
function copySidebarEmail(e)   { e.stopPropagation(); _copyEmail(e.currentTarget); }

/* ── Global handlers: click-outside closes popups; Esc closes drawer ─
 * Popup descriptors are hoisted to module scope so we don't rebuild the
 * array on every click event.                                          */
const _emailPopups = [
  ['topbar-email-popup',  '.topbar-email'],
  ['sidebar-email-popup', '.sidebar-email'],
];

document.addEventListener('click', (e) => {
  for (let i = 0; i < _emailPopups.length; i++) {
    const popupId = _emailPopups[i][0];
    const triggerSel = _emailPopups[i][1];
    const popup = document.getElementById(popupId);
    if (!popup || !popup.classList.contains('is-open')) continue;
    const trigger = document.querySelector(triggerSel);
    if (popup.contains(e.target) || (trigger && trigger.contains(e.target))) continue;
    popup.classList.remove('is-open');
    if (trigger) trigger.setAttribute('aria-expanded', 'false');
  }
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && document.body.classList.contains('is-menu-open')) closeMenu();
});

/* ── About section floating particles ─────────────────────────────── */
(function () {
  const canvas = document.getElementById('about-particles');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const section = canvas.closest('section');
  let particles = [];
  let raf;

  function resize() {
    canvas.width  = section.offsetWidth;
    canvas.height = section.offsetHeight;
  }

  const COLORS = [
    [255, 255, 255],   // white
    [255, 255, 255],   // white (weighted heavier)
    [255, 110, 110],   // soft red
    [224,  36,  36],   // brand red
  ];

  function makeParticle(randomY) {
    const c = COLORS[Math.floor(Math.random() * COLORS.length)];
    return {
      x:       Math.random() * canvas.width,
      y:       randomY ? Math.random() * canvas.height : canvas.height + Math.random() * 40,
      r:       Math.random() * 2.2 + 0.6,
      speed:   Math.random() * 0.45 + 0.20,
      drift:   (Math.random() - 0.5) * 0.35,
      opacity: Math.random() * 0.35 + 0.10,
      color:   c,
    };
  }

  function init() {
    resize();
    particles = Array.from({ length: 80 }, () => makeParticle(true));
  }

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      p.y    -= p.speed;
      p.x    += p.drift;
      if (p.y + p.r < 0) particles[i] = makeParticle(false);

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${p.color[0]},${p.color[1]},${p.color[2]},${p.opacity})`;
      ctx.fill();
    }
    raf = requestAnimationFrame(draw);
  }

  const ro = new ResizeObserver(() => { resize(); });
  ro.observe(section);

  init();
  draw();
})();
