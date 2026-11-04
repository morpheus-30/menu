import { createHmac, timingSafeEqual } from 'crypto';
import sharp from 'sharp';

const GRAPH = `https://graph.facebook.com/${process.env.WHATSAPP_GRAPH_VERSION || 'v23.0'}`;

// Meta signs every webhook call with the app secret
export function validSignature(rawBody, header) {
  const secret = process.env.WHATSAPP_APP_SECRET;
  if (!secret || !header) return false;
  const expected = 'sha256=' + createHmac('sha256', secret).update(rawBody).digest('hex');
  const a = Buffer.from(header);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

export function isAllowedSender(from) {
  const allowed = (process.env.ALLOWED_NUMBERS || '')
    .split(',')
    .map((n) => n.replace(/\D/g, ''))
    .filter(Boolean);
  return allowed.includes(String(from).replace(/\D/g, ''));
}

const auth = () => ({ Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}` });

export async function sendText(to, body) {
  const id = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const res = await fetch(`${GRAPH}/${id}/messages`, {
    method: 'POST',
    headers: { ...auth(), 'Content-Type': 'application/json' },
    body: JSON.stringify({ messaging_product: 'whatsapp', to, type: 'text', text: { body } }),
  });
  if (!res.ok) console.error('WhatsApp send failed', res.status, (await res.text()).slice(0, 300));
}

// Download a media file the user sent, then fix rotation (EXIF) and shrink it
export async function downloadImage(mediaId) {
  const metaRes = await fetch(`${GRAPH}/${mediaId}`, { headers: auth() });
  if (!metaRes.ok) throw new Error(`Could not get media info (${metaRes.status})`);
  const meta = await metaRes.json();
  const fileRes = await fetch(meta.url, { headers: auth() });
  if (!fileRes.ok) throw new Error(`Could not download image (${fileRes.status})`);
  const input = Buffer.from(await fileRes.arrayBuffer());
  const jpeg = await sharp(input)
    .rotate() // honour EXIF orientation
    .resize({ width: 2000, height: 2000, fit: 'inside', withoutEnlargement: true })
    .jpeg({ quality: 85 })
    .toBuffer();
  return new Blob([jpeg], { type: 'image/jpeg' });
}
