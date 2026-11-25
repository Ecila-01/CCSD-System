// Stored dates/times are Philippine wall-clock values, independent of browser timezone.
export const futureSlot = (date, time, now = Date.now()) => Boolean(date && time) &&
  Date.parse(`${date}T${time}:00+08:00`) > now;
