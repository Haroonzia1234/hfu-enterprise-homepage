# HFU Enterprise Homepage

A high-converting homepage design concept for HFU Enterprise Ltd, a UK logistics and courier company, pairing operational dispatch data with an interactive Route Board experience.

Live Demo: https://haroonzia1234.github.io/hfu-enterprise-homepage/
Repository: https://github.com/Haroonzia1234/hfu-enterprise-homepage

## What is Inside

The homepage concept is structured across six primary feature areas:

- Route Planner Hero with Interactive UK Map: An operational dispatch tool where users select collection and delivery locations across the UK, view projected routes with dynamic road mileage and drive time calculations, and receive instant vehicle recommendations based on load requirements.
- Services Explorer: Detailed profiles of all seven core offerings (Same Day Courier, Scheduled Delivery, Express and Overnight, International Shipping, Warehouse Storage and Fulfilment, Pallet Delivery, and Home Moves) with speed tags, operational parameters, and direct quote pre-filling.
- Fleet Explorer with Load Finder: Interactive size ladder and cargo stage detailing HFU's eight real vehicles (Small Van to 26 Tonne rigid truck) with exact dimensions, payload limits, pallet capacities, body options (Box, Curtain, Tail lift), and an intelligent pallet and weight calculator.
- How It Works and Weekly Run Builder: A three-step dispatch explanation paired with an interactive schedule builder designed for recurring B2B business logistics, scheduled pallet collections, and direct warehouse-to-customer deliveries.
- Coverage Radar and Area Checker: Visual coverage radar spanning Greater Manchester local hubs, national UK transit networks, and international borders, complete with a rapid town, city, and postcode area lookup tool.
- Quote Engine, Reviews, and FAQ: End-to-end quote request form with two-way state synchronization and a live summary card, genuine client testimonials in an accessible carousel, and an accordion FAQ backed by structured schema.

## Stack and Why

- Static HTML: Crawlable, semantic markup containing all primary content in the initial payload for maximum search indexing and resilience when JavaScript is disabled.
- CSS Custom Properties: Token-based styling architecture (tokens.css) managing colours, typography, elevations, spacing, and transition speeds without CSS preprocessors or runtime overhead.
- Vanilla ES Modules: Clean, modern modular JavaScript executing natively in the browser without framework abstraction or bundler complexity.
- No Runtime Dependencies: Zero external production dependencies, eliminating supply-chain vulnerabilities, breaking upstream changes, and runtime weight.
- Self-Hosted Variable Fonts: Montserrat Variable (display) and Inter Variable (body) served locally under the SIL Open Font License, eliminating third-party font tracking and render delays.
- Inline SVG: Handcrafted iconography, interactive UK vector maps, and scalable vehicle blueprints embedded directly in markup for crisp rendering at any resolution with zero HTTP asset requests.

## Run Locally

Prerequisites: Node.js (version 20 or higher).

1. Install development dependencies:

```bash
npm install
```

2. Build the static site:

```bash
npm run build
```

3. Start the local server:

```bash
npm start
```

The application will be accessible at:

```
http://localhost:5173
```

To run syntax and code quality checks without starting a server:

```bash
npm run check
```

## Project Structure

```
hfu-enterprise-homepage/
|-- assets/
|   |-- fonts/                  # Self-hosted variable fonts (Montserrat, Inter)
|   `-- img/                    # Favicon, app icons, and social sharing images
|-- css/
|   `-- styles.css              # Concatenated production stylesheet (generated)
|-- docs/
|   |-- ARCHITECTURE.md         # Technical architecture and design system contract
|   `-- CONTENT.md              # Verified company facts and dataset constraints
|-- js/
|   |-- data/                   # Facts, fleet specs, services, and map coordinates
|   |-- lib/                    # Shared utilities (DOM, analytics, geo, combobox)
|   |-- sections/               # Modular controller scripts for each page section
|   `-- main.js                 # Application bootstrap and global CTA orchestration
|-- scripts/
|   |-- build.mjs               # Site compiler, partial injector, and CSS bundler
|   |-- check.mjs               # Automated verification and linting script
|   `-- serve.mjs               # Lightweight local development server
|-- src/
|   |-- css/                    # Modular stylesheets (tokens, base, components)
|   |   `-- sections/           # Per-section CSS partials
|   |-- sections/               # HTML partials for each section landmark
|   `-- template.html           # Root document shell with include placeholders
|-- index.html                  # Compiled static HTML output (generated)
|-- package.json                # Project scripts and developer dependencies
|-- README.md                   # Developer and client documentation
`-- SUBMISSION.md               # Design contest entry narrative
```

## How the Build Works

The build pipeline is controlled by `scripts/build.mjs`:

- Partials and CSS Concatenation: The build script reads `src/template.html` and resolves all `{{> name}}` placeholders against HTML partials located in `src/sections/`. It then concatenates CSS files in defined bundle order (`fonts`, `tokens`, `base`, `components`, `utilities`, followed by individual section files) into `css/styles.css`.
- Cache Busting: Cryptographic content hashes (`CSS_HASH` and `JS_HASH`) are computed and appended to stylesheet and script links.
- Schema Generation: Structured data for `LocalBusiness` and `FAQPage` is generated programmatically from the canonical data modules and injected into the document head.
- Concept Mode vs Production Mode:
  - Default build (`npm run build`): Injects `<meta name="robots" content="noindex, nofollow">` to prevent preview and contest builds from indexing prematurely.
  - Production build (`npm run build:production`): Injects `<meta name="robots" content="index, follow, max-image-preview:large">`. Set the `SITE_URL` environment variable to configure the production origin for canonical tags and Open Graph metadata:
    ```bash
    SITE_URL=https://hfuenterprise.com npm run build:production
    ```

## How to Connect the Quote Form

### Form Endpoint Configuration

In `js/data/config.js`, update the `formEndpoint` property to your active backend URL:

```javascript
export const CONFIG = {
  formEndpoint: 'https://api.example.com/quotes',
  dataLayerName: 'dataLayer',
  averageRoadSpeedMph: 46,
  roadDistanceFactor: 1.22,
};
```

When `formEndpoint` is an empty string, the quote form simulates successful dispatch client-side and generates a reference code with a pre-filled mailto backup link. When an endpoint URL is provided, submissions are sent via an HTTP POST request with a JSON payload.

### JSON Payload Shape

The quote form submits the following JSON object:

```json
{
  "from": "Manchester",
  "to": "Leeds",
  "date": "2026-10-15",
  "time": "08:30",
  "service": "same-day",
  "vehicle": "lwb",
  "pallets": 2,
  "deliveryType": "same-day",
  "name": "Jane Smith",
  "phone": "0161 509 6152",
  "email": "jane.smith@example.com",
  "notes": "Loading bay entrance on north side."
}
```

Field specifications:

- `from` (string): Origin town, city, or postcode area.
- `to` (string): Destination town, city, or postcode area.
- `date` (string): Collection date formatted as YYYY-MM-DD.
- `time` (string): Collection time slot formatted as HH:MM (available from 04:15 to 23:45 in 15-minute increments).
- `service` (string|null): Service identifier (`same-day`, `scheduled`, `express-overnight`, `international`, `warehouse`, `pallet`, `home-moves`), or empty if unselected.
- `vehicle` (string|null): Vehicle identifier (`sv`, `swb`, `lwb`, `xlwb`, `luton`, `t75`, `t18`, `t26`), or empty if unselected.
- `pallets` (number): Number of pallets (0 to 16, where 0 indicates parcels or documents).
- `deliveryType` (string): Urgency level (`same-day`, `next-day`, or `flexible`).
- `name` (string): Customer contact name.
- `phone` (string): Customer contact telephone number.
- `email` (string): Customer contact email address.
- `notes` (string): Additional handling instructions or access details.

### dataLayer Events for GA4 and GTM

All telemetry is pushed to `window[CONFIG.dataLayerName]` (defaults to `window.dataLayer`) using the standard `{ event: eventName, ...parameters }` structure.

Available events:

- `cta_click`: Dispatched when clicking conversion links, containing `{ cta_id }`.
- `phone_click`: Dispatched when clicking telephone links, containing `{ href }`.
- `email_click`: Dispatched when clicking email links, containing `{ href }`.
- `route_planned`: Dispatched when origin or destination changes in the hero planner.
- `vehicle_selected`: Dispatched when selecting a vehicle tab or ladder bar in the fleet section.
- `service_selected`: Dispatched when exploring or selecting a service card.
- `schedule_built`: Dispatched when configuring recurring delivery days and pallet volumes.
- `coverage_checked`: Dispatched when searching a location in the coverage area checker.
- `quote_started`: Dispatched on the first input interaction within the quote form.
- `quote_submitted`: Dispatched upon successful submission of the quote form.
- `faq_opened`: Dispatched when expanding an FAQ item.
- `review_changed`: Dispatched when changing review slides.

## Accessibility and Performance

- Keyboard Operability: Custom autocomplete comboboxes, fleet tablists, review carousels, and accordions are fully keyboard accessible with Arrow keys, Tab, Enter, Escape, Home, and End navigation.
- Focus Management: Clear, high-contrast `:focus-visible` outlines on all interactive elements without outline suppression.
- Reduced Motion: The `@media (prefers-reduced-motion: reduce)` media query stops CSS transitions, turns off radar sweep loops, and presents instant content updates.
- Screen Reader Support: Dynamic calculations and form error summaries announce changes via an accessible `#live-region` status element.
- Performance Budget: Zero external script or font requests. The entire compiled experience measures approximately 160 KB HTML and 90 KB CSS before gzip or brotli compression.

## Content Sources and Inconsistencies Found

All copy and business information were drawn from `hfuenterprise.com` and recorded in `docs/CONTENT.md`. During research, five inconsistencies were identified on the live site and addressed as follows:

1. Vehicle Capacities: The live quote form lists Small Van at 350 kg and LWB at 1000 kg, while the live fleet page states 450 kg and 1200 kg. This concept follows the fleet page specifications (450 kg and 1200 kg).
2. Telephone Formatting: The live contact page lists 0757 6206225 while other pages display 07576 206225. This build standardizes on 07576 206225.
3. Wordmark Typo: The live graphic logo tagline misspells "RELIABLITY" (missing an I). This concept sets the brand wordmark cleanly in typography, omitting the misspelled tagline.
4. Address vs Service Locations: The live contact page lists a Bradford address (880 Manchester Road, BD5 8DH) while marketing copy focuses on Greater Manchester (Manchester, Salford, Stockport, Trafford, Didsbury, Chorlton). Both areas are reflected accurately in the coverage data.
5. Incomplete Content: The live homepage news section contains dummy filler text and an incomplete client logo band; both were excluded from this production concept.

## Credits

- Fonts: Montserrat Variable and Inter Variable, designed by Julieta Ulanovsky and Rasmus Andersson, distributed under the SIL Open Font License.
- Map Vector: United Kingdom and Ireland outline geometries derived from Natural Earth public domain map data.
- Geographic Coordinates: Postcode area centroids and lookup coordinates derived from postcodes.io open data (contains OS data, Crown copyright and database right).
