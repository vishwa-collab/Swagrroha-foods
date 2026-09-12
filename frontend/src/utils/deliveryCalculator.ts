/**
 * Business Rule:
 * Order date + 4 days gap for bulk fresh homemade preparation!
 * (e.g. Order Monday -> Delivered on Friday)
 * Secondary slot provides a 5-day option.
 */

export interface CalculatedDeliveryDate {
  formattedDate: string; // e.g. "Friday, Sep 18, 2026"
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

  // Primary slot: exactly 4 days gap (e.g. Order Monday -> Delivered Friday)
  const slot1Date = new Date(currentDate);
  slot1Date.setDate(currentDate.getDate() + 4);

  // Secondary slot: 5 days gap
  const slot2Date = new Date(currentDate);
  slot2Date.setDate(currentDate.getDate() + 5);

  const slot1 = buildDeliveryDate(slot1Date, orderDayName, 4);
  const slot2 = buildDeliveryDate(slot2Date, orderDayName, 5);

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
