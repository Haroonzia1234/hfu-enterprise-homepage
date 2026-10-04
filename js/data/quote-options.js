export const DELIVERY_TYPES = [
  { id: 'same-day', label: 'Same Day', hint: 'Collected and delivered today' },
  { id: 'next-day', label: 'Next Day', hint: 'Delivered the next day' },
  { id: 'flexible', label: 'Flexible', hint: 'Tell us your window' },
];

export const WEEKDAYS = [
  { id: 'mon', label: 'Mon', name: 'Monday' },
  { id: 'tue', label: 'Tue', name: 'Tuesday' },
  { id: 'wed', label: 'Wed', name: 'Wednesday' },
  { id: 'thu', label: 'Thu', name: 'Thursday' },
  { id: 'fri', label: 'Fri', name: 'Friday' },
  { id: 'sat', label: 'Sat', name: 'Saturday' },
  { id: 'sun', label: 'Sun', name: 'Sunday' },
];

function formatSlotLabel(hours, minutes) {
  const suffix = hours >= 12 ? 'pm' : 'am';
  const twelveHour = hours % 12 === 0 ? 12 : hours % 12;
  return twelveHour + ':' + String(minutes).padStart(2, '0') + ' ' + suffix;
}

function buildTimeSlots() {
  const slots = [];
  const firstSlotMinutes = 4 * 60 + 15;
  const lastSlotMinutes = 23 * 60 + 45;
  for (let totalMinutes = firstSlotMinutes; totalMinutes <= lastSlotMinutes; totalMinutes += 15) {
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    slots.push({
      value: String(hours).padStart(2, '0') + ':' + String(minutes).padStart(2, '0'),
      label: formatSlotLabel(hours, minutes),
    });
  }
  return slots;
}

export const TIME_SLOTS = buildTimeSlots();

export function getTimeSlotLabel(value) {
  const slot = TIME_SLOTS.find((candidate) => candidate.value === value);
  return slot ? slot.label : '';
}
