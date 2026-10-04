import { mkdir, writeFile } from 'node:fs/promises';

const inputs = [
  { a: 'AB', n: 'Aberdeen', r: 'Scotland', o: 'AB10' },
  { a: 'AL', n: 'St Albans', r: 'East of England', o: 'AL1' },
  { a: 'B', n: 'Birmingham', r: 'West Midlands', o: 'B1' },
  { a: 'BA', n: 'Bath', r: 'South West', o: 'BA1' },
  { a: 'BB', n: 'Blackburn', r: 'North West', o: 'BB1' },
  { a: 'BD', n: 'Bradford', r: 'Yorkshire', o: 'BD1' },
  { a: 'BH', n: 'Bournemouth', r: 'South West', o: 'BH1' },
  { a: 'BL', n: 'Bolton', r: 'North West', o: 'BL1' },
  { a: 'BN', n: 'Brighton', r: 'South East', o: 'BN1' },
  { a: 'BR', n: 'Bromley', r: 'London', o: 'BR1' },
  { a: 'BS', n: 'Bristol', r: 'South West', o: 'BS1' },
  { a: 'BT', n: 'Belfast', r: 'Northern Ireland', o: 'BT1' },
  { a: 'CA', n: 'Carlisle', r: 'North West', o: 'CA1' },
  { a: 'CB', n: 'Cambridge', r: 'East of England', o: 'CB1' },
  { a: 'CF', n: 'Cardiff', r: 'Wales', o: 'CF10' },
  { a: 'CH', n: 'Chester', r: 'North West', o: 'CH1' },
  { a: 'CM', n: 'Chelmsford', r: 'East of England', o: 'CM1' },
  { a: 'CO', n: 'Colchester', r: 'East of England', o: 'CO1' },
  { a: 'CR', n: 'Croydon', r: 'London', o: 'CR0' },
  { a: 'CT', n: 'Canterbury', r: 'South East', o: 'CT1' },
  { a: 'CV', n: 'Coventry', r: 'West Midlands', o: 'CV1' },
  { a: 'CW', n: 'Crewe', r: 'North West', o: 'CW1' },
  { a: 'DA', n: 'Dartford', r: 'South East', o: 'DA1' },
  { a: 'DD', n: 'Dundee', r: 'Scotland', o: 'DD1' },
  { a: 'DE', n: 'Derby', r: 'East Midlands', o: 'DE1' },
  { a: 'DG', n: 'Dumfries', r: 'Scotland', o: 'DG1' },
  { a: 'DH', n: 'Durham', r: 'North East', o: 'DH1' },
  { a: 'DL', n: 'Darlington', r: 'North East', o: 'DL1' },
  { a: 'DN', n: 'Doncaster', r: 'Yorkshire', o: 'DN1' },
  { a: 'DT', n: 'Dorchester', r: 'South West', o: 'DT1' },
  { a: 'DY', n: 'Dudley', r: 'West Midlands', o: 'DY1' },
  { a: 'E', n: 'London E', r: 'London', o: 'E1' },
  { a: 'EC', n: 'London City', r: 'London', o: 'EC1A' },
  { a: 'EH', n: 'Edinburgh', r: 'Scotland', o: 'EH1' },
  { a: 'EN', n: 'Enfield', r: 'London', o: 'EN1' },
  { a: 'EX', n: 'Exeter', r: 'South West', o: 'EX1' },
  { a: 'FK', n: 'Falkirk', r: 'Scotland', o: 'FK1' },
  { a: 'FY', n: 'Blackpool', r: 'North West', o: 'FY1' },
  { a: 'G', n: 'Glasgow', r: 'Scotland', o: 'G1' },
  { a: 'GL', n: 'Gloucester', r: 'South West', o: 'GL1' },
  { a: 'GU', n: 'Guildford', r: 'South East', o: 'GU1' },
  { a: 'HA', n: 'Harrow', r: 'London', o: 'HA1' },
  { a: 'HD', n: 'Huddersfield', r: 'Yorkshire', o: 'HD1' },
  { a: 'HG', n: 'Harrogate', r: 'Yorkshire', o: 'HG1' },
  { a: 'HP', n: 'Hemel Hempstead', r: 'East of England', o: 'HP1' },
  { a: 'HR', n: 'Hereford', r: 'West Midlands', o: 'HR1' },
  { a: 'HS', n: 'Outer Hebrides', r: 'Scotland', o: 'HS1' },
  { a: 'HU', n: 'Kingston upon Hull', r: 'Yorkshire', o: 'HU1' },
  { a: 'HX', n: 'Halifax', r: 'Yorkshire', o: 'HX1' },
  { a: 'IG', n: 'Ilford', r: 'London', o: 'IG1' },
  { a: 'IP', n: 'Ipswich', r: 'East of England', o: 'IP1' },
  { a: 'IV', n: 'Inverness', r: 'Scotland', o: 'IV1' },
  { a: 'KA', n: 'Kilmarnock', r: 'Scotland', o: 'KA1' },
  { a: 'KT', n: 'Kingston upon Thames', r: 'London', o: 'KT1' },
  { a: 'KW', n: 'Kirkwall', r: 'Scotland', o: 'KW15' },
  { a: 'KY', n: 'Kirkcaldy', r: 'Scotland', o: 'KY1' },
  { a: 'L', n: 'Liverpool', r: 'North West', o: 'L1' },
  { a: 'LA', n: 'Lancaster', r: 'North West', o: 'LA1' },
  { a: 'LD', n: 'Llandrindod Wells', r: 'Wales', o: 'LD1' },
  { a: 'LE', n: 'Leicester', r: 'East Midlands', o: 'LE1' },
  { a: 'LL', n: 'Llandudno', r: 'Wales', o: 'LL11' },
  { a: 'LN', n: 'Lincoln', r: 'East Midlands', o: 'LN1' },
  { a: 'LS', n: 'Leeds', r: 'Yorkshire', o: 'LS1' },
  { a: 'LU', n: 'Luton', r: 'East of England', o: 'LU1' },
  { a: 'M', n: 'Manchester', r: 'North West', o: 'M1' },
  { a: 'ME', n: 'Medway', r: 'South East', o: 'ME1' },
  { a: 'MK', n: 'Milton Keynes', r: 'South East', o: 'MK1' },
  { a: 'ML', n: 'Motherwell', r: 'Scotland', o: 'ML1' },
  { a: 'N', n: 'London N', r: 'London', o: 'N1' },
  { a: 'NE', n: 'Newcastle upon Tyne', r: 'North East', o: 'NE1' },
  { a: 'NG', n: 'Nottingham', r: 'East Midlands', o: 'NG1' },
  { a: 'NN', n: 'Northampton', r: 'East Midlands', o: 'NN1' },
  { a: 'NP', n: 'Newport', r: 'Wales', o: 'NP10' },
  { a: 'NR', n: 'Norwich', r: 'East of England', o: 'NR1' },
  { a: 'NW', n: 'London NW', r: 'London', o: 'NW1' },
  { a: 'OL', n: 'Oldham', r: 'North West', o: 'OL1' },
  { a: 'OX', n: 'Oxford', r: 'South East', o: 'OX1' },
  { a: 'PA', n: 'Paisley', r: 'Scotland', o: 'PA1' },
  { a: 'PE', n: 'Peterborough', r: 'East of England', o: 'PE1' },
  { a: 'PH', n: 'Perth', r: 'Scotland', o: 'PH1' },
  { a: 'PL', n: 'Plymouth', r: 'South West', o: 'PL1' },
  { a: 'PO', n: 'Portsmouth', r: 'South East', o: 'PO1' },
  { a: 'PR', n: 'Preston', r: 'North West', o: 'PR1' },
  { a: 'RG', n: 'Reading', r: 'South East', o: 'RG1' },
  { a: 'RH', n: 'Redhill', r: 'South East', o: 'RH1' },
  { a: 'RM', n: 'Romford', r: 'London', o: 'RM1' },
  { a: 'S', n: 'Sheffield', r: 'Yorkshire', o: 'S1' },
  { a: 'SA', n: 'Swansea', r: 'Wales', o: 'SA1' },
  { a: 'SE', n: 'London SE', r: 'London', o: 'SE1' },
  { a: 'SG', n: 'Stevenage', r: 'East of England', o: 'SG1' },
  { a: 'SK', n: 'Stockport', r: 'North West', o: 'SK1' },
  { a: 'SL', n: 'Slough', r: 'South East', o: 'SL1' },
  { a: 'SM', n: 'Sutton', r: 'London', o: 'SM1' },
  { a: 'SN', n: 'Swindon', r: 'South West', o: 'SN1' },
  { a: 'SO', n: 'Southampton', r: 'South East', o: 'SO14' },
  { a: 'SP', n: 'Salisbury', r: 'South West', o: 'SP1' },
  { a: 'SR', n: 'Sunderland', r: 'North East', o: 'SR1' },
  { a: 'SS', n: 'Southend-on-Sea', r: 'East of England', o: 'SS1' },
  { a: 'ST', n: 'Stoke-on-Trent', r: 'West Midlands', o: 'ST1' },
  { a: 'SW', n: 'London', id: 'london', r: 'London', o: 'SW1A' },
  { a: 'SY', n: 'Shrewsbury', r: 'West Midlands', o: 'SY1' },
  { a: 'TA', n: 'Taunton', r: 'South West', o: 'TA1' },
  { a: 'TD', n: 'Galashiels', r: 'Scotland', o: 'TD1' },
  { a: 'TF', n: 'Telford', r: 'West Midlands', o: 'TF1' },
  { a: 'TN', n: 'Tonbridge', r: 'South East', o: 'TN1' },
  { a: 'TQ', n: 'Torquay', r: 'South West', o: 'TQ1' },
  { a: 'TR', n: 'Truro', r: 'South West', o: 'TR1' },
  { a: 'TS', n: 'Cleveland', r: 'North East', o: 'TS1' },
  { a: 'TW', n: 'Twickenham', r: 'London', o: 'TW1' },
  { a: 'UB', n: 'Southall', r: 'London', o: 'UB1' },
  { a: 'W', n: 'London W', r: 'London', o: 'W1A' },
  { a: 'WA', n: 'Warrington', r: 'North West', o: 'WA1' },
  { a: 'WC', n: 'London West End', r: 'London', o: 'WC1A' },
  { a: 'WD', n: 'Watford', r: 'East of England', o: 'WD1' },
  { a: 'WF', n: 'Wakefield', r: 'Yorkshire', o: 'WF1' },
  { a: 'WN', n: 'Wigan', r: 'North West', o: 'WN1' },
  { a: 'WR', n: 'Worcester', r: 'West Midlands', o: 'WR1' },
  { a: 'WS', n: 'Walsall', r: 'West Midlands', o: 'WS1' },
  { a: 'WV', n: 'Wolverhampton', r: 'West Midlands', o: 'WV1' },
  { a: 'YO', n: 'York', r: 'Yorkshire', o: 'YO1' },
  { a: 'ZE', n: 'Lerwick', r: 'Scotland', o: 'ZE1' }
];

const labelIds = new Set([
  'manchester', 'london', 'birmingham', 'leeds', 'liverpool', 'sheffield',
  'newcastle-upon-tyne', 'glasgow', 'edinburgh', 'cardiff', 'bristol',
  'nottingham', 'southampton', 'norwich', 'aberdeen', 'belfast',
  'plymouth', 'inverness'
]);

function getSlug(name) {
  return name.toLowerCase().replace(/ /g, '-').replace(/[^a-z0-9-]/g, '');
}

function getAliases(id) {
  if (id === 'newcastle-upon-tyne') {
    return ['Newcastle'];
  }
  if (id === 'kingston-upon-hull') {
    return ['Hull'];
  }
  if (id === 'stoke-on-trent') {
    return ['Stoke'];
  }
  if (id === 'birmingham') {
    return ['Brum'];
  }
  if (id === 'nottingham') {
    return ['Notts'];
  }
  return [];
}

const fallbacks = {
  B1: { lat: 52.48, lon: -1.90 },
  BD1: { lat: 53.79, lon: -1.75 },
  BT1: { lat: 54.60, lon: -5.93 },
  CF10: { lat: 51.48, lon: -3.18 },
  E1: { lat: 51.52, lon: -0.06 },
  EC1A: { lat: 51.52, lon: -0.10 },
  EH1: { lat: 55.95, lon: -3.19 },
  G1: { lat: 55.86, lon: -4.25 },
  L1: { lat: 53.40, lon: -2.98 },
  LS1: { lat: 53.80, lon: -1.55 },
  M1: { lat: 53.48, lon: -2.24 },
  N1: { lat: 51.53, lon: -0.10 },
  NE1: { lat: 54.97, lon: -1.61 },
  NW1: { lat: 51.53, lon: -0.14 },
  S1: { lat: 53.38, lon: -1.47 },
  SE1: { lat: 51.50, lon: -0.09 },
  SW1A: { lat: 51.50, lon: -0.14 },
  W1A: { lat: 51.51, lon: -0.14 },
  WC1A: { lat: 51.52, lon: -0.12 }
};

function getFallback(outcode) {
  if (fallbacks[outcode]) {
    return fallbacks[outcode];
  }
  return { lat: 54.0, lon: -2.0 };
}

async function fetchCoord(outcode, retries = 3) {
  try {
    const res = await fetch('https://api.postcodes.io/outcodes/' + outcode);
    if (!res.ok) {
      throw new Error('Not OK');
    }
    const data = await res.json();
    if (data && data.result && data.result.latitude && data.result.longitude) {
      return { lat: data.result.latitude, lon: data.result.longitude };
    }
    throw new Error('No coordinates');
  } catch (error) {
    if (retries > 0) {
      return fetchCoord(outcode, retries - 1);
    }
    console.warn(`Lookup failed for ${outcode}, using fallback`);
    return getFallback(outcode);
  }
}

const locals = [
  { id: 'salford', name: 'Salford', area: 'M', region: 'North West', lat: 53.4875, lon: -2.2901, kind: 'local', labelOnMap: false, aliases: [] },
  { id: 'trafford', name: 'Trafford', area: 'M', region: 'North West', lat: 53.4503, lon: -2.3170, kind: 'local', labelOnMap: false, aliases: [] },
  { id: 'didsbury', name: 'Didsbury', area: 'M', region: 'North West', lat: 53.4163, lon: -2.2295, kind: 'local', labelOnMap: false, aliases: [] },
  { id: 'chorlton', name: 'Chorlton', area: 'M', region: 'North West', lat: 53.4425, lon: -2.2764, kind: 'local', labelOnMap: false, aliases: [] }
];

async function generate() {
  const places = [];
  
  for (const item of inputs) {
    const id = item.id || getSlug(item.n);
    const coord = await fetchCoord(item.o);
    places.push({
      id: id,
      name: item.n,
      area: item.a,
      region: item.r,
      lat: Number(coord.lat.toFixed(4)),
      lon: Number(coord.lon.toFixed(4)),
      kind: 'city',
      labelOnMap: labelIds.has(id),
      aliases: getAliases(id)
    });
  }

  for (const loc of locals) {
    places.push(loc);
  }

  places.sort((a, b) => a.name.localeCompare(b.name));

  let output = `export const HUB_PLACE_ID = 'manchester';
export const PLACES = [`;

  for (let i = 0; i < places.length; i++) {
    const p = places[i];
    const al = JSON.stringify(p.aliases).replace(/"/g, "'");
    output += `
  { id: '${p.id}', name: '${p.name}', area: '${p.area}', region: '${p.region}', lat: ${p.lat}, lon: ${p.lon}, kind: '${p.kind}', labelOnMap: ${p.labelOnMap}, aliases: ${al} }`;
    if (i < places.length - 1) {
      output += ',';
    }
  }
  output += `
];
`;

  await mkdir('js/data', { recursive: true });
  await writeFile('js/data/places.js', output, 'utf8');
  console.log('Places generated.');
}

generate().catch(console.error);
