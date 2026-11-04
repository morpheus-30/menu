import { after } from 'next/server';
import { revalidatePath } from 'next/cache';
import { structureMenu } from '@/lib/structure';
import { saveMenu, clearMenu } from '@/lib/store';
import { validSignature, isAllowedSender, sendText, downloadImage } from '@/lib/whatsapp';

export const maxDuration = 60;
export const dynamic = 'force-dynamic';

// Meta calls this once when you save the webhook in the developer dashboard
export async function GET(req) {
  const q = new URL(req.url).searchParams;
  if (q.get('hub.mode') === 'subscribe' && q.get('hub.verify_token') === process.env.WHATSAPP_VERIFY_TOKEN && process.env.WHATSAPP_VERIFY_TOKEN) {
    return new Response(q.get('hub.challenge'), { status: 200 });
  }
  return new Response('Forbidden', { status: 403 });
}

const seen = new Set(); // Meta retries deliveries; best-effort de-dupe

async function handle(msg) {
  const from = msg.from;
  try {
    const mediaId = msg.type === 'image' ? msg.image?.id
      : msg.type === 'document' && msg.document?.mime_type?.startsWith('image/') ? msg.document.id
      : null;

    if (mediaId) {
      await sendText(from, 'Got it, reading the menu…');
      const image = await downloadImage(mediaId);
      const parsed = await structureMenu(await image.arrayBuffer(), 'image/jpeg');
      const menu = await saveMenu(parsed, image);
      revalidatePath('/');
      const days = menu.days.length;
      await sendText(from, menu.needs_review
        ? `Menu published (${days} days), but please check it: ${menu.review_reasons.join('; ')}. If it looks wrong, resend a clearer, upright photo.`
        : `Menu updated ✅ (${days} days).`);
      return;
    }

    const text = (msg.text?.body || '').trim().toLowerCase();
    if (text === 'remove' || text === 'remove menu') {
      await clearMenu();
      revalidatePath('/');
      await sendText(from, 'Menu removed. Send a new menu photo when ready.');
      return;
    }
    await sendText(from, 'Send me the menu as a photo (or an image file) and I will update the site. Send "remove" to clear the current menu.');
  } catch (e) {
    console.error('WhatsApp handler error', e);
    await sendText(from, `Sorry, that failed: ${String(e.message).slice(0, 200)}`);
  }
}

export async function POST(req) {
  const raw = await req.text();
  if (!validSignature(raw, req.headers.get('x-hub-signature-256'))) {
    return new Response('Bad signature', { status: 401 });
  }

  let body;
  try { body = JSON.parse(raw); } catch { return new Response('ok'); }

  const messages = (body.entry || [])
    .flatMap((e) => e.changes || [])
    .flatMap((c) => c.value?.messages || [])
    .filter((m) => isAllowedSender(m.from) && !seen.has(m.id));
  messages.forEach((m) => seen.add(m.id));

  // Answer Meta immediately, do the slow work after the response
  after(async () => { for (const m of messages) await handle(m); });
  return new Response('ok');
}
