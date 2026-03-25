    // ── Nav scroll
    const nav = document.getElementById('nav');
    const hasHero = !!document.querySelector('#hero');
    function updateNav() { nav.classList.toggle('scrolled', !hasHero || scrollY > 60); }
    window.addEventListener('scroll', updateNav, { passive: true });
    updateNav();

    // ── Mobile menu
    const menu = document.getElementById('mobileMenu');
    const toggle = document.getElementById('navToggle');
    const toggleClose = document.getElementById('navToggleClose');
    const closeMenuLinks = document.querySelectorAll('[data-close-menu]');
    const main = document.getElementById('main');
    let lastMenuFocus = null;

    function getMenuFocusable() {
      if (!menu) return [];
      return Array.from(menu.querySelectorAll(
        'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
      )).filter(el => {
        const style = window.getComputedStyle(el);
        return style.display !== 'none' && style.visibility !== 'hidden';
      });
    }

    function openMenu() {
      lastMenuFocus = document.activeElement;
      document.body.classList.add('menu-open');
      menu.setAttribute('aria-hidden', 'false');
      toggle.setAttribute('aria-expanded', 'true');
      toggle.setAttribute('aria-label', 'Close menu');
      document.documentElement.style.overflow = 'hidden';
      main?.setAttribute('aria-hidden', 'true');

      // Move focus into the dialog for keyboard users
      const focusables = getMenuFocusable();
      (focusables[0] || toggleClose || menu)?.focus?.();
    }

    function closeMenu() {
      document.body.classList.remove('menu-open');
      menu.setAttribute('aria-hidden', 'true');
      toggle.setAttribute('aria-expanded', 'false');
      toggle.setAttribute('aria-label', 'Open menu');
      document.documentElement.style.overflow = '';
      main?.removeAttribute('aria-hidden');

      // Restore focus to where the user was
      if (lastMenuFocus && typeof lastMenuFocus.focus === 'function') lastMenuFocus.focus();
      lastMenuFocus = null;
    }

    toggle?.addEventListener('click', () => (document.body.classList.contains('menu-open') ? closeMenu() : openMenu()));
    toggleClose?.addEventListener('click', closeMenu);
    closeMenuLinks.forEach(a => a.addEventListener('click', closeMenu));
    menu?.addEventListener('click', (e) => { if (e.target === menu) closeMenu(); });
    window.addEventListener('keydown', (e) => {
      const isOpen = document.body.classList.contains('menu-open');
      if (!isOpen) return;

      if (e.key === 'Escape') {
        e.preventDefault();
        closeMenu();
        return;
      }

      if (e.key === 'Tab') {
        const focusables = getMenuFocusable();
        if (!focusables.length) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        const active = document.activeElement;

        if (e.shiftKey && active === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && active === last) {
          e.preventDefault();
          first.focus();
        }
      }
    });

    // Mark links that open new tabs for assistive tech
    document.querySelectorAll('a[target="_blank"]').forEach(a => {
      if (a.hasAttribute('aria-label')) return;
      const label = (a.textContent || '').replace(/\s+/g, ' ').trim();
      if (!label) return;
      a.setAttribute('aria-label', `${label} (opens in a new tab)`);
    });

    // ── Parallax (scroll-driven, no heavy libs)
    const prefersReducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
    const crParallaxEl = document.getElementById('crParallax');
    const crParallaxWrap = crParallaxEl?.closest('.cr-parallax-wrap');
    let parallaxTicking = false;

    function updateParallax() {
      parallaxTicking = false;
      if (!crParallaxEl || !crParallaxWrap) return;
      if (prefersReducedMotion) {
        crParallaxEl.style.transform = '';
        return;
      }

      const r = crParallaxWrap.getBoundingClientRect();
      const vh = Math.max(window.innerHeight || 0, 1);
      const progress = Math.min(1, Math.max(0, (vh - r.top) / (vh + r.height)));
      const maxShift = 90; // px – stronger parallax
      const y = (progress - 0.5) * 2 * maxShift; // -maxShift .. +maxShift
      crParallaxEl.style.transform = `translate3d(0, ${y.toFixed(2)}px, 0) scale(1.04)`;
    }

    function onScrollParallax() {
      if (parallaxTicking) return;
      parallaxTicking = true;
      requestAnimationFrame(updateParallax);
    }

    window.addEventListener('scroll', onScrollParallax, { passive: true });
    window.addEventListener('resize', onScrollParallax, { passive: true });
    // Kick once on load so it sets initial position
    updateParallax();

    // ── Scroll reveal, progressive enhancement
    // JS hides elements first, so if JS is blocked content remains visible
    const revealEls = document.querySelectorAll('.reveal');
    revealEls.forEach(el => el.classList.add('js-ready'));

    const revealObs = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add('in');
          revealObs.unobserve(e.target);
        }
      });
    }, { threshold: 0.05, rootMargin: '0px 0px -20px 0px' });
    revealEls.forEach(el => revealObs.observe(el));

    // Fallback: show everything after 2s in case observer never fires
    setTimeout(() => {
      document.querySelectorAll('.reveal.js-ready:not(.in)').forEach(el => el.classList.add('in'));
    }, 2000);

    // ── Animated stat counters
    function easeOutQuart(t) { return 1 - Math.pow(1 - t, 4); }
    function animateCounter(el) {
      if (el.dataset.animated) return;
      el.dataset.animated = '1';
      const target = parseInt(el.dataset.target, 10);
      const duration = 1800;
      const start = performance.now();
      function step(now) {
        const progress = Math.min((now - start) / duration, 1);
        el.textContent = Math.floor(easeOutQuart(progress) * target).toLocaleString('en-US');
        if (progress < 1) requestAnimationFrame(step);
        else el.textContent = target.toLocaleString('en-US');
      }
      requestAnimationFrame(step);
    }

    const counterObs = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          animateCounter(e.target);
          counterObs.unobserve(e.target);
        }
      });
    }, { threshold: 0.1 });
    const counterEls = Array.from(document.querySelectorAll('.counter'));
    // Some environments may not support IntersectionObserver reliably; always ensure counters run.
    if ('IntersectionObserver' in window) {
      counterEls.forEach(el => counterObs.observe(el));
    } else {
      counterEls.forEach(el => animateCounter(el));
    }

    // Fallback: run counters after 1s if observer hasn't fired
    setTimeout(() => {
      counterEls.forEach(el => animateCounter(el));
    }, 1000);

    // Extra safety: run after full load as well (covers odd render timing cases)
    window.addEventListener('load', () => {
      counterEls.forEach(el => animateCounter(el));
    }, { once: true });

    // ── Rotating parallax slideshow ───────────────
    const slideData = [
      { title: 'Almost Golden',       sub: 'William J. Dale III · 2026 · Album'   },
      { title: 'AIn\'t Love Grand',   sub: 'William J. Dale III · 2026 · Album'   },
      { title: 'AIn\'t Christmas Grand', sub: 'William J. Dale III · 2025 · Album' },
      { title: 'Steady Hands',        sub: 'William J. Dale III · 2026 · Single'  },
      { title: 'Here\'s To You',      sub: 'William J. Dale III · 2025 · Single'  },
    ];

    const parallaxWrap = document.getElementById('crParallaxWrap');
    if (parallaxWrap) {
      const slides = Array.from(parallaxWrap.querySelectorAll('.cr-slide'));
      const dots   = Array.from(parallaxWrap.querySelectorAll('.cr-dot'));
      const titleEl  = document.getElementById('crSlideTitle');
      const subEl    = document.getElementById('crSlideSub');
      let current = 0;
      let rotateTimer = null;

      function goToSlide(idx) {
        slides[current].classList.remove('cr-slide--active');
        dots[current].classList.remove('cr-dot--active');
        current = idx;
        slides[current].classList.add('cr-slide--active');
        dots[current].classList.add('cr-dot--active');
        if (titleEl) titleEl.textContent = slideData[current].title;
        if (subEl)   subEl.textContent   = slideData[current].sub;
      }

      function startRotation() {
        rotateTimer = setInterval(() => {
          goToSlide((current + 1) % slides.length);
        }, 5000);
      }

      function stopRotation() {
        clearInterval(rotateTimer);
        rotateTimer = null;
      }

      dots.forEach((dot, i) => {
        dot.addEventListener('click', () => {
          stopRotation();
          goToSlide(i);
          startRotation();
        });
      });

      parallaxWrap.addEventListener('mouseenter', stopRotation);
      parallaxWrap.addEventListener('mouseleave', startRotation);

      startRotation();
    }
