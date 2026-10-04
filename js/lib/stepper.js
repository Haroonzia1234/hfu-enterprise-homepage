export function attachStepper(rootElement, { onChange }) {
  const min = parseInt(rootElement.getAttribute('data-min') || '0', 10);
  const max = parseInt(rootElement.getAttribute('data-max') || '100', 10);
  const step = parseInt(rootElement.getAttribute('data-step') || '1', 10);

  const decreaseBtn = rootElement.querySelector('[data-stepper="decrease"]');
  const increaseBtn = rootElement.querySelector('[data-stepper="increase"]');
  const input = rootElement.querySelector('.stepper__input');

  function clampAndRound(val) {
    if (isNaN(val)) {
      return min;
    }
    const rounded = Math.round(val / step) * step;
    if (rounded < min) {
      return min;
    }
    if (rounded > max) {
      return max;
    }
    return rounded;
  }

  let lastEmittedValue = clampAndRound(
    parseInt(rootElement.getAttribute('data-value') || input.value || String(min), 10)
  );

  function updateDOM(val) {
    input.value = val;
    rootElement.setAttribute('data-value', val);

    if (val <= min) {
      decreaseBtn.setAttribute('disabled', 'true');
    } else {
      decreaseBtn.removeAttribute('disabled');
    }

    if (val >= max) {
      increaseBtn.setAttribute('disabled', 'true');
    } else {
      increaseBtn.removeAttribute('disabled');
    }
  }

  function handleDecrease() {
    const current = parseFloat(input.value);
    const next = clampAndRound(current - step);
    if (next !== lastEmittedValue) {
      updateDOM(next);
      lastEmittedValue = next;
      if (onChange) {
        onChange(next);
      }
    }
  }

  function handleIncrease() {
    const current = parseFloat(input.value);
    const next = clampAndRound(current + step);
    if (next !== lastEmittedValue) {
      updateDOM(next);
      lastEmittedValue = next;
      if (onChange) {
        onChange(next);
      }
    }
  }

  function handleCommit() {
    const val = parseFloat(input.value);
    const next = clampAndRound(val);
    updateDOM(next);
    if (next !== lastEmittedValue) {
      lastEmittedValue = next;
      if (onChange) {
        onChange(next);
      }
    }
  }

  function handleKeyDown(event) {
    if (event.key === 'ArrowUp') {
      event.preventDefault();
      handleIncrease();
    } else if (event.key === 'ArrowDown') {
      event.preventDefault();
      handleDecrease();
    }
  }

  decreaseBtn.addEventListener('click', handleDecrease);
  increaseBtn.addEventListener('click', handleIncrease);

  input.addEventListener('change', handleCommit);
  input.addEventListener('blur', handleCommit);
  input.addEventListener('keydown', handleKeyDown);

  updateDOM(lastEmittedValue);

  return {
    getValue: () => parseFloat(input.value),
    setValue: (val, options = {}) => {
      const next = clampAndRound(val);
      updateDOM(next);
      if (!options.silent) {
        if (next !== lastEmittedValue) {
          lastEmittedValue = next;
          if (onChange) {
            onChange(next);
          }
        }
      } else {
        lastEmittedValue = next;
      }
    },
    destroy: () => {
      decreaseBtn.removeEventListener('click', handleDecrease);
      increaseBtn.removeEventListener('click', handleIncrease);
      input.removeEventListener('change', handleCommit);
      input.removeEventListener('blur', handleCommit);
      input.removeEventListener('keydown', handleKeyDown);
    },
  };
}
