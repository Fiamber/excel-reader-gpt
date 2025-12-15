// /api/lib/dedupe.js
const crypto = require("crypto");

function makeStableId({ titulo, empresa, url }) {
  const base = `${titulo || ""}||${empresa || ""}||${url || ""}`.trim();
  return crypto.createHash("sha1").update(base).digest("hex");
}

function dedupeOffers(offers = []) {
  const seen = new Set();
  const out = [];

  for (const o of offers) {
    const key = (o.url || "").trim().toLowerCase() || makeStableId(o);
    if (seen.has(key)) continue;
    seen.add(key);

    // Aseguramos id estable
    out.push({
      ...o,
      id: o.id || makeStableId(o),
    });
  }
  return out;
}

module.exports = {
  makeStableId,
  dedupeOffers,
};

