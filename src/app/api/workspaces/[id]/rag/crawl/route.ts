import { NextRequest, NextResponse } from "next/server";
import { requireUser, requireWorkspaceAccess } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { searchArxivFinance, searchOpenAlex } from "@/lib/rag/academic-crawler";
import {
  crawlFinancialWebFullText,
  crawlDirectWebsite,
  ingestWebArticlesToVectorDb,
  WebCrawledArticle,
} from "@/lib/rag/web-crawler";
import { getEmbedding, storeChunkWithEmbedding } from "@/lib/rag/embedding-service";
import { enforceRateLimit } from "@/lib/rate-limit";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const rateLimitError = await enforceRateLimit(req, "rag-crawl", 15, 60);
    if (rateLimitError) return rateLimitError;

    const user = await requireUser();
    const { id: workspaceId } = await params;
    await requireWorkspaceAccess(user.id, workspaceId);

    const body = await req.json();
    const {
      query,
      source = "GOOGLE_WEB",
      limit = 5,
      crawlFullText = true,
      lang = "id",
    } = body;

    if (!query || typeof query !== "string") {
      return NextResponse.json(
        { error: "Query topik pencarian/crawling atau URL web wajib diisi" },
        { status: 400 }
      );
    }

    const trimmedQuery = query.trim();
    const isUrl = /^https?:\/\//i.test(trimmedQuery);

    // 1. Direct URL Crawling
    if (source === "DIRECT_URL" || isUrl) {
      const article = await crawlDirectWebsite(trimmedQuery);
      const ingestResult = await ingestWebArticlesToVectorDb([article], workspaceId);

      return NextResponse.json({
        success: true,
        source: "DIRECT_URL",
        query: trimmedQuery,
        crawledCount: 1,
        ingestedCount: ingestResult.ingestedCount,
        totalChunksCount: ingestResult.totalChunksCount,
        articles: [article],
        documents: ingestResult.documents,
      });
    }

    // 2. Google & Financial Web Full Crawling (Default & Primary Engine)
    if (source === "GOOGLE_WEB" || source === "ALL" || source === "ALL_WEB") {
      const safeLimit = Math.max(1, Math.min(10, Number(limit) || 5));
      const webArticles = await crawlFinancialWebFullText(trimmedQuery, {
        limit: safeLimit,
        fetchBody: crawlFullText,
        lang,
      });

      const ingestResult = await ingestWebArticlesToVectorDb(webArticles, workspaceId);

      return NextResponse.json({
        success: true,
        source: "GOOGLE_WEB",
        query: trimmedQuery,
        crawledCount: webArticles.length,
        ingestedCount: ingestResult.ingestedCount,
        totalChunksCount: ingestResult.totalChunksCount,
        articles: webArticles,
        documents: ingestResult.documents,
      });
    }

    // 3. Academic arXiv & OpenAlex Crawling (Legacy Mode)
    let papersToIngest: any[] = [];
    if (source === "ARXIV") {
      papersToIngest = await searchArxivFinance(trimmedQuery, limit);
    } else if (source === "OPENALEX") {
      papersToIngest = await searchOpenAlex(trimmedQuery, limit);
    } else {
      const [arxiv, openAlex] = await Promise.all([
        searchArxivFinance(trimmedQuery, Math.ceil(limit / 2)),
        searchOpenAlex(trimmedQuery, Math.ceil(limit / 2)),
      ]);
      papersToIngest = [...arxiv, ...openAlex];
    }

    const ingested: any[] = [];
    let chunksCreated = 0;

    for (const paper of papersToIngest) {
      const existing = await prisma.knowledgeDocument.findFirst({
        where: {
          OR: [{ id: paper.id }, { title: paper.title }],
        },
      });

      if (existing) {
        ingested.push({ ...existing, alreadyExisted: true });
        continue;
      }

      const doc = await prisma.knowledgeDocument.create({
        data: {
          id: paper.id,
          workspaceId,
          title: paper.title,
          authors: Array.isArray(paper.authors) ? paper.authors.join(", ") : paper.authors,
          year: paper.year,
          journal: paper.journalOrSource,
          doi: paper.doi || null,
          url: paper.url,
          category: paper.category,
          scope: paper.scope,
          abstract: paper.abstract,
        },
      });

      const chunkText = `[${paper.category} | ${paper.journalOrSource} (${paper.year})] ${paper.title} by ${doc.authors}.\n\nAbstract: ${paper.abstract}`;
      const embedding = await getEmbedding(chunkText);
      const chunkId = `chunk_${doc.id}_0`;

      await storeChunkWithEmbedding(chunkId, doc.id, 0, chunkText, embedding);
      chunksCreated++;
      ingested.push({ ...doc, alreadyExisted: false });
    }

    return NextResponse.json({
      success: true,
      source,
      query: trimmedQuery,
      crawledCount: papersToIngest.length,
      ingestedCount: ingested.length,
      totalChunksCount: chunksCreated,
      articles: papersToIngest,
    });
  } catch (error: any) {
    console.error("[Economic Web Crawler API Error]:", error);
    return NextResponse.json(
      { error: "Gagal melakukan web crawling data ekonomi", details: error.message },
      { status: 500 }
    );
  }
}
