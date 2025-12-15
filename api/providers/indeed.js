// /api/providers/indeed.js
const cheerio = require("cheerio");
const { normalizeCity, normalizeRole } = require("../lib/normalize");

function buildIndeedSearchUrl({ rol, ciudad, fresh_days }) {
  const q = encodeURIComponent(rol);
  const l = encodeURIComponent(ciudad || "");
  const params = new URLSearchParams();
  params.set("q", q);
  params.set("l", l);

  // Indeed soporta "fromage" (días desde publicación) en muchos casos
  const days = parseInt(fresh_days, 10);
  if (!Number.isNaN(days) && days > 0) {
    params.set("fromage", String(days));
  }

  return `https://es.indeed.com/jobs?${params.toString()}`;
}

async function fetchHtml(url) {
  const res = await fetch(url, {
    headers: {
      // User-Agent decente para evitar bloqueos tontos
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36",
      "Accept-Language": "es-ES,es;q=0.9,en;q=0.8",
    },
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Indeed fetch failed: ${res.status} ${res.statusText} :: ${text.slice(0, 200)}`);
  }
  return res.text();
}

function extractOffersFromIndeedHtml(html, limit, ciudadFallback) {
  const $ = cheerio.load(html);
  const offers = [];

  // En Indeed, muchas ofertas tienen "data-jk" (job key).
  // Buscamos anchors con data-jk para construir URL directa /viewjob?jk=...
  const anchors = $("a[data-jk]").toArray();

  for (const a of anchors) {
    if (offers.length >= limit) break;

    const jk = $(a).attr("data-jk");
    if (!jk) continue;

    // Título: puede estar en span dentro del anchor o cerca
    let titulo =
      $(a).find("span").first().text().trim() ||
      $(a).text().trim();

    // Subimos al contenedor para encontrar empresa/ubicación/snippet
    const card = $(a).closest("li, div").parent(); // heurística
    const empresa =
      card.find(".companyName").first().text().trim() ||
      $(a).closest("td, div, li").find(".companyName").first().text().trim();

    const ubicacion =
      card.find(".companyLocation").first().text().trim() ||
      $(a).closest("td, div, li").find(".companyLocation").first().text().trim() ||
      ciudadFallback ||
      "";

    const snippet =
      card.find(".job-snippet").first().text().trim() ||
      $(a).closest("td, div, li").find(".job-snippet").first().text().trim() ||
      "";

    // URL directa
    const url = `https://es.indeed.com/viewjob?jk=${encodeURIComponent(jk)}`;

    // Filtro mínimo de calidad: título + empresa o al menos título + url
    if (!titulo || titulo.length < 3) continue;

    offers.push({
      titulo,
      empresa: empresa || null,
      ciudad: ubicacion || null,
      pais: "España",
      modalidad: null,
      url,
      fuente: "indeed",
      fecha_publicacion: null,
      snippet: snippet || null,
      salario_publicado: null,
      tags: [],
      raw: {
        jobkey: jk,
        source_url: null,
      },
    });
  }

  return offers;
}

async function search({ rol, ciudad, pais, remote, fresh_days, limite }) {
  const roleNorm = normalizeRole(rol);
  const cityNorm = normalizeCity(ciudad);

  const limitNum = Math.max(1, Math.min(parseInt(limite, 10) || 5, 20));

  const url = buildIndeedSearchUrl({
    rol: roleNorm,
    ciudad: cityNorm,
    fresh_days,
  });

  const html = await fetchHtml(url);
  const offers = extractOffersFromIndeedHtml(html, limitNum, cityNorm);

  // Guardamos source_url en raw si quieres trazabilidad
  return offers.map(o => ({
    ...o,
    raw: { ...(o.raw || {}), source_url: url },
  }));
}

module.exports = {
  search,
};

