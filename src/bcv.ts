// Tasa oficial publicada por el BCV, extraída directamente de su página principal.
// El bloque "Tipo de Cambio de Referencia" es HTML server-rendered con IDs fijos
// por divisa (#dolar, #euro, #yuan, #lira, #rublo), cada uno con un
// <strong class="strong-tb">valor</strong>. También trae la fecha valor en un
// atributo ISO máquina-legible, que usamos para saber si el BCV ya actualizó hoy.

import { parseVzlaNumber } from "./parse";

export interface BcvOficial {
  usd: number;
  eur: number;
  cny: number;
  try_: number;
  rub: number;
  valueDate: string | null;
}

const FIELD_IDS: Record<keyof Omit<BcvOficial, "valueDate">, string> = {
  usd: "dolar",
  eur: "euro",
  cny: "yuan",
  try_: "lira",
  rub: "rublo",
};

export async function fetchBcvOficial(): Promise<BcvOficial> {
  const res = await fetch("https://www.bcv.org.ve/", {
    headers: { "User-Agent": "Mozilla/5.0 (compatible; CambioAppBot/1.0)" },
  });
  if (!res.ok) throw new Error(`BCV error: ${res.status}`);

  const values: Record<string, string> = {};
  let valueDate: string | null = null;

  class ValueHandler {
    constructor(private key: string) {}
    text(text: Text) {
      values[this.key] = (values[this.key] ?? "") + text.text;
    }
  }

  class DateHandler {
    element(el: Element) {
      valueDate = el.getAttribute("content");
    }
  }

  let rewriter = new HTMLRewriter();
  for (const [key, id] of Object.entries(FIELD_IDS)) {
    rewriter = rewriter.on(`#${id} .strong-tb`, new ValueHandler(key));
  }
  rewriter = rewriter.on('.pull-right.dinpro span[property="dc:date"]', new DateHandler());

  await rewriter.transform(res).arrayBuffer();

  const missing = Object.keys(FIELD_IDS).filter((k) => !values[k]);
  if (missing.length > 0) {
    throw new Error(`BCV: no se pudo leer ${missing.join(", ")} — el sitio pudo haber cambiado su HTML`);
  }

  return {
    usd: parseVzlaNumber(values.usd),
    eur: parseVzlaNumber(values.eur),
    cny: parseVzlaNumber(values.cny),
    try_: parseVzlaNumber(values.try_),
    rub: parseVzlaNumber(values.rub),
    valueDate,
  };
}
