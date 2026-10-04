import { qs, qsa, scrollToSection, announce } from '../lib/dom.js';
import { trackEvent } from '../lib/analytics.js';
import { quoteStore } from '../lib/quote-store.js';
import { describeRoute } from '../lib/geo.js';
import { attachPlaceCombobox } from '../lib/combobox.js';
import { attachStepper } from '../lib/stepper.js';
import { recommendVehicle } from '../data/fleet.js';
import { createRouteMap } from './route-map.js';

export function initHero() {
  const root = qs('[data-section="hero"]');
  if (!root) {
    return;
  }

  const fromInput = qs('#hero-from', root);
  const toInput = qs('#hero-to', root);
  const swapBtn = qs('[data-js="planner-swap"]', root);
  const submitBtn = qs('[data-js="planner-submit"]', root);
  const errorSlot = qs('[data-js="planner-error"]', root);
  const resultLine = qs('[data-js="planner-result"]', root);
  const deliveryRadios = qsa('[name="hero-delivery-type"]', root);

  const vehicleChipShort = qs('[data-js="vehicle-short"]', root);
  const vehicleChipName = qs('[data-js="vehicle-name"]', root);

  const readoutDistance = qs('[data-js="readout-distance"]', root);
  const readoutDuration = qs('[data-js="readout-duration"]', root);
  const readoutVehicle = qs('[data-js="readout-vehicle"]', root);

  const mapHost = qs('[data-js="route-map"]', root);
  const stepperRoot = qs('[data-js="stepper-pallets"]', root);

  let selectedFrom = null;
  let selectedTo = null;
  let fromText = '';
  let toText = '';
  let isInternalUpdate = false;

  const map = createRouteMap(mapHost, {
    onPlaceSelect: (place) => {
      if (!selectedFrom) {
        fromBox.setPlace(place);
      } else {
        toBox.setPlace(place);
      }
    },
  });

  const fromBox = attachPlaceCombobox(fromInput, {
    onSelect: (place) => {
      selectedFrom = place;
      if (place) {
        fromText = place.name;
        fromInput.closest('.field').classList.remove('is-invalid');
      }
      updateRoute();
    },
    onInput: (text, matchedPlace) => {
      fromText = text;
      selectedFrom = matchedPlace;
      fromInput.closest('.field').classList.remove('is-invalid');
      updateRoute();
    },
    onClear: () => {
      selectedFrom = null;
      fromText = '';
      updateRoute();
    },
  });

  const toBox = attachPlaceCombobox(toInput, {
    onSelect: (place) => {
      selectedTo = place;
      if (place) {
        toText = place.name;
        toInput.closest('.field').classList.remove('is-invalid');
      }
      updateRoute();
    },
    onInput: (text, matchedPlace) => {
      toText = text;
      selectedTo = matchedPlace;
      toInput.closest('.field').classList.remove('is-invalid');
      updateRoute();
    },
    onClear: () => {
      selectedTo = null;
      toText = '';
      updateRoute();
    },
  });

  const stepper = attachStepper(stepperRoot, {
    onChange: (value) => {
      updateVehicle(value);
      syncToStore();
    },
  });

  for (const radio of deliveryRadios) {
    radio.addEventListener('change', () => {
      syncToStore();
    });
  }

  swapBtn.addEventListener('click', () => {
    const tempFrom = selectedFrom;
    const tempTo = selectedTo;
    const tempFromText = fromText;
    const tempToText = toText;

    if (tempTo) {
      fromBox.setPlace(tempTo);
    } else {
      fromBox.clear();
      fromInput.value = tempToText;
      selectedFrom = null;
      fromText = tempToText;
    }

    if (tempFrom) {
      toBox.setPlace(tempFrom);
    } else {
      toBox.clear();
      toInput.value = tempFromText;
      selectedTo = null;
      toText = tempFromText;
    }

    updateRoute();
  });

  function getDeliveryType() {
    for (const radio of deliveryRadios) {
      if (radio.checked) {
        return radio.value;
      }
    }
    return 'same-day';
  }

  function updateVehicle(pallets) {
    const vehicle = recommendVehicle(pallets);
    if (vehicle) {
      vehicleChipShort.textContent = vehicle.shortName;
      vehicleChipName.textContent = vehicle.name;
      readoutVehicle.textContent = vehicle.shortName;

      if (!isInternalUpdate) {
        trackEvent('vehicle_selected', { vehicle: vehicle.id });
      }
    }
  }

  function updateRoute() {
    errorSlot.hidden = true;
    errorSlot.textContent = '';

    if (selectedFrom && selectedTo) {
      map.setRoute(selectedFrom, selectedTo);
      const routeInfo = describeRoute(selectedFrom, selectedTo);
      const sentence = `${selectedFrom.name} to ${selectedTo.name}: about ${routeInfo.milesLabel} road miles, around ${routeInfo.durationLabel} drive.`;

      resultLine.textContent = sentence;
      readoutDistance.textContent = routeInfo.milesLabel;
      readoutDuration.textContent = routeInfo.durationLabel;

      if (!isInternalUpdate) {
        announce(sentence);
        trackEvent('route_planned', {
          from: selectedFrom.name,
          to: selectedTo.name,
          miles: routeInfo.miles,
        });
      }
    } else {
      map.clearRoute();
      resultLine.textContent = 'Choose where from and where to to see your route.';
      readoutDistance.textContent = '--';
      readoutDuration.textContent = '--';
    }

    syncToStore();
  }

  function syncToStore() {
    if (isInternalUpdate) {
      return;
    }

    const parsed = parseInt(stepper.getValue(), 10);
    const pallets = isNaN(parsed) ? 0 : parsed;
    const vehicle = recommendVehicle(pallets);

    quoteStore.update(
      {
        from: selectedFrom,
        fromText: fromText,
        to: selectedTo,
        toText: toText,
        deliveryType: getDeliveryType(),
        pallets: pallets,
        vehicleId: vehicle ? vehicle.id : null,
      },
      'hero'
    );
  }

  quoteStore.subscribe((state, changedKeys, source) => {
    if (source === 'hero') {
      return;
    }

    isInternalUpdate = true;

    if (state.from) {
      fromBox.setPlace(state.from);
      selectedFrom = state.from;
      fromText = state.from.name;
    } else if (state.fromText) {
      fromInput.value = state.fromText;
      selectedFrom = null;
      fromText = state.fromText;
    }

    if (state.to) {
      toBox.setPlace(state.to);
      selectedTo = state.to;
      toText = state.to.name;
    } else if (state.toText) {
      toInput.value = state.toText;
      selectedTo = null;
      toText = state.toText;
    }

    stepper.setValue(state.pallets, { silent: true });
    updateVehicle(state.pallets);

    for (const radio of deliveryRadios) {
      radio.checked = radio.value === state.deliveryType;
    }

    updateRoute();

    isInternalUpdate = false;
  });

  submitBtn.addEventListener('click', () => {
    if (!fromText || !toText) {
      errorSlot.textContent = 'Add where from and where to so we can quote you.';
      errorSlot.hidden = false;

      if (!fromText) {
        fromInput.closest('.field').classList.add('is-invalid');
        fromInput.focus();
      } else if (!toText) {
        toInput.closest('.field').classList.add('is-invalid');
        toInput.focus();
      }
      return;
    }

    trackEvent('quote_started', { source: 'hero' });
    scrollToSection('quote', { focusSelector: '[data-js="quote-focus-target"]' });
  });

  updateVehicle(0);
}
