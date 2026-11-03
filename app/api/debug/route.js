// TEMPORARY: remove after debugging. Shows config presence only, never values.
export const dynamic = 'force-dynamic';

export async function GET(req) {
  const pw = process.env.ADMIN_PASSWORD;
  const given = new URL(req.url).searchParams.get('try');
  return Response.json({
    adminPasswordSet: Boolean(pw),
    adminPasswordLength: pw ? pw.length : 0,
    startsOrEndsWithSpace: pw ? pw !== pw.trim() : false,
    matchesTry: given === null ? null : given === pw,
    groqKeySet: Boolean(process.env.GROQ_API_KEY),
    blobTokenSet: Boolean(process.env.BLOB_READ_WRITE_TOKEN),
    vercelEnv: process.env.VERCEL_ENV || null,
  });
}
