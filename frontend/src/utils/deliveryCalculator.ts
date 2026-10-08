/**
 * Business Rule:
 * Order date + maximum 1-2 days delivery!
 * (e.g. Order Monday -> Delivered on Tuesday or Wednesday)
 * Slot 1: 1 day gap (Next day)
 * Slot 2: 2 days gap (Maximum 2 days)
 */

export interface CalculatedDeliveryDate {
  formattedDate: string; // e.g. "Friday, Oct 9, 2026"
  dayOfWeekName: string; // "Friday"
  isSameWeekend: boolean;
  orderDayName: string;
  daysUntil?: number;
}

export interface DeliverySlotOptions {
  slot1: CalculatedDeliveryDate;
  slot2: CalculatedDeliveryDate;
  saturday: CalculatedDeliveryDate; // backward compatibility
  sunday: CalculatedDeliveryDate;   // backward compatibility
}

const dateFormatOptions: Intl.DateTimeFormatOptions = {
  weekday: 'long',
  month: 'short',
  day: 'numeric',
  year: 'numeric',
};

function buildDeliveryDate(date: Date, orderDayName: string, daysUntil: number): CalculatedDeliveryDate {
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const dayName = dayNames[date.getDay()];
  return {
    formattedDate: date.toLocaleDateString('en-IN', dateFormatOptions),
    dayOfWeekName: dayName,
    isSameWeekend: false,
    orderDayName,
    daysUntil,
  };
}

export function getDeliverySlotOptions(currentDate: Date = new Date()): DeliverySlotOptions {
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const orderDayName = dayNames[currentDate.getDay()];

  // Primary slot: 1 day gap (Next day)
  const slot1Date = new Date(currentDate);
  slot1Date.setDate(currentDate.getDate() + 1);

  // Secondary slot: 2 days gap (Maximum 1-2 days)
  const slot2Date = new Date(currentDate);
  slot2Date.setDate(currentDate.getDate() + 2);

  const slot1 = buildDeliveryDate(slot1Date, orderDayName, 1);
  const slot2 = buildDeliveryDate(slot2Date, orderDayName, 2);

  return {
    slot1,
    slot2,
    saturday: slot1,
    sunday: slot2,
  };
}

// Backward-compatible wrapper
export function getNextDeliverySaturday(currentDate: Date = new Date()): CalculatedDeliveryDate {
  return getDeliverySlotOptions(currentDate).slot1;
}
