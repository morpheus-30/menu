import { put, head, del } from '@vercel/blob';

const KEY = 'menu/current.json';

export async function getMenu() {
  try {
    const meta = await head(KEY);
    const res = await fetch(`${meta.url}?t=${Date.now()}`, { cache: 'no-store' });
    return res.ok ? await res.json() : null;
  } catch {
    return null; // nothing uploaded yet
  }
}

export async function saveMenu(menu, image) {
  const old = await getMenu();
  const ext = image.type === 'image/png' ? 'png' : 'jpg';
  const img = await put(`menu/img-${Date.now()}.${ext}`, image, {
    access: 'public',
    contentType: image.type || 'image/jpeg',
  });
  const data = { ...menu, imageUrl: img.url, uploadedAt: new Date().toISOString() };
  await put(KEY, JSON.stringify(data), {
    access: 'public',
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: 'application/json',
    cacheControlMaxAge: 60,
  });
  if (old?.imageUrl) await del(old.imageUrl).catch(() => {});
  return data;
}

export async function clearMenu() {
  const old = await getMenu();
  if (old?.imageUrl) await del(old.imageUrl).catch(() => {});
  const meta = await head(KEY).catch(() => null);
  if (meta) await del(meta.url);
  return Boolean(old);
}
