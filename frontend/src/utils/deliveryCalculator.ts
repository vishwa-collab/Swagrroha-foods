/**
 * Business Rule:
 * Order Mon-Wed -> Delivered on the upcoming Saturday (this weekend)
 * Order Thu-Sun -> Delivered on the following week's Saturday (next weekend)
 * Always maintains 4-5 days gap for bulk fresh homemade preparation!
 * 
 * Customers can also choose Sunday of the same weekend as alternate slot.
 */

export interface CalculatedDeliveryDate {
  formattedDate: string; // e.g. "Saturday, Aug 15, 2026"
  dayOfWeekName: string; // "Saturday" or "Sunday"
  isSameWeekend: boolean;
  orderDayName: string;
  daysUntil?: number;
}

export interface DeliverySlotOptions {
  saturday: CalculatedDeliveryDate;
  sunday: CalculatedDeliveryDate;
}

const dateFormatOptions: Intl.DateTimeFormatOptions = {
  weekday: 'long',
  month: 'short',
  day: 'numeric',
  year: 'numeric',
};

function buildDeliveryDate(date: Date, dayName: string, isSameWeekend: boolean, orderDayName: string, daysUntil: number): CalculatedDeliveryDate {
  return {
    formattedDate: date.toLocaleDateString('en-IN', dateFormatOptions),
    dayOfWeekName: dayName,
    isSameWeekend,
    orderDayName,
    daysUntil,
  };
}

export function getDeliverySlotOptions(currentDate: Date = new Date()): DeliverySlotOptions {
  const dayOfWeek = currentDate.getDay(); // 0 = Sun, 1 = Mon, ... 6 = Sat
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const orderDayName = dayNames[dayOfWeek];

  let daysUntilSaturday = 0;

  if (dayOfWeek >= 1 && dayOfWeek <= 3) {
    // Monday (1), Tuesday (2), Wednesday (3) -> Same weekend Saturday
    daysUntilSaturday = 6 - dayOfWeek;
  } else {
    // Thursday (4), Friday (5), Saturday (6), Sunday (0) -> Next week's Saturday
    if (dayOfWeek === 0) {
      daysUntilSaturday = 6; // Sunday to next Saturday = 6 days
    } else {
      daysUntilSaturday = (6 - dayOfWeek) + 7;
    }
  }

  const isSameWeekend = dayOfWeek >= 1 && dayOfWeek <= 3;

  const satDate = new Date(currentDate);
  satDate.setDate(currentDate.getDate() + daysUntilSaturday);

  const sunDate = new Date(satDate);
  sunDate.setDate(satDate.getDate() + 1);

  return {
    saturday: buildDeliveryDate(satDate, 'Saturday', isSameWeekend, orderDayName, daysUntilSaturday),
    sunday: buildDeliveryDate(sunDate, 'Sunday', isSameWeekend, orderDayName, daysUntilSaturday + 1),
  };
}

// Backward-compatible wrapper
export function getNextDeliverySaturday(currentDate: Date = new Date()): CalculatedDeliveryDate {
  return getDeliverySlotOptions(currentDate).saturday;
}
