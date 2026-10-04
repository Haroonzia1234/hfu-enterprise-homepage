export const FLEET = [
  {
    id: 'sv',
    name: 'Small Van',
    shortName: 'SV',
    kind: 'van',
    lengthCm: 120,
    widthCm: 100,
    heightCm: 100,
    payloadKg: 450,
    pallets: 1,
    bodyOptions: [],
  },
  {
    id: 'swb',
    name: 'Short Wheel Base Van',
    shortName: 'SWB',
    kind: 'van',
    lengthCm: 240,
    widthCm: 100,
    heightCm: 120,
    payloadKg: 800,
    pallets: 2,
    bodyOptions: [],
  },
  {
    id: 'lwb',
    name: 'Long Wheel Base Van',
    shortName: 'LWB',
    kind: 'van',
    lengthCm: 340,
    widthCm: 120,
    heightCm: 180,
    payloadKg: 1200,
    pallets: 3,
    bodyOptions: [],
  },
  {
    id: 'xlwb',
    name: 'Extra-Long Wheel Base Van',
    shortName: 'XLWB',
    kind: 'van',
    lengthCm: 420,
    widthCm: 120,
    heightCm: 180,
    payloadKg: 1000,
    pallets: 4,
    bodyOptions: [],
  },
  {
    id: 'luton',
    name: 'Luton Van',
    shortName: 'LV',
    kind: 'luton',
    lengthCm: 400,
    widthCm: 200,
    heightCm: 200,
    payloadKg: 1000,
    pallets: 6,
    bodyOptions: ['Box', 'Curtain', 'Tail lift'],
  },
  {
    id: 't75',
    name: '7.5 Tonne',
    shortName: '7.5T',
    kind: 'rigid',
    lengthCm: 600,
    widthCm: 240,
    heightCm: 220,
    payloadKg: 2500,
    pallets: 10,
    bodyOptions: ['Box', 'Curtain', 'Tail lift'],
  },
  {
    id: 't18',
    name: '18 Tonne',
    shortName: '18T',
    kind: 'rigid',
    lengthCm: 700,
    widthCm: 240,
    heightCm: 250,
    payloadKg: 9000,
    pallets: 14,
    bodyOptions: ['Box', 'Curtain', 'Tail lift'],
  },
  {
    id: 't26',
    name: '26 Tonne',
    shortName: '26T',
    kind: 'rigid',
    lengthCm: 800,
    widthCm: 240,
    heightCm: 250,
    payloadKg: 15000,
    pallets: 16,
    bodyOptions: ['Box', 'Curtain', 'Tail lift'],
  },
];

export const STANDARD_PALLET_CM = { length: 120, width: 100 };

export function getVehicle(vehicleId) {
  return FLEET.find((vehicle) => vehicle.id === vehicleId) || null;
}

export function recommendVehicle(palletCount, weightKg = 0) {
  const requiredPallets = Math.max(0, Number(palletCount) || 0);
  const requiredWeight = Math.max(0, Number(weightKg) || 0);
  return (
    FLEET.find(
      (vehicle) => vehicle.pallets >= requiredPallets && vehicle.payloadKg >= requiredWeight
    ) || null
  );
}

export function formatMetres(centimetres) {
  return (centimetres / 100).toFixed(2).replace(/0$/, '').replace(/\.$/, '');
}

export function formatPayload(kilograms) {
  return kilograms.toLocaleString('en-GB') + ' kg';
}
