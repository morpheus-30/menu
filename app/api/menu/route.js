import { revalidatePath } from 'next/cache';
import { isAdmin } from '@/lib/auth';
import { structureMenu } from '@/lib/structure';
import { saveMenu } from '@/lib/store';

export const maxDuration = 30;

export async function POST(req) {
  if (!isAdmin(req)) return Response.json({ error: 'Wrong password' }, { status: 401 });

  const form = await req.formData();
  const image = form.get('image');
  const ocrText = String(form.get('ocrText') || '');
  if (!image || typeof image === 'string') {
    return Response.json({ error: 'No image attached' }, { status: 400 });
  }
  try {
    const parsed = await structureMenu(ocrText);
    const menu = await saveMenu(parsed, image);
    revalidatePath('/');
    return Response.json({ ok: true, menu });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
