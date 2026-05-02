// Obtiene el promedio de las 5 mejores órdenes de venta USDT/VES en Binance P2P
// No requiere autenticación
export async function fetchBinanceP2P(): Promise<number> {
  const payload = {
    fiat: "VES",
    page: 1,
    rows: 5,
    tradeType: "SELL",
    asset: "USDT",
    countries: [],
    proMerchantAds: false,
    shieldMerchantAds: false,
    filterType: "all",
    periods: [],
    additionalKycVerifyFilter: 0,
    publisherType: null,
    payTypes: [],
    classifies: ["mass", "profession"],
  };

  const res = await fetch(
    "https://p2p.binance.com/bapi/c2c/v2/friendly/c2c/adv/search",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }
  );

  if (!res.ok) throw new Error(`Binance P2P error: ${res.status}`);

  const json: any = await res.json();
  const ads: any[] = json.data ?? [];

  if (ads.length === 0) throw new Error("No hay órdenes en Binance P2P");

  const prices = ads.map((ad: any) => parseFloat(ad.adv.price));
  const avg = prices.reduce((a, b) => a + b, 0) / prices.length;

  return Math.round(avg * 100) / 100;
}
