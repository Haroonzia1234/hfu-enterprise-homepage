import { attachPlaceCombobox } from '../lib/combobox.js';
import { getHubPlace, estimateRoadMiles, formatPlaceLabel, findPlaceByQuery } from '../lib/geo.js';
import { createElement, announce, scrollToSection } from '../lib/dom.js';
import { quoteStore } from '../lib/quote-store.js';
import { trackEvent } from '../lib/analytics.js';

export function initCoverage() {
  const section = document.querySelector('[data-section="coverage"]');
  if (!section) {
    return;
  }

  const tabs = Array.from(section.querySelectorAll('[data-js="coverage-tab"]'));
  const panels = Array.from(section.querySelectorAll('.coverage__panel'));
  const segmentedInputs = Array.from(section.querySelectorAll('.segmented__input'));

  function activateZone(zoneId) {
    for (const tab of tabs) {
      if (tab.dataset.zone === zoneId) {
        tab.classList.add('is-active');
        tab.setAttribute('aria-selected', 'true');
      } else {
        tab.classList.remove('is-active');
        tab.setAttribute('aria-selected', 'false');
      }
    }
    
    for (const panel of panels) {
      if (panel.id === `panel-${zoneId}`) {
        panel.hidden = false;
        panel.classList.add('is-active');
      } else {
        panel.hidden = true;
        panel.classList.remove('is-active');
      }
    }

    for (const input of segmentedInputs) {
      if (input.value === zoneId) {
        input.checked = true;
      }
    }
  }

  for (const tab of tabs) {
    tab.addEventListener('click', () => {
      activateZone(tab.dataset.zone);
    });
  }

  for (const input of segmentedInputs) {
    input.addEventListener('change', () => {
      if (input.checked) {
        activateZone(input.value);
      }
    });
  }

  const inputEl = section.querySelector('[data-js="checker-input"]');
  const resultEl = section.querySelector('[data-js="checker-result"]');
  
  if (inputEl && resultEl) {
    attachPlaceCombobox(inputEl, {
      onSelect: (place) => {
        showMatch(place);
      },
      onInput: (text, matchedPlace) => {
        if (!text) {
          resultEl.textContent = '';
        } else if (matchedPlace) {
          showMatch(matchedPlace);
        }
      },
      onClear: () => {
        resultEl.textContent = '';
      }
    });
    
    inputEl.addEventListener('blur', () => {
      const text = inputEl.value.trim();
      if (!text) {
        return;
      }
      const place = findPlaceByQuery(text);
      if (place) {
        showMatch(place);
      } else {
        showNoMatch(text);
      }
    });

    inputEl.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') {
        const text = inputEl.value.trim();
        const place = findPlaceByQuery(text);
        if (place) {
          showMatch(place);
        } else {
          showNoMatch(text);
        }
      }
    });
  }

  function showMatch(place) {
    resultEl.textContent = '';
    const hub = getHubPlace();
    const miles = estimateRoadMiles(hub, place);
    
    const textElement = createElement('p', {
      className: 'coverage__result-text',
      text: `Yes, we cover ${place.name} (${place.area}). About ${miles} road miles from our Manchester hub.`
    });
    
    const buttonElement = createElement('button', {
      type: 'button',
      className: 'btn btn--primary coverage__btn',
      text: `Get a quote to ${place.area}`
    });
    
    buttonElement.addEventListener('click', () => {
      quoteStore.update({ to: place, toText: formatPlaceLabel(place) }, 'coverage');
      scrollToSection('quote');
    });
    
    resultEl.appendChild(textElement);
    resultEl.appendChild(buttonElement);
    
    announce(`Yes, we cover ${place.name}.`);
    trackEvent('coverage_checked', { result: 'match', place_id: place.id });
  }

  function showNoMatch(text) {
    resultEl.textContent = '';
    
    const lowerText = text.toLowerCase();
    const internationalKeywords = ['ireland', 'france', 'spain', 'germany', 'italy', 'poland', 'netherlands', 'belgium', 'europe', 'usa', 'america', 'paris', 'dublin', 'berlin', 'madrid', 'rome', 'international', 'global'];
    
    let isInternational = false;
    for (const keyword of internationalKeywords) {
      if (lowerText.includes(keyword)) {
        isInternational = true;
        break;
      }
    }
    
    if (isInternational) {
      const textElement = createElement('p', {
        className: 'coverage__result-text',
        text: 'It looks like you are searching outside the UK. For overseas shipping, please use our International service.'
      });
      
      const buttonElement = createElement('button', {
        type: 'button',
        className: 'btn btn--secondary coverage__btn',
        text: 'View International Service'
      });
      
      buttonElement.addEventListener('click', () => {
        activateZone('intl');
      });
      
      resultEl.appendChild(textElement);
      resultEl.appendChild(buttonElement);
      announce('Location looks international. Suggested international service.');
      trackEvent('coverage_checked', { result: 'international', query: text });
    } else {
      const textElement = createElement('p', {
        className: 'coverage__result-text',
        text: 'We could not place that. Try the first part of your postcode, for example M20 or LS1, or call 0161 509 6152.'
      });
      
      resultEl.appendChild(textElement);
      announce('We could not place that. Try the first part of your postcode, or call us.');
      trackEvent('coverage_checked', { result: 'no_match', query: text });
    }
  }
}
