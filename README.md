# Menu site

Next.js app. Public page at `/`, password-gated upload at `/admin`.

Upload flow: image is rotated (optional) and shrunk in your browser -> sent to a Groq vision model, which reads the table and returns structured JSON -> image + JSON are stored in Vercel Blob. No OCR step.

## Env vars
See `.env.example`. Set `ADMIN_PASSWORD` and `GROQ_API_KEY` in Vercel, and create a Blob store (Storage tab) so `BLOB_READ_WRITE_TOKEN` is added automatically.

## Deploy
1. Push to GitHub, import the repo in Vercel (or run `npx vercel --prod`).
2. Project -> Settings -> Domains -> add `menu.iamnaksh.tech`.
3. At your DNS provider add a CNAME: `menu` -> the target Vercel shows (usually `cname.vercel-dns.com`).
