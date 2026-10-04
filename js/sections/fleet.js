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
import {
  FLEET,
  STANDARD_PALLET_CM,
  recommendVehicle,
  getVehicle,
  formatMetres,
} from '../data/fleet.js';

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

  const activeTab = null;
  const lazyFilled = new Set();

  function selectVehicle(vehicleId, source = 'fleet', focusTab = false) {
    const tab = Array.from(tabs).find((t) => t.dataset.vehicle === vehicleId);
    if (!tab) {
      return;
    }

    for (const t of tabs) {
      t.setAttribute('aria-selected', t === tab ? 'true' : 'false');
      t.tabIndex = t === tab ? 0 : -1;
    }

    for (const bar of ladderBars) {
      if (bar.dataset.vehicle === vehicleId) {
        bar.classList.add('is-active');
      } else {
        bar.classList.remove('is-active');
      }
    }

    for (const panel of panels) {
      if (panel.id === tab.getAttribute('aria-controls')) {
        panel.removeAttribute('hidden');
        fillPanelLazily(panel, vehicleId);

        const artEl = qs('.fleet__vehicle', panel);
        if (artEl) {
          artEl.classList.remove('is-visible');
          void artEl.offsetWidth;
          artEl.classList.add('is-visible');
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
        for (let i = 0; i < palletsNodes.length; i++) {
          setTimeout(
            () => {
              palletsNodes[i].classList.add('is-visible');
            },
            i * 40 + 100
          );
        }
      } else {
        for (let i = 0; i < palletsNodes.length; i++) {
          palletsNodes[i].classList.add('is-visible');
        }
      }
    }
  }

  function buildBaySvg(vehicle) {
    const l = vehicle.lengthCm;
    const w = vehicle.widthCm;
    const padding = 60;
    const svgW = l + padding * 2;
    const svgH = w + padding * 2;

    const svg = createSvgElement('svg', {
      viewBox: `0 0 ${svgW} ${svgH}`,
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
      width: String(l),
      height: String(w),
      fill: 'transparent',
      stroke: 'var(--blue-400)',
      'stroke-width': '2',
      'stroke-dasharray': '4 4',
    });
    svg.appendChild(bayRect);

    const pL = STANDARD_PALLET_CM.length;
    const pW = STANDARD_PALLET_CM.width;

    const along1 = pL;
    const across1 = pW;
    const cap1 = Math.floor(l / along1) * Math.floor(w / across1);

    const along2 = pW;
    const across2 = pL;
    const cap2 = Math.floor(l / along2) * Math.floor(w / across2);

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

    const cols = Math.floor(l / along);
    const rows = Math.floor(w / across);

    let drawn = 0;
    for (let c = 0; c < cols && drawn < vehicle.pallets; c++) {
      for (let r = 0; r < rows && drawn < vehicle.pallets; r++) {
        const clusterH = rows * across;
        const startY = yOffset + (w - clusterH) / 2;
        const px = xOffset + c * along;
        const py = startY + r * across;
        const gap = 2;

        const palletRect = createSvgElement('rect', {
          x: String(px + gap),
          y: String(py + gap),
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

    const fontSize = Math.max(12, Math.round(svgW * 0.035));

    const yL = yOffset + w + 16;
    const pathL = createSvgElement('path', {
      d: `M${xOffset},${yL - 6} L${xOffset},${yL} L${xOffset + l},${yL} L${xOffset + l},${yL - 6}`,
      stroke: 'var(--ink-400)',
      fill: 'none',
      'stroke-width': '1.5',
    });
    const textL = createSvgElement('text', {
      x: String(xOffset + l / 2),
      y: String(yL + fontSize + 4),
      fill: 'var(--white)',
      'font-size': String(fontSize),
      'text-anchor': 'middle',
    });
    textL.textContent = `${formatMetres(l)} m length`;
    svg.appendChild(pathL);
    svg.appendChild(textL);

    const xW = xOffset + l + 16;
    const pathW = createSvgElement('path', {
      d: `M${xW - 6},${yOffset} L${xW},${yOffset} L${xW},${yOffset + w} L${xW - 6},${yOffset + w}`,
      stroke: 'var(--ink-400)',
      fill: 'none',
      'stroke-width': '1.5',
    });
    const textW = createSvgElement('text', {
      x: String(xW + 8),
      y: String(yOffset + w / 2 + fontSize * 0.35),
      fill: 'var(--white)',
      'font-size': String(fontSize),
      'text-anchor': 'start',
    });
    textW.textContent = `${formatMetres(w)} m width`;
    svg.appendChild(pathW);
    svg.appendChild(textW);

    return svg;
  }

  function handleFinderChange() {
    const p = Number(palletsInput.value) || 0;
    const w = Number(weightInput.value) || 0;

    const recommended = recommendVehicle(p, w);

    for (const tab of tabs) {
      tab.classList.remove('is-recommended');
    }
    for (const bar of ladderBars) {
      bar.classList.remove('is-recommended');
    }

    if (p === 0 && w === 0) {
      resultArea.innerHTML = '';
      return;
    }

    if (recommended) {
      const tab = Array.from(tabs).find((t) => t.dataset.vehicle === recommended.id);
      if (tab) {
        tab.classList.add('is-recommended');
      }

      const bar = Array.from(ladderBars).find((b) => b.dataset.vehicle === recommended.id);
      if (bar) {
        bar.classList.add('is-recommended');
      }

      resultArea.innerHTML = '';
      const pText = createElement('p', {
        text: `Best match: ${recommended.name}. Carries up to ${formatNumber(recommended.pallets)} pallet${recommended.pallets === 1 ? '' : 's'} and ${formatNumber(recommended.payloadKg)} kg.`,
      });
      const btn = createElement('button', {
        className: 'btn btn--primary fleet__finder-btn',
        text: 'See it in the fleet',
        dataset: { vehicle: recommended.id },
      });
      btn.addEventListener('click', () => {
        selectVehicle(recommended.id, 'fleet', true);
      });
      resultArea.appendChild(pText);
      resultArea.appendChild(btn);
    } else {
      resultArea.innerHTML =
        '<p>That is beyond a single 26T. Contact the team and we will plan it with you.</p>';
    }

    quoteStore.update({ pallets: p, weightKg: w || null }, 'fleet');
  }

  tablist.addEventListener('keydown', (e) => {
    const tabsArr = Array.from(tabs);
    const currentIndex = tabsArr.findIndex((t) => t.tabIndex === 0);
    let newIndex = currentIndex;

    if (e.key === 'ArrowRight') {
      newIndex = (currentIndex + 1) % tabsArr.length;
    } else if (e.key === 'ArrowLeft') {
      newIndex = (currentIndex - 1 + tabsArr.length) % tabsArr.length;
    } else if (e.key === 'Home') {
      newIndex = 0;
    } else if (e.key === 'End') {
      newIndex = tabsArr.length - 1;
    }

    if (newIndex !== currentIndex) {
      e.preventDefault();
      const newTab = tabsArr[newIndex];
      selectVehicle(newTab.dataset.vehicle, 'fleet', true);
    }
  });

  for (const tab of tabs) {
    tab.addEventListener('click', () => {
      selectVehicle(tab.dataset.vehicle, 'fleet', true);
    });
  }

  for (const bar of ladderBars) {
    bar.addEventListener('click', () => {
      selectVehicle(bar.dataset.vehicle, 'fleet', true);
      const tab = Array.from(tabs).find((t) => t.dataset.vehicle === bar.dataset.vehicle);
      if (tab) {
        tab.focus();
      }
    });
  }

  const unsubscribe = quoteStore.subscribe((state, changedKeys, source) => {
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
