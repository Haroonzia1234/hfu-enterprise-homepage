import { mkdir, writeFile } from 'node:fs/promises';

const placeInputs = [
  { areaCode: 'AB', name: 'Aberdeen', region: 'Scotland', outcode: 'AB10' },
  { areaCode: 'AL', name: 'St Albans', region: 'East of England', outcode: 'AL1' },
  { areaCode: 'B', name: 'Birmingham', region: 'West Midlands', outcode: 'B1' },
  { areaCode: 'BA', name: 'Bath', region: 'South West', outcode: 'BA1' },
  { areaCode: 'BB', name: 'Blackburn', region: 'North West', outcode: 'BB1' },
  { areaCode: 'BD', name: 'Bradford', region: 'Yorkshire', outcode: 'BD1' },
  { areaCode: 'BH', name: 'Bournemouth', region: 'South West', outcode: 'BH1' },
  { areaCode: 'BL', name: 'Bolton', region: 'North West', outcode: 'BL1' },
  { areaCode: 'BN', name: 'Brighton', region: 'South East', outcode: 'BN1' },
  { areaCode: 'BR', name: 'Bromley', region: 'London', outcode: 'BR1' },
  { areaCode: 'BS', name: 'Bristol', region: 'South West', outcode: 'BS1' },
  { areaCode: 'BT', name: 'Belfast', region: 'Northern Ireland', outcode: 'BT1' },
  { areaCode: 'CA', name: 'Carlisle', region: 'North West', outcode: 'CA1' },
  { areaCode: 'CB', name: 'Cambridge', region: 'East of England', outcode: 'CB1' },
  { areaCode: 'CF', name: 'Cardiff', region: 'Wales', outcode: 'CF10' },
  { areaCode: 'CH', name: 'Chester', region: 'North West', outcode: 'CH1' },
  { areaCode: 'CM', name: 'Chelmsford', region: 'East of England', outcode: 'CM1' },
  { areaCode: 'CO', name: 'Colchester', region: 'East of England', outcode: 'CO1' },
  { areaCode: 'CR', name: 'Croydon', region: 'London', outcode: 'CR0' },
  { areaCode: 'CT', name: 'Canterbury', region: 'South East', outcode: 'CT1' },
  { areaCode: 'CV', name: 'Coventry', region: 'West Midlands', outcode: 'CV1' },
  { areaCode: 'CW', name: 'Crewe', region: 'North West', outcode: 'CW1' },
  { areaCode: 'DA', name: 'Dartford', region: 'South East', outcode: 'DA1' },
  { areaCode: 'DD', name: 'Dundee', region: 'Scotland', outcode: 'DD1' },
  { areaCode: 'DE', name: 'Derby', region: 'East Midlands', outcode: 'DE1' },
  { areaCode: 'DG', name: 'Dumfries', region: 'Scotland', outcode: 'DG1' },
  { areaCode: 'DH', name: 'Durham', region: 'North East', outcode: 'DH1' },
  { areaCode: 'DL', name: 'Darlington', region: 'North East', outcode: 'DL1' },
  { areaCode: 'DN', name: 'Doncaster', region: 'Yorkshire', outcode: 'DN1' },
  { areaCode: 'DT', name: 'Dorchester', region: 'South West', outcode: 'DT1' },
  { areaCode: 'DY', name: 'Dudley', region: 'West Midlands', outcode: 'DY1' },
  { areaCode: 'E', name: 'London E', region: 'London', outcode: 'E1' },
  { areaCode: 'EC', name: 'London City', region: 'London', outcode: 'EC1A' },
  { areaCode: 'EH', name: 'Edinburgh', region: 'Scotland', outcode: 'EH1' },
  { areaCode: 'EN', name: 'Enfield', region: 'London', outcode: 'EN1' },
  { areaCode: 'EX', name: 'Exeter', region: 'South West', outcode: 'EX1' },
  { areaCode: 'FK', name: 'Falkirk', region: 'Scotland', outcode: 'FK1' },
  { areaCode: 'FY', name: 'Blackpool', region: 'North West', outcode: 'FY1' },
  { areaCode: 'G', name: 'Glasgow', region: 'Scotland', outcode: 'G1' },
  { areaCode: 'GL', name: 'Gloucester', region: 'South West', outcode: 'GL1' },
  { areaCode: 'GU', name: 'Guildford', region: 'South East', outcode: 'GU1' },
  { areaCode: 'HA', name: 'Harrow', region: 'London', outcode: 'HA1' },
  { areaCode: 'HD', name: 'Huddersfield', region: 'Yorkshire', outcode: 'HD1' },
  { areaCode: 'HG', name: 'Harrogate', region: 'Yorkshire', outcode: 'HG1' },
  { areaCode: 'HP', name: 'Hemel Hempstead', region: 'East of England', outcode: 'HP1' },
  { areaCode: 'HR', name: 'Hereford', region: 'West Midlands', outcode: 'HR1' },
  { areaCode: 'HS', name: 'Outer Hebrides', region: 'Scotland', outcode: 'HS1' },
  { areaCode: 'HU', name: 'Kingston upon Hull', region: 'Yorkshire', outcode: 'HU1' },
  { areaCode: 'HX', name: 'Halifax', region: 'Yorkshire', outcode: 'HX1' },
  { areaCode: 'IG', name: 'Ilford', region: 'London', outcode: 'IG1' },
  { areaCode: 'IP', name: 'Ipswich', region: 'East of England', outcode: 'IP1' },
  { areaCode: 'IV', name: 'Inverness', region: 'Scotland', outcode: 'IV1' },
  { areaCode: 'KA', name: 'Kilmarnock', region: 'Scotland', outcode: 'KA1' },
  { areaCode: 'KT', name: 'Kingston upon Thames', region: 'London', outcode: 'KT1' },
  { areaCode: 'KW', name: 'Kirkwall', region: 'Scotland', outcode: 'KW15' },
  { areaCode: 'KY', name: 'Kirkcaldy', region: 'Scotland', outcode: 'KY1' },
  { areaCode: 'L', name: 'Liverpool', region: 'North West', outcode: 'L1' },
  { areaCode: 'LA', name: 'Lancaster', region: 'North West', outcode: 'LA1' },
  { areaCode: 'LD', name: 'Llandrindod Wells', region: 'Wales', outcode: 'LD1' },
  { areaCode: 'LE', name: 'Leicester', region: 'East Midlands', outcode: 'LE1' },
  { areaCode: 'LL', name: 'Llandudno', region: 'Wales', outcode: 'LL11' },
  { areaCode: 'LN', name: 'Lincoln', region: 'East Midlands', outcode: 'LN1' },
  { areaCode: 'LS', name: 'Leeds', region: 'Yorkshire', outcode: 'LS1' },
  { areaCode: 'LU', name: 'Luton', region: 'East of England', outcode: 'LU1' },
  { areaCode: 'M', name: 'Manchester', region: 'North West', outcode: 'M1' },
  { areaCode: 'ME', name: 'Medway', region: 'South East', outcode: 'ME1' },
  { areaCode: 'MK', name: 'Milton Keynes', region: 'South East', outcode: 'MK1' },
  { areaCode: 'ML', name: 'Motherwell', region: 'Scotland', outcode: 'ML1' },
  { areaCode: 'N', name: 'London N', region: 'London', outcode: 'N1' },
  { areaCode: 'NE', name: 'Newcastle upon Tyne', region: 'North East', outcode: 'NE1' },
  { areaCode: 'NG', name: 'Nottingham', region: 'East Midlands', outcode: 'NG1' },
  { areaCode: 'NN', name: 'Northampton', region: 'East Midlands', outcode: 'NN1' },
  { areaCode: 'NP', name: 'Newport', region: 'Wales', outcode: 'NP10' },
  { areaCode: 'NR', name: 'Norwich', region: 'East of England', outcode: 'NR1' },
  { areaCode: 'NW', name: 'London NW', region: 'London', outcode: 'NW1' },
  { areaCode: 'OL', name: 'Oldham', region: 'North West', outcode: 'OL1' },
  { areaCode: 'OX', name: 'Oxford', region: 'South East', outcode: 'OX1' },
  { areaCode: 'PA', name: 'Paisley', region: 'Scotland', outcode: 'PA1' },
  { areaCode: 'PE', name: 'Peterborough', region: 'East of England', outcode: 'PE1' },
  { areaCode: 'PH', name: 'Perth', region: 'Scotland', outcode: 'PH1' },
  { areaCode: 'PL', name: 'Plymouth', region: 'South West', outcode: 'PL1' },
  { areaCode: 'PO', name: 'Portsmouth', region: 'South East', outcode: 'PO1' },
  { areaCode: 'PR', name: 'Preston', region: 'North West', outcode: 'PR1' },
  { areaCode: 'RG', name: 'Reading', region: 'South East', outcode: 'RG1' },
  { areaCode: 'RH', name: 'Redhill', region: 'South East', outcode: 'RH1' },
  { areaCode: 'RM', name: 'Romford', region: 'London', outcode: 'RM1' },
  { areaCode: 'S', name: 'Sheffield', region: 'Yorkshire', outcode: 'S1' },
  { areaCode: 'SA', name: 'Swansea', region: 'Wales', outcode: 'SA1' },
  { areaCode: 'SE', name: 'London SE', region: 'London', outcode: 'SE1' },
  { areaCode: 'SG', name: 'Stevenage', region: 'East of England', outcode: 'SG1' },
  { areaCode: 'SK', name: 'Stockport', region: 'North West', outcode: 'SK1' },
  { areaCode: 'SL', name: 'Slough', region: 'South East', outcode: 'SL1' },
  { areaCode: 'SM', name: 'Sutton', region: 'London', outcode: 'SM1' },
  { areaCode: 'SN', name: 'Swindon', region: 'South West', outcode: 'SN1' },
  { areaCode: 'SO', name: 'Southampton', region: 'South East', outcode: 'SO14' },
  { areaCode: 'SP', name: 'Salisbury', region: 'South West', outcode: 'SP1' },
  { areaCode: 'SR', name: 'Sunderland', region: 'North East', outcode: 'SR1' },
  { areaCode: 'SS', name: 'Southend-on-Sea', region: 'East of England', outcode: 'SS1' },
  { areaCode: 'ST', name: 'Stoke-on-Trent', region: 'West Midlands', outcode: 'ST1' },
  { areaCode: 'SW', name: 'London', id: 'london', region: 'London', outcode: 'SW1A' },
  { areaCode: 'SY', name: 'Shrewsbury', region: 'West Midlands', outcode: 'SY1' },
  { areaCode: 'TA', name: 'Taunton', region: 'South West', outcode: 'TA1' },
  { areaCode: 'TD', name: 'Galashiels', region: 'Scotland', outcode: 'TD1' },
  { areaCode: 'TF', name: 'Telford', region: 'West Midlands', outcode: 'TF1' },
  { areaCode: 'TN', name: 'Tonbridge', region: 'South East', outcode: 'TN1' },
  { areaCode: 'TQ', name: 'Torquay', region: 'South West', outcode: 'TQ1' },
  { areaCode: 'TR', name: 'Truro', region: 'South West', outcode: 'TR1' },
  { areaCode: 'TS', name: 'Cleveland', region: 'North East', outcode: 'TS1' },
  { areaCode: 'TW', name: 'Twickenham', region: 'London', outcode: 'TW1' },
  { areaCode: 'UB', name: 'Southall', region: 'London', outcode: 'UB1' },
  { areaCode: 'W', name: 'London W', region: 'London', outcode: 'W1A' },
  { areaCode: 'WA', name: 'Warrington', region: 'North West', outcode: 'WA1' },
  { areaCode: 'WC', name: 'London West End', region: 'London', outcode: 'WC1A' },
  { areaCode: 'WD', name: 'Watford', region: 'East of England', outcode: 'WD1' },
  { areaCode: 'WF', name: 'Wakefield', region: 'Yorkshire', outcode: 'WF1' },
  { areaCode: 'WN', name: 'Wigan', region: 'North West', outcode: 'WN1' },
  { areaCode: 'WR', name: 'Worcester', region: 'West Midlands', outcode: 'WR1' },
  { areaCode: 'WS', name: 'Walsall', region: 'West Midlands', outcode: 'WS1' },
  { areaCode: 'WV', name: 'Wolverhampton', region: 'West Midlands', outcode: 'WV1' },
  { areaCode: 'YO', name: 'York', region: 'Yorkshire', outcode: 'YO1' },
  { areaCode: 'ZE', name: 'Lerwick', region: 'Scotland', outcode: 'ZE1' },
];

const mappedLabelIds = new Set([
  'manchester',
  'london',
  'birmingham',
  'leeds',
  'liverpool',
  'sheffield',
  'newcastle-upon-tyne',
  'glasgow',
  'edinburgh',
  'cardiff',
  'bristol',
  'nottingham',
  'southampton',
  'norwich',
  'aberdeen',
  'belfast',
  'plymouth',
  'inverness',
]);

function getSlug(placeName) {
  return placeName
    .toLowerCase()
    .replace(/ /g, '-')
    .replace(/[^a-z0-9-]/g, '');
}

function getAliases(placeIdentifier) {
  if (placeIdentifier === 'newcastle-upon-tyne') {
    return ['Newcastle'];
  }
  if (placeIdentifier === 'kingston-upon-hull') {
    return ['Hull'];
  }
  if (placeIdentifier === 'stoke-on-trent') {
    return ['Stoke'];
  }
  if (placeIdentifier === 'birmingham') {
    return ['Brum'];
  }
  if (placeIdentifier === 'nottingham') {
    return ['Notts'];
  }
  return [];
}

const fallbackCoordinates = {
  B1: { lat: 52.48, lon: -1.9 },
  BD1: { lat: 53.79, lon: -1.75 },
  BT1: { lat: 54.6, lon: -5.93 },
  CF10: { lat: 51.48, lon: -3.18 },
  E1: { lat: 51.52, lon: -0.06 },
  EC1A: { lat: 51.52, lon: -0.1 },
  EH1: { lat: 55.95, lon: -3.19 },
  G1: { lat: 55.86, lon: -4.25 },
  L1: { lat: 53.4, lon: -2.98 },
  LS1: { lat: 53.8, lon: -1.55 },
  M1: { lat: 53.48, lon: -2.24 },
  N1: { lat: 51.53, lon: -0.1 },
  NE1: { lat: 54.97, lon: -1.61 },
  NW1: { lat: 51.53, lon: -0.14 },
  S1: { lat: 53.38, lon: -1.47 },
  SE1: { lat: 51.5, lon: -0.09 },
  SW1A: { lat: 51.5, lon: -0.14 },
  W1A: { lat: 51.51, lon: -0.14 },
  WC1A: { lat: 51.52, lon: -0.12 },
};

function getFallback(outcodeString) {
  if (fallbackCoordinates[outcodeString]) {
    return fallbackCoordinates[outcodeString];
  }
  return { lat: 54.0, lon: -2.0 };
}

async function fetchCoordinates(outcodeString, retriesAllowed = 3) {
  try {
    const fetchResponse = await fetch('https://api.postcodes.io/outcodes/' + outcodeString);
    if (!fetchResponse.ok) {
      throw new Error('Not OK');
    }
    const responseData = await fetchResponse.json();
    if (
      responseData &&
      responseData.result &&
      responseData.result.latitude &&
      responseData.result.longitude
    ) {
      return { lat: responseData.result.latitude, lon: responseData.result.longitude };
    }
    throw new Error('No coordinates');
  } catch {
    if (retriesAllowed > 0) {
      return fetchCoordinates(outcodeString, retriesAllowed - 1);
    }
    console.warn(`Lookup failed for ${outcodeString}, using fallback`);
    return getFallback(outcodeString);
  }
}

const localPlaces = [
  {
    id: 'salford',
    name: 'Salford',
    area: 'M',
    region: 'North West',
    lat: 53.4875,
    lon: -2.2901,
    kind: 'local',
    labelOnMap: false,
    aliases: [],
  },
  {
    id: 'trafford',
    name: 'Trafford',
    area: 'M',
    region: 'North West',
    lat: 53.4503,
    lon: -2.317,
    kind: 'local',
    labelOnMap: false,
    aliases: [],
  },
  {
    id: 'didsbury',
    name: 'Didsbury',
    area: 'M',
    region: 'North West',
    lat: 53.4163,
    lon: -2.2295,
    kind: 'local',
    labelOnMap: false,
    aliases: [],
  },
  {
    id: 'chorlton',
    name: 'Chorlton',
    area: 'M',
    region: 'North West',
    lat: 53.4425,
    lon: -2.2764,
    kind: 'local',
    labelOnMap: false,
    aliases: [],
  },
];

async function generatePlaces() {
  const allPlaces = [];

  for (const inputItem of placeInputs) {
    const placeIdentifier = inputItem.id || getSlug(inputItem.name);
    const coordinates = await fetchCoordinates(inputItem.outcode);
    allPlaces.push({
      id: placeIdentifier,
      name: inputItem.name,
      area: inputItem.areaCode,
      region: inputItem.region,
      lat: Number(coordinates.lat.toFixed(4)),
      lon: Number(coordinates.lon.toFixed(4)),
      kind: 'city',
      labelOnMap: mappedLabelIds.has(placeIdentifier),
      aliases: getAliases(placeIdentifier),
    });
  }

  for (const localLocation of localPlaces) {
    allPlaces.push(localLocation);
  }

  allPlaces.sort((placeA, placeB) => {
    return placeA.name.localeCompare(placeB.name);
  });

  let fileOutput = `export const HUB_PLACE_ID = 'manchester';\nexport const PLACES = [`;

  for (let placeIndex = 0; placeIndex < allPlaces.length; placeIndex++) {
    const placeItem = allPlaces[placeIndex];
    const aliasesString = JSON.stringify(placeItem.aliases).replace(/"/g, "'");
    fileOutput += `\n  { id: '${placeItem.id}', name: '${placeItem.name}', area: '${placeItem.area}', region: '${placeItem.region}', lat: ${placeItem.lat}, lon: ${placeItem.lon}, kind: '${placeItem.kind}', labelOnMap: ${placeItem.labelOnMap}, aliases: ${aliasesString} }`;
    if (placeIndex < allPlaces.length - 1) {
      fileOutput += ',';
    }
  }
  fileOutput += `\n];\n`;

  await mkdir('js/data', { recursive: true });
  await writeFile('js/data/places.js', fileOutput, 'utf8');
  console.log('Places generated.');
}

generatePlaces().catch(console.error);
