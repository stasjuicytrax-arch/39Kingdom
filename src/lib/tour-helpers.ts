export interface TourDate {
  date: string;
  display: string;
  city: string;
  country: string;
  venue: string;
  festival: boolean;
}

const CITY_TIMEZONES: Record<string, string> = {
  'Kuala Lumpur': 'Asia/Kuala_Lumpur',
  Pattaya: 'Asia/Bangkok',
  Bangkok: 'Asia/Bangkok',
  'Ho Chi Minh City': 'Asia/Ho_Chi_Minh',
  Goa: 'Asia/Kolkata',
};

export function getNextShow(dates: TourDate[], now: Date = new Date()): TourDate | null {
  const upcoming = dates
    .filter((d) => new Date(`${d.date}T00:00:00`) >= startOfDay(now))
    .sort((a, b) => a.date.localeCompare(b.date));
  return upcoming[0] ?? dates[dates.length - 1] ?? null;
}

export function isPlayed(date: TourDate, now: Date = new Date()): boolean {
  return new Date(`${date.date}T23:59:59`) < now;
}

export function formatShortDate(isoDate: string): string {
  const [, month, day] = isoDate.split('-');
  return `${day}.${month}`;
}

export function cityTimeZone(city: string): string | null {
  return CITY_TIMEZONES[city] ?? null;
}

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}
