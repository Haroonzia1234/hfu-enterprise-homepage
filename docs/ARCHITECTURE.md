# HFU Enterprise homepage: architecture and design system

This document is the single source of truth for how the homepage is built. Every section, script
and stylesheet follows it so the pieces fit together.

## 1. Concept: "Route Board"

HFU's mark is a forward chevron split in two colours. Blue means speed, plum means reliability.
The homepage is built as a dispatch board: one continuous route with a numbered stop per section.

Signature ideas (all must be visible in the final page):

1. The hero IS the quote tool. A route planner (from, to, service, load) draws the journey on an
   interactive UK map and recommends a vehicle from HFU's real fleet, then hands everything to the
   quote form with one click.
2. Section eyebrows are route stops: a small chevron plus a two digit stop number, for example
   `02 Fleet`.
3. The chevron is the only decorative shape. It appears as button arrows, list bullets, map
   markers, travelling vehicle markers, progress heads and slanted section edges.
4. Dark "ink boards" (rounded dark panels) hold every interactive instrument: the map, the fleet
   bay, the weekly run builder, the coverage radar. Paper sections hold the reading content.
5. Everything interactive carries real HFU data: real fleet dimensions, real services, real
   collection slots (4:15 am to 11:45 pm), real local areas, real contact details.

## 2. Design tokens

All tokens live in `src/css/tokens.css`. Never hard code a colour, font, radius, shadow or spacing
value that has a token.

Colours:

| Role | Token | Value |
| --- | --- | --- |
| Page background | `--paper` | `#f4f2ee` |
| Alternate background | `--paper-2` | `#ebe7df` |
| Cards, white sections | `--white` | `#ffffff` |
| Dark surfaces | `--ink-900`, `--ink-800`, `--ink-950` | `#0b1324`, `#121d35`, `#070c16` |
| Body text on light | `--ink-900` (strong), `--ink-500` (muted) | |
| Body text on dark | `--white` (strong), `--ink-200` (normal), `--ink-300` (muted) | |
| Brand blue | `--blue-500` (graphics, large text), `--blue-600` (text on light), `--blue-400` and `--blue-300` (on dark) | `#2781ba` |
| Brand plum | `--plum-500` (buttons, graphics on light), `--plum-600` (text on light), `--plum-400` and `--plum-300` (on dark) | `#a2356e` |
| Hairlines | `--line` on light, `--line-ink` on dark | |

Rules: primary buttons are plum with white text. Links and route lines are blue. On dark
backgrounds use `--blue-400` or `--plum-400` for accents, never `--plum-500` (contrast too low).
Muted text on light uses `--ink-500`, never `--ink-400`.

Typography:

- Display: `var(--font-display)` (Montserrat Variable). Headings use weight 800, italic,
  uppercase, line-height 0.98 to 1.05, letter-spacing -0.01em. Keep display text short, at most
  eight words, so uppercase italic stays readable. Numerals in stats use weight 800 upright.
- Body: `var(--font-body)` (Inter Variable). Weight 400 to 600. Line-height 1.55 to 1.7.
- Eyebrows: body font, weight 700, uppercase, `letter-spacing: 0.14em`, `--text-xs`.
- Use `font-variant-numeric: tabular-nums` on any number that changes.

Shape and depth:

- Radii: `--radius-sm` for inputs and chips, `--radius-md` for cards, `--radius-lg` for ink boards.
- Slanted sections use the recipe in section 6.
- Shadows only from `--shadow-sm`, `--shadow-md`, `--shadow-lg`.

Motion: ease with `--ease-out`, durations `--dur-fast`, `--dur-med`, `--dur-slow`. Every animation
must stop under `@media (prefers-reduced-motion: reduce)`. No animation may delay content from
being readable.

Breakpoints (mobile first, `min-width`): 640px, 860px, 1100px. Content max width is
`var(--container)` with `var(--gutter)` side padding.

## 3. Hard rules for all code

1. ASCII only in every file. No curly quotes, en or em dashes, arrows, multiplication signs,
   pound signs or emoji. Use `-`, `x`, `GBP`, or HTML entities such as `&pound;` and `&middot;`.
   In CSS use escapes such as `\2192` if a glyph is truly needed. Prefer SVG icons.
2. No comments anywhere: not in HTML, CSS or JavaScript. Names must explain the code.
3. JavaScript: ES modules, no frameworks, no dependencies, strict equality, `const` by default.
   Every `if`, `else`, `for` and `while` uses braces and the body goes on its own line:

   ```js
   if (isOpen) {
     closeMenu();
   }
   ```

4. Descriptive names only. Write `suggestionListElement`, `selectedPlace`, `routeDistanceMiles`.
   Never `el`, `e`, `i`, `m`, `st`, `cb`, `fn`, `tmp`, `res`. Loop with
   `for (const vehicle of FLEET)` or `forEach((vehicle) => ...)`.
5. Modules never touch the DOM at import time. All DOM work happens inside exported `init*`
   functions. This lets Node import every module to verify exports.
6. Never use `innerHTML` with any value that came from user input. Build nodes with
   `createElement` or `textContent`. `innerHTML` is allowed only for static, trusted markup
   (for example SVG strings from `vehicle-art.js`).
7. Prettier formatting (config in `.prettierrc`): 2 spaces, single quotes, semicolons, 100 columns.
8. CSS: mobile first, BEM class names (`block__element--modifier`), no ids in selectors, no
   `!important` (the only exception is the reduced motion reset), logical properties welcome.
9. Accessibility: WCAG 2.2 AA. Semantic landmarks, one `h1`, ordered headings, visible
   `:focus-visible`, 44px minimum tap targets, labels for every control, `aria-live` for dynamic
   results, keyboard support for every widget, `prefers-reduced-motion` respected.
10. Content: UK English (colour, organise, customise). Only use facts from `js/data/*.js` and
    `docs/CONTENT.md`. Never invent prices, certifications, insurance claims, awards, ratings,
    review counts, client names, delivery guarantees or tracking features beyond "real time
    tracking and updates". If a fact is not in the data files, leave it out.
11. Performance: no external requests, no images except inline SVG, no layout shift, transitions
    only on `transform` and `opacity` where possible.
12. Section scripts must fail soft: if an expected element is missing, return without throwing.

## 4. File map and ownership

```
index.html                    generated by scripts/build.mjs, committed for GitHub Pages
css/styles.css                generated by scripts/build.mjs
js/main.js                    entry module
js/lib/*.js                   shared libraries
js/data/*.js                  facts and datasets
js/sections/*.js              one module per section
src/template.html             document shell with {{> name}} include markers
src/sections/*.html           one partial per section
src/css/*.css                 fonts, tokens, base, components, utilities
src/css/sections/*.css        one stylesheet per section
scripts/                      build, serve, check
assets/                       fonts and images
```

Section partials, in page order: `sprite`, `header`, `hero`, `stats`, `services`, `fleet`, `how`,
`business`, `coverage`, `why`, `reviews`, `quote`, `faq`, `footer`.

Matching section stylesheet names: `header`, `hero`, `route-map`, `stats`, `services`, `fleet`,
`how`, `business`, `coverage`, `why`, `reviews`, `quote`, `faq`, `footer`.

CSS bundle order: `fonts`, `tokens`, `base`, `components`, `utilities`, then the section files in the
order above.

## 5. Build

`node scripts/build.mjs` replaces every `{{> name}}` in `src/template.html` with
`src/sections/name.html`, concatenates the CSS in bundle order into `css/styles.css`, fills the
head placeholders (title, description, canonical, robots, Open Graph, JSON-LD generated from
`js/data/*.js`) and appends a content hash to the CSS and script URLs.

- Default build is a concept build: `noindex`.
- `node scripts/build.mjs --production` removes `noindex`, so the page can be indexed once it
  replaces the live site. Set `SITE_URL` to the real origin for canonical and Open Graph URLs.

`node scripts/check.mjs` verifies: ASCII only, no comments, braces rule for control flow,
JavaScript syntax, every ES import resolves to a real export, every `#icon-*` reference exists in
the sprite, every `id` is unique, every `href="#..."` target exists, and reports CSS classes used
in HTML that no stylesheet defines.

## 6. HTML conventions

Every partial is one landmark. Section skeleton:

```html
<section class="section section--paper services" id="services" data-section="services"
  aria-labelledby="services-title">
  <div class="container">
    <header class="section__header">
      <p class="section__eyebrow"><span class="section__stop">01</span> Services</p>
      <h2 class="section__title" id="services-title">What we move, and how fast</h2>
      <p class="section__lede">One short supporting sentence.</p>
    </header>
    ...
  </div>
</section>
```

Section background modifiers on `.section`: `section--paper` (default), `section--white`,
`section--paper-2`, `section--ink`, `section--blue-deep`. Add `section--slant` to a dark section
to cut its top and bottom edges at an angle.

Stop numbers: Services 01, Fleet 02, How it works 03, Business 04, Coverage 05, Why HFU 06,
Reviews 07, Quote 08, FAQ 09. The hero and the stats strip have no stop number.

Slant recipe (implemented once in `components.css`, reused by all dark sections):

```css
.section--slant {
  position: relative;
  isolation: isolate;
  margin-block: calc(var(--cut) * -1);
  padding-block: calc(var(--space-section) + var(--cut));
  background: transparent;
}
.section--slant::before {
  content: '';
  position: absolute;
  inset: 0;
  z-index: -1;
  background: var(--slant-background, var(--ink-900));
  clip-path: polygon(0 var(--cut), 100% 0, 100% calc(100% - var(--cut)), 0 100%);
}
```

`section--ink` sets `--slant-background: var(--ink-900)` and `section--blue-deep` sets it to
`var(--blue-900)`; both also set light text colours for their children.

IDs for anchors: `top` (hero), `services`, `fleet`, `how-it-works`, `business`, `coverage`, `why`,
`reviews`, `quote`, `faq`. Section `data-section` values: `hero`, `stats`, `services`, `fleet`,
`how`, `business`, `coverage`, `why`, `reviews`, `quote`, `faq`.

IDs inside a partial are prefixed with the section name (`fleet-title`, `quote-name`).

JavaScript hooks use `data-js="..."` attributes, never classes. State classes use the `is-` prefix
(`is-active`, `is-open`, `is-invalid`, `is-revealed`).

All meaningful text must exist in the static HTML so it is crawlable and readable without
JavaScript. JavaScript adds interaction and visuals. Tab panels, accordion items and carousel
slides are all present in the HTML.

Scroll reveal: add `data-reveal` to blocks that should fade up on first view, optionally with
`data-reveal-delay="1"` to `"6"` (80ms steps). The `js` class on `<html>` is set by an inline
script in the template, so content is visible when JavaScript is off.

Call to action wiring (handled centrally by `main.js`, so sections only add attributes):

```html
<a class="btn btn--primary" href="#quote" data-quote-cta data-cta-id="hero-primary"
   data-quote-service="same-day" data-quote-vehicle="lwb" data-quote-delivery="same-day">Get a Quote</a>
```

On click `main.js` writes the `data-quote-*` values into the quote store, tracks the event, and
smooth scrolls to `#quote` focusing its first empty field. `data-quote-service` takes a service id
from `js/data/services.js`, `data-quote-vehicle` a fleet id, `data-quote-delivery` a delivery type
id.

Shared component markup (styles in `components.css`):

Buttons: `.btn` plus `.btn--primary` (plum), `.btn--secondary` (outlined ink), `.btn--light`
(white, for dark backgrounds), `.btn--ghost`, `.btn--lg`, `.btn--block`. Arrow icon inside a
button: `<svg class="icon btn__icon" aria-hidden="true"><use href="#icon-chevron-right"></use></svg>`.

Icons (from the sprite in `src/sections/sprite.html`):
`<svg class="icon" aria-hidden="true" focusable="false"><use href="#icon-phone"></use></svg>`.
Available ids: `chevron-right`, `chevron-left`, `chevron-down`, `arrow-right`, `phone`, `mail`,
`pin`, `clock`, `check`, `swap`, `plus`, `minus`, `menu`, `close`, `quote`, `calendar`, `box`,
`pallet`, `truck`, `van`, `globe`, `warehouse`, `home`, `bolt`, `moon`, `repeat`, `shield`,
`headset`, `route`, `tag`, `map`, `user`, `weight`, `ruler`, `info`, `alert`. Brand chevron:
`<svg class="brand-mark" viewBox="0 0 297 290" aria-hidden="true"><use href="#brand-chevron"></use></svg>`.

Brand lockup: `<a class="brand" href="#top"><svg class="brand__mark" ...></svg><span class="brand__word">HFU <span class="brand__word-light">Enterprise</span></span></a>`, with `.brand--light` on dark backgrounds.

Other shared classes: `.container`, `.section__header`, `.section__eyebrow`, `.section__stop`,
`.section__title`, `.section__lede`, `.chip`, `.chip--blue`, `.chip--plum`, `.chip--ink`,
`.card`, `.card--flat`, `.board` (dark rounded instrument panel with `.board__header`,
`.board__title`, `.board__body`, `.board__footer`), `.field`, `.field__label`, `.field__control`,
`.field__hint`, `.field__error`, `.is-invalid`, `.segmented` (radio pills), `.stepper`,
`.combobox`, `.combobox__list`, `.combobox__option`, `.readout` (label plus value pair),
`.chevron-list` (list with chevron bullets), `.visually-hidden`, `.skip-link`, `.stack` (vertical
rhythm), `.cluster` (wrapping flex row), `.text-muted`, `.text-balance`.

Segmented radio group markup:

```html
<fieldset class="segmented">
  <legend class="field__label">Delivery type</legend>
  <label class="segmented__option">
    <input class="segmented__input" type="radio" name="delivery-type" value="same-day" checked>
    <span class="segmented__label">Same Day</span>
  </label>
</fieldset>
```

Stepper markup:

```html
<div class="stepper" data-js="stepper" data-min="0" data-max="16" data-value="0">
  <button class="stepper__btn" type="button" data-stepper="decrease" aria-label="Fewer pallets">
    <svg class="icon" aria-hidden="true"><use href="#icon-minus"></use></svg>
  </button>
  <input class="stepper__input" type="number" inputmode="numeric" min="0" max="16" value="0"
    aria-label="Pallets">
  <button class="stepper__btn" type="button" data-stepper="increase" aria-label="More pallets">
    <svg class="icon" aria-hidden="true"><use href="#icon-plus"></use></svg>
  </button>
</div>
```

Combobox markup (place autocomplete, behaviour from `js/lib/combobox.js`):

```html
<div class="combobox" data-js="combobox">
  <input class="field__control" id="hero-from" type="text" autocomplete="off"
    placeholder="Town, city or postcode">
</div>
```

The script creates the `<ul class="combobox__list" role="listbox">` and sets all ARIA attributes.

## 7. JavaScript module contracts

All paths are relative to `js/`.

### data/company.js, fleet.js, services.js, content.js, reviews.js, faqs.js, quote-options.js, config.js

Already written. Read them before using them. Highlights:

- `COMPANY` (name, phones, email, address, hours, stats, localAreas, keywords, hubPlaceId).
- `FLEET` entries: `{ id, name, shortName, kind: 'van' | 'luton' | 'rigid', lengthCm, widthCm,
  heightCm, payloadKg, pallets, bodyOptions }`. Ids: `sv`, `swb`, `lwb`, `xlwb`, `luton`, `t75`,
  `t18`, `t26`. Helpers: `getVehicle(id)`, `recommendVehicle(pallets, weightKg)`,
  `formatMetres(cm)`, `formatPayload(kg)`, constant `STANDARD_PALLET_CM`.
- `SERVICES` entries: `{ id, name, shortName, icon, summary, description, bestFor }`. Ids:
  `same-day`, `scheduled`, `express-overnight`, `international`, `warehouse`, `pallet`,
  `home-moves`. Helper `getService(id)`.
- `WHY_PILLARS`, `COMMITMENT`, `PROCESS_STEPS` in `content.js`.
- `REVIEWS`, `FAQS`.
- `DELIVERY_TYPES` (`same-day`, `next-day`, `flexible`), `WEEKDAYS`, `TIME_SLOTS`
  (`{ value: '04:15', label: '4:15 am' }` from 04:15 to 23:45 every 15 minutes),
  `getTimeSlotLabel(value)`.
- `CONFIG` (`formEndpoint`, `dataLayerName`, `averageRoadSpeedMph`, `roadDistanceFactor`).

### data/places.js and data/uk-map.js (generated datasets)

```js
export const PLACES = [
  { id: 'manchester', name: 'Manchester', area: 'M', region: 'North West', lat: 53.4808, lon: -2.2426,
    kind: 'city', labelOnMap: true, aliases: [] },
  { id: 'salford', name: 'Salford', area: 'M', region: 'North West', lat: 53.4875, lon: -2.2901,
    kind: 'local', labelOnMap: false, aliases: [] },
];
export const HUB_PLACE_ID = 'manchester';
export const MAP_VIEWBOX = { width: 640, height: 820 };
export const UK_OUTLINE_PATH = 'M...';
export const IRELAND_OUTLINE_PATH = 'M...';
export function projectLatLon(latitude, longitude) {
  return { x: 0, y: 0 };
}
```

`kind` is `'city'` (one per UK postcode area, named after its main town) or `'local'` (the six
Manchester area locations HFU lists: Manchester, Salford, Stockport, Trafford, Didsbury,
Chorlton; Manchester itself is a `city`). `area` is the postcode area letters, for example `M`,
`BD`, `LS`. Place ids are lower case slugs.

### lib/dom.js

```js
qs(selector, rootElement = document)            // Element or null
qsa(selector, rootElement = document)           // Element[]
createElement(tagName, attributes = {}, children = [])
createSvgElement(tagName, attributes = {}, children = [])
prefersReducedMotion()                          // boolean
debounce(callback, waitMilliseconds)
clamp(value, minimum, maximum)
formatNumber(value)                             // en-GB grouping
animateNumber(element, { from, to, durationMilliseconds, suffix })
onVisible(element, callback, { threshold, rootMargin, once })   // returns stop function
scrollToSection(sectionId, { focusSelector, behavior })
trapFocus(containerElement)                     // returns release function
announce(message)                               // writes to #live-region
uniqueId(prefix)
```

`createElement` attributes: `className`, `text`, `dataset` (object), `aria` (object, keys without
the `aria-` prefix), plus any other plain attribute. Children are nodes or strings.

### lib/analytics.js

```js
trackEvent(eventName, parameters = {})   // pushes { event: eventName, ...parameters } to window[CONFIG.dataLayerName]
```

Event names used across the page: `cta_click`, `phone_click`, `email_click`, `route_planned`,
`vehicle_selected`, `service_selected`, `schedule_built`, `coverage_checked`, `quote_started`,
`quote_submitted`, `faq_opened`, `review_changed`.

### lib/quote-store.js

```js
export const quoteStore = {
  getState(),
  update(patch, source),      // shallow merge, then notify
  reset(),
  subscribe(listener),        // listener(state, changedKeys, source); returns unsubscribe
};
```

State shape:

```js
{
  from: Place | null, fromText: '',
  to: Place | null, toText: '',
  deliveryType: 'same-day' | 'next-day' | 'flexible',
  serviceId: string | null,        // service id from SERVICES
  vehicleId: string | null,        // fleet id
  pallets: 0,                      // 0 means parcels and documents
  weightKg: null | number,
  collectionDate: '',              // YYYY-MM-DD
  collectionTime: '',              // HH:MM
  schedule: null | { days: ['mon', 'wed'], time: '06:30', palletsPerRun: 2 },
  notes: ''
}
```

The store persists to `sessionStorage` (wrapped in try/catch), hydrates from URL parameters
(`?from=LS&to=BD&vehicle=lwb&service=pallet&delivery=next-day`), and never throws.

### lib/geo.js

```js
getPlaceById(placeId)
getHubPlace()
normalisePostcode(text)              // { area: 'BD', outcode: 'BD5' } or null
findPlaceByQuery(text)               // exact name, alias, postcode area or outcode match -> Place or null
suggestPlaces(text, limit = 6)       // ranked Place[]
haversineMiles(placeA, placeB)
estimateRoadMiles(placeA, placeB)    // haversine times CONFIG.roadDistanceFactor, rounded
estimateDriveMinutes(roadMiles)      // miles / CONFIG.averageRoadSpeedMph * 60, plus 10, rounded
formatMiles(miles)                   // '205 miles'
formatDuration(minutes)              // '4 hr 10 min' or '35 min'
describeRoute(fromPlace, toPlace)    // { miles, minutes, milesLabel, durationLabel }
```

### lib/combobox.js

```js
attachPlaceCombobox(inputElement, { onSelect, onInput, onClear, limit })
// returns { getPlace(), setPlace(place), clear(), destroy() }
```

`onSelect(place)` fires when a suggestion is chosen or the typed text exactly matches a place on
blur. `onInput(text, matchedPlace)` fires on every input. `onClear()` fires when the field is
emptied. Keyboard: arrow keys, Enter, Escape, Home and End.

### lib/stepper.js

```js
attachStepper(rootElement, { onChange })
// returns { getValue(), setValue(value, { silent }), destroy() }
```

### lib/vehicle-art.js

```js
renderVehicleSvg(vehicleId, { className, title })   // returns an SVG markup string
```

Side view, facing right, branded with the HFU chevron livery, viewBox `0 0 800 280`, ground line at
y = 232. Vehicle lengths are proportional to real lengths so the line-up reads as a size ladder.

### sections/route-map.js

```js
createRouteMap(hostElement, { onPlaceSelect })
// returns { setRoute(fromPlace, toPlace), clearRoute(), setAmbient(isEnabled), focusPlace(placeId), destroy() }
```

Renders an inline `<svg>` inside `hostElement` using `UK_OUTLINE_PATH`, `IRELAND_OUTLINE_PATH`,
`projectLatLon` and `PLACES`. Labelled city dots are keyboard focusable buttons; choosing one calls
`onPlaceSelect(place)`.

### sections/*.js

Each exports one `init<Name>()` and finds its own root with
`document.querySelector('[data-section="name"]')`: `initHeader`, `initHero`, `initStats`,
`initServices`, `initFleet`, `initHow`, `initBusiness`, `initCoverage`, `initReviews`,
`initQuote`, `initFaq`. `main.js` calls each inside its own try/catch so one failure never breaks
the page.

## 8. Content facts

Allowed facts are in `docs/CONTENT.md` and the data modules. The live site disagrees with itself in
two places: the quote form shows Small Van 350 kg and LWB 1000 kg, the fleet page shows 450 kg and
1200 kg. This build uses the fleet page.

## 9. Definition of done for every section

- Matches the tokens and recipes in this document, on desktop (1440 px), tablet (768 px) and phone
  (390 px). No horizontal scroll at 320 px.
- Static HTML contains all readable content. JavaScript only enhances.
- Keyboard and screen reader operable. Focus is never trapped or lost.
- No console errors. No comments. ASCII only. Braces everywhere.
- Calls to action lead to the quote form and set useful defaults in the quote store.
