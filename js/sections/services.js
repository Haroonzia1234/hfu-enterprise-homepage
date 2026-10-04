import { trackEvent } from '../lib/analytics.js';
import { quoteStore } from '../lib/quote-store.js';
import { SERVICES } from '../data/services.js';

export function initServices() {
  const sectionElement = document.querySelector('[data-section="services"]');
  if (!sectionElement) {
    return;
  }

  const tabListElement = sectionElement.querySelector('[role="tablist"]');
  if (!tabListElement) {
    return;
  }

  const tabElements = Array.from(tabListElement.querySelectorAll('[role="tab"]'));
  const panelElements = Array.from(sectionElement.querySelectorAll('[role="tabpanel"]'));

  if (tabElements.length === 0 || panelElements.length === 0) {
    return;
  }

  let currentServiceId = 'same-day';

  function activateTab(targetServiceId, activateOptions = {}) {
    const shouldFocusTab = activateOptions.shouldFocusTab === true;
    const shouldScrollIntoView = activateOptions.shouldScrollIntoView === true;
    const shouldTrackEvent = activateOptions.shouldTrackEvent !== false;
    const shouldUpdateStore = activateOptions.shouldUpdateStore !== false;

    const matchedTabElement = tabElements.find((element) => {
      return element.getAttribute('data-service-id') === targetServiceId;
    });

    const matchedPanelElement = panelElements.find((element) => {
      return element.id === 'services-panel-' + targetServiceId;
    });

    if (!matchedTabElement || !matchedPanelElement) {
      return;
    }

    currentServiceId = targetServiceId;

    for (const tabElement of tabElements) {
      const isSelectedTab = tabElement === matchedTabElement;
      tabElement.setAttribute('aria-selected', isSelectedTab ? 'true' : 'false');
      tabElement.setAttribute('tabindex', isSelectedTab ? '0' : '-1');
      if (isSelectedTab) {
        tabElement.classList.add('is-active');
      } else {
        tabElement.classList.remove('is-active');
      }
    }

    for (const panelElement of panelElements) {
      const isSelectedPanel = panelElement === matchedPanelElement;
      if (isSelectedPanel) {
        panelElement.removeAttribute('hidden');
        panelElement.classList.add('is-active');
      } else {
        panelElement.setAttribute('hidden', '');
        panelElement.classList.remove('is-active');
      }
    }

    if (shouldFocusTab) {
      matchedTabElement.focus();
    }

    if (shouldScrollIntoView) {
      matchedTabElement.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'nearest',
      });
    }

    if (shouldTrackEvent && typeof trackEvent === 'function') {
      trackEvent('service_selected', { service_id: targetServiceId });
    }

    if (shouldUpdateStore && quoteStore && typeof quoteStore.update === 'function') {
      quoteStore.update({ serviceId: targetServiceId }, 'services');
    }
  }

  for (const tabElement of tabElements) {
    tabElement.addEventListener('click', () => {
      const targetServiceId = tabElement.getAttribute('data-service-id');
      if (targetServiceId) {
        activateTab(targetServiceId, {
          shouldFocusTab: true,
          shouldScrollIntoView: true,
          shouldTrackEvent: true,
          shouldUpdateStore: true,
        });
      }
    });

    tabElement.addEventListener('keydown', (keyboardEvent) => {
      const pressedKey = keyboardEvent.key;
      let targetIndex = -1;
      const currentIndex = tabElements.indexOf(tabElement);

      if (pressedKey === 'ArrowDown' || pressedKey === 'ArrowRight') {
        keyboardEvent.preventDefault();
        targetIndex = (currentIndex + 1) % tabElements.length;
      } else if (pressedKey === 'ArrowUp' || pressedKey === 'ArrowLeft') {
        keyboardEvent.preventDefault();
        targetIndex = (currentIndex - 1 + tabElements.length) % tabElements.length;
      } else if (pressedKey === 'Home') {
        keyboardEvent.preventDefault();
        targetIndex = 0;
      } else if (pressedKey === 'End') {
        keyboardEvent.preventDefault();
        targetIndex = tabElements.length - 1;
      }

      if (targetIndex !== -1) {
        const nextTabElement = tabElements[targetIndex];
        const nextServiceId = nextTabElement.getAttribute('data-service-id');
        if (nextServiceId) {
          activateTab(nextServiceId, {
            shouldFocusTab: true,
            shouldScrollIntoView: true,
            shouldTrackEvent: true,
            shouldUpdateStore: true,
          });
        }
      }
    });
  }

  function resolveServiceIdFromHash() {
    const hashString = window.location.hash;
    const hashPrefix = '#services-';
    if (hashString && hashString.startsWith(hashPrefix)) {
      const candidateServiceId = hashString.slice(hashPrefix.length);
      const isValidService = SERVICES.some((service) => {
        return service.id === candidateServiceId;
      });
      if (isValidService) {
        return candidateServiceId;
      }
    }
    return null;
  }

  window.addEventListener('hashchange', () => {
    const hashServiceId = resolveServiceIdFromHash();
    if (hashServiceId && hashServiceId !== currentServiceId) {
      activateTab(hashServiceId, {
        shouldFocusTab: false,
        shouldScrollIntoView: true,
        shouldTrackEvent: true,
        shouldUpdateStore: true,
      });
    }
  });

  if (quoteStore && typeof quoteStore.subscribe === 'function') {
    quoteStore.subscribe((storeState, changedKeys, updateSource) => {
      if (updateSource === 'services') {
        return;
      }
      if (!storeState || !storeState.serviceId) {
        return;
      }
      if (storeState.serviceId === currentServiceId) {
        return;
      }
      const isValidService = SERVICES.some((service) => {
        return service.id === storeState.serviceId;
      });
      if (isValidService) {
        activateTab(storeState.serviceId, {
          shouldFocusTab: false,
          shouldScrollIntoView: false,
          shouldTrackEvent: false,
          shouldUpdateStore: false,
        });
      }
    });
  }

  const initialHashServiceId = resolveServiceIdFromHash();
  if (initialHashServiceId) {
    activateTab(initialHashServiceId, {
      shouldFocusTab: false,
      shouldScrollIntoView: false,
      shouldTrackEvent: false,
      shouldUpdateStore: true,
    });
  } else if (quoteStore && typeof quoteStore.getState === 'function') {
    const existingStoreState = quoteStore.getState();
    if (existingStoreState && existingStoreState.serviceId) {
      const isValidService = SERVICES.some((service) => {
        return service.id === existingStoreState.serviceId;
      });
      if (isValidService) {
        activateTab(existingStoreState.serviceId, {
          shouldFocusTab: false,
          shouldScrollIntoView: false,
          shouldTrackEvent: false,
          shouldUpdateStore: false,
        });
      }
    }
  }
}
