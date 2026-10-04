import { PLACES, HUB_PLACE_ID } from '../data/places.js';
import { CONFIG } from '../data/config.js';

export function normalisePostcode(text) {
  const trimmed = text.trim().toUpperCase();
  if (!trimmed) {
    return null;
  }

  if (trimmed.includes(' ')) {
    const parts = trimmed.split(/\s+/);
    if (parts.length >= 2) {
      const outcodeStr = parts[0];
      const match = outcodeStr.match(/^([A-Z]{1,2})([0-9][0-9A-Z]?)?$/);
      if (match) {
        return { area: match[1], outcode: match[1] + (match[2] || '') };
      }
      return null;
    }
  }

  const clean = trimmed.replace(/\s+/g, '');
  if (clean.length >= 5) {
    const outcodeStr = clean.slice(0, -3);
    const match = outcodeStr.match(/^([A-Z]{1,2})([0-9][0-9A-Z]?)?$/);
    if (match) {
      return { area: match[1], outcode: match[1] + (match[2] || '') };
    }
  } else {
    const match = clean.match(/^([A-Z]{1,2})([0-9][0-9A-Z]?)?$/);
    if (match) {
      return { area: match[1], outcode: match[1] + (match[2] || '') };
    }
  }

  return null;
}

export function findPlaceByQuery(text) {
  if (!text) {
    return null;
  }

  let query = text.trim().toLowerCase().replace(/\s+/g, ' ');
  query = query.replace(/\s*\([a-z]{1,2}\)$/, '');

  for (const place of PLACES) {
    if (place.id.toLowerCase() === query || place.name.toLowerCase() === query) {
      return place;
    }
  }

  for (const place of PLACES) {
    if (place.aliases) {
      for (const alias of place.aliases) {
        if (alias.toLowerCase() === query) {
          return place;
        }
      }
    }
  }

  const postcode = normalisePostcode(text);
  if (postcode) {
    for (const place of PLACES) {
      if (place.kind === 'city' && place.area === postcode.area) {
        return place;
      }
    }
  }

  return null;
}

export function suggestPlaces(text, limit = 6) {
  if (!text || text.trim() === '') {
    const defaultPlaces = [];
    for (const place of PLACES) {
      if (place.labelOnMap) {
        defaultPlaces.push(place);
      }
    }
    defaultPlaces.sort((firstPlace, secondPlace) =>
      firstPlace.name.localeCompare(secondPlace.name)
    );
    return defaultPlaces.slice(0, limit);
  }

  const query = text.trim().toLowerCase().replace(/\s+/g, ' ');
  const postcode = normalisePostcode(text);

  const results = [];
  const seen = new Set();

  const addPlace = (place) => {
    if (!seen.has(place.id)) {
      seen.add(place.id);
      results.push(place);
    }
  };

  for (const place of PLACES) {
    if (place.name.toLowerCase().startsWith(query)) {
      addPlace(place);
    }
  }

  for (const place of PLACES) {
    if (place.aliases) {
      for (const alias of place.aliases) {
        if (alias.toLowerCase().startsWith(query)) {
          addPlace(place);
        }
      }
    }
  }

  if (postcode) {
    for (const place of PLACES) {
      if (place.kind === 'city') {
        if (place.area.startsWith(postcode.outcode) || postcode.outcode.startsWith(place.area)) {
          addPlace(place);
        }
      }
    }
  }

  for (const place of PLACES) {
    if (place.name.toLowerCase().includes(query)) {
      addPlace(place);
    }
  }

  return results.slice(0, limit);
}

export function formatPlaceLabel(place) {
  if (place.kind === 'city') {
    return `${place.name} (${place.area})`;
  }

  let cityPlace = null;
  for (const candidatePlace of PLACES) {
    if (candidatePlace.kind === 'city' && candidatePlace.area === place.area) {
      cityPlace = candidatePlace;
      break;
    }
  }
  const cityName = cityPlace ? cityPlace.name : 'Unknown';
  return `${place.name}, ${cityName} area`;
}

export function getPlaceById(id) {
  for (const place of PLACES) {
    if (place.id === id) {
      return place;
    }
  }
  return null;
}

export function getHubPlace() {
  return getPlaceById(HUB_PLACE_ID);
}

export function haversineMiles(placeA, placeB) {
  const earthRadiusMiles = 3958.8;
  const latitude1Radians = placeA.lat * (Math.PI / 180);
  const longitude1Radians = placeA.lon * (Math.PI / 180);
  const latitude2Radians = placeB.lat * (Math.PI / 180);
  const longitude2Radians = placeB.lon * (Math.PI / 180);

  const latitudeDifferenceRadians = latitude2Radians - latitude1Radians;
  const longitudeDifferenceRadians = longitude2Radians - longitude1Radians;

  const haversineTerm =
    Math.sin(latitudeDifferenceRadians / 2) * Math.sin(latitudeDifferenceRadians / 2) +
    Math.cos(latitude1Radians) *
      Math.cos(latitude2Radians) *
      Math.sin(longitudeDifferenceRadians / 2) *
      Math.sin(longitudeDifferenceRadians / 2);

  const angularDistance = 2 * Math.atan2(Math.sqrt(haversineTerm), Math.sqrt(1 - haversineTerm));
  return earthRadiusMiles * angularDistance;
}

export function estimateRoadMiles(placeA, placeB) {
  if (placeA.id === placeB.id) {
    return 0;
  }
  const haversine = haversineMiles(placeA, placeB);
  let roadMiles = Math.round(haversine * CONFIG.roadDistanceFactor);
  if (roadMiles < 1) {
    roadMiles = 1;
  }
  return roadMiles;
}

export function estimateDriveMinutes(roadMiles) {
  if (roadMiles === 0) {
    return 0;
  }
  return Math.round((roadMiles / CONFIG.averageRoadSpeedMph) * 60 + 10);
}

export function formatMiles(miles) {
  if (miles === 1) {
    return '1 mile';
  }
  return `${miles} miles`;
}

export function formatDuration(minutes) {
  const hrs = Math.floor(minutes / 60);
  const mins = minutes % 60;

  if (hrs === 0) {
    return `${mins} min`;
  }
  if (mins === 0) {
    return `${hrs} hr`;
  }
  return `${hrs} hr ${mins} min`;
}

export function describeRoute(fromPlace, toPlace) {
  const miles = estimateRoadMiles(fromPlace, toPlace);
  const minutes = estimateDriveMinutes(miles);

  return {
    miles,
    minutes,
    milesLabel: formatMiles(miles),
    durationLabel: formatDuration(minutes),
  };
}
