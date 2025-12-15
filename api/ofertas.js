// /api/ofertas.js
import { dedupeOffers } from "./lib/dedupe.js";
import { search as searchIndeed } from "./providers/indeed.js";

const PROVIDERS = {
  indeed: { search: searchIndeed },
};

function parseSourcesParam(sourcesParam) {
  if (!sourcesParam) return ["indeed"];
  return String(sourcesParam)
    .split(",")
    .map(s => s.trim().toLowerCase())
    .filter(Boolean);
}

export default async function handler(req, res) {
  try {
    const {
      rol,
      ciudad = "",
      pais = "es",
      limite = "5",
      remote = "any",
      sources,
      fresh_days = "14",
    } = req.query || {};

    if (!rol || String(rol).trim().length === 0) {
      return res.status(400).json({ error: "Missing required query param: rol" });
    }

    const limitNum = Math.max(1, Math.min(parseInt(limite, 10) || 5, 20));
    const srcList = parseSourcesParam(sources);

    const enabled = srcList.filter(s => PROVIDERS[s]);
    if (enabled.length === 0) enabled.push("indeed");

    let allOffers = [];
    for (const src of enabled) {
      if (allOffers.length >= limitNum) break;
      const remaining = limitNum - allOffers.length;

      const offers = await PROVIDERS[src].search({
        rol,
        ciudad,
        pais,
        remote,
        fresh_days,
        limite: remaining,
      });

      allOffers = allOffers.concat(offers || []);
    }

    allOffers = dedupeOffers(allOffers).slice(0, limitNum);
    return res.status(200).json(allOffers);
  } catch (err) {
    return res.status(500).json({
      error: "Internal error in /api/ofertas",
      details: err?.message || String(err),
    });
  }
}
