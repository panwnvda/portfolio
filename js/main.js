/*
 * Site-wide bootstrap: back-to-top button, hero typed text,
 * portfolio Isotope layout, AOS scroll animations, and a
 * smooth-scroll to URL hash on page load.
 *
 * Originally derived from the iPortfolio template (BootstrapMade).
 *
 * Optimisations vs. the upstream template:
 *   - one window 'load' listener instead of four
 *   - scroll handler throttled via requestAnimationFrame
 *   - scroll listener marked passive (avoids blocking the scroller)
 */
(function () {
  "use strict";

  const $ = (sel) => document.querySelector(sel);

  /* Back-to-top button: show once the user has scrolled past 100 px.
   * rAF-throttle so multiple scroll events per frame coalesce into one
   * class-toggle.                                                     */
  const backtotop = $('.back-to-top');
  if (backtotop) {
    let ticking = false;
    const update = () => {
      backtotop.classList.toggle('active', window.scrollY > 100);
      ticking = false;
    };
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(update);
    };
    document.addEventListener('scroll', onScroll, { passive: true });
    /* initial state set below in the consolidated load handler */
  }

  /* Single window-load handler covers everything that has to wait for
   * external resources (typed.js, Isotope, AOS) and for layout to be
   * stable enough to scroll to a hash.                                 */
  window.addEventListener('load', () => {
    /* Back-to-top initial visibility */
    if (backtotop) backtotop.classList.toggle('active', window.scrollY > 100);

    /* Smooth-scroll to an in-page anchor if the URL arrived with one */
    if (window.location.hash) {
      const target = $(window.location.hash);
      if (target) window.scrollTo({ top: target.offsetTop, behavior: 'smooth' });
    }

    /* Hero "typed" effect (index.html only) */
    const typedEl = $('.typed');
    if (typedEl && typeof Typed !== 'undefined') {
      new Typed('.typed', {
        strings: typedEl.getAttribute('data-typed-items').split(','),
        loop: true, typeSpeed: 100, backSpeed: 50, backDelay: 2000
      });
    }

    /* Portfolio card layout via Isotope (no filter UI) */
    const container = $('.portfolio-container');
    if (container && typeof Isotope !== 'undefined') {
      new Isotope(container, { itemSelector: '.portfolio-item', layoutMode: 'fitRows' });
    }

    /* AOS scroll-reveal animations */
    if (typeof AOS !== 'undefined') {
      AOS.init({ duration: 1000, easing: 'ease-in-out', once: true, mirror: false });
    }
  });
})();
