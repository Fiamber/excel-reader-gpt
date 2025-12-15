// /api/lib/normalize.js
export function normalizeText(input = "") {
  return String(input)
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/[áàäâ]/g, "a")
    .replace(/[éèëê]/g, "e")
    .replace(/[íìïî]/g, "i")
    .replace(/[óòöô]/g, "o")
    .replace(/[úùüû]/g, "u")
    .replace(/ñ/g, "n");
}

export function normalizeCity(city = "") {
  const c = normalizeText(city);
  if (!c) return "";

  if (["bcn", "barna", "barcelona"].includes(c)) return "Barcelona";
  if (["mad", "madrid"].includes(c)) return "Madrid";

  return c
    .split(" ")
    .map(w => (w ? w[0].toUpperCase() + w.slice(1) : ""))
    .join(" ");
}

export function normalizeRole(role = "") {
  return normalizeText(role);
}


