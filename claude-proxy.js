// This runs on Netlify's servers, not in the visitor's browser.
// The API key lives only here, as an environment variable — never in the HTML/JS
// that gets sent to whoever opens the app.
//
// Every call now requires a valid access code with credits remaining.
// Credits live in Netlify Blobs (a built-in key/value store) so they persist
// across calls without needing a separate database.

const { getStore } = require("@netlify/blobs");

exports.handler = async function (event) {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  let payload;
  try {
    payload = JSON.parse(event.body);
  } catch (e) {
    return { statusCode: 400, body: JSON.stringify({ error: "Bad request body" }) };
  }

  const { code, ...anthropicBody } = payload;

  if (!code) {
    return { statusCode: 401, body: JSON.stringify({ error: "no_code", message: "Missing access code." }) };
  }

  const store = getStore("testable-credits");
  const record = await store.get(code, { type: "json" });

  if (!record || typeof record.credits !== "number") {
    return { statusCode: 403, body: JSON.stringify({ error: "invalid_code", message: "That access code isn't recognized." }) };
  }
  if (record.credits <= 0) {
    return { statusCode: 402, body: JSON.stringify({ error: "no_credits", message: "Out of credits on this code." }) };
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Server is missing ANTHROPIC_API_KEY. Set it in Netlify: Site settings → Environment variables." })
    };
  }

  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify(anthropicBody)
    });

    const data = await res.text();

    // Only spend a credit on a successful call — a failed API call shouldn't cost the user.
    if (res.ok) {
      record.credits -= 1;
      await store.setJSON(code, record);
    }

    return {
      statusCode: res.status,
      headers: {
        "Content-Type": "application/json",
        "X-Credits-Remaining": String(record.credits)
      },
      body: data
    };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
