// /api/lib/dedupe.js
import crypto from "crypto";

export function makeStableId({ titulo, empresa, url }) {
  const base = `${titulo || ""}||${empresa || ""}||${url || ""}`.trim();
  return crypto.createHash("sha1").update(base).digest("hex");
}

export function dedupeOffers(offers = []) {
  const seen = new Set();
  const out = [];

  for (const o of offers) {
    const key = (o.url || "").trim().toLowerCase() || makeStableId(o);
    if (seen.has(key)) continue;
    seen.add(key);

    out.push({
      ...o,
      id: o.id || makeStableId(o),
    });
  }
  return out;
}
