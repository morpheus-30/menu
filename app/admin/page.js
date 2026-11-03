'use client';
import { useEffect, useState } from 'react';

// Shrink the photo so it fits Vercel's 4.5 MB request limit and OCRs faster
async function shrink(file, max = 2200) {
  const bmp = await createImageBitmap(file);
  const s = Math.min(1, max / Math.max(bmp.width, bmp.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bmp.width * s);
  canvas.height = Math.round(bmp.height * s);
  canvas.getContext('2d').drawImage(bmp, 0, 0, canvas.width, canvas.height);
  const blob = await new Promise((r) => canvas.toBlob(r, 'image/jpeg', 0.85));
  return { canvas, blob };
}

export default function Admin() {
  const [password, setPassword] = useState('');
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [done, setDone] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => { setPassword(sessionStorage.getItem('menu-pw') || ''); }, []);

  async function submit(e) {
    e.preventDefault();
    setBusy(true); setError(''); setDone(null);
    try {
      sessionStorage.setItem('menu-pw', password);
      setStatus('Preparing image…');
      const { canvas, blob } = await shrink(file);

      setStatus('Reading text from image…');
      const { createWorker } = await import('tesseract.js');
      const worker = await createWorker('eng', 1, {
        logger: (m) => m.status === 'recognizing text' && setStatus(`Reading text… ${Math.round(m.progress * 100)}%`),
      });
      const { data } = await worker.recognize(canvas);
      await worker.terminate();

      setStatus('Building menu…');
      const body = new FormData();
      body.append('image', blob, 'menu.jpg');
      body.append('ocrText', data.text);
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
        <button className="primary" disabled={busy || !file}>{busy ? 'Working…' : 'Publish menu'}</button>
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
