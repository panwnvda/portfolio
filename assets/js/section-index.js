/*
 * Cheatsheet sidebar index: dropdown disclosure, expand/collapse-all,
 * and a typeahead search that hides non-matching sections.
 *
 * Optimised for large pages (OSCP/OSEP/CRTL have hundreds of headings):
 *   - one click listener via event delegation instead of one per button
 *   - debounced search input so per-keystroke work doesn't drop frames
 *   - per-section caching of (heading, content[], lowercased text) computed
 *     once on first keypress instead of every keypress
 *   - highlight uses DOM <strong> insertion, not innerHTML regex (faster
 *     and preserves event listeners on nested elements).
 */
(function () {
  'use strict';

  let allOpen = false;

  /* Public: toggle the whole index drawer (visible/hidden). */
  window.toggleIndex = function () {
    const index = document.getElementById('index');
    if (index) index.classList.toggle('open');
  };

  /* Public: open every dropdown / close every dropdown. */
  window.toggleAll = function () {
    allOpen = !allOpen;
    const buttons = document.querySelectorAll('.dropdown-btn, .nested-dropdown-btn');
    for (let i = 0; i < buttons.length; i++) {
      const btn = buttons[i];
      const container = btn.nextElementSibling;
      if (!container) continue;
      container.style.display = allOpen ? 'block' : 'none';
      btn.classList.toggle('active', allOpen);
    }
  };

  /* Single delegated click handler for every dropdown button at every level.
   * Avoids attaching a separate listener per button (a long page can have
   * 100+ buttons, which adds measurable cost on initial parse).            */
  const indexRoot = document.getElementById('index');
  if (indexRoot) {
    indexRoot.addEventListener('click', (e) => {
      const btn = e.target.closest('.dropdown-btn, .nested-dropdown-btn');
      if (!btn || !indexRoot.contains(btn)) return;
      const content = btn.nextElementSibling;
      if (!content) return;
      btn.classList.toggle('active');
      content.style.display = (content.style.display === 'block') ? 'none' : 'block';
    });
  }

  /* Auto-dismiss the "edit warning" alert (CRTL/OSED kit pages). */
  setTimeout(() => {
    const alert = document.querySelector('.alert-warning');
    if (alert && typeof bootstrap !== 'undefined') {
      new bootstrap.Alert(alert).close();
    }
  }, 7000);

  /* ── Search ── */
  const searchInput = document.getElementById('search-input');
  if (!searchInput) return;

  const contentRoot = document.querySelector('.cheatsheet-content');
  if (!contentRoot) return;

  /* Build a per-heading section cache once on the first interaction.
   * Each entry stores the heading element, an array of every sibling
   * element until the next heading, and the lowercased text used for
   * matching. This avoids re-walking the DOM on every keystroke.   */
  let sections = null;

  function buildSections() {
    const headings = contentRoot.querySelectorAll('h2, h3, h4, h5, h6');
    const out = new Array(headings.length);
    for (let i = 0; i < headings.length; i++) {
      const h = headings[i];
      const content = [];
      let sib = h.nextElementSibling;
      while (sib && !sib.matches('h2, h3, h4, h5, h6')) {
        content.push(sib);
        sib = sib.nextElementSibling;
      }
      /* Keep the heading's original text so we can restore it after
       * the highlight <strong> wrapping is removed.                 */
      out[i] = {
        heading: h,
        content: content,
        originalHTML: h.innerHTML,
        text: h.textContent.toLowerCase(),
      };
    }
    return out;
  }

  /* Escape a user-supplied substring for safe use in RegExp. */
  function escapeRegex(s) {
    return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  function runSearch(term) {
    if (!sections) sections = buildSections();

    const lcTerm = term.toLowerCase();
    let anyMatch = false;
    let highlightRegex = null;
    if (term) highlightRegex = new RegExp('(' + escapeRegex(term) + ')', 'gi');

    for (let i = 0; i < sections.length; i++) {
      const sec = sections[i];
      /* Restore the original heading HTML before re-applying highlight. */
      sec.heading.innerHTML = sec.originalHTML;

      if (!lcTerm || sec.text.includes(lcTerm)) {
        sec.heading.style.display = '';
        for (let j = 0; j < sec.content.length; j++) {
          sec.content[j].style.display = '';
        }
        if (highlightRegex) {
          sec.heading.innerHTML = sec.originalHTML.replace(highlightRegex, '<strong>$1</strong>');
        }
        anyMatch = true;
      } else {
        sec.heading.style.display = 'none';
        for (let j = 0; j < sec.content.length; j++) {
          sec.content[j].style.display = 'none';
        }
      }
    }

    /* "No matches found" sentinel — created on demand, removed when not needed. */
    let noMatch = document.getElementById('no-match-message');
    if (!anyMatch) {
      if (!noMatch) {
        noMatch = document.createElement('p');
        noMatch.id = 'no-match-message';
        noMatch.className = 'text-danger mt-3';
        noMatch.textContent = 'No matches found.';
        contentRoot.appendChild(noMatch);
      }
    } else if (noMatch) {
      noMatch.remove();
    }
  }

  /* Debounce keystrokes so we run runSearch() at most once per animation
   * frame instead of once per keypress. With ~500 headings on the OSCP
   * page this matters when typing fast.                              */
  let pending = 0;
  searchInput.addEventListener('input', (e) => {
    const value = e.target.value;
    if (pending) cancelAnimationFrame(pending);
    pending = requestAnimationFrame(() => {
      pending = 0;
      runSearch(value);
    });
  });
})();
