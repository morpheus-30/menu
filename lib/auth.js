import { timingSafeEqual } from 'crypto';

export function isAdmin(req) {
  const real = process.env.ADMIN_PASSWORD || '';
  const given = req.headers.get('x-admin-password') || '';
  if (!real) return false;
  const a = Buffer.from(given);
  const b = Buffer.from(real);
  return a.length === b.length && timingSafeEqual(a, b);
}
