import { qs, qsa, createElement, scrollToSection, announce } from '../lib/dom.js';
import { trackEvent } from '../lib/analytics.js';
import { quoteStore } from '../lib/quote-store.js';
import { FLEET } from '../data/fleet.js';
import { WEEKDAYS, TIME_SLOTS, getTimeSlotLabel } from '../data/quote-options.js';
import { attachStepper } from '../lib/stepper.js';

export function initBusiness() {
  const sectionElement = qs('[data-section="business"]');
  if (!sectionElement) {
    return;
  }

  const daysContainer = qs('[data-js="business-days"]', sectionElement);
  const timeSelectElement = qs('[data-js="business-time"]', sectionElement);
  const vehicleSelectElement = qs('[data-js="business-vehicle"]', sectionElement);
  const stepperElement = qs('[data-js="business-stepper"]', sectionElement);
  const stripElement = qs('[data-js="business-preview-strip"]', sectionElement);
  const summaryElement = qs('[data-js="business-summary"]', sectionElement);
  const submitButtonElement = qs('[data-js="business-submit"]', sectionElement);
  const submitTextElement = qs('[data-js="business-submit-text"]', submitButtonElement);

  if (!daysContainer) {
    return;
  }
  if (!timeSelectElement) {
    return;
  }
  if (!vehicleSelectElement) {
    return;
  }
  if (!stepperElement) {
    return;
  }
  if (!stripElement) {
    return;
  }
  if (!summaryElement) {
    return;
  }
  if (!submitButtonElement) {
    return;
  }
  if (!submitTextElement) {
    return;
  }

  for (const slot of TIME_SLOTS) {
    const optionElement = createElement('option', { value: slot.value, text: slot.label });
    timeSelectElement.appendChild(optionElement);
  }
  timeSelectElement.value = '06:30';

  for (const vehicle of FLEET) {
    const optionElement = createElement('option', { value: vehicle.id, text: vehicle.name });
    vehicleSelectElement.appendChild(optionElement);
  }
  vehicleSelectElement.value = 'lwb';

  let selectedDays = ['mon', 'wed', 'fri'];
  let selectedTime = '06:30';
  let selectedVehicleId = 'lwb';

  const stepperInstance = attachStepper(stepperElement, {
    onChange: function () {
      updatePreview();
    }
  });

  function getActiveVehicle() {
    for (const vehicle of FLEET) {
      if (vehicle.id === selectedVehicleId) {
        return vehicle;
      }
    }
    return FLEET[0];
  }

  function getDayName(dayId) {
    for (const day of WEEKDAYS) {
      if (day.id === dayId) {
        return day.label;
      }
    }
    return '';
  }

  function updatePreview() {
    const activeVehicle = getActiveVehicle();
    const currentPallets = stepperInstance.getValue();
    const dayButtons = qsa('.business__day', daysContainer);
    const selectedLabels = [];

    for (const buttonElement of dayButtons) {
      const dayId = buttonElement.dataset.day;
      const isSelected = selectedDays.includes(dayId);
      if (isSelected) {
        buttonElement.setAttribute('aria-pressed', 'true');
        selectedLabels.push(getDayName(dayId));
      } else {
        buttonElement.setAttribute('aria-pressed', 'false');
      }
    }

    const previewColumns = qsa('.business__preview-col', stripElement);
    for (const columnElement of previewColumns) {
      const dayId = columnElement.dataset.previewDay;
      columnElement.textContent = '';
      if (selectedDays.includes(dayId)) {
        columnElement.classList.add('is-active');
        const timeElement = createElement('div', { className: 'business__preview-time', text: selectedTime });
        const vehicleElement = createElement('div', { className: 'business__preview-vehicle', text: activeVehicle.shortName });
        columnElement.appendChild(timeElement);
        columnElement.appendChild(vehicleElement);
      } else {
        columnElement.classList.remove('is-active');
      }
    }

    if (selectedDays.length === 0) {
      summaryElement.textContent = 'Choose at least one day.';
      submitButtonElement.disabled = true;
      submitTextElement.textContent = 'Choose at least one day';
      announce(summaryElement.textContent);
      return;
    }

    submitButtonElement.disabled = false;
    submitTextElement.textContent = 'Request a scheduled run quote';
    const timeLabel = getTimeSlotLabel(selectedTime);
    const runWord = selectedDays.length === 1 ? 'run' : 'runs';
    const dayList = selectedLabels.join(', ');
    const palletWord = currentPallets === 1 ? 'pallet' : 'pallets';
    const summaryText = selectedDays.length + ' ' + runWord + ' a week: ' + dayList + ' at ' + timeLabel + ' with a ' + activeVehicle.shortName + ', up to ' + currentPallets + ' ' + palletWord + ' each.';

    summaryElement.textContent = summaryText;
    announce(summaryText);
  }

  daysContainer.addEventListener('click', function (event) {
    const buttonElement = event.target.closest('.business__day');
    if (!buttonElement) {
      return;
    }
    const dayId = buttonElement.dataset.day;
    if (selectedDays.includes(dayId)) {
      const newDays = [];
      for (const dayItem of selectedDays) {
        if (dayItem !== dayId) {
          newDays.push(dayItem);
        }
      }
      selectedDays = newDays;
    } else {
      selectedDays.push(dayId);
      const sortedDays = [];
      for (const weekday of WEEKDAYS) {
        if (selectedDays.includes(weekday.id)) {
          sortedDays.push(weekday.id);
        }
      }
      selectedDays = sortedDays;
    }
    updatePreview();
  });

  timeSelectElement.addEventListener('change', function () {
    selectedTime = timeSelectElement.value;
    updatePreview();
  });

  vehicleSelectElement.addEventListener('change', function () {
    selectedVehicleId = vehicleSelectElement.value;
    const activeVehicle = getActiveVehicle();
    const currentMax = activeVehicle.pallets;
    
    stepperElement.dataset.max = String(currentMax);
    const inputElement = qs('.stepper__input', stepperElement);
    if (inputElement) {
      inputElement.max = String(currentMax);
    }
    
    if (stepperInstance.getValue() > currentMax) {
      stepperInstance.setValue(currentMax, { silent: true });
    }
    
    updatePreview();
  });

  submitButtonElement.addEventListener('click', function () {
    const currentPallets = stepperInstance.getValue();
    quoteStore.update(
      {
        schedule: { days: selectedDays, time: selectedTime, palletsPerRun: currentPallets },
        serviceId: 'scheduled',
        vehicleId: selectedVehicleId,
        deliveryType: 'flexible',
      },
      'business'
    );
    trackEvent('schedule_built', {
      days: selectedDays.length,
      vehicle: selectedVehicleId,
      pallets: currentPallets
    });
    scrollToSection('quote', { focusSelector: '[data-js="quote-focus-target"]' });
  });

  const initialVehicle = getActiveVehicle();
  stepperElement.dataset.max = String(initialVehicle.pallets);
  const initialInputElement = qs('.stepper__input', stepperElement);
  if (initialInputElement) {
    initialInputElement.max = String(initialVehicle.pallets);
  }

  updatePreview();
}
