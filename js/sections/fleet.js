import {
  qs,
  qsa,
  createSvgElement,
  createElement,
  prefersReducedMotion,
  formatNumber,
} from '../lib/dom.js';
import { trackEvent } from '../lib/analytics.js';
import { quoteStore } from '../lib/quote-store.js';
import { renderVehicleSvg } from '../lib/vehicle-art.js';
import { attachStepper } from '../lib/stepper.js';
import { STANDARD_PALLET_CM, recommendVehicle, getVehicle, formatMetres } from '../data/fleet.js';

export function initFleet() {
  const root = qs('[data-section="fleet"]');
  if (!root) {
    return;
  }

  const tablist = qs('[data-js="fleet-tablist"]', root);
  const tabs = qsa('[data-js="fleet-tab"]', root);
  const panels = qsa('[role="tabpanel"]', root);
  const ladderBars = qsa('.fleet__ladder-bar', root);

  const palletsInput = qs('#fleet-finder-pallets', root);
  const weightInput = qs('#fleet-finder-weight', root);
  const resultArea = qs('[data-js="finder-result"]', root);

  const stepperRoot = qs('[data-js="stepper"]', root);
  if (stepperRoot) {
    attachStepper(stepperRoot, {
      onChange: handleFinderChange,
    });
  }

  if (weightInput) {
    weightInput.addEventListener('input', handleFinderChange);
  }

  const lazyFilled = new Set();

  function selectVehicle(vehicleId, source = 'fleet', focusTab = false) {
    const tab = Array.from(tabs).find((tabButton) => tabButton.dataset.vehicle === vehicleId);
    if (!tab) {
      return;
    }

    for (const tabButton of tabs) {
      tabButton.setAttribute('aria-selected', tabButton === tab ? 'true' : 'false');
      tabButton.tabIndex = tabButton === tab ? 0 : -1;
    }

    for (const ladderButton of ladderBars) {
      if (ladderButton.dataset.vehicle === vehicleId) {
        ladderButton.classList.add('is-active');
      } else {
        ladderButton.classList.remove('is-active');
      }
    }

    for (const panel of panels) {
      if (panel.id === tab.getAttribute('aria-controls')) {
        panel.removeAttribute('hidden');
        fillPanelLazily(panel, vehicleId);

        const artElement = qs('.fleet__vehicle', panel);
        if (artElement) {
          artElement.classList.remove('is-visible');
          void artElement.offsetWidth;
          artElement.classList.add('is-visible');
        }
      } else {
        panel.setAttribute('hidden', '');
      }
    }

    if (focusTab) {
      tab.focus();
    }

    if (source === 'fleet') {
      trackEvent('vehicle_selected', { vehicle_id: vehicleId });
      quoteStore.update({ vehicleId }, 'fleet');
    }
  }

  function fillPanelLazily(panel, vehicleId) {
    if (lazyFilled.has(vehicleId)) {
      return;
    }
    lazyFilled.add(vehicleId);

    const vehicle = getVehicle(vehicleId);
    if (!vehicle) {
      return;
    }

    const artContainer = qs('[data-js="fleet-art"]', panel);
    const bayContainer = qs('[data-js="fleet-bay"]', panel);

    if (artContainer) {
      artContainer.innerHTML = renderVehicleSvg(vehicleId, {
        className: 'fleet__vehicle is-visible',
        title: vehicle.name,
      });

      const svg = qs('svg', artContainer);
      if (svg) {
        const wrapper = createSvgElement('g');
        const children = Array.from(svg.childNodes);
        for (const child of children) {
          if (child.nodeName !== 'title') {
            wrapper.appendChild(child);
          }
        }
        svg.appendChild(wrapper);

        const bbox = wrapper.getBBox();
        const padding = 28;
        let boxWidth = bbox.width + padding * 2;
        let boxX = bbox.x - padding;
        if (boxWidth < 340) {
          boxX = boxX - (340 - boxWidth) / 2;
          boxWidth = 340;
        }
        const boxY = bbox.y - padding;
        const boxHeight = bbox.height + padding * 2;

        svg.setAttribute('viewBox', `${boxX} ${boxY} ${boxWidth} ${boxHeight}`);
        svg.setAttribute('preserveAspectRatio', 'xMidYMax meet');
      }
    }

    if (bayContainer) {
      const baySvg = buildBaySvg(vehicle);
      const caption = createElement('p', {
        className: 'fleet__bay-caption',
        text: `Carries up to ${formatNumber(vehicle.pallets)} standard UK pallet${vehicle.pallets === 1 ? '' : 's'}`,
      });
      bayContainer.appendChild(baySvg);
      bayContainer.appendChild(caption);

      const palletsNodes = qsa('.fleet__pallet', baySvg);
      if (!prefersReducedMotion()) {
        for (let index = 0; index < palletsNodes.length; index++) {
          setTimeout(
            () => {
              palletsNodes[index].classList.add('is-visible');
            },
            index * 40 + 100
          );
        }
      } else {
        for (let index = 0; index < palletsNodes.length; index++) {
          palletsNodes[index].classList.add('is-visible');
        }
      }
    }
  }

  function buildBaySvg(vehicle) {
    const vehicleLength = vehicle.lengthCm;
    const vehicleWidth = vehicle.widthCm;
    const padding = 60;
    const paddingRight = 90;
    const svgWidth = vehicleLength + padding + paddingRight;
    const svgHeight = vehicleWidth + padding * 2;

    const svg = createSvgElement('svg', {
      viewBox: `0 0 ${svgWidth} ${svgHeight}`,
      className: 'fleet__bay-svg',
      aria: { hidden: 'true' },
    });

    const defs = createSvgElement('defs');
    const pattern = createSvgElement('pattern', {
      id: `pallet-slat-${vehicle.id}`,
      width: '20',
      height: '20',
      patternUnits: 'userSpaceOnUse',
    });
    const slatBg = createSvgElement('rect', {
      width: '20',
      height: '20',
      fill: 'var(--plum-300)',
      opacity: '0.35',
    });
    const slatLine = createSvgElement('line', {
      x1: '0',
      y1: '0',
      x2: '0',
      y2: '20',
      stroke: 'var(--ink-900)',
      'stroke-width': '1',
      opacity: '0.1',
    });
    pattern.appendChild(slatBg);
    pattern.appendChild(slatLine);
    defs.appendChild(pattern);
    svg.appendChild(defs);

    const xOffset = padding;
    const yOffset = padding;

    const bayRect = createSvgElement('rect', {
      x: String(xOffset),
      y: String(yOffset),
      width: String(vehicleLength),
      height: String(vehicleWidth),
      fill: 'transparent',
      stroke: 'var(--blue-400)',
      'stroke-width': '2',
      'stroke-dasharray': '4 4',
    });
    svg.appendChild(bayRect);

    const palletLength = STANDARD_PALLET_CM.length;
    const palletWidth = STANDARD_PALLET_CM.width;

    const along1 = palletLength;
    const across1 = palletWidth;
    const cap1 = Math.floor(vehicleLength / along1) * Math.floor(vehicleWidth / across1);

    const along2 = palletWidth;
    const across2 = palletLength;
    const cap2 = Math.floor(vehicleLength / along2) * Math.floor(vehicleWidth / across2);

    let along;
    let across;

    if (cap1 >= vehicle.pallets && cap2 >= vehicle.pallets) {
      if (cap1 < cap2) {
        along = along1;
        across = across1;
      } else if (cap2 < cap1) {
        along = along2;
        across = across2;
      } else {
        along = along1;
        across = across1;
      }
    } else if (cap1 >= vehicle.pallets) {
      along = along1;
      across = across1;
    } else {
      along = along2;
      across = across2;
    }

    const cols = Math.floor(vehicleLength / along);
    const rows = Math.floor(vehicleWidth / across);

    let drawn = 0;
    for (let colIndex = 0; colIndex < cols && drawn < vehicle.pallets; colIndex++) {
      for (let rowIndex = 0; rowIndex < rows && drawn < vehicle.pallets; rowIndex++) {
        const clusterHeight = rows * across;
        const startY = yOffset + (vehicleWidth - clusterHeight) / 2;
        const palletX = xOffset + colIndex * along;
        const palletY = startY + rowIndex * across;
        const gap = 2;

        const palletRect = createSvgElement('rect', {
          x: String(palletX + gap),
          y: String(palletY + gap),
          width: String(along - gap * 2),
          height: String(across - gap * 2),
          rx: '4',
          fill: `url(#pallet-slat-${vehicle.id})`,
          stroke: 'var(--plum-400)',
          'stroke-width': '1',
          className: 'fleet__pallet',
        });
        svg.appendChild(palletRect);
        drawn++;
      }
    }

    const fontSize = Math.max(12, Math.round(svgWidth * 0.035));

    const yLength = yOffset + vehicleWidth + 16;
    const lengthPath = createSvgElement('path', {
      d: `M${xOffset},${yLength - 6} L${xOffset},${yLength} L${xOffset + vehicleLength},${yLength} L${xOffset + vehicleLength},${yLength - 6}`,
      stroke: 'var(--ink-400)',
      fill: 'none',
      'stroke-width': '1.5',
    });
    const lengthText = createSvgElement('text', {
      x: String(xOffset + vehicleLength / 2),
      y: String(yLength + fontSize + 4),
      fill: 'var(--white)',
      'font-size': String(fontSize),
      'text-anchor': 'middle',
    });
    lengthText.textContent = `${formatMetres(vehicleLength)} m`;
    const lengthSubText = createSvgElement('text', {
      x: String(xOffset + vehicleLength / 2),
      y: String(yLength + fontSize + 4 + fontSize * 1.2),
      fill: 'var(--ink-300)',
      'font-size': String(Math.round(fontSize * 0.8)),
      'text-anchor': 'middle',
    });
    lengthSubText.textContent = 'length';
    svg.appendChild(lengthPath);
    svg.appendChild(lengthText);
    svg.appendChild(lengthSubText);

    const xWidth = xOffset + vehicleLength + 16;
    const widthPath = createSvgElement('path', {
      d: `M${xWidth - 6},${yOffset} L${xWidth},${yOffset} L${xWidth},${yOffset + vehicleWidth} L${xWidth - 6},${yOffset + vehicleWidth}`,
      stroke: 'var(--ink-400)',
      fill: 'none',
      'stroke-width': '1.5',
    });
    const widthText = createSvgElement('text', {
      x: String(xWidth + 8),
      y: String(yOffset + vehicleWidth / 2 - fontSize * 0.2),
      fill: 'var(--white)',
      'font-size': String(fontSize),
      'text-anchor': 'start',
    });
    widthText.textContent = `${formatMetres(vehicleWidth)} m`;
    const widthSubText = createSvgElement('text', {
      x: String(xWidth + 8),
      y: String(yOffset + vehicleWidth / 2 + fontSize),
      fill: 'var(--ink-300)',
      'font-size': String(Math.round(fontSize * 0.8)),
      'text-anchor': 'start',
    });
    widthSubText.textContent = 'width';
    svg.appendChild(widthPath);
    svg.appendChild(widthText);
    svg.appendChild(widthSubText);

    return svg;
  }

  function handleFinderChange() {
    const palletsValue = Number(palletsInput.value) || 0;
    const weightValue = Number(weightInput.value) || 0;

    const recommended = recommendVehicle(palletsValue, weightValue);

    for (const tabButton of tabs) {
      tabButton.classList.remove('is-recommended');
    }
    for (const ladderButton of ladderBars) {
      ladderButton.classList.remove('is-recommended');
    }

    if (palletsValue === 0 && weightValue === 0) {
      resultArea.innerHTML = '';
      return;
    }

    if (recommended) {
      const tabButton = Array.from(tabs).find(
        (button) => button.dataset.vehicle === recommended.id
      );
      if (tabButton) {
        tabButton.classList.add('is-recommended');
      }

      const ladderButton = Array.from(ladderBars).find(
        (bar) => bar.dataset.vehicle === recommended.id
      );
      if (ladderButton) {
        ladderButton.classList.add('is-recommended');
      }

      resultArea.innerHTML = '';
      const paragraphElement = createElement('p', {
        text: `Best match: ${recommended.name}. Carries up to ${formatNumber(recommended.pallets)} pallet${recommended.pallets === 1 ? '' : 's'} and ${formatNumber(recommended.payloadKg)} kg.`,
      });
      const finderButton = createElement('button', {
        className: 'btn btn--primary fleet__finder-btn',
        text: 'See it in the fleet',
        dataset: { vehicle: recommended.id },
      });
      finderButton.addEventListener('click', () => {
        selectVehicle(recommended.id, 'fleet', true);
      });
      resultArea.appendChild(paragraphElement);
      resultArea.appendChild(finderButton);
    } else {
      resultArea.innerHTML =
        '<p>That is beyond a single 26T. Contact the team and we will plan it with you.</p>';
    }

    quoteStore.update({ pallets: palletsValue, weightKg: weightValue || null }, 'fleet');
  }

  tablist.addEventListener('keydown', (keyboardEvent) => {
    const tabsArr = Array.from(tabs);
    const currentIndex = tabsArr.findIndex((tabButton) => tabButton.tabIndex === 0);
    let newIndex = currentIndex;

    if (keyboardEvent.key === 'ArrowRight') {
      newIndex = (currentIndex + 1) % tabsArr.length;
    } else if (keyboardEvent.key === 'ArrowLeft') {
      newIndex = (currentIndex - 1 + tabsArr.length) % tabsArr.length;
    } else if (keyboardEvent.key === 'Home') {
      newIndex = 0;
    } else if (keyboardEvent.key === 'End') {
      newIndex = tabsArr.length - 1;
    }

    if (newIndex !== currentIndex) {
      keyboardEvent.preventDefault();
      const newTab = tabsArr[newIndex];
      selectVehicle(newTab.dataset.vehicle, 'fleet', true);
    }
  });

  for (const tabButton of tabs) {
    tabButton.addEventListener('click', () => {
      selectVehicle(tabButton.dataset.vehicle, 'fleet', true);
    });
  }

  for (const ladderButton of ladderBars) {
    ladderButton.addEventListener('click', () => {
      selectVehicle(ladderButton.dataset.vehicle, 'fleet', true);
      const tabButton = Array.from(tabs).find(
        (button) => button.dataset.vehicle === ladderButton.dataset.vehicle
      );
      if (tabButton) {
        tabButton.focus();
      }
    });
  }

  quoteStore.subscribe((state, changedKeys, source) => {
    if (source !== 'fleet' && changedKeys.includes('vehicleId') && state.vehicleId) {
      selectVehicle(state.vehicleId, source, false);
    }
  });

  const state = quoteStore.getState();
  if (state.vehicleId) {
    selectVehicle(state.vehicleId, 'init', false);
  } else {
    selectVehicle('lwb', 'init', false);
  }
}
