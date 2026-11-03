import { revalidatePath } from 'next/cache';
import { isAdmin } from '@/lib/auth';
import { structureMenu } from '@/lib/structure';
import { saveMenu, clearMenu } from '@/lib/store';

export const maxDuration = 30;

export async function POST(req) {
  if (!isAdmin(req)) return Response.json({ error: 'Wrong password' }, { status: 401 });

  const form = await req.formData();
  const image = form.get('image');
  if (!image || typeof image === 'string') {
    return Response.json({ error: 'No image attached' }, { status: 400 });
  }
  try {
    const parsed = await structureMenu(await image.arrayBuffer(), image.type || 'image/jpeg');
    const menu = await saveMenu(parsed, image);
    revalidatePath('/');
    return Response.json({ ok: true, menu });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}

export async function DELETE(req) {
  if (!isAdmin(req)) return Response.json({ error: 'Wrong password' }, { status: 401 });
  try {
    await clearMenu();
    revalidatePath('/');
    return Response.json({ ok: true });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
