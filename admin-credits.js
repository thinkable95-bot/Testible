// Kyle-only. Grants (or tops up) credits on an access code.
// Protected by ADMIN_SECRET so nobody else can hand out free credits.

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

  const { adminSecret, code, credits } = payload;

  if (!adminSecret || adminSecret !== process.env.ADMIN_SECRET) {
    return { statusCode: 401, body: JSON.stringify({ error: "Unauthorized" }) };
  }
  if (!code || typeof credits !== "number") {
    return { statusCode: 400, body: JSON.stringify({ error: "Need a code (string) and credits (number)." }) };
  }

  const store = getStore("testable-credits");
  const existing = (await store.get(code, { type: "json" })) || { credits: 0 };
  existing.credits += credits;
  await store.setJSON(code, existing);

  return {
    statusCode: 200,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code, credits: existing.credits })
  };
};
