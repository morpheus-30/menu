// All week logic is done in IST so "this week" matches the viewer's calendar.
const TZ = 'Asia/Kolkata';
const DAY = 86400000;

// Calendar date in IST, as a Date at 00:00 UTC (safe for day arithmetic)
function istDay(d) {
  const s = new Intl.DateTimeFormat('en-CA', { timeZone: TZ }).format(d);
  return new Date(s + 'T00:00:00Z');
}

// Monday of the week containing d (IST)
export function weekStart(d) {
  const x = istDay(d);
  x.setUTCDate(x.getUTCDate() - ((x.getUTCDay() + 6) % 7));
  return x;
}

export function weeksBehind(uploadedAt, now = new Date()) {
  return Math.round((weekStart(now) - weekStart(new Date(uploadedAt))) / (7 * DAY));
}

export function todayName(now = new Date()) {
  return new Intl.DateTimeFormat('en-US', { timeZone: TZ, weekday: 'long' }).format(now);
}

export function fmtDate(d, withTime = false) {
  return new Intl.DateTimeFormat('en-IN', {
    timeZone: TZ, weekday: 'short', day: 'numeric', month: 'short',
    ...(withTime ? { hour: 'numeric', minute: '2-digit', hour12: true } : {}),
  }).format(new Date(d));
}

export function weekLabel(uploadedAt) {
  const s = weekStart(new Date(uploadedAt));
  const e = new Date(s.getTime() + 6 * DAY);
  const f = (x) => new Intl.DateTimeFormat('en-IN', { timeZone: 'UTC', day: 'numeric', month: 'short' }).format(x);
  return `${f(s)} – ${f(e)}`;
}
