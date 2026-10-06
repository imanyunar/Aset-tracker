import { NextRequest, NextResponse } from "next/server";
import { requireUser, requireWorkspaceAccess } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { searchArxivFinance, searchOpenAlex } from "@/lib/rag/academic-crawler";
import { getEmbedding, storeChunkWithEmbedding } from "@/lib/rag/embedding-service";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireUser();
    const { id: workspaceId } = await params;
    await requireWorkspaceAccess(user.id, workspaceId);

    const body = await req.json();
    const { query, source = "ALL", limit = 4 } = body;

    if (!query || typeof query !== "string") {
      return NextResponse.json(
        { error: "Query topik pencarian/crawling wajib diisi" },
        { status: 400 }
      );
    }

    let papersToIngest: any[] = [];

    if (source === "ARXIV") {
      papersToIngest = await searchArxivFinance(query, limit);
    } else if (source === "OPENALEX") {
      papersToIngest = await searchOpenAlex(query, limit);
    } else {
      const [arxiv, openAlex] = await Promise.all([
        searchArxivFinance(query, Math.ceil(limit / 2)),
        searchOpenAlex(query, Math.ceil(limit / 2)),
      ]);
      papersToIngest = [...arxiv, ...openAlex];
    }

    const ingested: any[] = [];

    for (const paper of papersToIngest) {
      // Check if already in DB
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
      ingested.push({ ...doc, alreadyExisted: false });
    }

    return NextResponse.json({
      success: true,
      query,
      crawledCount: papersToIngest.length,
      ingestedCount: ingested.length,
      papers: ingested,
    });
  } catch (error: any) {
    console.error("[Academic Crawler Ingest Error]:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
