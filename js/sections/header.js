import { trapFocus } from '../lib/dom.js';

export function initHeader() {
  const siteHeaderElement = document.querySelector('[data-js="site-header"]');
  const menuToggleButtonElement = document.querySelector('[data-js="menu-toggle"]');
  const mobileMenuElement = document.querySelector('[data-js="mobile-menu"]');
  const scrollProgressElement = document.querySelector('[data-js="scroll-progress"]');
  const stickyCtaElement = document.querySelector('[data-js="sticky-cta"]');
  const desktopNavLinks = document.querySelectorAll('.site-nav__link');

  let isMenuOpen = false;
  let releaseFocusTrap = null;

  function updateMobileMenuPosition() {
    if (!mobileMenuElement || !siteHeaderElement) {
      return;
    }
    const headerBoundingRectangle = siteHeaderElement.getBoundingClientRect();
    const headerBottomPosition = Math.round(headerBoundingRectangle.bottom);
    mobileMenuElement.style.top = `${headerBottomPosition}px`;
    mobileMenuElement.style.height = `calc(100dvh - ${headerBottomPosition}px)`;
  }

  function openMobileMenu() {
    if (isMenuOpen || !mobileMenuElement || !menuToggleButtonElement) {
      return;
    }
    isMenuOpen = true;
    menuToggleButtonElement.setAttribute('aria-expanded', 'true');
    menuToggleButtonElement.setAttribute('aria-label', 'Close menu');
    mobileMenuElement.removeAttribute('hidden');
    document.documentElement.classList.add('has-menu-open');
    document.body.classList.add('has-menu-open');
    updateMobileMenuPosition();
    if (typeof trapFocus === 'function') {
      releaseFocusTrap = trapFocus(mobileMenuElement);
    }
    const firstFocusableElement = mobileMenuElement.querySelector('a[href], button');
    if (firstFocusableElement) {
      firstFocusableElement.focus();
    }
  }

  function closeMobileMenu() {
    if (!isMenuOpen || !mobileMenuElement || !menuToggleButtonElement) {
      return;
    }
    isMenuOpen = false;
    menuToggleButtonElement.setAttribute('aria-expanded', 'false');
    menuToggleButtonElement.setAttribute('aria-label', 'Open menu');
    mobileMenuElement.setAttribute('hidden', '');
    document.documentElement.classList.remove('has-menu-open');
    document.body.classList.remove('has-menu-open');
    mobileMenuElement.style.top = '';
    mobileMenuElement.style.height = '';
    if (typeof releaseFocusTrap === 'function') {
      releaseFocusTrap();
      releaseFocusTrap = null;
    }
    menuToggleButtonElement.focus();
  }

  function toggleMobileMenu() {
    if (isMenuOpen) {
      closeMobileMenu();
    } else {
      openMobileMenu();
    }
  }

  if (menuToggleButtonElement) {
    menuToggleButtonElement.addEventListener('click', (event) => {
      event.stopPropagation();
      toggleMobileMenu();
    });
  }

  if (mobileMenuElement) {
    const mobileMenuLinks = mobileMenuElement.querySelectorAll('a');
    for (const mobileMenuLink of mobileMenuLinks) {
      mobileMenuLink.addEventListener('click', () => {
        closeMobileMenu();
      });
    }

    document.addEventListener('click', (event) => {
      if (!isMenuOpen) {
        return;
      }
      const clickTarget = event.target;
      if (
        !mobileMenuElement.contains(clickTarget) &&
        !menuToggleButtonElement.contains(clickTarget)
      ) {
        closeMobileMenu();
      }
    });

    document.addEventListener('keydown', (event) => {
      if ((event.key === 'Escape' || event.key === 'Esc') && isMenuOpen) {
        closeMobileMenu();
      }
    });
  }

  window.addEventListener('resize', () => {
    if (window.innerWidth >= 1100 && isMenuOpen) {
      closeMobileMenu();
    } else {
      if (isMenuOpen) {
        updateMobileMenuPosition();
      }
    }
  });

  let scrollScheduled = false;

  function updateScrollState() {
    const currentScrollY = window.scrollY || window.pageYOffset || 0;
    const documentScrollHeight = document.documentElement.scrollHeight;
    const viewportInnerHeight = window.innerHeight;
    const maximumScrollY = documentScrollHeight - viewportInnerHeight;

    let scrollProgressRatio = 0;
    if (maximumScrollY > 0) {
      scrollProgressRatio = currentScrollY / maximumScrollY;
    }
    if (scrollProgressRatio < 0) {
      scrollProgressRatio = 0;
    }
    if (scrollProgressRatio > 1) {
      scrollProgressRatio = 1;
    }

    if (siteHeaderElement) {
      if (currentScrollY > 8) {
        siteHeaderElement.classList.add('is-scrolled');
      } else {
        siteHeaderElement.classList.remove('is-scrolled');
      }
      siteHeaderElement.style.setProperty('--scroll-progress', scrollProgressRatio.toString());
    }

    if (scrollProgressElement) {
      scrollProgressElement.style.setProperty('--scroll-progress', scrollProgressRatio.toString());
    }

    if (stickyCtaElement) {
      const heroElement =
        document.getElementById('top') || document.querySelector('[data-section="hero"]');
      const quoteElement =
        document.getElementById('quote') || document.querySelector('[data-section="quote"]');

      let isUserPastHero = false;
      if (heroElement) {
        const heroBoundingRectangle = heroElement.getBoundingClientRect();
        if (heroBoundingRectangle.bottom <= 80) {
          isUserPastHero = true;
        }
      } else {
        if (currentScrollY > 300) {
          isUserPastHero = true;
        }
      }

      let isQuoteSectionInView = false;
      if (quoteElement) {
        const quoteBoundingRectangle = quoteElement.getBoundingClientRect();
        if (quoteBoundingRectangle.top < viewportInnerHeight && quoteBoundingRectangle.bottom > 0) {
          isQuoteSectionInView = true;
        }
      }

      if (isUserPastHero && !isQuoteSectionInView) {
        stickyCtaElement.classList.add('is-visible');
      } else {
        stickyCtaElement.classList.remove('is-visible');
      }
    }
  }

  function handleScroll() {
    if (scrollScheduled) {
      return;
    }
    scrollScheduled = true;
    window.requestAnimationFrame(() => {
      updateScrollState();
      scrollScheduled = false;
    });
  }

  window.addEventListener('scroll', handleScroll, { passive: true });
  updateScrollState();

  const observedSectionIds = [
    'services',
    'fleet',
    'how-it-works',
    'business',
    'coverage',
    'why',
    'reviews',
    'faq',
  ];

  const sectionElementsToObserve = [];
  for (const sectionId of observedSectionIds) {
    const sectionElement =
      document.getElementById(sectionId) || document.querySelector(`[data-section="${sectionId}"]`);
    if (sectionElement) {
      sectionElementsToObserve.push(sectionElement);
    }
  }

  if (sectionElementsToObserve.length > 0 && typeof IntersectionObserver !== 'undefined') {
    const sectionVisibilityMap = new Map();

    function updateActiveNavLink() {
      let highestVisibleHeight = 0;
      let activeSectionId = null;

      for (const [sectionId, entry] of sectionVisibilityMap.entries()) {
        if (entry.isIntersecting && entry.intersectionRect.height > highestVisibleHeight) {
          highestVisibleHeight = entry.intersectionRect.height;
          activeSectionId = sectionId;
        }
      }

      let mappedTargetId = activeSectionId;
      if (activeSectionId === 'why') {
        mappedTargetId = 'reviews';
      }

      for (const desktopNavLink of desktopNavLinks) {
        const navLinkHref = desktopNavLink.getAttribute('href');
        if (mappedTargetId && navLinkHref === `#${mappedTargetId}`) {
          desktopNavLink.classList.add('is-active');
          desktopNavLink.setAttribute('aria-current', 'true');
        } else {
          desktopNavLink.classList.remove('is-active');
          desktopNavLink.removeAttribute('aria-current');
        }
      }
    }

    const scrollSpyObserver = new IntersectionObserver(
      (observerEntries) => {
        for (const observerEntry of observerEntries) {
          sectionVisibilityMap.set(observerEntry.target.id, observerEntry);
        }
        updateActiveNavLink();
      },
      {
        rootMargin: '-15% 0px -40% 0px',
        threshold: [0, 0.1, 0.25, 0.5, 0.75, 1.0],
      }
    );

    for (const sectionElement of sectionElementsToObserve) {
      scrollSpyObserver.observe(sectionElement);
    }
  }
}
