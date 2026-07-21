import { fetchBcvOficial } from "./bcv";
import { fetchBinanceP2P } from "./binance";
import { fetchLatestIntervencion } from "./intervencion";
import { Rates, IntervencionRecord, Env } from "./types";

const RATES_KEY = "rates";
const INTERVENCION_KEY = "intervencion";
const FAST_CRON = "*/5 * * * *";
const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Content-Type": "application/json",
};

async function updateRates(env: Env): Promise<void> {
  const [bcvData, usdt] = await Promise.allSettled([
    fetchBcvOficial(),
    fetchBinanceP2P(),
  ]);

  const existing = await env.RATES_KV.get(RATES_KEY);
  const prev: Rates | null = existing ? JSON.parse(existing) : null;

  const bcv = bcvData.status === "fulfilled" ? bcvData.value.usd : prev?.bcv ?? 0;
  const eur = bcvData.status === "fulfilled" ? bcvData.value.eur : prev?.eur ?? 0;
  const bcvValueDate = bcvData.status === "fulfilled" ? bcvData.value.valueDate : prev?.bcv_value_date ?? null;
  if (usdt.status === "rejected") console.error("Binance fetch failed:", usdt.reason);
  if (bcvData.status === "rejected") console.error("BCV fetch failed:", bcvData.reason);
  const usdtVal = usdt.status === "fulfilled" ? usdt.value : prev?.usdt ?? 0;

  const rates: Rates = {
    bcv,
    eur,
    usdt: usdtVal,
    updated_at: new Date().toISOString(),
    bcv_value_date: bcvValueDate,
    sources: {
      bcv: "BCV oficial - www.bcv.org.ve",
      usdt: "Binance P2P - promedio top 5 vendedores VES",
      eur: "BCV oficial - www.bcv.org.ve",
    },
  };

  await env.RATES_KV.put(RATES_KEY, JSON.stringify(rates), {
    expirationTtl: 86400,
  });
}

async function updateIntervencion(env: Env): Promise<void> {
  const existing = await env.RATES_KV.get(INTERVENCION_KEY);
  const prev: IntervencionRecord | null = existing ? JSON.parse(existing) : null;

  const latest = await fetchLatestIntervencion();

  const record: IntervencionRecord = {
    fecha: latest.fecha,
    numero: latest.numero,
    tasa_eur_bs: latest.tasaEurBs,
    updated_at: new Date().toISOString(),
    es_nueva: prev !== null && prev.numero !== latest.numero,
  };

  await env.RATES_KV.put(INTERVENCION_KEY, JSON.stringify(record), {
    expirationTtl: 86400 * 7,
  });
}

async function serveCached(env: Env, key: string, refresh: () => Promise<void>): Promise<Response> {
  const cached = await env.RATES_KV.get(key);

  if (!cached) {
    await refresh();
    const fresh = await env.RATES_KV.get(key);
    if (!fresh) {
      return new Response(
        JSON.stringify({ error: "Datos no disponibles todavia" }),
        { status: 503, headers: CORS_HEADERS }
      );
    }
    return new Response(fresh, { headers: CORS_HEADERS });
  }

  return new Response(cached, {
    headers: { ...CORS_HEADERS, "Cache-Control": "public, max-age=60" },
  });
}

async function handleRequest(request: Request, env: Env): Promise<Response> {
  if (request.method === "OPTIONS") {
    return new Response(null, { headers: CORS_HEADERS });
  }

  const { pathname } = new URL(request.url);

  if (pathname === "/intervencion") {
    return serveCached(env, INTERVENCION_KEY, () => updateIntervencion(env));
  }

  return serveCached(env, RATES_KEY, () => updateRates(env));
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    return handleRequest(request, env);
  },
  async scheduled(event: ScheduledEvent, env: Env): Promise<void> {
    if (event.cron === FAST_CRON) {
      await updateRates(env);
    } else {
      await updateIntervencion(env);
    }
  },
};
