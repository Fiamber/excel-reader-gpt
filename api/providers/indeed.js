// /api/providers/indeed.js
import * as cheerio from "cheerio";
import { normalizeCity, normalizeRole } from "../lib/normalize.js";

function buildIndeedSearchUrl({ rol, ciudad, fresh_days }) {
  const q = encodeURIComponent(rol);
  const l = encodeURIComponent(ciudad || "");
  const params = new URLSearchParams();
  params.set("q", q);
  params.set("l", l);

  const days = parseInt(fresh_days, 10);
  if (!Number.isNaN(days) && days > 0) params.set("fromage", String(days));

  return `https://es.indeed.com/jobs?${params.toString()}`;
}

async function fetchHtml(url) {
  const res = await fetch(url, {
    headers: {
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

  const anchors = $("a[data-jk]").toArray();
  for (const a of anchors) {
    if (offers.length >= limit) break;

    const jk = $(a).attr("data-jk");
    if (!jk) continue;

    let titulo = $(a).find("span").first().text().trim() || $(a).text().trim();

    const root = $(a).closest("li, div");
    const empresa =
      root.find(".companyName").first().text().trim() ||
      $(a).closest("td, div, li").find(".companyName").first().text().trim();

    const ubicacion =
      root.find(".companyLocation").first().text().trim() ||
      $(a).closest("td, div, li").find(".companyLocation").first().text().trim() ||
      ciudadFallback ||
      "";

    const snippet =
      root.find(".job-snippet").first().text().trim() ||
      $(a).closest("td, div, li").find(".job-snippet").first().text().trim() ||
      "";

    const url = `https://es.indeed.com/viewjob?jk=${encodeURIComponent(jk)}`;

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
      raw: { jobkey: jk, source_url: null },
    });
  }

  return offers;
}

export async function search({ rol, ciudad, fresh_days, limite }) {
  const roleNorm = normalizeRole(rol);
  const cityNorm = normalizeCity(ciudad);

  const limitNum = Math.max(1, Math.min(parseInt(limite, 10) || 5, 20));
  const url = buildIndeedSearchUrl({ rol: roleNorm, ciudad: cityNorm, fresh_days });

  const html = await fetchHtml(url);
  const offers = extractOffersFromIndeedHtml(html, limitNum, cityNorm);

  return offers.map(o => ({
    ...o,
    raw: { ...(o.raw || {}), source_url: url },
  }));
}
