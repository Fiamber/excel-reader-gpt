// /api/lib/normalize.js
function normalizeText(input = "") {
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

function normalizeCity(city = "") {
  const c = normalizeText(city);
  if (!c) return "";

  // Alias típicos
  if (["bcn", "barna", "barcelona"].includes(c)) return "Barcelona";
  if (["mad", "madrid"].includes(c)) return "Madrid";

  // Capitaliza primera letra de cada palabra
  return c
    .split(" ")
    .map(w => (w ? w[0].toUpperCase() + w.slice(1) : ""))
    .join(" ");
}

function normalizeRole(role = "") {
  // No hacemos magia aún: solo limpiamos.
  // Más adelante puedes meter sinónimos / OR queries.
  return normalizeText(role);
}

module.exports = {
  normalizeText,
  normalizeCity,
  normalizeRole,
};

