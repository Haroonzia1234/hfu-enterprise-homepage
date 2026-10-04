import { CONFIG } from '../data/config.js';

export function trackEvent(eventName, parameters = {}) {
  try {
    if (!window[CONFIG.dataLayerName]) {
      window[CONFIG.dataLayerName] = [];
    }
    window[CONFIG.dataLayerName].push({
      event: eventName,
      ...parameters,
    });
  } catch (error) {}
}
