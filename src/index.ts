import { fetchDolarAPI } from "./dolarapi";
import { fetchBinanceP2P } from "./binance";
import { Rates, Env } from "./types";

const KV_KEY = "rates";
const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Content-Type": "application/json",
};

async function updateRates(env: Env): Promise<void> {
  const [dolarData, usdt] = await Promise.allSettled([
    fetchDolarAPI(),
    fetchBinanceP2P(),
  ]);

  const existing = await env.RATES_KV.get(KV_KEY);
  const prev: Rates | null = existing ? JSON.parse(existing) : null;

  const bcv = dolarData.status === "fulfilled" ? dolarData.value.bcv : prev?.bcv ?? 0;
  const eur = dolarData.status === "fulfilled" ? dolarData.value.eur : prev?.eur ?? 0;
  const usdtVal = usdt.status === "fulfilled" ? usdt.value : prev?.usdt ?? 0;

  const rates: Rates = {
    bcv,
    eur,
    usdt: usdtVal,
    updated_at: new Date().toISOString(),
    sources: {
      bcv: "pydolarve.org - BCV oficial",
      usdt: "Binance P2P - promedio top 5 vendedores VES",
      eur: "pydolarve.org - Banco Central de Venezuela",
    },
  };

  await env.RATES_KV.put(KV_KEY, JSON.stringify(rates), {
    expirationTtl: 86400,
  });
}

async function handleRequest(request: Request, env: Env): Promise<Response> {
  if (request.method === "OPTIONS") {
    return new Response(null, { headers: CORS_HEADERS });
  }

  const cached = await env.RATES_KV.get(KV_KEY);

  if (!cached) {
    await updateRates(env);
    const fresh = await env.RATES_KV.get(KV_KEY);
    if (!fresh) {
      return new Response(
        JSON.stringify({ error: "Tasas no disponibles todavia" }),
        { status: 503, headers: CORS_HEADERS }
      );
    }
    return new Response(fresh, { headers: CORS_HEADERS });
  }

  return new Response(cached, {
    headers: { ...CORS_HEADERS, "Cache-Control": "public, max-age=60" },
  });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    return handleRequest(request, env);
  },
  async scheduled(_event: ScheduledEvent, env: Env): Promise<void> {
    await updateRates(env);
  },
};