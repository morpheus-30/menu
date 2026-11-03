const PROMPT = `You read a photo of a weekly food menu and turn it into JSON.
The photo is usually a table and may be rotated or sideways: rotate it mentally before reading. Rows and columns are meaningful (typically one axis is days/dates, the other is meal types or dish categories), so keep every dish aligned with its own day and column.
Return ONLY a JSON object with this shape:
{
  "title": string | null,
  "days": [ { "day": "Monday", "meals": [ { "name": "Breakfast", "items": ["Idli", "Sambar"] } ] } ],
  "notes": string | null,
  "needs_review": boolean,
  "review_reasons": [string]
}
Rules:
- Use full English day names (Monday..Sunday), in the order they appear. If a date is shown (e.g. 26-10-2026), put it in "notes" only if useful; do not change the day name.
- Use the table's column headers as meal names (e.g. "Morning Snacks", "Dal", "Seasonal Veg", "Gravy Veg", "Rice", "Roti", "Raita", "Salad", "Sweets", "Evening Snacks"). If the menu has no meal split, use one meal named "Menu".
- Skip empty cells and cells with only a dash. Never invent dishes.
- Fix obvious spelling slips only when you are confident.
- If text is hard to read, you had to guess an alignment, or days/columns look missing, set needs_review to true and explain briefly in review_reasons.
- Otherwise needs_review is false and review_reasons is [].`;

export async function structureMenu(imageBuffer, mimeType = 'image/jpeg') {
  if (!process.env.GROQ_API_KEY) throw new Error('GROQ_API_KEY is not set');

  const dataUrl = `data:${mimeType};base64,${Buffer.from(imageBuffer).toString('base64')}`;

  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: process.env.GROQ_VISION_MODEL || 'meta-llama/llama-4-scout-17b-16e-instruct',
      temperature: 0,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: PROMPT },
            { type: 'image_url', image_url: { url: dataUrl } },
          ],
        },
      ],
    }),
  });
  if (!res.ok) throw new Error(`Groq error ${res.status}: ${(await res.text()).slice(0, 200)}`);

  const json = await res.json();
  let menu;
  try {
    menu = JSON.parse(json.choices[0].message.content);
  } catch {
    menu = { days: [], needs_review: true, review_reasons: ['Could not parse the model output'] };
  }

  // Our own sanity checks on top of the model's self-report
  menu.days = Array.isArray(menu.days) ? menu.days : [];
  menu.review_reasons = Array.isArray(menu.review_reasons) ? menu.review_reasons : [];
  const itemCount = menu.days.reduce(
    (n, d) => n + (d.meals || []).reduce((m, x) => m + (x.items || []).length, 0), 0);
  if (!menu.days.length || !itemCount) menu.review_reasons.push('No menu items were found');
  menu.needs_review = Boolean(menu.needs_review) || menu.review_reasons.length > 0;
  return menu;
}
