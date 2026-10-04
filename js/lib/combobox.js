import { uniqueId, createElement, announce } from './dom.js';
import { suggestPlaces, findPlaceByQuery, formatPlaceLabel } from './geo.js';

export function attachPlaceCombobox(inputElement, { onSelect, onInput, onClear, limit = 6 }) {
  const wrapper = inputElement.parentElement;
  const listId = uniqueId('combobox-list');

  const listElement = createElement('ul', {
    className: 'combobox__list',
    role: 'listbox',
    id: listId,
    hidden: true,
  });

  wrapper.appendChild(listElement);

  inputElement.setAttribute('role', 'combobox');
  inputElement.setAttribute('aria-autocomplete', 'list');
  inputElement.setAttribute('aria-expanded', 'false');
  inputElement.setAttribute('aria-controls', listId);
  inputElement.setAttribute('aria-haspopup', 'listbox');

  let currentSuggestions = [];
  let activeIndex = -1;
  let isOpen = false;

  function renderSuggestions(suggestions) {
    currentSuggestions = suggestions;
    listElement.textContent = '';

    if (suggestions.length === 0) {
      const emptyItem = createElement('li', {
        className: 'combobox__empty',
        text: 'No match. Try a town, city or postcode area such as LS or M20.',
      });
      listElement.appendChild(emptyItem);
      announce('No match. Try a town, city or postcode area such as LS or M20.');
    } else {
      for (let optionIndex = 0; optionIndex < suggestions.length; optionIndex++) {
        const place = suggestions[optionIndex];
        const optionId = `${listId}-opt-${optionIndex}`;

        const metaText = place.kind === 'local' ? 'local' : place.area;

        const nameSpan = createElement('span', {
          className: 'combobox__name',
          text: place.name,
        });

        const metaSpan = createElement('span', {
          className: 'combobox__meta',
          text: metaText,
        });

        const item = createElement(
          'li',
          {
            className: 'combobox__option',
            role: 'option',
            id: optionId,
          },
          [nameSpan, metaSpan]
        );

        listElement.appendChild(item);
      }
    }

    activeIndex = -1;
    updateActiveDescendant();
  }

  function openList() {
    if (!isOpen) {
      isOpen = true;
      listElement.hidden = false;
      inputElement.setAttribute('aria-expanded', 'true');
    }
  }

  function closeList() {
    if (isOpen) {
      isOpen = false;
      listElement.hidden = true;
      inputElement.setAttribute('aria-expanded', 'false');
      inputElement.removeAttribute('aria-activedescendant');
      activeIndex = -1;
      updateActiveDescendant();
    }
  }

  function updateActiveDescendant() {
    const options = listElement.querySelectorAll('.combobox__option');
    for (let optionIndex = 0; optionIndex < options.length; optionIndex++) {
      if (optionIndex === activeIndex) {
        options[optionIndex].classList.add('is-active');
        options[optionIndex].setAttribute('aria-selected', 'true');
        inputElement.setAttribute('aria-activedescendant', options[optionIndex].id);
        options[optionIndex].scrollIntoView({ block: 'nearest' });
      } else {
        options[optionIndex].classList.remove('is-active');
        options[optionIndex].setAttribute('aria-selected', 'false');
      }
    }
    if (activeIndex === -1) {
      inputElement.removeAttribute('aria-activedescendant');
    }
  }

  function chooseOption(index) {
    if (index >= 0 && index < currentSuggestions.length) {
      const place = currentSuggestions[index];
      inputElement.value = formatPlaceLabel(place);
      closeList();
      onSelect(place);
    }
  }

  function handleInput() {
    const text = inputElement.value;
    if (text === '') {
      onClear();
    }
    const matchedPlace = findPlaceByQuery(text);
    if (onInput) {
      onInput(text, matchedPlace);
    }

    renderSuggestions(suggestPlaces(text, limit));
    openList();
  }

  function handleKeyDown(event) {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      openList();
      if (currentSuggestions.length > 0) {
        activeIndex = (activeIndex + 1) % currentSuggestions.length;
        updateActiveDescendant();
      }
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      openList();
      if (currentSuggestions.length > 0) {
        activeIndex = activeIndex - 1;
        if (activeIndex < 0) {
          activeIndex = currentSuggestions.length - 1;
        }
        updateActiveDescendant();
      }
    } else if (event.key === 'Home') {
      if (isOpen && currentSuggestions.length > 0) {
        event.preventDefault();
        activeIndex = 0;
        updateActiveDescendant();
      }
    } else if (event.key === 'End') {
      if (isOpen && currentSuggestions.length > 0) {
        event.preventDefault();
        activeIndex = currentSuggestions.length - 1;
        updateActiveDescendant();
      }
    } else if (event.key === 'Enter') {
      if (isOpen) {
        event.preventDefault();
        if (activeIndex >= 0) {
          chooseOption(activeIndex);
        }
      }
    } else if (event.key === 'Escape') {
      if (isOpen) {
        event.preventDefault();
        closeList();
      }
    } else if (event.key === 'Tab') {
      if (isOpen) {
        closeList();
      }
    }
  }

  function handleFocus() {
    renderSuggestions(suggestPlaces(inputElement.value, limit));
    openList();
  }

  function handleBlur() {
    setTimeout(() => {
      const text = inputElement.value;
      const matchedPlace = findPlaceByQuery(text);
      if (matchedPlace && document.activeElement !== inputElement) {
        inputElement.value = formatPlaceLabel(matchedPlace);
        if (onSelect) {
          onSelect(matchedPlace);
        }
      }
      closeList();
    }, 150);
  }

  function handlePointerDown(event) {
    const option = event.target.closest('.combobox__option');
    if (option) {
      event.preventDefault();
      const options = Array.from(listElement.querySelectorAll('.combobox__option'));
      const index = options.indexOf(option);
      chooseOption(index);
    }
  }

  inputElement.addEventListener('input', handleInput);
  inputElement.addEventListener('keydown', handleKeyDown);
  inputElement.addEventListener('focus', handleFocus);
  inputElement.addEventListener('blur', handleBlur);
  listElement.addEventListener('mousedown', handlePointerDown);

  return {
    getPlace: () => findPlaceByQuery(inputElement.value),
    setPlace: (place) => {
      inputElement.value = formatPlaceLabel(place);
    },
    clear: () => {
      inputElement.value = '';
      closeList();
    },
    destroy: () => {
      inputElement.removeEventListener('input', handleInput);
      inputElement.removeEventListener('keydown', handleKeyDown);
      inputElement.removeEventListener('focus', handleFocus);
      inputElement.removeEventListener('blur', handleBlur);
      listElement.removeEventListener('mousedown', handlePointerDown);
      if (listElement.parentNode) {
        listElement.parentNode.removeChild(listElement);
      }
    },
  };
}
