/**
 * Business Rule:
 * Order Mon-Wed -> Delivered on the upcoming Saturday (this weekend)
 * Order Thu-Sun -> Delivered on the following week's Saturday (next weekend)
 * Always maintains 4-5 days gap for bulk fresh homemade preparation!
 */

export interface CalculatedDeliveryDate {
  formattedDate: string; // e.g. "Saturday, Aug 15, 2026"
  dayOfWeekName: string; // "Saturday"
  isSameWeekend: boolean;
  orderDayName: string;
}

export function getNextDeliverySaturday(currentDate: Date = new Date()): CalculatedDeliveryDate {
  const dayOfWeek = currentDate.getDay(); // 0 = Sun, 1 = Mon, ..., 3 = Wed, 4 = Thu, ..., 6 = Sat
  
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const orderDayName = dayNames[dayOfWeek];

  let daysUntilSaturday = 0;

  if (dayOfWeek >= 1 && dayOfWeek <= 3) {
    // Monday (1), Tuesday (2), Wednesday (3) -> Same weekend Saturday
    daysUntilSaturday = 6 - dayOfWeek;
  } else {
    // Thursday (4), Friday (5), Saturday (6), Sunday (0) -> Next week's Saturday (7 + 6 - dayOfWeek)
    if (dayOfWeek === 0) {
      daysUntilSaturday = 6; // Sunday to next Saturday = 6 days
    } else {
      daysUntilSaturday = (6 - dayOfWeek) + 7;
    }
  }

  const deliveryDate = new Date(currentDate);
  deliveryDate.setDate(currentDate.getDate() + daysUntilSaturday);

  const options: Intl.DateTimeFormatOptions = {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  };

  return {
    formattedDate: deliveryDate.toLocaleDateString('en-IN', options),
    dayOfWeekName: 'Saturday',
    isSameWeekend: dayOfWeek >= 1 && dayOfWeek <= 3,
    orderDayName,
  };
}
