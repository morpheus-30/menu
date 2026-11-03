// TEMPORARY: remove after debugging. Shows config presence only, never values.
export const dynamic = 'force-dynamic';

export async function GET(req) {
  const pw = process.env.ADMIN_PASSWORD;
  const given = new URL(req.url).searchParams.get('try');
  const out = {
    adminPasswordSet: Boolean(pw),
    adminPasswordLength: pw ? pw.length : 0,
    startsOrEndsWithSpace: pw ? pw !== pw.trim() : false,
    matchesTry: given === null ? null : given === pw,
    groqKeySet: Boolean(process.env.GROQ_API_KEY),
    blobTokenSet: Boolean(process.env.BLOB_READ_WRITE_TOKEN),
    vercelEnv: process.env.VERCEL_ENV || null,
  };
  if (process.env.GROQ_API_KEY) {
    try {
      const r = await fetch('https://api.groq.com/openai/v1/models', {
        headers: { Authorization: `Bearer ${process.env.GROQ_API_KEY}` },
      });
      const j = await r.json();
      out.groqModels = (j.data || []).map((m) => m.id).sort();
      if (!r.ok) out.groqError = j;
    } catch (e) {
      out.groqError = String(e.message);
    }
  }
  return Response.json(out);
}
