export function qs(selector, rootElement = document) {
  return rootElement.querySelector(selector);
}

export function qsa(selector, rootElement = document) {
  return Array.from(rootElement.querySelectorAll(selector));
}

export function createElement(tagName, attributes = {}, children = []) {
  const element = document.createElement(tagName);
  for (const key of Object.keys(attributes)) {
    const value = attributes[key];
    if (key === 'className') {
      element.className = value;
    } else if (key === 'text') {
      element.textContent = value;
    } else if (key === 'dataset') {
      for (const dataKey of Object.keys(value)) {
        element.dataset[dataKey] = value[dataKey];
      }
    } else if (key === 'aria') {
      for (const ariaKey of Object.keys(value)) {
        element.setAttribute(`aria-${ariaKey}`, value[ariaKey]);
      }
    } else if (value === true) {
      element.setAttribute(key, '');
    } else if (value !== false && value !== null) {
      element.setAttribute(key, value);
    }
  }
  for (const child of children) {
    if (typeof child === 'string') {
      element.appendChild(document.createTextNode(child));
    } else {
      element.appendChild(child);
    }
  }
  return element;
}

export function createSvgElement(tagName, attributes = {}, children = []) {
  const element = document.createElementNS('http://www.w3.org/2000/svg', tagName);
  for (const key of Object.keys(attributes)) {
    const value = attributes[key];
    if (key === 'className') {
      element.setAttribute('class', value);
    } else if (key === 'text') {
      element.textContent = value;
    } else if (key === 'dataset') {
      for (const dataKey of Object.keys(value)) {
        element.setAttribute(`data-${dataKey}`, value[dataKey]);
      }
    } else if (key === 'aria') {
      for (const ariaKey of Object.keys(value)) {
        element.setAttribute(`aria-${ariaKey}`, value[ariaKey]);
      }
    } else if (value === true) {
      element.setAttribute(key, '');
    } else if (value !== false && value !== null) {
      element.setAttribute(key, value);
    }
  }
  for (const child of children) {
    if (typeof child === 'string') {
      element.appendChild(document.createTextNode(child));
    } else {
      element.appendChild(child);
    }
  }
  return element;
}

export function prefersReducedMotion() {
  if (typeof window !== 'undefined' && window.matchMedia) {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }
  return false;
}

export function debounce(callback, waitMilliseconds) {
  let timeoutId;
  return function (...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      callback.apply(this, args);
    }, waitMilliseconds);
  };
}

export function clamp(value, minimum, maximum) {
  return Math.min(Math.max(value, minimum), maximum);
}

export function formatNumber(value) {
  return new Intl.NumberFormat('en-GB').format(value);
}

export function animateNumber(element, { from, to, durationMilliseconds, suffix = '' }) {
  if (prefersReducedMotion()) {
    element.textContent = formatNumber(to) + suffix;
    return;
  }
  const startTime = performance.now();
  function update(currentTime) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / durationMilliseconds, 1);
    const easeOutQuart = 1 - Math.pow(1 - progress, 4);
    const currentNumber = from + (to - from) * easeOutQuart;
    element.textContent = formatNumber(Math.round(currentNumber)) + suffix;
    if (progress < 1) {
      requestAnimationFrame(update);
    }
  }
  requestAnimationFrame(update);
}

export function onVisible(
  element,
  callback,
  { threshold = 0.2, rootMargin = '0px', once = true } = {}
) {
  if (typeof IntersectionObserver !== 'undefined') {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            callback(entry.target);
            if (once) {
              observer.disconnect();
            }
          }
        }
      },
      { threshold, rootMargin }
    );
    observer.observe(element);
    return function () {
      observer.disconnect();
    };
  } else {
    callback(element);
    return function () {};
  }
}

export function scrollToSection(sectionId, { focusSelector, behavior = 'smooth' } = {}) {
  const section = document.getElementById(sectionId);
  if (!section) {
    return;
  }
  const scrollBehavior = prefersReducedMotion() ? 'auto' : behavior;
  section.scrollIntoView({ behavior: scrollBehavior });
  if (history.replaceState) {
    history.replaceState(null, '', `#${sectionId}`);
  }
  if (focusSelector) {
    const target = section.querySelector(focusSelector);
    if (target) {
      target.focus({ preventScroll: true });
    }
  }
}

export function trapFocus(containerElement) {
  const focusableSelectors =
    'a[href], button, input, textarea, select, details, [tabindex]:not([tabindex="-1"])';
  const previousFocus = document.activeElement;
  function handleKeyDown(event) {
    if (event.key !== 'Tab') {
      return;
    }
    const focusableElements = Array.from(
      containerElement.querySelectorAll(focusableSelectors)
    ).filter((element) => {
      return !element.hasAttribute('disabled') && !element.getAttribute('aria-hidden');
    });
    if (focusableElements.length === 0) {
      event.preventDefault();
      return;
    }
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];
    if (event.shiftKey) {
      if (document.activeElement === firstElement) {
        lastElement.focus();
        event.preventDefault();
      }
    } else {
      if (document.activeElement === lastElement) {
        firstElement.focus();
        event.preventDefault();
      }
    }
  }
  containerElement.addEventListener('keydown', handleKeyDown);
  return function () {
    containerElement.removeEventListener('keydown', handleKeyDown);
    if (previousFocus) {
      previousFocus.focus();
    }
  };
}

export function announce(message) {
  const liveRegion = document.getElementById('live-region');
  if (!liveRegion) {
    return;
  }
  liveRegion.textContent = '';
  requestAnimationFrame(() => {
    liveRegion.textContent = message;
  });
}

let idCounter = 0;
export function uniqueId(prefix) {
  idCounter += 1;
  return `${prefix}-${idCounter}`;
}
