import { prefersReducedMotion } from '../lib/dom.js';

export function initHow() {
  const sectionElement = document.querySelector('[data-section="how"]');
  if (!sectionElement) {
    return;
  }
  const stepsContainer = sectionElement.querySelector('.how__steps');
  if (!stepsContainer) {
    return;
  }
  const timelineElement = sectionElement.querySelector('.how__timeline');
  const stepElements = Array.from(stepsContainer.querySelectorAll('.how__step'));
  const nodeButtons = Array.from(stepsContainer.querySelectorAll('.how__node'));
  if (stepElements.length === 0) {
    return;
  }

  const stepThresholds = [0.05, 0.33, 0.66, 0.95];
  const targetProgressValues = [0.15, 0.45, 0.75, 1.0];

  function applyProgress(progressRatio) {
    const formattedProgress = progressRatio.toFixed(4);
    stepsContainer.style.setProperty('--how-progress', formattedProgress);
    if (timelineElement) {
      timelineElement.style.setProperty('--how-progress', formattedProgress);
    }
    let latestReachedIndex = -1;
    stepElements.forEach((stepElement, stepIndex) => {
      const threshold = stepThresholds[stepIndex];
      const isReached = progressRatio >= threshold;
      if (isReached) {
        stepElement.classList.add('is-reached');
        latestReachedIndex = stepIndex;
      } else {
        stepElement.classList.remove('is-reached');
      }
      stepElement.classList.remove('is-current');
    });
    if (latestReachedIndex >= 0) {
      stepElements[latestReachedIndex].classList.add('is-current');
    }
  }

  function jumpToStep(targetIndex) {
    const safeIndex = Math.max(0, Math.min(stepElements.length - 1, targetIndex));
    const targetProgress = targetProgressValues[safeIndex];
    applyProgress(targetProgress);
  }

  nodeButtons.forEach((nodeButton, buttonIndex) => {
    nodeButton.addEventListener('click', () => {
      jumpToStep(buttonIndex);
    });
    nodeButton.addEventListener('keydown', (keyboardEvent) => {
      if (keyboardEvent.key === 'Enter' || keyboardEvent.key === ' ') {
        keyboardEvent.preventDefault();
        jumpToStep(buttonIndex);
      }
    });
  });

  stepElements.forEach((stepElement, elementIndex) => {
    stepElement.addEventListener('click', (clickEvent) => {
      const targetElement = clickEvent.target;
      if (targetElement.closest('a') || targetElement.closest('button')) {
        return;
      }
      jumpToStep(elementIndex);
    });
  });

  if (prefersReducedMotion()) {
    applyProgress(1.0);
    return;
  }

  function updateScrollProgress() {
    const viewportHeight = window.innerHeight;
    const sectionBoundingRect = sectionElement.getBoundingClientRect();
    const startScrollOffset = viewportHeight * 0.75;
    const endScrollOffset = viewportHeight * 0.25;
    const totalScrollDistance = sectionBoundingRect.height + startScrollOffset - endScrollOffset;
    if (totalScrollDistance <= 0) {
      return;
    }
    const currentScrolledDistance = startScrollOffset - sectionBoundingRect.top;
    const computedProgress = currentScrolledDistance / totalScrollDistance;
    const clampedProgress = Math.max(0, Math.min(1, computedProgress));
    applyProgress(clampedProgress);
  }

  let animationFrameIdentifier = null;
  function handleScrollOrResize() {
    if (animationFrameIdentifier !== null) {
      return;
    }
    animationFrameIdentifier = requestAnimationFrame(() => {
      animationFrameIdentifier = null;
      updateScrollProgress();
    });
  }

  window.addEventListener('scroll', handleScrollOrResize, { passive: true });
  window.addEventListener('resize', handleScrollOrResize, { passive: true });

  updateScrollProgress();
}
