import { findPlaceByQuery } from './geo.js';
import { getVehicle } from '../data/fleet.js';
import { getService } from '../data/services.js';

const DEFAULT_STATE = {
  from: null,
  fromText: '',
  to: null,
  toText: '',
  deliveryType: 'same-day',
  serviceId: null,
  vehicleId: null,
  pallets: 0,
  weightKg: null,
  collectionDate: '',
  collectionTime: '',
  schedule: null,
  notes: '',
};

let currentState = { ...DEFAULT_STATE };
const listeners = new Set();

function persist() {
  try {
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.setItem('hfu-quote-state', JSON.stringify(currentState));
    }
  } catch (error) {}
}

function hydrate() {
  try {
    if (typeof sessionStorage !== 'undefined') {
      const stored = sessionStorage.getItem('hfu-quote-state');
      if (stored) {
        currentState = { ...DEFAULT_STATE, ...JSON.parse(stored) };
      }
    }
  } catch (error) {}

  if (typeof window !== 'undefined' && window.location && window.location.search) {
    try {
      const params = new URLSearchParams(window.location.search);
      const patch = {};

      if (params.has('from')) {
        const fromText = params.get('from');
        patch.fromText = fromText;
        patch.from = findPlaceByQuery(fromText);
      }

      if (params.has('to')) {
        const toText = params.get('to');
        patch.toText = toText;
        patch.to = findPlaceByQuery(toText);
      }

      if (params.has('vehicle')) {
        const vehicleId = params.get('vehicle');
        if (getVehicle(vehicleId)) {
          patch.vehicleId = vehicleId;
        }
      }

      if (params.has('service')) {
        const serviceId = params.get('service');
        if (getService(serviceId)) {
          patch.serviceId = serviceId;
        }
      }

      if (params.has('delivery')) {
        const delivery = params.get('delivery');
        if (['same-day', 'next-day', 'flexible'].includes(delivery)) {
          patch.deliveryType = delivery;
        }
      }

      if (params.has('pallets')) {
        const pallets = parseInt(params.get('pallets'), 10);
        if (!isNaN(pallets) && pallets >= 0 && pallets <= 16) {
          patch.pallets = pallets;
        }
      }

      if (Object.keys(patch).length > 0) {
        currentState = { ...currentState, ...patch };
        persist();
      }
    } catch (error) {}
  }
}

hydrate();

export const quoteStore = {
  getState() {
    return { ...currentState };
  },

  update(patch, source = 'unknown') {
    const changedKeys = [];
    for (const key of Object.keys(patch)) {
      const oldVal = currentState[key];
      const newVal = patch[key];
      let isChanged = false;
      if (typeof oldVal === 'object' || typeof newVal === 'object') {
        isChanged = JSON.stringify(oldVal) !== JSON.stringify(newVal);
      } else {
        isChanged = oldVal !== newVal;
      }

      if (isChanged) {
        changedKeys.push(key);
      }
    }

    if (changedKeys.length === 0) {
      return;
    }

    currentState = { ...currentState, ...patch };
    persist();

    const stateCopy = this.getState();
    for (const listener of listeners) {
      try {
        listener(stateCopy, changedKeys, source);
      } catch (error) {}
    }
  },

  reset() {
    this.update(DEFAULT_STATE, 'reset');
  },

  subscribe(listener) {
    listeners.add(listener);
    return function () {
      listeners.delete(listener);
    };
  },
};
