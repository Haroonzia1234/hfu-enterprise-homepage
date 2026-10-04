import { quoteStore } from './lib/quote-store.js';
import { scrollToSection, onVisible, qsa } from './lib/dom.js';
import { trackEvent } from './lib/analytics.js';

import { initHeader } from './sections/header.js';
import { initHero } from './sections/hero.js';
import { initStats } from './sections/stats.js';
import { initServices } from './sections/services.js';
import { initFleet } from './sections/fleet.js';
import { initHow } from './sections/how.js';
import { initBusiness } from './sections/business.js';
import { initCoverage } from './sections/coverage.js';
import { initReviews } from './sections/reviews.js';
import { initQuote } from './sections/quote.js';
import { initFaq } from './sections/faq.js';

function bootstrap() {
  const revealElements = qsa('[data-reveal]');
  for (const element of revealElements) {
    onVisible(element, (target) => {
      const delayMultiplier = target.getAttribute('data-reveal-delay');
      if (delayMultiplier) {
        const delayMs = parseInt(delayMultiplier, 10) * 80;
        target.style.transitionDelay = `${delayMs}ms`;
      }
      target.classList.add('is-revealed');
    }, { threshold: 0.15, once: true });
  }

  document.addEventListener('click', (event) => {
    const ctaElement = event.target.closest('[data-quote-cta]');
    if (ctaElement) {
      const patch = {};
      if (ctaElement.hasAttribute('data-quote-service')) {
        patch.serviceId = ctaElement.getAttribute('data-quote-service');
      }
      if (ctaElement.hasAttribute('data-quote-vehicle')) {
        patch.vehicleId = ctaElement.getAttribute('data-quote-vehicle');
      }
      if (ctaElement.hasAttribute('data-quote-delivery')) {
        patch.deliveryType = ctaElement.getAttribute('data-quote-delivery');
      }
      
      quoteStore.update(patch, 'cta');
      
      const cta_id = ctaElement.getAttribute('data-cta-id');
      trackEvent('cta_click', { cta_id });
      
      event.preventDefault();
      scrollToSection('quote', { focusSelector: '[data-js="quote-focus-target"]' });
      return;
    }
    
    const linkElement = event.target.closest('a[href]');
    if (linkElement) {
      const href = linkElement.getAttribute('href');
      if (href && href.startsWith('tel:')) {
        trackEvent('phone_click', { href });
      } else if (href && href.startsWith('mailto:')) {
        trackEvent('email_click', { href });
      }
    }
  });

  const sections = [
    { name: 'header', init: initHeader },
    { name: 'hero', init: initHero },
    { name: 'stats', init: initStats },
    { name: 'services', init: initServices },
    { name: 'fleet', init: initFleet },
    { name: 'how', init: initHow },
    { name: 'business', init: initBusiness },
    { name: 'coverage', init: initCoverage },
    { name: 'reviews', init: initReviews },
    { name: 'quote', init: initQuote },
    { name: 'faq', init: initFaq }
  ];

  for (const section of sections) {
    try {
      section.init();
    } catch (error) {
      console.error('HFU section failed', section.name, error);
    }
  }

  document.documentElement.classList.add('is-ready');
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootstrap);
} else {
  bootstrap();
}
