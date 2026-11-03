const PROMPT = `You turn OCR text of a weekly food menu into JSON.
Return ONLY a JSON object with this shape:
{
  "title": string | null,
  "days": [ { "day": "Monday", "meals": [ { "name": "Breakfast", "items": ["Idli", "Sambar"] } ] } ],
  "notes": string | null,
  "needs_review": boolean,
  "review_reasons": [string]
}
Rules:
- Use full English day names (Monday..Sunday), in the order they appear.
- Keep meal names as written (Breakfast, Lunch, Snacks, Dinner...). If the menu has no meal split, use one meal named "Menu".
- Fix obvious OCR typos only when you are confident. Never invent dishes.
- OCR often scrambles tables (columns merged, rows out of order). If you had to guess which dish belongs to which day or meal, if text is garbled, or if days/meals look missing, set needs_review to true and explain briefly in review_reasons.
- Otherwise needs_review is false and review_reasons is [].`;

export async function structureMenu(ocrText) {
  const text = (ocrText || '').trim();
  if (!process.env.GROQ_API_KEY) throw new Error('GROQ_API_KEY is not set');

  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
      temperature: 0,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: PROMPT },
        { role: 'user', content: text || '(empty)' },
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
  if (text.length < 30) menu.review_reasons.push('Very little text was read from the image');
  if (!menu.days.length || !itemCount) menu.review_reasons.push('No menu items were found');
  menu.needs_review = Boolean(menu.needs_review) || menu.review_reasons.length > 0;
  return menu;
}
