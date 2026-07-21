// Precio de USDT/VES en Binance P2P, vía un proxy propio en Vercel.
// Binance bloquea (403) los rangos de IP de Cloudflare Workers — no es un
// problema de headers, lo confirmamos probando con headers de navegador
// completos y siguió fallando. Vercel no está bloqueado, así que el proxy
// hace el fetch real a Binance y este worker solo le pega a él.
const PROXY_URL = "https://binance-proxy-mocha.vercel.app/api/usdt-ves";

export async function fetchBinanceP2P(): Promise<number> {
  const res = await fetch(PROXY_URL);
  if (!res.ok) throw new Error(`Binance proxy error: ${res.status}`);

  const json: any = await res.json();
  if (typeof json.usdt !== "number") {
    throw new Error(`Binance proxy: respuesta inesperada — ${JSON.stringify(json)}`);
  }

  return json.usdt;
}
