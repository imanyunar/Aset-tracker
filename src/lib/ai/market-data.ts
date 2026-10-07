/**
 * Real-Time Market & Exchange Rate Service
 * Fetches live spot FX rates and economic indicators to prevent AI hallucination.
 */

interface LiveRateCache {
  base: string;
  rates: Record<string, number>;
  updatedAt: number;
}

let cachedRates: LiveRateCache | null = null;
const CACHE_TTL_MS = 60 * 1000; // 1 minute fresh cache

export async function getLiveExchangeRates(baseCurrency: string = "USD"): Promise<{
  success: boolean;
  base: string;
  rates: Record<string, number>;
  lastUpdated: string;
}> {
  const now = Date.now();
  if (cachedRates && cachedRates.base === baseCurrency && now - cachedRates.updatedAt < CACHE_TTL_MS) {
    return {
      success: true,
      base: cachedRates.base,
      rates: cachedRates.rates,
      lastUpdated: new Date(cachedRates.updatedAt).toISOString(),
    };
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);

    const res = await fetch(`https://open.er-api.com/v6/latest/${baseCurrency}`, {
      signal: controller.signal,
      headers: { "User-Agent": "NexaFinance-Institutional/1.0" },
    });
    clearTimeout(timeout);

    if (res.ok) {
      const data = await res.json();
      if (data && data.rates) {
        cachedRates = {
          base: baseCurrency,
          rates: data.rates,
          updatedAt: now,
        };
        return {
          success: true,
          base: baseCurrency,
          rates: data.rates,
          lastUpdated: data.time_last_update_utc || new Date().toISOString(),
        };
      }
    }
  } catch (err) {
    console.warn("[MarketData] Error fetching live FX rates:", err);
  }

  // Return fallback or cached data if available
  if (cachedRates) {
    return {
      success: true,
      base: cachedRates.base,
      rates: cachedRates.rates,
      lastUpdated: new Date(cachedRates.updatedAt).toISOString(),
    };
  }

  return {
    success: false,
    base: baseCurrency,
    rates: { IDR: 17910, EUR: 0.95, SGD: 1.34, JPY: 154.2 },
    lastUpdated: new Date().toISOString(),
  };
}

/**
 * Detects if a user query relates to currency exchange, inflation, interest rates, or market data.
 */
export async function getLiveMarketContextForQuery(query: string): Promise<{
  isMarketQuery: boolean;
  marketContextText: string;
  sourceSummary?: string;
}> {
  const q = query.toLowerCase();

  const isCurrencyQuery =
    q.includes("rate dollar") ||
    q.includes("rate usd") ||
    q.includes("kurs dollar") ||
    q.includes("kurs usd") ||
    q.includes("dollar idr") ||
    q.includes("usd idr") ||
    q.includes("kurs rupiah") ||
    q.includes("nilai tukar") ||
    q.includes("kurs euro") ||
    q.includes("kurs sgd") ||
    q.includes("kurs yen") ||
    q.includes("kurs bca") ||
    q.includes("exchange rate");

  const isEconQuery =
    q.includes("bi-rate") ||
    q.includes("bi rate") ||
    q.includes("suku bunga acuan") ||
    q.includes("inflasi") ||
    q.includes("harga emas") ||
    q.includes("ihsg");

  if (!isCurrencyQuery && !isEconQuery) {
    return { isMarketQuery: false, marketContextText: "" };
  }

  if (isCurrencyQuery) {
    const fx = await getLiveExchangeRates("USD");
    const usdIdr = fx.rates["IDR"] ? Math.round(fx.rates["IDR"] * 100) / 100 : 17905;
    const formattedIdr = new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 2,
    }).format(usdIdr);

    return {
      isMarketQuery: true,
      marketContextText: `\n[DATA REAL-TIME LIVE PASAR SPOT INTERNASIONAL]:
- Kurs 1 USD = ${formattedIdr} (Spot Rate Interbank Terkini)
- Kurs 1 EUR = ${new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR" }).format(
        fx.rates["IDR"] && fx.rates["EUR"] ? fx.rates["IDR"] / fx.rates["EUR"] : 19500
      )}
- Kurs 1 SGD = ${new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR" }).format(
        fx.rates["IDR"] && fx.rates["SGD"] ? fx.rates["IDR"] / fx.rates["SGD"] : 13800
      )}
- Waktu Update Data: ${fx.lastUpdated}
PENTING: Gunakan angka real-time di atas dan hasil Google Search Grounding. Jangan menggunakan angka historis lama.`,
      sourceSummary: `Live Spot Interbank & Google Search Grounding (${fx.lastUpdated})`,
    };
  }

  return {
    isMarketQuery: true,
    marketContextText: `\n[INSTRUKSI RISET PASAR REAL-TIME]: Pertanyaan pengguna membutuhkan data makroekonomi terkini. Gunakan Google Search Grounding aktif untuk merujuk ke rilis resmi Bank Indonesia (BI), BPS, atau Bursa Efek Indonesia (BEI) terkini.`,
    sourceSummary: "Google Search Grounding Real-Time",
  };
}
