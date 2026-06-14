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
  const arrow = event.currentTarget.querySelector('.arrow');
  submenu.classList.toggle('open');
  if (arrow) {
    arrow.style.transform = submenu.classList.contains('open')
      ? 'rotate(90deg)'      // open: chevron points down
      : 'rotate(0deg)';      // closed: chevron points right
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

/* ── Global handlers: click-outside closes popups; Esc closes drawer ─ */
document.addEventListener('click', (e) => {
  [['topbar-email-popup', '.topbar-email'],
   ['sidebar-email-popup', '.sidebar-email']
  ].forEach(([popupId, triggerSel]) => {
    const popup = document.getElementById(popupId);
    if (!popup || !popup.classList.contains('is-open')) return;
    const trigger = document.querySelector(triggerSel);
    if (popup.contains(e.target) || (trigger && trigger.contains(e.target))) return;
    popup.classList.remove('is-open');
    if (trigger) trigger.setAttribute('aria-expanded', 'false');
  });
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && document.body.classList.contains('is-menu-open')) closeMenu();
});
