// Vercel Serverless Function — Proxy fuer Anthropic API.
// Haelt den API-Key serverseitig (Env-Variable ANTHROPIC_API_KEY) und
// schuetzt ihn so vor dem Browser des Users.

export default async function handler(req, res) {
  // Nur POST zulassen
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({
      error: "ANTHROPIC_API_KEY ist nicht in den Vercel Environment Variables gesetzt.",
    });
  }

  // Body kann je nach Vercel-Runtime String oder Objekt sein
  let body = req.body;
  if (typeof body === "string") {
    try { body = JSON.parse(body); } catch { body = {}; }
  }
  const existing = (body && body.existing) || "";

  const prompt =
    'Erstelle genau 8 neue witzige deutsche Gruebelfragen im Stil von "Sind Buttermesser eigentlich Streichinstrumente?" — kurze, philosophisch-absurde Wortspiel-Fragen. Max 12 Woerter pro Frage. ' +
    "Nicht wiederholen: " + existing + ". " +
    "Antworte NUR mit einem JSON-Array von Strings, kein anderer Text.";

  try {
    const upstream = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-5",
        max_tokens: 1000,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    const text = await upstream.text();
    if (!upstream.ok) {
      return res.status(upstream.status).json({
        error: "Anthropic API Fehler",
        status: upstream.status,
        details: text.slice(0, 500),
      });
    }

    // Antwort 1:1 weiterreichen
    res.setHeader("Content-Type", "application/json");
    return res.status(200).send(text);
  } catch (err) {
    return res.status(500).json({ error: String(err && err.message || err) });
  }
}
