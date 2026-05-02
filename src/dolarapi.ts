export async function fetchDolarAPI(): Promise<{ bcv: number; eur: number }> {
  const res = await fetch("https://open.er-api.com/v6/latest/USD");
  if (!res.ok) throw new Error(`ExchangeRate error: ${res.status}`);
  const data: any = await res.json();

  const bcv = data.rates?.VES ?? 0;
  const eurUsd = data.rates?.EUR ?? 0;
  const eur = eurUsd > 0 ? bcv / eurUsd : 0;

  return { bcv, eur };
}