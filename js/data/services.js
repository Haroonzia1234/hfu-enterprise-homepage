export const SERVICES = [
  {
    id: 'same-day',
    name: 'Same Day Courier',
    shortName: 'Same day',
    icon: 'bolt',
    summary: 'Time sensitive deliveries are our specialty.',
    description:
      'When time is of the essence, our same day courier service is your go-to solution. Urgent business documents, critical medical supplies and last minute customer orders are prioritised and reach their destination on the same day.',
    bestFor: ['Urgent business documents', 'Critical medical supplies', 'Last minute customer orders'],
  },
  {
    id: 'scheduled',
    name: 'Scheduled Delivery',
    shortName: 'Scheduled',
    icon: 'repeat',
    summary: 'Recurring shipments, made simple.',
    description:
      'Designed to fit seamlessly into your business operations, scheduled deliveries suit businesses and individuals with consistent shipping requirements. From daily deliveries to weekly schedules, we customise the run to your timetable, with timely pickups and drop offs.',
    bestFor: ['Daily deliveries', 'Weekly schedules', 'Regular business runs'],
  },
  {
    id: 'express-overnight',
    name: 'Express and Overnight',
    shortName: 'Overnight',
    icon: 'moon',
    summary: 'When fast just is not fast enough.',
    description:
      'Perfect for urgent shipments, our express and overnight service gets your package to its destination promptly by the next day. Advanced tracking tools, competitive pricing and a commitment to reliability keep your time sensitive goods on schedule.',
    bestFor: ['Next day deadlines', 'Time sensitive goods', 'Critical shipments'],
  },
  {
    id: 'international',
    name: 'International Shipping',
    shortName: 'International',
    icon: 'globe',
    summary: 'Cross border logistics, handled for you.',
    description:
      'From customs clearance to safe transit across borders, we handle every detail so your shipments arrive at their international destinations without delays. Small parcels or bulk freight, with tailored, secure and cost effective solutions.',
    bestFor: ['Customs clearance', 'Small parcels', 'Bulk freight'],
  },
  {
    id: 'warehouse',
    name: 'Warehouse Storage and Fulfilment',
    shortName: 'Warehousing',
    icon: 'warehouse',
    summary: 'Secure storage and dependable fulfilment.',
    description:
      'Our facilities are equipped with advanced security systems to safeguard your inventory. We provide end to end support, including inventory management, order processing and timely dispatch, so your customers receive their orders accurately and on time.',
    bestFor: ['Inventory management', 'Order processing', 'Timely dispatch'],
  },
  {
    id: 'pallet',
    name: 'Pallet Delivery',
    shortName: 'Pallets',
    icon: 'pallet',
    summary: 'Bulk transport, handled with care.',
    description:
      'For businesses with bulk shipping needs, we provide secure and cost effective transportation for large shipments. Regional, national or international, our network delivers on time with tracking options and customisable solutions.',
    bestFor: ['Large scale shipping', 'Bulk transportation', 'Regional to international'],
  },
  {
    id: 'home-moves',
    name: 'Home Moves',
    shortName: 'Home moves',
    icon: 'home',
    summary: 'Relocation at affordable prices.',
    description:
      'Alongside transporting goods and packages, we help domestic clients with home moves. Competitive rates on our vehicles and a team that handles your belongings with care, for peace of mind during an exciting but stressful time.',
    bestFor: ['Domestic relocations', 'Competitive vehicle rates', 'Careful handling'],
  },
];

export function getService(serviceId) {
  return SERVICES.find((service) => service.id === serviceId) || null;
}
