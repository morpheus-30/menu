'use client';
import { useEffect, useState } from 'react';

// Rotate (0/90/180/270 degrees clockwise) and shrink the photo so it fits
// Vercel's 4.5 MB request limit and Groq's 4 MB base64 image limit
async function prepare(file, rotation = 0, max = 2000) {
  const bmp = await createImageBitmap(file);
  const swap = rotation % 180 !== 0;
  const w = swap ? bmp.height : bmp.width;
  const h = swap ? bmp.width : bmp.height;
  const s = Math.min(1, max / Math.max(w, h));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(w * s);
  canvas.height = Math.round(h * s);
  const ctx = canvas.getContext('2d');
  ctx.translate(canvas.width / 2, canvas.height / 2);
  ctx.rotate((rotation * Math.PI) / 180);
  const dw = Math.round(bmp.width * s);
  const dh = Math.round(bmp.height * s);
  ctx.drawImage(bmp, -dw / 2, -dh / 2, dw, dh);
  return new Promise((r) => canvas.toBlob(r, 'image/jpeg', 0.85));
}

export default function Admin() {
  const [password, setPassword] = useState('');
  const [file, setFile] = useState(null);
  const [rotation, setRotation] = useState(0);
  const [preview, setPreview] = useState('');
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [done, setDone] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => { setPassword(sessionStorage.getItem('menu-pw') || ''); }, []);

  useEffect(() => {
    if (!file) { setPreview(''); return; }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  async function submit(e) {
    e.preventDefault();
    setBusy(true); setError(''); setDone(null);
    try {
      sessionStorage.setItem('menu-pw', password);
      setStatus('Preparing image…');
      const blob = await prepare(file, rotation);

      setStatus('Reading menu…');
      const body = new FormData();
      body.append('image', blob, 'menu.jpg');
      const res = await fetch('/api/menu', { method: 'POST', headers: { 'x-admin-password': password }, body });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Upload failed');
      setDone(json.menu);
      setStatus('');
    } catch (err) {
      setError(err.message);
      setStatus('');
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!confirm('Remove the current menu from the site?')) return;
    setBusy(true); setError(''); setDone(null); setStatus('Removing menu…');
    try {
      sessionStorage.setItem('menu-pw', password);
      const res = await fetch('/api/menu', { method: 'DELETE', headers: { 'x-admin-password': password } });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Remove failed');
      setStatus('Menu removed.');
    } catch (err) {
      setError(err.message);
      setStatus('');
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="page">
      <h1 className="title">Upload menu</h1>
      <form className="form" onSubmit={submit}>
        <label>Password
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" required />
        </label>
        <label>Menu image
          <input type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] || null)} required />
        </label>
        {preview && (
          <>
            <div style={{ overflow: 'hidden', textAlign: 'center' }}>
              <img
                src={preview}
                alt="Menu preview"
                style={{
                  maxWidth: '100%',
                  maxHeight: 360,
                  transform: `rotate(${rotation}deg)`,
                  transition: 'transform .2s',
                }}
              />
            </div>
            <button type="button" onClick={() => setRotation((r) => (r + 90) % 360)}>
              Rotate 90° (so text reads upright)
            </button>
          </>
        )}
        <button className="primary" disabled={busy || !file}>{busy ? 'Working…' : 'Publish menu'}</button>
        <button type="button" disabled={busy || !password} onClick={remove}>Remove current menu</button>
        {status && <p className="msg muted">{status}</p>}
        {error && <p className="msg err">{error}</p>}
        {done && (
          <p className="msg">
            Published{done.needs_review ? ', but some items were flagged for review: ' + done.review_reasons.join('; ') + '.' : '.'}{' '}
            <a className="link" href="/">View menu</a>
          </p>
        )}
      </form>
    </main>
  );
}
