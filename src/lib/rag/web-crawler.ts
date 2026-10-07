import { getEmbedding, storeChunkWithEmbedding } from "./embedding-service";
import { prisma } from "@/lib/prisma";

export interface WebCrawledArticle {
  id: string;
  title: string;
  url: string;
  source: string;
  publishedAt?: string;
  snippet: string;
  content?: string;
  category: "MACROECONOMICS" | "FINANCIAL_MARKETS" | "MONETARY_POLICY" | "BANKING_REGULATION" | "CORPORATE_FINANCE" | "ECONOMIC_NEWS";
  scope: "NATIONAL" | "INTERNATIONAL" | "REGULATORY";
  wordCount?: number;
}

/**
 * Clean XML / HTML text helper
 */
function cleanText(text: string): string {
  if (!text) return "";
  return text
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, " ")
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Categorize financial topic into standard taxonomy
 */
export function categorizeEconomicTopic(
  text: string
): "MACROECONOMICS" | "FINANCIAL_MARKETS" | "MONETARY_POLICY" | "BANKING_REGULATION" | "CORPORATE_FINANCE" | "ECONOMIC_NEWS" {
  const lower = text.toLowerCase();
  if (lower.includes("bi-rate") || lower.includes("suku bunga") || lower.includes("bank indonesia") || lower.includes("the fed") || lower.includes("moneter") || lower.includes("inflasi")) {
    return "MONETARY_POLICY";
  }
  if (lower.includes("ojk") || lower.includes("regulasi") || lower.includes("psak") || lower.includes("ifrs") || lower.includes("kepatuhan") || lower.includes("tata kelola")) {
    return "BANKING_REGULATION";
  }
  if (lower.includes("ihsg") || lower.includes("saham") || lower.includes("obligasi") || lower.includes("reksadana") || lower.includes("valas") || lower.includes("rupiah") || lower.includes("emas") || lower.includes("bursa")) {
    return "FINANCIAL_MARKETS";
  }
  if (lower.includes("pdb") || lower.includes("pertumbuhan ekonomi") || lower.includes("apbn") || lower.includes("fiskal") || lower.includes("ekspor") || lower.includes("impor") || lower.includes("makro")) {
    return "MACROECONOMICS";
  }
  if (lower.includes("laba") || lower.includes("dividen") || lower.includes("ipo") || lower.includes("emiten") || lower.includes("merger") || lower.includes("arus kas")) {
    return "CORPORATE_FINANCE";
  }
  return "ECONOMIC_NEWS";
}

/**
 * Search Google Financial News RSS for real-time Indonesian & Global economic events
 */
export async function searchGoogleFinancialNews(
  query: string,
  options?: { limit?: number; lang?: "id" | "en" }
): Promise<WebCrawledArticle[]> {
  const limit = Math.max(1, Math.min(15, options?.limit || 6));
  const lang = options?.lang || "id";

  // Build targeted economic query string
  let searchTerms = query.trim();
  if (lang === "id") {
    if (!searchTerms.toLowerCase().includes("ekonomi") && !searchTerms.toLowerCase().includes("keuangan")) {
      searchTerms = `${searchTerms} ekonomi keuangan`;
    }
  } else {
    if (!searchTerms.toLowerCase().includes("finance") && !searchTerms.toLowerCase().includes("economy")) {
      searchTerms = `${searchTerms} economy finance markets`;
    }
  }

  const encodedQuery = encodeURIComponent(searchTerms);
  const url =
    lang === "id"
      ? `https://news.google.com/rss/search?q=${encodedQuery}&hl=id&gl=ID&ceid=ID:id`
      : `https://news.google.com/rss/search?q=${encodedQuery}&hl=en-US&gl=US&ceid=US:en`;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36 NexaFinance-Economic-RAG/2.0",
        Accept: "application/rss+xml, application/xml, text/xml;q=0.9",
      },
    });
    clearTimeout(timeout);

    if (!res.ok) {
      console.warn(`[GoogleNewsCrawler] RSS fetch status: ${res.status}`);
      return [];
    }

    const xml = await res.text();
    const articles: WebCrawledArticle[] = [];

    const itemRegex = /<item>([\s\S]*?)<\/item>/g;
    let match: RegExpExecArray | null;

    while ((match = itemRegex.exec(xml)) !== null && articles.length < limit) {
      const itemXml = match[1];

      const titleMatch = itemXml.match(/<title>([\s\S]*?)<\/title>/);
      const linkMatch = itemXml.match(/<link>([\s\S]*?)<\/link>/);
      const pubDateMatch = itemXml.match(/<pubDate>([\s\S]*?)<\/pubDate>/);
      const descMatch = itemXml.match(/<description>([\s\S]*?)<\/description>/);
      const sourceMatch = itemXml.match(/<source[^>]*>([\s\S]*?)<\/source>/);

      const rawTitle = titleMatch ? cleanText(titleMatch[1]) : "Berita Ekonomi & Keuangan Terkini";
      const rawLink = linkMatch ? cleanText(linkMatch[1]) : "";
      const pubDate = pubDateMatch ? cleanText(pubDateMatch[1]) : new Date().toISOString();
      const snippet = descMatch ? cleanText(descMatch[1]).slice(0, 500) : "";
      const sourceName = sourceMatch ? cleanText(sourceMatch[1]) : "Google Berita Finansial";

      // Split title if it contains source suffix (e.g. "Judul Artikel - CNBC Indonesia")
      let cleanTitle = rawTitle;
      if (rawTitle.includes(" - ")) {
        const parts = rawTitle.split(" - ");
        cleanTitle = parts.slice(0, -1).join(" - ").trim();
      }

      const id = `web_${Math.abs(cleanTitle.split("").reduce((acc, c) => (acc << 5) - acc + c.charCodeAt(0), 0)).toString(36)}_${Date.now().toString(36)}`;

      articles.push({
        id,
        title: cleanTitle,
        url: rawLink || "https://news.google.com",
        source: sourceName,
        publishedAt: pubDate,
        snippet: snippet || cleanTitle,
        category: categorizeEconomicTopic(cleanTitle + " " + snippet),
        scope: lang === "id" ? "NATIONAL" : "INTERNATIONAL",
      });
    }

    return articles;
  } catch (err) {
    console.warn("[GoogleNewsCrawler] Failed to query Google News RSS:", err);
    return [];
  }
}

/**
 * Fetch and extract clean main text from a web page
 */
export async function fetchAndCleanWebContent(
  targetUrl: string,
  timeoutMs = 7000
): Promise<{ title?: string; text: string; wordCount: number }> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    const res = await fetch(targetUrl, {
      signal: controller.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36 NexaFinance-Web-Reader/2.0",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "id,en-US;q=0.9,en;q=0.8",
      },
    });
    clearTimeout(timeout);

    if (!res.ok) {
      return { text: "", wordCount: 0 };
    }

    const html = await res.text();

    // Extract page title
    const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
    const title = titleMatch ? cleanText(titleMatch[1]) : undefined;

    // Remove non-content elements
    const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
    let bodyHtml = bodyMatch ? bodyMatch[1] : html;

    bodyHtml = bodyHtml
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, " ")
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, " ")
      .replace(/<header\b[^<]*(?:(?!<\/header>)<[^<]*)*<\/header>/gi, " ")
      .replace(/<footer\b[^<]*(?:(?!<\/footer>)<[^<]*)*<\/footer>/gi, " ")
      .replace(/<nav\b[^<]*(?:(?!<\/nav>)<[^<]*)*<\/nav>/gi, " ")
      .replace(/<aside\b[^<]*(?:(?!<\/aside>)<[^<]*)*<\/aside>/gi, " ")
      .replace(/<form\b[^<]*(?:(?!<\/form>)<[^<]*)*<\/form>/gi, " ")
      .replace(/<noscript\b[^<]*(?:(?!<\/noscript>)<[^<]*)*<\/noscript>/gi, " ")
      .replace(/<!--[\s\S]*?-->/g, " ");

    // Extract paragraphs and headings
    const paragraphRegex = /<(?:p|article|h1|h2|h3|h4|li)[^>]*>([\s\S]*?)<\/(?:p|article|h1|h2|h3|h4|li)>/gi;
    const segments: string[] = [];
    let pMatch: RegExpExecArray | null;

    while ((pMatch = paragraphRegex.exec(bodyHtml)) !== null) {
      const cleaned = cleanText(pMatch[1]);
      if (cleaned.length > 25 && !cleaned.includes("cookie") && !cleaned.includes("javascript")) {
        segments.push(cleaned);
      }
    }

    const fullText = segments.join("\n\n").slice(0, 10000);
    const wordCount = fullText.split(/\s+/).filter(Boolean).length;

    return {
      title,
      text: fullText,
      wordCount,
    };
  } catch (err) {
    console.warn(`[WebContentCrawler] Failed to fetch ${targetUrl}:`, err);
    return { text: "", wordCount: 0 };
  }
}

/**
 * Full Crawl: Searches Google News & Financial Web, then fetches article bodies concurrently
 */
export async function crawlFinancialWebFullText(
  query: string,
  options?: { limit?: number; fetchBody?: boolean; lang?: "id" | "en" }
): Promise<WebCrawledArticle[]> {
  const articles = await searchGoogleFinancialNews(query, {
    limit: options?.limit || 5,
    lang: options?.lang || "id",
  });

  const shouldFetchBody = options?.fetchBody !== false;
  if (!shouldFetchBody || articles.length === 0) {
    return articles;
  }

  // Concurrently fetch full text for each article (with fallback to snippet)
  const enriched = await Promise.all(
    articles.map(async (art) => {
      try {
        const { text, wordCount } = await fetchAndCleanWebContent(art.url, 6000);
        return {
          ...art,
          content: text && text.length > 100 ? text : art.snippet,
          wordCount: wordCount || art.snippet.split(/\s+/).length,
        };
      } catch {
        return {
          ...art,
          content: art.snippet,
          wordCount: art.snippet.split(/\s+/).length,
        };
      }
    })
  );

  return enriched;
}

/**
 * Directly crawl any specific financial website or article URL
 */
export async function crawlDirectWebsite(
  targetUrl: string,
  customTitle?: string
): Promise<WebCrawledArticle> {
  const { title, text, wordCount } = await fetchAndCleanWebContent(targetUrl, 8000);
  const effectiveTitle = customTitle || title || "Dokumen Web Ekonomi Terverifikasi";
  const snippet = text.slice(0, 400);

  const id = `web_direct_${Math.abs(targetUrl.split("").reduce((acc, c) => (acc << 5) - acc + c.charCodeAt(0), 0)).toString(36)}_${Date.now().toString(36)}`;

  let sourceHost = "Website Finansial";
  try {
    const parsed = new URL(targetUrl);
    sourceHost = parsed.hostname.replace("www.", "");
  } catch {}

  return {
    id,
    title: effectiveTitle,
    url: targetUrl,
    source: sourceHost,
    publishedAt: new Date().toISOString(),
    snippet: snippet || effectiveTitle,
    content: text || snippet,
    category: categorizeEconomicTopic(effectiveTitle + " " + text),
    scope: targetUrl.includes(".id") || targetUrl.includes("indonesia") ? "NATIONAL" : "INTERNATIONAL",
    wordCount,
  };
}

/**
 * Chunk long text into semantic segments with overlap
 */
export function chunkFinancialText(text: string, chunkSize = 800, overlap = 150): string[] {
  if (!text || text.length <= chunkSize) {
    return [text];
  }

  const chunks: string[] = [];
  let startIndex = 0;

  while (startIndex < text.length) {
    let endIndex = startIndex + chunkSize;

    // Try to break at newline or sentence end if possible
    if (endIndex < text.length) {
      const nextBreak = text.lastIndexOf(". ", endIndex);
      if (nextBreak > startIndex + chunkSize / 2) {
        endIndex = nextBreak + 1;
      }
    }

    const chunk = text.slice(startIndex, endIndex).trim();
    if (chunk.length > 50) {
      chunks.push(chunk);
    }

    startIndex = endIndex - overlap;
    if (startIndex >= text.length - overlap) break;
  }

  return chunks;
}

/**
 * Ingest crawled economic web articles into Neon Postgres pgvector
 */
export async function ingestWebArticlesToVectorDb(
  articles: WebCrawledArticle[],
  workspaceId?: string
): Promise<{
  ingestedCount: number;
  totalChunksCount: number;
  documents: Array<{ id: string; title: string; chunksCount: number; alreadyExisted: boolean }>;
}> {
  let ingestedCount = 0;
  let totalChunksCount = 0;
  const docsResult: Array<{ id: string; title: string; chunksCount: number; alreadyExisted: boolean }> = [];

  for (const art of articles) {
    try {
      // Check existing document
      const existing = await prisma.knowledgeDocument.findFirst({
        where: {
          OR: [{ id: art.id }, { url: art.url }, { title: art.title }],
        },
        include: { _count: { select: { chunks: true } } },
      });

      if (existing) {
        docsResult.push({
          id: existing.id,
          title: existing.title,
          chunksCount: existing._count.chunks,
          alreadyExisted: true,
        });
        continue;
      }

      const year = art.publishedAt ? new Date(art.publishedAt).getFullYear() : new Date().getFullYear();

      // Create document in Neon Postgres
      const doc = await prisma.knowledgeDocument.create({
        data: {
          id: art.id,
          workspaceId: workspaceId || null,
          title: art.title,
          authors: art.source,
          year,
          journal: `Google Web Intelligence / ${art.source}`,
          url: art.url,
          category: art.category,
          scope: art.scope,
          abstract: art.snippet,
        },
      });

      // Split into chunks and vectorize
      const textToChunk = art.content && art.content.length > art.snippet.length ? art.content : art.snippet;
      const chunks = chunkFinancialText(textToChunk, 800, 120);

      let createdChunksForDoc = 0;
      for (let i = 0; i < chunks.length; i++) {
        const chunkText = `[${art.category} | ${art.source} (${year})] ${art.title}\n\n${chunks[i]}`;
        const embedding = await getEmbedding(chunkText);
        const chunkId = `chunk_${doc.id}_${i}`;

        await storeChunkWithEmbedding(chunkId, doc.id, i, chunkText, embedding);
        createdChunksForDoc++;
        totalChunksCount++;
      }

      ingestedCount++;
      docsResult.push({
        id: doc.id,
        title: doc.title,
        chunksCount: createdChunksForDoc,
        alreadyExisted: false,
      });
    } catch (err) {
      console.error(`[IngestWebArticles] Error ingesting article "${art.title}":`, err);
    }
  }

  return {
    ingestedCount,
    totalChunksCount,
    documents: docsResult,
  };
}
