export function toISODate(date: Date) {
  return date.toISOString().slice(0, 10);
}

export function getMonthKey(date: Date) {
  return date.toISOString().slice(0, 7);
}

export function getWeekRange(date: Date) {
  const current = new Date(date);
  const day = current.getDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;
  const monday = new Date(current);
  monday.setDate(current.getDate() + diffToMonday);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  return {
    start: toISODate(monday),
    end: toISODate(sunday)
  };
}

export function isBetween(date: string, start: string, end: string) {
  return date >= start && date <= end;
}

export function formatDateID(date: string) {
  return new Intl.DateTimeFormat("id-ID", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric"
  }).format(new Date(`${date}T00:00:00`));
}
