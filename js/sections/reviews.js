import { qs, qsa, announce } from '../lib/dom.js';
import { trackEvent } from '../lib/analytics.js';

export function initReviews() {
  const rootElement = qs('[data-section="reviews"]');
  if (!rootElement) {
    return;
  }

  const carouselElement = qs('[data-js="reviews-carousel"]', rootElement);
  if (!carouselElement) {
    return;
  }

  const slideElements = qsa('[data-js="reviews-slide"]', carouselElement);
  if (slideElements.length === 0) {
    return;
  }

  const previousButton = qs('[data-js="reviews-prev"]', rootElement);
  const nextButton = qs('[data-js="reviews-next"]', rootElement);
  const segmentElements = qsa('[data-js="reviews-segment"]', rootElement);
  const currentCounterElement = qs('[data-js="reviews-current"]', rootElement);

  let activeIndex = 0;
  const totalSlides = slideElements.length;
  let pointerStartX = 0;
  let pointerStartY = 0;
  let isPointerDown = false;

  function updateSlideState(targetIndex, direction) {
    if (targetIndex === activeIndex) {
      return;
    }

    const previousIndex = activeIndex;
    activeIndex = (targetIndex + totalSlides) % totalSlides;

    for (let index = 0; index < slideElements.length; index++) {
      const slide = slideElements[index];
      const isCurrent = index === activeIndex;
      slide.classList.remove('is-active', 'is-prev');

      if (isCurrent) {
        slide.classList.add('is-active');
        slide.setAttribute('aria-hidden', 'false');
      } else {
        if (index === previousIndex && direction === 'next') {
          slide.classList.add('is-prev');
        }
        slide.setAttribute('aria-hidden', 'true');
      }
    }

    for (let index = 0; index < segmentElements.length; index++) {
      const segment = segmentElements[index];
      const isCurrent = index === activeIndex;
      segment.classList.toggle('is-active', isCurrent);
      segment.setAttribute('aria-selected', isCurrent ? 'true' : 'false');
    }

    if (currentCounterElement) {
      currentCounterElement.textContent = String(activeIndex + 1).padStart(2, '0');
    }

    const currentSlide = slideElements[activeIndex];
    const reviewId = currentSlide.getAttribute('data-review-id') || '';
    const reviewerNameElement = qs('.reviews__reviewer-name', currentSlide);
    const reviewerName = reviewerNameElement ? reviewerNameElement.textContent : '';

    carouselElement.setAttribute('aria-label', `Review ${activeIndex + 1} of ${totalSlides}: ${reviewerName}`);
    announce(`Slide ${activeIndex + 1} of ${totalSlides}: ${reviewerName}`);

    trackEvent('review_changed', {
      index: activeIndex,
      reviewId: reviewId,
      reviewer: reviewerName
    });
  }

  function advanceNext() {
    updateSlideState(activeIndex + 1, 'next');
  }

  function retreatPrevious() {
    updateSlideState(activeIndex - 1, 'prev');
  }

  if (previousButton) {
    previousButton.addEventListener('click', () => {
      retreatPrevious();
    });
  }

  if (nextButton) {
    nextButton.addEventListener('click', () => {
      advanceNext();
    });
  }

  for (let index = 0; index < segmentElements.length; index++) {
    const segment = segmentElements[index];
    segment.addEventListener('click', () => {
      const direction = index >= activeIndex ? 'next' : 'prev';
      updateSlideState(index, direction);
    });
  }

  carouselElement.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      retreatPrevious();
    } else if (event.key === 'ArrowRight') {
      event.preventDefault();
      advanceNext();
    } else if (event.key === 'Home') {
      event.preventDefault();
      updateSlideState(0, 'prev');
    } else if (event.key === 'End') {
      event.preventDefault();
      updateSlideState(totalSlides - 1, 'next');
    }
  });

  carouselElement.addEventListener('pointerdown', (event) => {
    if (event.pointerType !== 'touch' && event.pointerType !== 'pen') {
      return;
    }
    isPointerDown = true;
    pointerStartX = event.clientX;
    pointerStartY = event.clientY;
    try {
      carouselElement.setPointerCapture(event.pointerId);
    } catch (captureError) {
      if (!captureError) {
        return;
      }
    }
  });

  carouselElement.addEventListener('pointerup', (event) => {
    if (!isPointerDown) {
      return;
    }
    isPointerDown = false;
    try {
      carouselElement.releasePointerCapture(event.pointerId);
    } catch (releaseError) {
      if (!releaseError) {
        return;
      }
    }
    const deltaX = event.clientX - pointerStartX;
    const deltaY = event.clientY - pointerStartY;

    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) >= 40) {
      if (deltaX < 0) {
        advanceNext();
      } else {
        retreatPrevious();
      }
    }
  });

  carouselElement.addEventListener('pointercancel', () => {
    isPointerDown = false;
  });

  for (let index = 0; index < slideElements.length; index++) {
    const slide = slideElements[index];
    if (index === 0) {
      slide.classList.add('is-active');
      slide.setAttribute('aria-hidden', 'false');
    } else {
      slide.classList.remove('is-active');
      slide.setAttribute('aria-hidden', 'true');
    }
  }

  for (let index = 0; index < segmentElements.length; index++) {
    const segment = segmentElements[index];
    const isCurrent = index === 0;
    segment.classList.toggle('is-active', isCurrent);
    segment.setAttribute('aria-selected', isCurrent ? 'true' : 'false');
  }

  if (currentCounterElement) {
    currentCounterElement.textContent = '01';
  }
}
