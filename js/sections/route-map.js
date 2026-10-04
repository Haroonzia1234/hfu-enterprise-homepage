import { createSvgElement, prefersReducedMotion, clamp } from '../lib/dom.js';
import { PLACES, HUB_PLACE_ID } from '../data/places.js';
import {
  MAP_VIEWBOX,
  UK_OUTLINE_PATH,
  IRELAND_OUTLINE_PATH,
  projectLatLon,
} from '../data/uk-map.js';

const LABEL_OFFSETS = {
  london: { dx: -8, dy: -6, anchor: 'end' },
  birmingham: { dx: 8, dy: 4, anchor: 'start' },
  glasgow: { dx: 8, dy: -4, anchor: 'start' },
  cardiff: { dx: -8, dy: -6, anchor: 'end' },
  'newcastle-upon-tyne': { dx: 8, dy: -4, anchor: 'start' },
  bristol: { dx: -8, dy: 8, anchor: 'end' },
  southampton: { dx: 8, dy: 6, anchor: 'start' },
  norwich: { dx: 8, dy: -4, anchor: 'start' },
  liverpool: { dx: -8, dy: -6, anchor: 'end' },
  leeds: { dx: 8, dy: -8, anchor: 'start' },
  sheffield: { dx: 8, dy: 8, anchor: 'start' },
  manchester: { dx: 8, dy: -4, anchor: 'start' },
  edinburgh: { dx: 8, dy: -4, anchor: 'start' },
  belfast: { dx: -8, dy: -4, anchor: 'end' },
  aberdeen: { dx: 8, dy: -4, anchor: 'start' },
  nottingham: { dx: 8, dy: -4, anchor: 'start' },
  cambridge: { dx: 8, dy: -4, anchor: 'start' },
  oxford: { dx: -8, dy: -4, anchor: 'end' },
  exeter: { dx: -8, dy: -4, anchor: 'end' },
  swansea: { dx: -8, dy: 4, anchor: 'end' },
  hull: { dx: 8, dy: -4, anchor: 'start' },
  york: { dx: 8, dy: -4, anchor: 'start' },
  'stoke-on-trent': { dx: -8, dy: 4, anchor: 'end' },
  derby: { dx: 8, dy: 4, anchor: 'start' },
  leicester: { dx: 8, dy: 4, anchor: 'start' },
  coventry: { dx: 8, dy: 4, anchor: 'start' },
  brighton: { dx: 8, dy: 6, anchor: 'start' },
  plymouth: { dx: -8, dy: -6, anchor: 'end' },
  bournemouth: { dx: -8, dy: 6, anchor: 'end' },
  ipswich: { dx: 8, dy: -4, anchor: 'start' },
  peterborough: { dx: 8, dy: -4, anchor: 'start' },
  sunderland: { dx: 8, dy: 4, anchor: 'start' },
  middlesbrough: { dx: 8, dy: 4, anchor: 'start' },
  preston: { dx: -8, dy: -4, anchor: 'end' },
  blackpool: { dx: -8, dy: 4, anchor: 'end' },
  lancaster: { dx: -8, dy: -4, anchor: 'end' },
  carlisle: { dx: -8, dy: -4, anchor: 'end' },
  dundee: { dx: 8, dy: 4, anchor: 'start' },
  inverness: { dx: 8, dy: -4, anchor: 'start' },
  bradford: { dx: -8, dy: 6, anchor: 'end' },
  wolverhampton: { dx: -8, dy: 4, anchor: 'end' },
};

const AMBIENT_CITY_IDS = [
  'london',
  'birmingham',
  'glasgow',
  'cardiff',
  'newcastle-upon-tyne',
  'bristol',
  'southampton',
  'norwich',
];

const DOT_GRID_SIZE = 14;
const DOT_RADIUS = 1.2;
const DOT_GRID_PATTERN_ID = 'route-map-dot-grid';
const GLOW_FILTER_ID = 'route-map-glow';
const ROUTE_CLIP_ID = 'route-map-uk-clip';
const MINIMUM_FIT_WIDTH = 220;
const MAXIMUM_ZOOM = 2.6;
const MARGIN_FRACTION = 0.18;
const MINIMUM_VERTICAL_MARGIN = 70;

function getDefaultOffset() {
  return { dx: 8, dy: -3, anchor: 'start' };
}

function getLabelOffset(placeId) {
  if (LABEL_OFFSETS[placeId]) {
    return LABEL_OFFSETS[placeId];
  }
  return getDefaultOffset();
}

function buildQuadraticArc(startPoint, endPoint, bendFraction) {
  const midX = (startPoint.x + endPoint.x) / 2;
  const midY = (startPoint.y + endPoint.y) / 2;
  const chordDx = endPoint.x - startPoint.x;
  const chordDy = endPoint.y - startPoint.y;
  const chordLength = Math.sqrt(chordDx * chordDx + chordDy * chordDy);
  const perpX = -chordDy / chordLength;
  const offset = chordLength * bendFraction;
  const controlX = midX + perpX * offset;
  const controlY = midY - Math.abs(offset);
  return {
    pathData: `M${startPoint.x},${startPoint.y} Q${controlX},${controlY} ${endPoint.x},${endPoint.y}`,
    controlX,
    controlY,
  };
}

function buildChevronGlyph(centerX, centerY, size) {
  const halfWidth = size / 2;
  const halfHeight = size * 0.9;
  const topPoints = [
    [centerX - halfWidth, centerY - halfHeight * 0.15],
    [centerX + halfWidth, centerY - halfHeight],
    [centerX + halfWidth, centerY - halfHeight * 0.1],
    [centerX, centerY + halfHeight * 0.15],
  ];
  const bottomPoints = [
    [centerX - halfWidth, centerY + halfHeight * 0.15],
    [centerX, centerY + halfHeight * 0.4],
    [centerX + halfWidth, centerY + halfHeight * 0.15],
    [centerX, centerY + halfHeight * 0.15 - halfHeight * 0.25],
  ];
  const topPolygon = createSvgElement('polygon', {
    points: topPoints.map((point) => point.join(',')).join(' '),
    class: 'route-map__chevron-top',
  });
  const bottomPolygon = createSvgElement('polygon', {
    points: bottomPoints.map((point) => point.join(',')).join(' '),
    class: 'route-map__chevron-bottom',
  });
  return createSvgElement('g', {}, [topPolygon, bottomPolygon]);
}

function buildSmallChevron(size) {
  const halfSize = size / 2;
  const topPolygon = createSvgElement('polygon', {
    points: `${-halfSize},0 0,${-halfSize} ${halfSize},0 0,${halfSize * 0.3}`,
    class: 'route-map__chevron-top',
  });
  const bottomPolygon = createSvgElement('polygon', {
    points: `${-halfSize},${halfSize * 0.1} 0,${halfSize} ${halfSize},${halfSize * 0.1} 0,${halfSize * 0.4}`,
    class: 'route-map__chevron-bottom',
  });
  return createSvgElement('g', {}, [topPolygon, bottomPolygon]);
}

function lerpViewBox(fromVb, toVb, progress) {
  return {
    x: fromVb.x + (toVb.x - fromVb.x) * progress,
    y: fromVb.y + (toVb.y - fromVb.y) * progress,
    width: fromVb.width + (toVb.width - fromVb.width) * progress,
    height: fromVb.height + (toVb.height - fromVb.height) * progress,
  };
}

function easeOutCubic(progressValue) {
  return 1 - Math.pow(1 - progressValue, 3);
}

function easeInOutCubic(progressValue) {
  if (progressValue < 0.5) {
    return 4 * progressValue * progressValue * progressValue;
  }
  return 1 - Math.pow(-2 * progressValue + 2, 3) / 2;
}

function computeFitViewBox(startPoint, endPoint, hostElement, fullViewBox) {
  const minPointX = Math.min(startPoint.x, endPoint.x);
  const minPointY = Math.min(startPoint.y, endPoint.y);
  const maxPointX = Math.max(startPoint.x, endPoint.x);
  const maxPointY = Math.max(startPoint.y, endPoint.y);
  const routeWidth = maxPointX - minPointX;
  const routeHeight = maxPointY - minPointY;

  const horizontalMargin = Math.max(routeWidth * MARGIN_FRACTION, 40);
  const verticalMargin = Math.max(routeHeight * MARGIN_FRACTION, MINIMUM_VERTICAL_MARGIN);
  const paddedWidth = routeWidth + horizontalMargin * 2;
  const paddedHeight = routeHeight + verticalMargin * 2;

  let hostAspect = fullViewBox.width / fullViewBox.height;
  if (hostElement && hostElement.clientWidth > 0 && hostElement.clientHeight > 0) {
    hostAspect = hostElement.clientWidth / hostElement.clientHeight;
  }

  let fitWidth = paddedWidth;
  let fitHeight = paddedHeight;
  if (fitWidth / fitHeight > hostAspect) {
    fitHeight = fitWidth / hostAspect;
  } else {
    fitWidth = fitHeight * hostAspect;
  }

  if (fitWidth < MINIMUM_FIT_WIDTH) {
    fitWidth = MINIMUM_FIT_WIDTH;
    fitHeight = fitWidth / hostAspect;
  }

  const minWidth = fullViewBox.width / MAXIMUM_ZOOM;
  const minHeight = fullViewBox.height / MAXIMUM_ZOOM;
  if (fitWidth < minWidth) {
    fitWidth = minWidth;
    fitHeight = fitWidth / hostAspect;
  }
  if (fitHeight < minHeight) {
    fitHeight = minHeight;
    fitWidth = fitHeight * hostAspect;
  }

  if (fitWidth > fullViewBox.width) {
    fitWidth = fullViewBox.width;
    fitHeight = fitWidth / hostAspect;
  }
  if (fitHeight > fullViewBox.height) {
    fitHeight = fullViewBox.height;
    fitWidth = fitHeight * hostAspect;
  }

  const centerX = (minPointX + maxPointX) / 2;
  const centerY = (minPointY + maxPointY) / 2;
  let viewBoxX = centerX - fitWidth / 2;
  let viewBoxY = centerY - fitHeight / 2;
  viewBoxX = clamp(viewBoxX, 0, Math.max(0, fullViewBox.width - fitWidth));
  viewBoxY = clamp(viewBoxY, 0, Math.max(0, fullViewBox.height - fitHeight));
  return {
    x: viewBoxX,
    y: viewBoxY,
    width: fitWidth,
    height: fitHeight,
  };
}

export function createRouteMap(hostElement, { onPlaceSelect }) {
  if (!hostElement) {
    return {
      setRoute() {},
      clearRoute() {},
      setAmbient() {},
      focusPlace() {},
      destroy() {},
    };
  }

  const fullViewBox = {
    x: 0,
    y: 0,
    width: MAP_VIEWBOX.width,
    height: MAP_VIEWBOX.height,
  };

  let currentViewBox = { ...fullViewBox };
  let ambientEnabled = true;
  let ambientFrameId = null;
  let routeFrameId = null;
  let cameraFrameId = null;
  let intersectionObserver = null;
  let isVisible = true;
  let isDocumentVisible = true;
  let currentRouteElements = null;
  let activeEndpointIds = [];

  const placesById = new Map();
  PLACES.forEach((place) => {
    placesById.set(place.id, place);
  });

  const hubPlace = placesById.get(HUB_PLACE_ID);
  const hubPoint = hubPlace
    ? projectLatLon(hubPlace.lat, hubPlace.lon)
    : { x: MAP_VIEWBOX.width / 2, y: MAP_VIEWBOX.height / 2 };

  const svgElement = createSvgElement('svg', {
    class: 'route-map__svg',
    viewBox: `${fullViewBox.x} ${fullViewBox.y} ${fullViewBox.width} ${fullViewBox.height}`,
    preserveAspectRatio: 'xMidYMid meet',
    width: '100%',
    height: '100%',
    'aria-hidden': 'true',
    overflow: 'hidden',
  });

  const dotPattern = createSvgElement(
    'pattern',
    {
      id: DOT_GRID_PATTERN_ID,
      width: String(DOT_GRID_SIZE),
      height: String(DOT_GRID_SIZE),
      patternUnits: 'userSpaceOnUse',
    },
    [
      createSvgElement('circle', {
        cx: String(DOT_GRID_SIZE / 2),
        cy: String(DOT_GRID_SIZE / 2),
        r: String(DOT_RADIUS),
        fill: 'var(--blue-300)',
        'fill-opacity': '0.18',
      }),
    ]
  );

  const glowFilter = createSvgElement(
    'filter',
    {
      id: GLOW_FILTER_ID,
      x: '-50%',
      y: '-50%',
      width: '200%',
      height: '200%',
    },
    [
      createSvgElement('feGaussianBlur', {
        in: 'SourceGraphic',
        stdDeviation: '6',
        result: 'blur',
      }),
    ]
  );

  const clipPath = createSvgElement(
    'clipPath',
    {
      id: ROUTE_CLIP_ID,
    },
    [createSvgElement('path', { d: UK_OUTLINE_PATH })]
  );

  const radialGlow = createSvgElement(
    'radialGradient',
    {
      id: 'route-map-england-glow',
      cx: '55%',
      cy: '65%',
      r: '40%',
    },
    [
      createSvgElement('stop', {
        offset: '0%',
        'stop-color': 'var(--blue-400)',
        'stop-opacity': '0.06',
      }),
      createSvgElement('stop', {
        offset: '100%',
        'stop-color': 'var(--blue-400)',
        'stop-opacity': '0',
      }),
    ]
  );

  const defsElement = createSvgElement('defs', {}, [dotPattern, glowFilter, clipPath, radialGlow]);
  svgElement.appendChild(defsElement);

  const irelandPath = createSvgElement('path', {
    d: IRELAND_OUTLINE_PATH,
    class: 'route-map__ireland',
    'aria-hidden': 'true',
  });
  svgElement.appendChild(irelandPath);

  const glowRect = createSvgElement('rect', {
    x: '0',
    y: '0',
    width: String(MAP_VIEWBOX.width),
    height: String(MAP_VIEWBOX.height),
    fill: 'url(#route-map-england-glow)',
    'aria-hidden': 'true',
  });
  svgElement.appendChild(glowRect);

  const landPath = createSvgElement('path', {
    d: UK_OUTLINE_PATH,
    class: 'route-map__land',
    'aria-hidden': 'true',
  });
  svgElement.appendChild(landPath);

  const patternOverlay = createSvgElement('path', {
    d: UK_OUTLINE_PATH,
    fill: `url(#${DOT_GRID_PATTERN_ID})`,
    'clip-path': `url(#${ROUTE_CLIP_ID})`,
    class: 'route-map__land-pattern',
    'aria-hidden': 'true',
  });
  svgElement.appendChild(patternOverlay);

  const ambientLayer = createSvgElement('g', {
    class: 'route-map__ambient-layer',
    'aria-hidden': 'true',
  });
  svgElement.appendChild(ambientLayer);

  const ambientCities = AMBIENT_CITY_IDS.map((cityId) => placesById.get(cityId)).filter(
    (place) => place !== undefined
  );

  const ambientArcs = [];
  ambientCities.forEach((city, cityIndex) => {
    const cityPoint = projectLatLon(city.lat, city.lon);
    const arcData = buildQuadraticArc(hubPoint, cityPoint, 0.14);
    const arcPath = createSvgElement('path', {
      d: arcData.pathData,
      class: 'route-map__ambient-arc',
    });
    ambientLayer.appendChild(arcPath);
    ambientArcs.push({
      pathElement: arcPath,
      startDelay: cityIndex * 0.8,
      markerElement: null,
    });
  });

  ambientArcs.forEach((arcInfo) => {
    const markerChevron = buildSmallChevron(5);
    markerChevron.setAttribute('class', 'route-map__ambient-marker');
    ambientLayer.appendChild(markerChevron);
    arcInfo.markerElement = markerChevron;
  });

  const placesLayer = createSvgElement('g', {
    class: 'route-map__places-layer',
    role: 'group',
    'aria-label': 'Selectable cities',
  });
  svgElement.appendChild(placesLayer);

  const labelledPlaces = PLACES.filter((place) => {
    return place.labelOnMap === true && place.kind !== 'local' && place.id !== HUB_PLACE_ID;
  });

  const placeGroups = new Map();

  labelledPlaces.forEach((place) => {
    const point = projectLatLon(place.lat, place.lon);
    const offset = getLabelOffset(place.id);

    const hitCircle = createSvgElement('circle', {
      cx: String(point.x),
      cy: String(point.y),
      r: '14',
      class: 'route-map__place-hit',
    });

    const dotCircle = createSvgElement('circle', {
      cx: String(point.x),
      cy: String(point.y),
      r: '3.5',
      class: 'route-map__place-dot',
    });

    const focusRing = createSvgElement('circle', {
      cx: String(point.x),
      cy: String(point.y),
      class: 'route-map__place-focus-ring',
    });

    const labelText = createSvgElement('text', {
      x: String(point.x + offset.dx),
      y: String(point.y + offset.dy),
      class: 'route-map__label',
      'text-anchor': offset.anchor,
      'dominant-baseline': 'central',
    });
    labelText.textContent = place.name;

    const placeGroup = createSvgElement('g', {
      class: 'route-map__place',
      role: 'button',
      tabindex: '0',
      'aria-label': `Use ${place.name} in your route`,
    });

    placeGroup.appendChild(hitCircle);
    placeGroup.appendChild(focusRing);
    placeGroup.appendChild(dotCircle);
    placeGroup.appendChild(labelText);

    const handlePlaceActivation = () => {
      if (onPlaceSelect) {
        onPlaceSelect(place);
      }
    };

    placeGroup.addEventListener('click', handlePlaceActivation);
    placeGroup.addEventListener('keydown', (keyEvent) => {
      if (keyEvent.key === 'Enter' || keyEvent.key === ' ') {
        keyEvent.preventDefault();
        handlePlaceActivation();
      }
    });

    placesLayer.appendChild(placeGroup);
    placeGroups.set(place.id, { groupElement: placeGroup, dotElement: dotCircle, point });
  });

  const hubGroup = createSvgElement('g', {
    class: 'route-map__hub',
    'aria-hidden': 'true',
  });

  const hubRing1 = createSvgElement('circle', {
    cx: String(hubPoint.x),
    cy: String(hubPoint.y),
    r: '6',
    class: 'route-map__ring',
  });

  const hubRing2 = createSvgElement('circle', {
    cx: String(hubPoint.x),
    cy: String(hubPoint.y),
    r: '6',
    class: 'route-map__ring route-map__ring--delayed',
  });

  const hubChevron = buildChevronGlyph(hubPoint.x, hubPoint.y, 8);

  const hubLabel = createSvgElement('text', {
    x: String(hubPoint.x + 14),
    y: String(hubPoint.y),
    class: 'route-map__hub-label',
    'text-anchor': 'start',
    'dominant-baseline': 'central',
  });
  hubLabel.textContent = 'HFU';

  hubGroup.appendChild(hubRing1);
  hubGroup.appendChild(hubRing2);
  hubGroup.appendChild(hubChevron);
  hubGroup.appendChild(hubLabel);
  svgElement.appendChild(hubGroup);

  const routeLayer = createSvgElement('g', {
    class: 'route-map__route-layer',
    'aria-hidden': 'true',
  });
  svgElement.appendChild(routeLayer);

  const containerDiv = document.createElement('div');
  containerDiv.className = 'route-map';
  containerDiv.appendChild(svgElement);
  hostElement.appendChild(containerDiv);

  function applyZoomFactor(viewBox) {
    const zoomFactor = MAP_VIEWBOX.width / viewBox.width;
    svgElement.style.setProperty('--map-zoom', String(zoomFactor));
  }

  function updateSvgViewBox(viewBox) {
    svgElement.setAttribute(
      'viewBox',
      `${viewBox.x} ${viewBox.y} ${viewBox.width} ${viewBox.height}`
    );
    currentViewBox = { ...viewBox };
    applyZoomFactor(viewBox);
  }

  applyZoomFactor(fullViewBox);

  let ambientStartTime = null;

  function animateAmbientMarkers(timestamp) {
    if (!ambientEnabled || !isVisible || !isDocumentVisible) {
      ambientFrameId = null;
      return;
    }
    if (ambientStartTime === null) {
      ambientStartTime = timestamp;
    }
    const elapsedSeconds = (timestamp - ambientStartTime) / 1000;

    ambientArcs.forEach((arcInfo) => {
      const pathLength = arcInfo.pathElement.getTotalLength();
      if (pathLength <= 0) {
        return;
      }
      const cycleSeconds = 4.5;
      const adjustedTime = elapsedSeconds - arcInfo.startDelay;
      if (adjustedTime < 0) {
        arcInfo.markerElement.setAttribute('transform', 'translate(-100,-100)');
        return;
      }
      const progressFraction = (adjustedTime % cycleSeconds) / cycleSeconds;
      const distanceAlongPath = progressFraction * pathLength;
      const pathPoint = arcInfo.pathElement.getPointAtLength(distanceAlongPath);
      const lookAheadPoint = arcInfo.pathElement.getPointAtLength(
        Math.min(distanceAlongPath + 1, pathLength)
      );
      const angleRadians = Math.atan2(
        lookAheadPoint.y - pathPoint.y,
        lookAheadPoint.x - pathPoint.x
      );
      const angleDegrees = (angleRadians * 180) / Math.PI;
      arcInfo.markerElement.setAttribute(
        'transform',
        `translate(${pathPoint.x},${pathPoint.y}) rotate(${angleDegrees})`
      );
    });

    ambientFrameId = requestAnimationFrame(animateAmbientMarkers);
  }

  function startAmbientAnimation() {
    if (prefersReducedMotion()) {
      return;
    }
    if (ambientFrameId !== null) {
      return;
    }
    ambientStartTime = null;
    ambientFrameId = requestAnimationFrame(animateAmbientMarkers);
  }

  function stopAmbientAnimation() {
    if (ambientFrameId !== null) {
      cancelAnimationFrame(ambientFrameId);
      ambientFrameId = null;
    }
    ambientArcs.forEach((arcInfo) => {
      if (arcInfo.markerElement) {
        arcInfo.markerElement.setAttribute('transform', 'translate(-100,-100)');
      }
    });
  }

  function tweenCamera(targetViewBox, durationMs, onComplete) {
    if (cameraFrameId !== null) {
      cancelAnimationFrame(cameraFrameId);
      cameraFrameId = null;
    }
    if (prefersReducedMotion()) {
      updateSvgViewBox(targetViewBox);
      if (onComplete) {
        onComplete();
      }
      return;
    }
    const fromViewBox = { ...currentViewBox };
    let cameraStartTime = null;

    function animateCameraStep(timestamp) {
      if (cameraStartTime === null) {
        cameraStartTime = timestamp;
      }
      const elapsed = timestamp - cameraStartTime;
      const rawProgress = clamp(elapsed / durationMs, 0, 1);
      const easedProgress = easeOutCubic(rawProgress);
      const interpolated = lerpViewBox(fromViewBox, targetViewBox, easedProgress);
      updateSvgViewBox(interpolated);
      if (rawProgress < 1) {
        cameraFrameId = requestAnimationFrame(animateCameraStep);
      } else {
        cameraFrameId = null;
        if (onComplete) {
          onComplete();
        }
      }
    }

    cameraFrameId = requestAnimationFrame(animateCameraStep);
  }

  function buildRoutePin(point, placeName, isEndPin) {
    const pinGroup = createSvgElement('g', {
      class: 'route-map__pin',
      transform: `translate(${point.x},${point.y})`,
    });

    const ringClass = isEndPin
      ? 'route-map__pin-ring route-map__pin-ring--end'
      : 'route-map__pin-ring';
    const centreClass = isEndPin
      ? 'route-map__pin-centre route-map__pin-centre--end'
      : 'route-map__pin-centre';

    const outerRing = createSvgElement('circle', {
      cx: '0',
      cy: '0',
      r: '7',
      class: ringClass,
    });

    const innerDot = createSvgElement('circle', {
      cx: '0',
      cy: '0',
      r: '3',
      class: centreClass,
    });

    const scaleGroup = createSvgElement('g', {
      class: 'route-map__pin-scale',
    });
    scaleGroup.appendChild(outerRing);
    scaleGroup.appendChild(innerDot);
    pinGroup.appendChild(scaleGroup);

    const chipGroup = createSvgElement('g', {
      class: 'route-map__chip',
    });

    const chipText = createSvgElement('text', {
      class: 'route-map__chip-text',
      'text-anchor': 'middle',
      'dominant-baseline': 'central',
    });
    chipText.textContent = placeName;

    const estimatedTextWidth = placeName.length * 6.5;
    const chipPaddingX = 8;
    const chipWidth = estimatedTextWidth + chipPaddingX * 2;
    const chipHeight = 18;
    const chipXOffset = -chipWidth / 2;
    const chipYOffset = -18;

    const chipBackground = createSvgElement('rect', {
      x: String(chipXOffset),
      y: String(chipYOffset - chipHeight / 2),
      width: String(chipWidth),
      height: String(chipHeight),
      class: 'route-map__chip-bg',
    });

    chipText.setAttribute('x', String(chipXOffset + chipWidth / 2));
    chipText.setAttribute('y', String(chipYOffset));

    const chipScale = createSvgElement('g', {
      class: 'route-map__chip-scale',
    });
    chipScale.appendChild(chipBackground);
    chipScale.appendChild(chipText);
    chipGroup.appendChild(chipScale);
    pinGroup.appendChild(chipGroup);

    return pinGroup;
  }

  function markEndpoints(fromPlaceId, toPlaceId) {
    clearEndpoints();
    const idsToMark = [fromPlaceId, toPlaceId];
    idsToMark.forEach((placeId) => {
      const placeData = placeGroups.get(placeId);
      if (placeData) {
        placeData.groupElement.classList.add('is-route-endpoint');
        activeEndpointIds.push(placeId);
      }
    });
  }

  function clearEndpoints() {
    activeEndpointIds.forEach((placeId) => {
      const placeData = placeGroups.get(placeId);
      if (placeData) {
        placeData.groupElement.classList.remove('is-route-endpoint');
      }
    });
    activeEndpointIds = [];
  }

  function animateRouteVehicle(routePathElement, durationMs) {
    if (routeFrameId !== null) {
      cancelAnimationFrame(routeFrameId);
      routeFrameId = null;
    }
    if (prefersReducedMotion()) {
      return;
    }

    const vehicleGroup = createSvgElement('g', { class: 'route-map__vehicle-marker' });

    const mainChevron = buildSmallChevron(6);
    mainChevron.setAttribute('class', 'route-map__vehicle-chevron');
    vehicleGroup.appendChild(mainChevron);

    const ghostChevrons = [];
    for (let ghostIndex = 0; ghostIndex < 3; ghostIndex += 1) {
      const ghostChevron = buildSmallChevron(5);
      ghostChevron.setAttribute('class', 'route-map__vehicle-ghost');
      vehicleGroup.appendChild(ghostChevron);
      ghostChevrons.push(ghostChevron);
    }

    routeLayer.appendChild(vehicleGroup);

    let vehicleStartTime = null;

    function animateVehicleStep(timestamp) {
      if (vehicleStartTime === null) {
        vehicleStartTime = timestamp;
      }
      const elapsed = timestamp - vehicleStartTime;
      const rawProgress = (elapsed % durationMs) / durationMs;
      const easedProgress = easeInOutCubic(rawProgress);
      const pathLength = routePathElement.getTotalLength();
      const currentDistance = easedProgress * pathLength;
      const currentPoint = routePathElement.getPointAtLength(currentDistance);
      const lookAheadPoint = routePathElement.getPointAtLength(
        Math.min(currentDistance + 1, pathLength)
      );
      const angleRadians = Math.atan2(
        lookAheadPoint.y - currentPoint.y,
        lookAheadPoint.x - currentPoint.x
      );
      const angleDegrees = (angleRadians * 180) / Math.PI;

      mainChevron.setAttribute(
        'transform',
        `translate(${currentPoint.x},${currentPoint.y}) rotate(${angleDegrees})`
      );

      ghostChevrons.forEach((ghostElement, ghostIdx) => {
        const ghostDistance = Math.max(0, currentDistance - (ghostIdx + 1) * 12);
        const ghostPoint = routePathElement.getPointAtLength(ghostDistance);
        const ghostLookAhead = routePathElement.getPointAtLength(
          Math.min(ghostDistance + 1, pathLength)
        );
        const ghostAngle =
          (Math.atan2(ghostLookAhead.y - ghostPoint.y, ghostLookAhead.x - ghostPoint.x) * 180) /
          Math.PI;
        ghostElement.setAttribute(
          'transform',
          `translate(${ghostPoint.x},${ghostPoint.y}) rotate(${ghostAngle})`
        );
      });

      routeFrameId = requestAnimationFrame(animateVehicleStep);
    }

    routeFrameId = requestAnimationFrame(animateVehicleStep);
  }

  function setRoute(fromPlace, toPlace) {
    if (!fromPlace || !toPlace) {
      clearRoute();
      return;
    }

    if (currentRouteElements) {
      clearRouteElements();
    }

    const startPoint = projectLatLon(fromPlace.lat, fromPlace.lon);
    const endPoint = projectLatLon(toPlace.lat, toPlace.lon);

    markEndpoints(fromPlace.id, toPlace.id);

    if (fromPlace.id === toPlace.id) {
      const pulseRing = createSvgElement('circle', {
        cx: String(startPoint.x),
        cy: String(startPoint.y),
        r: '6',
        class: 'route-map__ring',
      });
      routeLayer.appendChild(pulseRing);
      currentRouteElements = { nodes: [pulseRing] };
      return;
    }

    const arcData = buildQuadraticArc(startPoint, endPoint, 0.14);

    const glowPath = createSvgElement('path', {
      d: arcData.pathData,
      class: 'route-map__route-glow',
      filter: `url(#${GLOW_FILTER_ID})`,
    });

    const routePath = createSvgElement('path', {
      d: arcData.pathData,
      class: 'route-map__route',
    });

    routeLayer.appendChild(glowPath);
    routeLayer.appendChild(routePath);

    const totalLength = routePath.getTotalLength();
    if (!prefersReducedMotion()) {
      routePath.style.strokeDasharray = String(totalLength);
      routePath.style.strokeDashoffset = String(totalLength);
      glowPath.style.strokeDasharray = String(totalLength);
      glowPath.style.strokeDashoffset = String(totalLength);

      let drawStartTime = null;

      function animateDrawStep(timestamp) {
        if (drawStartTime === null) {
          drawStartTime = timestamp;
        }
        const elapsed = timestamp - drawStartTime;
        const drawProgress = clamp(elapsed / 900, 0, 1);
        const easedDraw = easeOutCubic(drawProgress);
        const currentOffset = totalLength * (1 - easedDraw);
        routePath.style.strokeDashoffset = String(currentOffset);
        glowPath.style.strokeDashoffset = String(currentOffset);
        if (drawProgress < 1) {
          requestAnimationFrame(animateDrawStep);
        }
      }

      requestAnimationFrame(animateDrawStep);
    }

    ambientLayer.style.opacity = '0.15';

    const fitViewBox = computeFitViewBox(startPoint, endPoint, hostElement, fullViewBox);
    const startPin = buildRoutePin(startPoint, fromPlace.name, false);
    const endPin = buildRoutePin(endPoint, toPlace.name, true);
    routeLayer.appendChild(startPin);
    routeLayer.appendChild(endPin);

    tweenCamera(fitViewBox, 700);
    animateRouteVehicle(routePath, 3600);

    currentRouteElements = {
      nodes: [glowPath, routePath, startPin, endPin],
    };
  }

  function clearRouteElements() {
    if (routeFrameId !== null) {
      cancelAnimationFrame(routeFrameId);
      routeFrameId = null;
    }
    while (routeLayer.firstChild) {
      routeLayer.removeChild(routeLayer.firstChild);
    }
    currentRouteElements = null;
  }

  function clearRoute() {
    clearRouteElements();
    clearEndpoints();
    ambientLayer.style.opacity = '1';
    tweenCamera(fullViewBox, 700);
  }

  function setAmbient(isEnabled) {
    ambientEnabled = isEnabled;
    if (isEnabled) {
      startAmbientAnimation();
    } else {
      stopAmbientAnimation();
    }
  }

  function focusPlace(placeId) {
    const placeData = placeGroups.get(placeId);
    if (!placeData) {
      return;
    }
    const pulseRing = createSvgElement('circle', {
      cx: String(placeData.point.x),
      cy: String(placeData.point.y),
      r: '4',
      class: 'route-map__focus-pulse',
    });
    placesLayer.appendChild(pulseRing);
    setTimeout(() => {
      if (pulseRing.parentNode) {
        pulseRing.parentNode.removeChild(pulseRing);
      }
    }, 900);
  }

  function handleVisibilityChange() {
    isDocumentVisible = !document.hidden;
    if (isDocumentVisible && ambientEnabled && isVisible) {
      startAmbientAnimation();
    } else if (!isDocumentVisible) {
      stopAmbientAnimation();
    }
  }

  document.addEventListener('visibilitychange', handleVisibilityChange);

  intersectionObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        isVisible = entry.isIntersecting;
        if (isVisible && ambientEnabled && isDocumentVisible) {
          startAmbientAnimation();
        } else if (!isVisible) {
          stopAmbientAnimation();
        }
      });
    },
    { threshold: 0.1 }
  );
  intersectionObserver.observe(containerDiv);

  if (ambientEnabled) {
    startAmbientAnimation();
  }

  function destroy() {
    stopAmbientAnimation();
    if (routeFrameId !== null) {
      cancelAnimationFrame(routeFrameId);
      routeFrameId = null;
    }
    if (cameraFrameId !== null) {
      cancelAnimationFrame(cameraFrameId);
      cameraFrameId = null;
    }
    if (intersectionObserver) {
      intersectionObserver.disconnect();
      intersectionObserver = null;
    }
    document.removeEventListener('visibilitychange', handleVisibilityChange);
    if (containerDiv.parentNode) {
      containerDiv.parentNode.removeChild(containerDiv);
    }
  }

  return {
    setRoute,
    clearRoute,
    setAmbient,
    focusPlace,
    destroy,
  };
}
