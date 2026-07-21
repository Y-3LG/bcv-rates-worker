// Última intervención cambiaria publicada por el BCV.
// El sitio expone un endpoint de exportación (Drupal Views Data Export) que
// devuelve una tabla HTML mínima — mucho más liviana que la página completa —
// aunque el Content-Type diga "xls", el body es HTML plano y ya viene
// ordenado con la más reciente primero.

import { parseVzlaNumber } from "./parse";

export interface Intervencion {
  fecha: string; // "21-07-2026"
  numero: string; // "020-26"
  tasaEurBs: number;
}

export async function fetchLatestIntervencion(): Promise<Intervencion> {
  const res = await fetch(
    "https://www.bcv.org.ve/cambiaria/export/intervencion-cambiaria",
    { headers: { "User-Agent": "Mozilla/5.0 (compatible; CambioAppBot/1.0)" } }
  );
  if (!res.ok) throw new Error(`Intervencion cambiaria error: ${res.status}`);

  const html = await res.text();
  const rowMatch = html.match(
    /<tr[^>]*>\s*<td>([^<]+)<\/td>\s*<td>([^<]+)<\/td>\s*<td>([^<]+)<\/td>\s*<\/tr>/
  );
  if (!rowMatch) {
    throw new Error("Intervencion cambiaria: no se encontró ninguna fila — el sitio pudo haber cambiado su HTML");
  }

  return {
    fecha: rowMatch[1].trim(),
    numero: rowMatch[2].trim(),
    tasaEurBs: parseVzlaNumber(rowMatch[3]),
  };
}
