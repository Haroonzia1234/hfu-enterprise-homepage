import { animateNumber, onVisible, prefersReducedMotion, qs, qsa } from '../lib/dom.js';

export function initStats() {
  const sectionElement = qs('[data-section="stats"]');
  if (!sectionElement) {
    return;
  }

  if (prefersReducedMotion()) {
    return;
  }

  const statElements = qsa('[data-count-to]', sectionElement);
  if (statElements.length === 0) {
    return;
  }

  onVisible(
    sectionElement,
    () => {
      for (const statElement of statElements) {
        const targetValue = Number(statElement.dataset.countTo);
        if (Number.isNaN(targetValue)) {
          continue;
        }

        const numberElement = qs('.stats__number', statElement);
        const targetElement = numberElement || statElement;

        animateNumber(targetElement, {
          from: 0,
          to: targetValue,
          durationMilliseconds: 1500,
          suffix: numberElement ? '' : statElement.dataset.countSuffix || '',
        });
      }
    },
    { threshold: 0.2, once: true }
  );
}
