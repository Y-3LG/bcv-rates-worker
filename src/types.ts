export interface Rates {
  bcv: number;
  usdt: number;
  eur: number;
  updated_at: string;
  sources: {
    bcv: string;
    usdt: string;
    eur: string;
  };
}

export interface Env {
  RATES_KV: KVNamespace;
}
