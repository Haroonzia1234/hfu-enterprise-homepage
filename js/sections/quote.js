import { qs, qsa, announce } from '../lib/dom.js';
import { trackEvent } from '../lib/analytics.js';
import { quoteStore } from '../lib/quote-store.js';
import { describeRoute } from '../lib/geo.js';
import { attachPlaceCombobox } from '../lib/combobox.js';
import { attachStepper } from '../lib/stepper.js';
import { COMPANY } from '../data/company.js';
import { FLEET, formatMetres } from '../data/fleet.js';
import { SERVICES } from '../data/services.js';
import { CONFIG } from '../data/config.js';
import { TIME_SLOTS, getTimeSlotLabel } from '../data/quote-options.js';

export function initQuote() {
  const section = qs('[data-section="quote"]');
  if (!section) {
    return;
  }

  const form = qs('[data-js="quote-form"]', section);
  const successPanel = qs('[data-js="quote-success"]', section);
  const dateInput = qs('#quote-date', section);
  const timeSelect = qs('#quote-time', section);
  const serviceSelect = qs('#quote-service', section);
  const vehicleSelect = qs('#quote-vehicle', section);
  
  const today = new Date().toISOString().split('T')[0];
  dateInput.min = today;

  for (const slot of TIME_SLOTS) {
    const option = document.createElement('option');
    option.value = slot.value;
    option.textContent = slot.label;
    timeSelect.appendChild(option);
  }

  const noServiceOption = document.createElement('option');
  noServiceOption.value = '';
  noServiceOption.textContent = 'Not sure yet';
  serviceSelect.appendChild(noServiceOption);
  for (const service of SERVICES) {
    const option = document.createElement('option');
    option.value = service.id;
    option.textContent = service.name;
    serviceSelect.appendChild(option);
  }

  const noVehicleOption = document.createElement('option');
  noVehicleOption.value = '';
  noVehicleOption.textContent = 'Not sure, advise me';
  vehicleSelect.appendChild(noVehicleOption);
  for (const vehicle of FLEET) {
    const option = document.createElement('option');
    option.value = vehicle.id;
    const lengthMetres = formatMetres(vehicle.lengthCm);
    const widthMetres = formatMetres(vehicle.widthCm);
    const heightMetres = formatMetres(vehicle.heightCm);
    option.textContent = `${vehicle.name} (${lengthMetres} x ${widthMetres} x ${heightMetres} m, up to ${vehicle.payloadKg} kg)`;
    vehicleSelect.appendChild(option);
  }

  const fromCombobox = attachPlaceCombobox(qs('[data-js="quote-from-combobox"]', section), {
    onSelect: (place) => {
      const text = place ? place.name : qs('#quote-from', section).value;
      quoteStore.update({ from: place, fromText: text }, 'quote');
    },
    onInput: (text, place) => {
      quoteStore.update({ fromText: text, from: place }, 'quote');
    },
    onClear: () => {
      quoteStore.update({ from: null, fromText: '' }, 'quote');
    }
  });

  const toCombobox = attachPlaceCombobox(qs('[data-js="quote-to-combobox"]', section), {
    onSelect: (place) => {
      const text = place ? place.name : qs('#quote-to', section).value;
      quoteStore.update({ to: place, toText: text }, 'quote');
    },
    onInput: (text, place) => {
      quoteStore.update({ toText: text, to: place }, 'quote');
    },
    onClear: () => {
      quoteStore.update({ to: null, toText: '' }, 'quote');
    }
  });

  const palletStepper = attachStepper(qs('[data-js="quote-pallets"]', section), {
    onChange: (value) => {
      quoteStore.update({ pallets: value }, 'quote');
    }
  });

  form.addEventListener('input', (event) => {
    markStarted();
    const target = event.target;
    if (target.name === 'quote-delivery-type') {
      quoteStore.update({ deliveryType: target.value }, 'quote');
    } else if (target.id === 'quote-date') {
      quoteStore.update({ collectionDate: target.value }, 'quote');
    } else if (target.id === 'quote-time') {
      quoteStore.update({ collectionTime: target.value }, 'quote');
    } else if (target.id === 'quote-service') {
      quoteStore.update({ serviceId: target.value }, 'quote');
    } else if (target.id === 'quote-vehicle') {
      quoteStore.update({ vehicleId: target.value }, 'quote');
    } else if (target.id === 'quote-notes') {
      quoteStore.update({ notes: target.value }, 'quote');
    }
  });

  let hasStarted = false;
  function markStarted() {
    if (!hasStarted) {
      trackEvent('quote_started');
      hasStarted = true;
    }
  }

  quoteStore.subscribe((state, changedKeys, source) => {
    if (source !== 'quote') {
      if (changedKeys.includes('deliveryType')) {
        const radio = qs(`input[name="quote-delivery-type"][value="${state.deliveryType}"]`, form);
        if (radio) {
          radio.checked = true;
        }
      }
      if (changedKeys.includes('collectionDate')) {
        dateInput.value = state.collectionDate || '';
      }
      if (changedKeys.includes('collectionTime')) {
        timeSelect.value = state.collectionTime || '';
      }
      if (changedKeys.includes('serviceId')) {
        serviceSelect.value = state.serviceId || '';
      }
      if (changedKeys.includes('vehicleId')) {
        vehicleSelect.value = state.vehicleId || '';
      }
      if (changedKeys.includes('pallets')) {
        palletStepper.setValue(state.pallets, { silent: true });
      }
      if (changedKeys.includes('notes')) {
        qs('#quote-notes', form).value = state.notes || '';
      }
      if (changedKeys.includes('from') || changedKeys.includes('fromText')) {
        if (state.from) {
          fromCombobox.setPlace(state.from);
        } else {
          qs('#quote-from', form).value = state.fromText || '';
        }
      }
      if (changedKeys.includes('to') || changedKeys.includes('toText')) {
        if (state.to) {
          toCombobox.setPlace(state.to);
        } else {
          qs('#quote-to', form).value = state.toText || '';
        }
      }
    }
    updateSummary(state);
  });

  function updateSummary(state) {
    const routeNode = qs('[data-js="summary-route"]', section);
    const deliveryNode = qs('[data-js="summary-delivery"]', section);
    const dateNode = qs('[data-js="summary-datetime"]', section);
    const vehicleNode = qs('[data-js="summary-vehicle"]', section);
    const serviceNode = qs('[data-js="summary-service"]', section);
    const scheduleNode = qs('[data-js="summary-schedule"]', section);
    const scheduleRow = qs('[data-js="summary-schedule-row"]', section);
    
    const successRouteNode = qs('[data-js="success-route"]', section);
    const successDeliveryNode = qs('[data-js="success-delivery"]', section);
    const successDateNode = qs('[data-js="success-datetime"]', section);
    const successVehicleNode = qs('[data-js="success-vehicle"]', section);
    const successServiceNode = qs('[data-js="success-service"]', section);
    const successScheduleNode = qs('[data-js="success-schedule"]', section);
    const successScheduleRow = qs('[data-js="success-schedule-row"]', section);

    if (state.from && state.to) {
      const routeInfo = describeRoute(state.from, state.to);
      const text = `${state.from.name} to ${state.to.name} (${routeInfo.milesLabel}, ${routeInfo.durationLabel})`;
      routeNode.textContent = text;
      successRouteNode.textContent = text;
    } else if (state.fromText || state.toText) {
      const fromText = state.fromText || '?';
      const toText = state.toText || '?';
      const text = `${fromText} to ${toText}`;
      routeNode.textContent = text;
      successRouteNode.textContent = text;
    } else {
      routeNode.textContent = '-';
      successRouteNode.textContent = '-';
    }

    const deliveryText = state.deliveryType === 'same-day' ? 'Same Day' : state.deliveryType === 'next-day' ? 'Next Day' : 'Flexible';
    deliveryNode.textContent = deliveryText;
    successDeliveryNode.textContent = deliveryText;

    const timeLabel = state.collectionTime ? getTimeSlotLabel(state.collectionTime) : '';
    const dateText = state.collectionDate ? state.collectionDate + (timeLabel ? ` at ${timeLabel}` : '') : '-';
    dateNode.textContent = dateText;
    successDateNode.textContent = dateText;

    let vehicleText = '-';
    if (state.vehicleId) {
      const vehicleRecord = FLEET.find((item) => item.id === state.vehicleId);
      if (vehicleRecord) {
        vehicleText = vehicleRecord.name;
      }
    }
    if (state.pallets > 0) {
      if (vehicleText === '-') {
        vehicleText = `${state.pallets} pallets`;
      } else {
        vehicleText = `${vehicleText}, ${state.pallets} pallets`;
      }
    }
    vehicleNode.textContent = vehicleText;
    successVehicleNode.textContent = vehicleText;

    let serviceText = '-';
    if (state.serviceId) {
      const serviceRecord = SERVICES.find((item) => item.id === state.serviceId);
      if (serviceRecord) {
        serviceText = serviceRecord.name;
      }
    }
    serviceNode.textContent = serviceText;
    successServiceNode.textContent = serviceText;

    if (state.schedule) {
      const scheduleText = `${state.schedule.days.join(', ')} at ${state.schedule.time} (${state.schedule.palletsPerRun} pallets)`;
      scheduleNode.textContent = scheduleText;
      successScheduleNode.textContent = scheduleText;
      scheduleRow.classList.remove('is-hidden');
      if (successScheduleRow) {
        successScheduleRow.classList.remove('is-hidden');
      }
    } else {
      scheduleNode.textContent = '-';
      successScheduleNode.textContent = '-';
      scheduleRow.classList.add('is-hidden');
      if (successScheduleRow) {
        successScheduleRow.classList.add('is-hidden');
      }
    }
  }

  updateSummary(quoteStore.getState());

  function validateField(id, value) {
    if (id === 'quote-from') {
      if (value.trim() === '') {
        return 'Collection location is required.';
      }
      return '';
    }
    if (id === 'quote-to') {
      if (value.trim() === '') {
        return 'Delivery location is required.';
      }
      return '';
    }
    if (id === 'quote-name') {
      if (value.trim() === '') {
        return 'Name is required.';
      }
      return '';
    }
    if (id === 'quote-date') {
      if (value) {
        if (value < today) {
          return 'Collection date cannot be in the past.';
        }
      }
      return '';
    }
    if (id === 'quote-phone' || id === 'quote-email') {
      const phoneValue = qs('#quote-phone', section).value.trim();
      const emailValue = qs('#quote-email', section).value.trim();
      
      if (phoneValue === '' && emailValue === '') {
        return 'Please provide either a phone number or an email.';
      }
      
      if (id === 'quote-email' && emailValue !== '') {
        const emailRegex = /^\S+@\S+\.\S+$/;
        if (!emailRegex.test(emailValue)) {
          return 'Please provide a valid email address.';
        }
      }
      
      if (id === 'quote-phone' && phoneValue !== '') {
        if (phoneValue.length < 9) {
          return 'Please provide a valid phone number.';
        }
      }
      return '';
    }
    return '';
  }

  function showError(input, message) {
    const errorNode = qs(`#${input.id}-error`, section);
    if (errorNode) {
      errorNode.textContent = message;
      if (message) {
        input.setAttribute('aria-invalid', 'true');
        input.setAttribute('aria-describedby', `${input.id}-error`);
        input.classList.add('is-invalid');
      } else {
        input.removeAttribute('aria-invalid');
        input.removeAttribute('aria-describedby');
        input.classList.remove('is-invalid');
      }
    }
  }

  form.addEventListener('focusout', (event) => {
    const target = event.target;
    if (target.tagName === 'INPUT' || target.tagName === 'SELECT' || target.tagName === 'TEXTAREA') {
      if (target.id === 'quote-phone' || target.id === 'quote-email') {
        const phoneError = validateField('quote-phone', qs('#quote-phone', section).value);
        const emailError = validateField('quote-email', qs('#quote-email', section).value);
        showError(qs('#quote-phone', section), phoneError ? 'Phone or email required.' : '');
        showError(qs('#quote-email', section), emailError);
        
        const contactErrorNode = qs('#quote-contact-error', section);
        if (phoneError && emailError && contactErrorNode) {
           contactErrorNode.textContent = phoneError;
        } else if (contactErrorNode) {
           contactErrorNode.textContent = '';
        }
      } else {
        const errorText = validateField(target.id, target.value);
        showError(target, errorText);
      }
    }
  });

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    markStarted();

    let firstInvalid = null;
    let errorsCount = 0;

    const phoneValue = qs('#quote-phone', section).value.trim();
    const emailValue = qs('#quote-email', section).value.trim();
    let contactError = '';
    if (phoneValue === '' && emailValue === '') {
      contactError = 'Please provide either a phone number or an email.';
    } else if (emailValue !== '' && !/^\S+@\S+\.\S+$/.test(emailValue)) {
      contactError = 'Please provide a valid email address.';
    } else if (phoneValue !== '' && phoneValue.length < 9) {
      contactError = 'Please provide a valid phone number.';
    }

    if (contactError) {
      showError(qs('#quote-phone', section), contactError);
      showError(qs('#quote-email', section), contactError);
      const contactErrorNode = qs('#quote-contact-error', section);
      if (contactErrorNode) {
         contactErrorNode.textContent = contactError;
      }
      if (!firstInvalid) {
        firstInvalid = qs('#quote-phone', section);
      }
      errorsCount++;
    } else {
      showError(qs('#quote-phone', section), '');
      showError(qs('#quote-email', section), '');
      const contactErrorNode = qs('#quote-contact-error', section);
      if (contactErrorNode) {
         contactErrorNode.textContent = '';
      }
    }

    const fieldsToValidate = ['quote-from', 'quote-to', 'quote-date', 'quote-name'];
    for (const id of fieldsToValidate) {
      const input = qs(`#${id}`, section);
      if (input) {
        const errorText = validateField(id, input.value);
        showError(input, errorText);
        if (errorText) {
          if (!firstInvalid) {
            firstInvalid = input;
          }
          errorsCount++;
        }
      }
    }

    if (errorsCount > 0) {
      let announcement = `Form has ${errorsCount} error.`;
      if (errorsCount > 1) {
        announcement = `Form has ${errorsCount} errors.`;
      }
      announce(announcement);
      if (firstInvalid) {
        firstInvalid.focus();
      }
      return;
    }

    const honeypot = qs('#company-website', section).value;
    if (honeypot) {
      showSuccess(null);
      return;
    }

    const state = quoteStore.getState();
    const payload = {
      from: state.fromText || qs('#quote-from', section).value,
      to: state.toText || qs('#quote-to', section).value,
      date: state.collectionDate,
      time: state.collectionTime,
      service: state.serviceId,
      vehicle: state.vehicleId,
      pallets: state.pallets,
      deliveryType: state.deliveryType,
      name: qs('#quote-name', section).value,
      phone: qs('#quote-phone', section).value,
      email: qs('#quote-email', section).value,
      notes: qs('#quote-notes', section).value,
    };

    if (CONFIG.formEndpoint) {
      fetch(CONFIG.formEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      .then((response) => {
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        showSuccess(payload);
      })
      .catch(() => {
        announce('Submission failed. Please call us on 0161 509 6152.');
      });
    } else {
      showSuccess(payload);
    }
  });

  function showSuccess(payload) {
    trackEvent('quote_submitted');
    form.classList.add('is-hidden');
    successPanel.classList.remove('is-hidden');

    const dateString = new Date().toISOString().slice(2, 10).replace(/-/g, '');
    const randomDigits = Math.floor(1000 + Math.random() * 9000);
    const reference = `HFU-${dateString}-${randomDigits}`;
    qs('[data-js="quote-success-ref"]', section).textContent = reference;

    const emailButton = qs('[data-js="quote-email-btn"]', section);
    if (emailButton && payload) {
      const subject = encodeURIComponent(`Quote Request ${reference}`);
      const bodyText = `Reference: ${reference}\nName: ${payload.name}\nPhone: ${payload.phone}\nEmail: ${payload.email}\nFrom: ${payload.from}\nTo: ${payload.to}\nDate: ${payload.date}\nTime: ${payload.time}\nService: ${payload.service}\nVehicle: ${payload.vehicle}\nPallets: ${payload.pallets}\nDelivery: ${payload.deliveryType}\nNotes: ${payload.notes}`;
      emailButton.href = `mailto:${COMPANY.email}?subject=${subject}&body=${encodeURIComponent(bodyText)}`;
    }

    const title = qs('[data-js="quote-success-title"]', section);
    if (title) {
      title.focus();
    }
  }

  const resetButton = qs('[data-js="quote-reset"]', section);
  if (resetButton) {
    resetButton.addEventListener('click', () => {
      form.reset();
      quoteStore.reset();
      const errorNodes = qsa('.field__error', form);
      for (const node of errorNodes) {
        node.textContent = '';
      }
      const invalidInputs = qsa('.is-invalid', form);
      for (const input of invalidInputs) {
        input.classList.remove('is-invalid');
        input.removeAttribute('aria-invalid');
        input.removeAttribute('aria-describedby');
      }
      form.classList.remove('is-hidden');
      successPanel.classList.add('is-hidden');
      qs('#quote-from', section).focus();
    });
  }
}
