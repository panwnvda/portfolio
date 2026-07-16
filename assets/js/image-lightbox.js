/*
 * Tiny image lightbox for long-form notes pages.
 * One shared overlay, one delegated click listener — no per-image handlers.
 * Click any .page__content img → opens; click overlay or press Esc → closes.
 */
(function () {
  'use strict';

  var overlay = null;
  var overlayImg = null;

  function ensureOverlay() {
    if (overlay) return;
    overlay = document.createElement('div');
    overlay.className = 'img-lightbox';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-label', 'Enlarged image (click or press Esc to close)');
    overlayImg = document.createElement('img');
    overlay.appendChild(overlayImg);
    overlay.addEventListener('click', close);
    document.body.appendChild(overlay);
  }

  function open(src, alt) {
    ensureOverlay();
    overlayImg.src = src;
    overlayImg.alt = alt || '';
    overlay.classList.add('is-open');
    document.body.classList.add('lightbox-lock');
  }

  function close() {
    if (!overlay) return;
    overlay.classList.remove('is-open');
    document.body.classList.remove('lightbox-lock');
  }

  document.addEventListener('click', function (e) {
    var img = e.target && e.target.closest && e.target.closest('.page__content img, .cheatsheet-content img');
    if (!img) return;
    e.preventDefault();
    open(img.currentSrc || img.src, img.alt);
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') close();
  });
})();
