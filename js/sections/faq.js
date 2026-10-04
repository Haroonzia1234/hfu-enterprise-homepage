import { prefersReducedMotion } from '../lib/dom.js';
import { trackEvent } from '../lib/analytics.js';

export function initFaq() {
  const faqSection = document.querySelector('[data-section="faq"]');
  if (!faqSection) {
    return;
  }

  const faqItems = Array.from(faqSection.querySelectorAll('.faq__item'));
  if (faqItems.length === 0) {
    return;
  }

  function closeItem(detailsElement) {
    if (!detailsElement.open || detailsElement.classList.contains('is-closing')) {
      return;
    }

    const answerElement = detailsElement.querySelector('.faq__answer');
    if (!answerElement || prefersReducedMotion()) {
      detailsElement.open = false;
      detailsElement.classList.remove('is-closing');
      return;
    }

    detailsElement.classList.add('is-closing');
    answerElement.style.gridTemplateRows = '1fr';
    void answerElement.offsetHeight;
    answerElement.style.gridTemplateRows = '0fr';

    let isFinished = false;
    function finishClosing() {
      if (isFinished) {
        return;
      }
      isFinished = true;
      answerElement.removeEventListener('transitionend', handleTransitionEnd);
      clearTimeout(safetyTimerId);
      detailsElement.open = false;
      detailsElement.classList.remove('is-closing');
      answerElement.style.gridTemplateRows = '';
    }

    function handleTransitionEnd(event) {
      if (event.target === answerElement && event.propertyName === 'grid-template-rows') {
        finishClosing();
      }
    }

    answerElement.addEventListener('transitionend', handleTransitionEnd);
    const safetyTimerId = setTimeout(finishClosing, 400);
  }

  function openItem(detailsElement) {
    if (detailsElement.open && !detailsElement.classList.contains('is-closing')) {
      return;
    }

    detailsElement.classList.remove('is-closing');
    const answerElement = detailsElement.querySelector('.faq__answer');
    if (!answerElement || prefersReducedMotion()) {
      detailsElement.open = true;
      return;
    }

    answerElement.style.gridTemplateRows = '0fr';
    detailsElement.open = true;
    void answerElement.offsetHeight;
    answerElement.style.gridTemplateRows = '1fr';

    let isFinished = false;
    function finishOpening() {
      if (isFinished) {
        return;
      }
      isFinished = true;
      answerElement.removeEventListener('transitionend', handleTransitionEnd);
      clearTimeout(safetyTimerId);
      answerElement.style.gridTemplateRows = '';
    }

    function handleTransitionEnd(event) {
      if (event.target === answerElement && event.propertyName === 'grid-template-rows') {
        finishOpening();
      }
    }

    answerElement.addEventListener('transitionend', handleTransitionEnd);
    const safetyTimerId = setTimeout(finishOpening, 400);
  }

  for (const faqItem of faqItems) {
    const summaryElement = faqItem.querySelector('.faq__question');
    if (!summaryElement) {
      continue;
    }

    summaryElement.addEventListener('click', (event) => {
      event.preventDefault();
      const isCurrentlyOpen = faqItem.open && !faqItem.classList.contains('is-closing');

      if (isCurrentlyOpen) {
        closeItem(faqItem);
      } else {
        for (const otherItem of faqItems) {
          if (otherItem !== faqItem && otherItem.open) {
            closeItem(otherItem);
          }
        }
        openItem(faqItem);
        const questionId = faqItem.dataset.faqId;
        if (questionId) {
          trackEvent('faq_opened', { id: questionId });
        }
      }
    });
  }

  function openItemByHash() {
    if (typeof window === 'undefined' || !window.location.hash) {
      return;
    }

    const hashIdentifier = window.location.hash.replace(/^#/, '');
    if (!hashIdentifier) {
      return;
    }

    let targetFaqItem = faqSection.querySelector(`details#${hashIdentifier}`);
    if (!targetFaqItem && hashIdentifier.startsWith('faq-')) {
      const extractedId = hashIdentifier.slice(4);
      targetFaqItem = faqSection.querySelector(`details[data-faq-id="${extractedId}"]`);
    }

    if (!targetFaqItem) {
      return;
    }

    for (const otherItem of faqItems) {
      if (otherItem !== targetFaqItem && otherItem.open) {
        closeItem(otherItem);
      }
    }

    if (!targetFaqItem.open) {
      openItem(targetFaqItem);
      const questionId = targetFaqItem.dataset.faqId;
      if (questionId) {
        trackEvent('faq_opened', { id: questionId });
      }
    }

    targetFaqItem.scrollIntoView({
      behavior: prefersReducedMotion() ? 'auto' : 'smooth',
    });
  }

  openItemByHash();

  window.addEventListener('hashchange', () => {
    openItemByHash();
  });
}
