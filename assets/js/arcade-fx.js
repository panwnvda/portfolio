/* =============================================================
   ARCADE FX
   Cursor, animated background canvas, reveal-on-scroll, glitch hover.
   Respects prefers-reduced-motion and disables on touch devices.
   ============================================================= */
(function () {
  var prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var hasFinePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  /* ---------------- Pixel cursor ---------------- */
  function initCursor() {
    if (!hasFinePointer) return;

    var cursor = document.getElementById('arcade-cursor');
    var dot    = document.getElementById('arcade-cursor-dot');
    if (!cursor || !dot) return;

    var mx = window.innerWidth / 2, my = window.innerHeight / 2;
    var cx = mx, cy = my;

    document.addEventListener('mousemove', function (e) {
      mx = e.clientX;
      my = e.clientY;
      dot.style.transform = 'translate(' + (mx - 2) + 'px,' + (my - 2) + 'px)';
    });

    function tick() {
      cx += (mx - cx) * 0.25;
      cy += (my - cy) * 0.25;
      cursor.style.transform = 'translate(' + (cx - 8) + 'px,' + (cy - 8) + 'px)';
      requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);

    // Grow on hover over interactive elements
    var hoverables = 'a, button, .btn, input, textarea, select, .post-blog-card, .author__urls a, .pagination li a, .code-copy-btn, .search__toggle, .greedy-nav__toggle';
    document.addEventListener('mouseover', function (e) {
      if (e.target.closest && e.target.closest(hoverables)) {
        cursor.classList.add('hover');
      }
    });
    document.addEventListener('mouseout', function (e) {
      if (e.target.closest && e.target.closest(hoverables)) {
        cursor.classList.remove('hover');
      }
    });

    document.addEventListener('mousedown', function () { cursor.classList.add('down'); });
    document.addEventListener('mouseup',   function () { cursor.classList.remove('down'); });
  }

  /* ---------------- Background canvas (grid + particles) ---------------- */
  function initBackground() {
    if (prefersReduced) return;

    var canvas = document.getElementById('arcade-bg-canvas');
    if (!canvas) return;
    var ctx = canvas.getContext('2d');

    /* Particles sit on a fixed lattice (a multiple of the grid pitch) so
       they read as organised, not scattered. Each gently bobs and
       twinkles around its node, so the field still feels alive. */
    var palette = ['#ff2e57', '#ff6b8a', '#3d7dff', '#5b9dff', '#00e0ff'];
    var SPACING = 120;         // lattice pitch = 3 × the 40px grid cell (denser field)
    var particles = [];

    function buildParticles() {
      particles = [];
      var i = 0;
      for (var gx = SPACING; gx < canvas.width; gx += SPACING) {
        for (var gy = SPACING; gy < canvas.height; gy += SPACING) {
          particles.push({
            hx: gx, hy: gy,                        // home node on the lattice
            size: 2 + (i % 3),                     // 2–4 px, cycling
            color: palette[i % palette.length],    // colours cycle in order
            phase: (i % 8) * (Math.PI / 4),        // staggered so they don't pulse in unison
            ampX: 4 + (i % 3) * 2,                 // small float radius
            ampY: 4 + ((i + 1) % 3) * 2
          });
          i++;
        }
      }
    }

    function resize() {
      canvas.width  = window.innerWidth;
      canvas.height = window.innerHeight;
      buildParticles();
    }
    resize();
    window.addEventListener('resize', resize);

    var gridOffset = 0;
    var lastFrame = 0;
    var FRAME_MS = 1000 / 12;  // Low-cost ambient motion.

    function frame(t) {
      if (document.hidden) return;

      if (t - lastFrame < FRAME_MS) {
        requestAnimationFrame(frame);
        return;
      }
      lastFrame = t;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // neon grid — blue verticals, red horizontals
      var gridSize = 40;
      gridOffset = (gridOffset + 0.25) % gridSize;
      ctx.lineWidth = 1;

      ctx.strokeStyle = 'rgba(61, 125, 255, 0.14)';
      ctx.beginPath();
      for (var x = -gridSize + gridOffset; x < canvas.width + gridSize; x += gridSize) {
        ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height);
      }
      ctx.stroke();

      ctx.strokeStyle = 'rgba(255, 42, 74, 0.12)';
      ctx.beginPath();
      for (var y = -gridSize + gridOffset; y < canvas.height + gridSize; y += gridSize) {
        ctx.moveTo(0, y); ctx.lineTo(canvas.width, y);
      }
      ctx.stroke();

      // particles — gently bob + twinkle around their fixed lattice nodes
      var ts = t * 0.001;
      for (var i = 0; i < particles.length; i++) {
        var p = particles[i];
        var ox = Math.cos(ts * 0.5 + p.phase) * p.ampX;
        var oy = Math.sin(ts * 0.6 + p.phase) * p.ampY;
        ctx.globalAlpha = 0.30 + 0.22 * (0.5 + 0.5 * Math.sin(ts * 1.1 + p.phase));
        ctx.fillStyle = p.color;
        ctx.fillRect(Math.round(p.hx + ox), Math.round(p.hy + oy), p.size, p.size);
      }
      ctx.globalAlpha = 1;

      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);

    document.addEventListener('visibilitychange', function () {
      if (!document.hidden) {
        lastFrame = 0;
        requestAnimationFrame(frame);
      }
    });
  }

  /* ---------------- Parrot: fly into the avatar, and carry that "perched"
     state across pages via sessionStorage (per tab/session) ---------------- */
  var PARROT_FLAG = 'wxueParrotPerched';
  function parrotPerched() {
    try { return sessionStorage.getItem(PARROT_FLAG) === '1'; } catch (e) { return false; }
  }
  function setParrotPerched(on) {
    try {
      if (on) sessionStorage.setItem(PARROT_FLAG, '1');
      else sessionStorage.removeItem(PARROT_FLAG);
    } catch (e) {}
  }

  function initParrotMascot() {
    var parrot = document.querySelector('.parrot-mascot');
    if (!parrot) return;

    var idle = parrot.querySelector('.parrot-frame-idle');
    var up = parrot.querySelector('.parrot-frame-up');
    var down = parrot.querySelector('.parrot-frame-down');

    var state = 'home';           /* 'home' | 'flying' | 'in-image' */
    var pending = null;           /* state the current flight is heading into */
    var flapTimer = null;

    function showFrame(frame) {
      if (idle) idle.style.opacity = frame === 'idle' ? '1' : '0';
      if (up) up.style.opacity = frame === 'up' ? '1' : '0';
      if (down) down.style.opacity = frame === 'down' ? '1' : '0';
    }

    function startFlap() {
      var wingsUp = true;
      showFrame('up');
      flapTimer = window.setInterval(function () {
        wingsUp = !wingsUp;
        showFrame(wingsUp ? 'up' : 'down');
      }, 140);
    }

    function stopFlap() {
      if (flapTimer) { clearInterval(flapTimer); flapTimer = null; }
    }

    /* The avatar the parrot flies into, and the two image sources we swap
       between as it "enters" / "exits" the picture. */
    var avatarWrap = document.querySelector('.author__avatar');
    var avatarImg = avatarWrap ? avatarWrap.querySelector('img') : null;
    var AVATAR_PLAIN = avatarImg ? avatarImg.getAttribute('src') : null;
    var AVATAR_PARROT = '/assets/images/site_data/avatar-parrot.jpg';

    /* Translate that lands the parrot's centre on the avatar's shoulder
       (where the composited parrot sits). Measured from the resting
       position with the transform removed, so it's correct from wherever
       the parrot currently is. */
    function avatarTranslate() {
      if (!avatarImg) return null;
      var prev = parrot.style.transform;
      parrot.style.transform = 'none';
      var pr = parrot.getBoundingClientRect();
      parrot.style.transform = prev;

      var ar = avatarImg.getBoundingClientRect();
      var targetX = ar.left + ar.width * 0.31;   /* shoulder x in the composite */
      var targetY = ar.top + ar.height * 0.62;   /* shoulder y in the composite */
      var dx = Math.round(targetX - (pr.left + pr.width / 2));
      var dy = Math.round(targetY - (pr.top + pr.height / 2));
      return 'translate(' + dx + 'px, ' + dy + 'px)';
    }

    /* Facing is decoupled from the flight. The mascot's transform is a
       pure translate (a simple, reliable transition that always fires
       transitionend), and left/right facing is a .face-right class that
       flips the sprite frames. Default sprite faces LEFT. */
    function faceRight(on) {
      parrot.classList.toggle('face-right', on);
    }

    function settle(finalState) {
      stopFlap();
      parrot.classList.remove('is-flying');
      showFrame('idle');
      if (finalState === 'home') faceRight(false);   /* natural facing at rest */
      state = finalState;
    }

    function enterImage() {
      /* Arrived at the avatar: hide the flying sprite and reveal the
         shoulder composite, so the parrot appears to have landed in it. */
      stopFlap();
      parrot.classList.remove('is-flying');
      if (avatarImg && AVATAR_PARROT) avatarImg.src = AVATAR_PARROT;
      setParrotPerched(true);                /* remember it across page loads */
      parrot.style.opacity = '0';
      parrot.style.pointerEvents = 'none';   /* let clicks reach the avatar */
      if (avatarWrap) avatarWrap.style.cursor = 'pointer';
      state = 'in-image';
    }

    function flyToAvatar() {
      var pt = avatarTranslate();
      if (!pt) return;
      faceRight(false);                 /* face left, toward the avatar */
      if (prefersReduced) {
        parrot.style.transform = pt;
        enterImage();
        return;
      }
      pending = 'in-image';
      state = 'flying';
      parrot.classList.add('is-flying');
      startFlap();
      void parrot.offsetWidth;          /* commit start state before transitioning */
      parrot.style.transform = pt;
    }

    function exitImage() {
      /* Click on the picture: restore the plain avatar and send the parrot
         back home from where it landed. */
      setParrotPerched(false);               /* stop carrying it across pages */
      if (avatarImg && AVATAR_PLAIN) avatarImg.src = AVATAR_PLAIN;
      if (avatarWrap) avatarWrap.style.cursor = '';
      var pt = avatarTranslate();       /* reappear on the avatar, then fly out */
      if (pt) parrot.style.transform = pt;
      parrot.style.opacity = '';
      parrot.style.pointerEvents = '';
      flyHome();
    }

    function flyHome() {
      faceRight(true);                  /* turn to face right, toward home */
      if (prefersReduced) {
        parrot.style.transform = 'none';
        settle('home');
        return;
      }
      pending = 'home';
      state = 'flying';
      parrot.classList.add('is-flying');
      startFlap();
      void parrot.offsetWidth;
      parrot.style.transform = 'none';
    }

    parrot.addEventListener('transitionend', function (e) {
      /* Only the mascot's own flight counts — ignore the frames' quick
         facing-flip transition (which also bubbles up as a transform). */
      if (e.target !== parrot || e.propertyName !== 'transform' || state !== 'flying') return;
      if (pending === 'in-image') enterImage();
      else settle(pending || 'home');
    });

    function handleActivate(e) {
      e.preventDefault();
      e.stopPropagation();
      if (state === 'flying') return;
      if (state === 'home') flyToAvatar();
      /* while in the image the sprite is hidden; exit is via the avatar click */
    }

    parrot.addEventListener('click', handleActivate);
    parrot.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') {
        handleActivate(e);
      }
    });

    /* Click the avatar picture to send the parrot back out of it. */
    if (avatarWrap) {
      avatarWrap.addEventListener('click', function (e) {
        if (state !== 'in-image') return;
        e.preventDefault();
        e.stopPropagation();
        exitImage();
      });
    }

    /* Keep the hidden parrot pinned to the avatar if the layout shifts
       while it's "in" the picture, so it reappears in the right spot on
       exit. rAF-throttled to collapse resize bursts into one reflow. */
    var repositionScheduled = false;
    window.addEventListener('resize', function () {
      if (state !== 'in-image' || repositionScheduled) return;
      repositionScheduled = true;
      window.requestAnimationFrame(function () {
        repositionScheduled = false;
        if (state !== 'in-image') return;
        var pt = avatarTranslate();
        if (pt) parrot.style.transform = pt;
      });
    });

    /* Carried in from another page (perched flag set)? Start already in the
       avatar — swap the picture and tuck the bird away, with no fly-in. */
    if (parrotPerched()) enterImage();
  }

  /* On pages WITHOUT the flying bird (Certifications, Notes, …), still honour
     the carried-over "perched" state: show the parrot avatar on load, and let
     a click on the avatar dismiss it. */
  function initParrotCarry() {
    if (document.querySelector('.parrot-mascot')) return;   /* home is handled by the bird */
    var avatarWrap = document.querySelector('.author__avatar');
    var avatarImg = avatarWrap ? avatarWrap.querySelector('img') : null;
    if (!avatarImg) return;
    var AVATAR_PARROT = '/assets/images/site_data/avatar-parrot.jpg';
    var AVATAR_PLAIN = avatarImg.getAttribute('src');
    if (parrotPerched()) {
      avatarImg.src = AVATAR_PARROT;
      avatarWrap.style.cursor = 'pointer';
    }
    avatarWrap.addEventListener('click', function (e) {
      if (!parrotPerched()) return;
      e.preventDefault();
      e.stopPropagation();
      setParrotPerched(false);
      avatarImg.src = AVATAR_PLAIN;
      avatarWrap.style.cursor = '';
    });
  }

  /* ---------------- Reveal on scroll ---------------- */
  function initReveal() {
    if (prefersReduced) return;
    if (!('IntersectionObserver' in window)) return;

    var targets = document.querySelectorAll('.post-blog-card, .archive__item, .toc, .page__content > h2, .page__content > h3, .sidebar');
    if (!targets.length) return;

    targets.forEach(function (el) { el.classList.add('reveal'); });

    /* Only NOW gate reveals via CSS — if JS broke earlier, content stays visible. */
    document.body.classList.add('arcade-fx-ready');

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });

    targets.forEach(function (el) {
      io.observe(el);
      /* Safety: if still hidden after 3s, force reveal */
      setTimeout(function () { el.classList.add('visible'); }, 3000);
    });
  }

  /* ---------------- Glitch hover on titles ---------------- */
  function initGlitch() {
    if (prefersReduced) return;

    var hovers = document.querySelectorAll('.page__title, .archive__subtitle, .author__name, .post-blog-card h2');
    hovers.forEach(function (el) {
      el.addEventListener('mouseenter', function () {
        el.classList.add('arcade-glitch');
        setTimeout(function () { el.classList.remove('arcade-glitch'); }, 380);
      });
    });
  }

  /* ---------------- Hacker scene ---------------- */
  function initHackerScene() {
    if (prefersReduced) return;
    var scene = document.getElementById('hacker-scene');
    if (!scene) return;

    var timers = [];
    function clearTimers() {
      timers.forEach(function (t) { clearTimeout(t); });
      timers = [];
    }

    function setState(s) {
      scene.setAttribute('data-state', s);
    }

    function play() {
      clearTimers();
      setState('idle');

      timers.push(setTimeout(function () { setState('typing');   }, 200));
      timers.push(setTimeout(function () { setState('warning');  }, 2200));
      timers.push(setTimeout(function () { setState('panic');    }, 4000));
      timers.push(setTimeout(function () { setState('cops');     }, 5800));
      timers.push(setTimeout(function () { setState('arrest');   }, 7600));
      timers.push(setTimeout(function () { setState('cuffed');   }, 9800));
      timers.push(setTimeout(function () { setState('walking');  }, 11400));
      timers.push(setTimeout(function () { setState('jailed');   }, 13400));
      /* Loop: hold the jailed pose briefly, then restart */
      timers.push(setTimeout(function () { play(); }, 17000));
    }

    /* Trigger on first scroll into view (or immediately if already visible) */
    var triggered = false;
    function maybeTrigger() {
      if (triggered) return;
      var rect = scene.getBoundingClientRect();
      if (rect.top < window.innerHeight && rect.bottom > 0) {
        triggered = true;
        play();
      }
    }

    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting && !triggered) {
            triggered = true;
            play();
            io.disconnect();
          }
        });
      }, { threshold: 0.2 });
      io.observe(scene);
    } else {
      window.addEventListener('scroll', maybeTrigger, { passive: true });
      maybeTrigger();
    }

    var replay = scene.querySelector('.hs-replay');
    if (replay) {
      replay.addEventListener('click', function () { play(); });
    }
  }

  /* ---------------- Section menu (three bars → sections) ---------------- */
  function initSectionMenu() {
    var nav = document.getElementById('site-nav');
    if (!nav) return;

    var SECTIONS = [
      { label: 'Certifications', href: '/certifications/' },
      { label: 'Disclosures',    href: '/disclosures/' },
      { label: 'Projects',       href: '/projects/' },
      { label: 'Writeups',       href: '/writeups/' }
    ];

    var toggle = document.createElement('button');
    toggle.type = 'button';
    toggle.className = 'section-menu__toggle';
    toggle.setAttribute('aria-label', 'Open sections menu');
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-controls', 'section-menu-panel');
    toggle.innerHTML = '<span class="section-menu__bars" aria-hidden="true">' +
      '<span></span><span></span><span></span></span>';

    var panel = document.createElement('ul');
    panel.id = 'section-menu-panel';
    panel.className = 'section-menu__panel';

    /* Highlight the section matching the current page. */
    var here = decodeURIComponent(location.pathname).toLowerCase().replace(/\/+$/, '') + '/';
    SECTIONS.forEach(function (s) {
      var li = document.createElement('li');
      var a = document.createElement('a');
      a.href = s.href;
      a.textContent = s.label;
      if (here === s.href.toLowerCase()) {
        a.className = 'is-current';
        a.setAttribute('aria-current', 'page');
      }
      li.appendChild(a);
      panel.appendChild(li);
    });

    /* has-section-menu retires the theme's inline nav + its overflow toggle. */
    nav.classList.add('has-section-menu');
    nav.appendChild(toggle);
    nav.appendChild(panel);

    function isOpen() { return nav.classList.contains('section-menu-open'); }
    function setOpen(open) {
      nav.classList.toggle('section-menu-open', open);
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      toggle.setAttribute('aria-label', open ? 'Close sections menu' : 'Open sections menu');
    }

    toggle.addEventListener('click', function (e) {
      e.preventDefault();
      e.stopPropagation();
      setOpen(!isOpen());
    });

    document.addEventListener('click', function (e) {
      if (isOpen() && !toggle.contains(e.target) && !panel.contains(e.target)) {
        setOpen(false);
      }
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && isOpen()) {
        setOpen(false);
        toggle.focus();
      }
    });
  }

  /* ---------------- Boot ---------------- */
  /* Sidebar-bio typewriter — mirrors v2's Typed.js params
     (typeSpeed 100, backSpeed 50, backDelay 2000, loop true).
     Reads roles from data-typed-items="a, b, c" on .typed. */
  function initTypedRoles() {
    var el = document.querySelector('.typed[data-typed-items]');
    if (!el) return;
    var items = el.getAttribute('data-typed-items')
      .split(',').map(function (s) { return s.trim(); }).filter(Boolean);
    if (!items.length) return;

    var caret = document.createElement('span');
    caret.className = 'typed-cursor';
    caret.setAttribute('aria-hidden', 'true');
    caret.textContent = '|';
    el.parentNode.insertBefore(caret, el.nextSibling);

    if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
      el.textContent = items[0];
      return;
    }

    var TYPE = 100, BACK = 50, HOLD = 2000, GAP = 400;
    var i = 0, pos = 0, deleting = false;

    (function tick() {
      var word = items[i];
      if (!deleting) {
        pos++;
        el.textContent = word.slice(0, pos);
        if (pos === word.length) { deleting = true; setTimeout(tick, HOLD); return; }
        setTimeout(tick, TYPE);
      } else {
        pos--;
        el.textContent = word.slice(0, pos);
        if (pos === 0) {
          deleting = false;
          i = (i + 1) % items.length;
          setTimeout(tick, GAP);
          return;
        }
        setTimeout(tick, BACK);
      }
    })();
  }

  function boot() {
    initBackground();
    initReveal();
    initGlitch();
    initHackerScene();
    initParrotMascot();
    initParrotCarry();
    initSectionMenu();
    initTypedRoles();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
