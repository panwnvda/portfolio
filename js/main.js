/*
 * Site-wide bootstrap: back-to-top button, hero typed text,
 * portfolio Isotope layout, AOS scroll animations, and a
 * smooth-scroll to URL hash on page load.
 *
 * Originally derived from the iPortfolio template (BootstrapMade).
 */
(function () {
  "use strict";

  const $ = (sel) => document.querySelector(sel);

  /* Back-to-top button: show once the user has scrolled past 100 px */
  const backtotop = $('.back-to-top');
  if (backtotop) {
    const toggle = () => backtotop.classList.toggle('active', window.scrollY > 100);
    window.addEventListener('load', toggle);
    document.addEventListener('scroll', toggle);
  }

  /* Smooth-scroll to an in-page anchor if the URL arrived with one */
  window.addEventListener('load', () => {
    if (!window.location.hash) return;
    const target = $(window.location.hash);
    if (target) window.scrollTo({ top: target.offsetTop, behavior: 'smooth' });
  });

  /* Hero "typed" effect (index.html only) */
  const typedEl = $('.typed');
  if (typedEl && typeof Typed !== 'undefined') {
    new Typed('.typed', {
      strings: typedEl.getAttribute('data-typed-items').split(','),
      loop: true, typeSpeed: 100, backSpeed: 50, backDelay: 2000
    });
  }

  /* Portfolio card layout via Isotope (no filter UI) */
  window.addEventListener('load', () => {
    const container = $('.portfolio-container');
    if (container && typeof Isotope !== 'undefined') {
      new Isotope(container, { itemSelector: '.portfolio-item' });
    }
  });

  /* AOS scroll-reveal animations */
  window.addEventListener('load', () => {
    if (typeof AOS !== 'undefined') {
      AOS.init({ duration: 1000, easing: 'ease-in-out', once: true, mirror: false });
    }
  });
})();
