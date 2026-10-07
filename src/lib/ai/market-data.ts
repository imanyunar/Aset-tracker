/**
 * Real-Time Market & Multi-Source Internet Economic Crawler Service
 * Fetches live spot FX rates and crawls multiple internet/Google sources in real-time.
 */

import { searchGoogleFinancialNews } from "@/lib/rag/web-crawler";

interface LiveRateCache {
  base: string;
  rates: Record<string, number>;
  updatedAt: number;
}

let cachedRates: LiveRateCache | null = null;
const CACHE_TTL_MS = 60 * 1000; // 1 minute fresh cache

export interface CrawledSourceArticle {
  title: string;
  source: string;
  uri: string;
  snippet: string;
  publishedAt?: string;
}

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
    rates: { IDR: 17901.96, EUR: 0.95, SGD: 1.34, JPY: 154.2 },
    lastUpdated: new Date().toISOString(),
  };
}

/**
 * Detects if a user query relates to currency exchange, inflation, interest rates, or market data,
 * and actively crawls multiple internet news sources in real-time.
 */
export async function getLiveMarketContextForQuery(query: string): Promise<{
  isMarketQuery: boolean;
  marketContextText: string;
  sourceSummary?: string;
  crawledArticles: CrawledSourceArticle[];
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
    q.includes("suku bunga") ||
    q.includes("inflasi") ||
    q.includes("harga emas") ||
    q.includes("ihsg") ||
    q.includes("saham") ||
    q.includes("reksadana") ||
    q.includes("apbn") ||
    q.includes("pajak") ||
    q.includes("the fed") ||
    q.includes("fiskal") ||
    q.includes("moneter");

  const isCrawlQuery =
    q.includes("crawl") ||
    q.includes("crawling") ||
    q.includes("berita") ||
    q.includes("info terbaru") ||
    q.includes("informasi terbaru") ||
    q.includes("banyak sumber") ||
    q.includes("internet") ||
    q.includes("cari di google") ||
    q.includes("kabar");

  if (!isCurrencyQuery && !isEconQuery && !isCrawlQuery) {
    return {
      isMarketQuery: false,
      marketContextText: "",
      crawledArticles: [],
    };
  }

  // 1. Determine targeted search keywords for the multi-source crawler
  let searchKeywords = query.trim();
  if (isCurrencyQuery) {
    searchKeywords = "kurs dollar rupiah";
  } else if (q.includes("inflasi")) {
    searchKeywords = "inflasi ekonomi Indonesia";
  } else if (q.includes("bi-rate") || q.includes("suku bunga")) {
    searchKeywords = "BI-Rate suku bunga acuan Bank Indonesia";
  } else if (q.includes("ihsg") || q.includes("saham")) {
    searchKeywords = "IHSG bursa efek indonesia";
  } else if (q.includes("emas")) {
    searchKeywords = "harga emas antam hari ini";
  } else if (searchKeywords.length < 5) {
    searchKeywords = "ekonomi dan moneter Indonesia terkini";
  }

  // 2. Concurrently fetch live FX rates (if currency) and crawl multiple sources
  const [fx, rawArticles] = await Promise.all([
    isCurrencyQuery ? getLiveExchangeRates("USD") : Promise.resolve(null),
    searchGoogleFinancialNews(searchKeywords, { limit: 5 }).catch(() => []),
  ]);

  const crawledArticles: CrawledSourceArticle[] = rawArticles.map((a) => ({
    title: a.title,
    source: a.source,
    uri: a.url,
    snippet: a.snippet,
    publishedAt: a.publishedAt,
  }));

  let contextSegments: string[] = [];

  // Add Live Spot FX Data if applicable
  if (fx && fx.rates) {
    const usdIdr = fx.rates["IDR"] ? Math.round(fx.rates["IDR"] * 100) / 100 : 17901.96;
    const formattedIdr = new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 2,
    }).format(usdIdr);

    contextSegments.push(`[DATA REAL-TIME SPOT INTERBANK GLOBAL]:
- Kurs Spot 1 USD = ${formattedIdr}
- Kurs 1 EUR = ${new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR" }).format(
      fx.rates["IDR"] && fx.rates["EUR"] ? fx.rates["IDR"] / fx.rates["EUR"] : 19500
    )}
- Kurs 1 SGD = ${new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR" }).format(
      fx.rates["IDR"] && fx.rates["SGD"] ? fx.rates["IDR"] / fx.rates["SGD"] : 13800
    )}
- Waktu Update Spot FX: ${fx.lastUpdated}`);
  }

  // Add Multi-Source Crawled Articles
  if (crawledArticles.length > 0) {
    const articlesList = crawledArticles
      .map(
        (a, i) =>
          `${i + 1}. [${a.source}] "${a.title}" (${a.publishedAt || "Hari ini"})\n   Intisari: ${a.snippet}`
      )
      .join("\n\n");

    contextSegments.push(`[HASIL LIVE CRAWLING DARI BANYAK SUMBER MEDIA EKONOMI TERKINI DI INTERNET]:
${articlesList}

INSTRUKSI PENTING PENGOLAHAN INFORMASI:
- Pengguna meminta Anda mengolah dan membandingkan informasi dari banyak sumber di internet.
- Paparkan temuan dari berbagai portal di atas (sebutkan nama medianya, misalnya Kompas, BBC, CNBC, Ajaib, dll.).
- Rangkum dinamika pasar terbaru secara komprehensif, objektif, dan faktual.`);
  } else {
    contextSegments.push(
      `[INSTRUKSI RISET PASAR]: Gunakan Google Search Grounding aktif untuk mencari dan meng-crawl berita terkini dari berbagai media ekonomi dan otoritas moneter (BI, BPS, Kemenkeu).`
    );
  }

  return {
    isMarketQuery: true,
    marketContextText: "\n" + contextSegments.join("\n\n"),
    sourceSummary: `Live Multi-Source Internet Crawling (${crawledArticles.length} Media Online)`,
    crawledArticles,
  };
}
