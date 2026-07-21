export interface Rates {
  bcv: number;
  usdt: number;
  eur: number;
  updated_at: string;
  bcv_value_date: string | null;
  sources: {
    bcv: string;
    usdt: string;
    eur: string;
  };
}

export interface IntervencionRecord {
  fecha: string;
  numero: string;
  tasa_eur_bs: number;
  updated_at: string;
  es_nueva: boolean;
}

export interface Env {
  RATES_KV: KVNamespace;
}
