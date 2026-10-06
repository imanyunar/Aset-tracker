import { NextRequest, NextResponse } from "next/server";
import { requireUser, requireWorkspaceAccess } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { getEmbedding, storeChunkWithEmbedding } from "@/lib/rag/embedding-service";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireUser();
    const { id: workspaceId } = await params;
    await requireWorkspaceAccess(user.id, workspaceId);

    const documents = await prisma.knowledgeDocument.findMany({
      where: {
        OR: [{ workspaceId }, { workspaceId: null }],
      },
      orderBy: { createdAt: "desc" },
      include: {
        _count: { select: { chunks: true } },
      },
      take: 50,
    });

    return NextResponse.json({
      documents: documents.map((d) => ({
        id: d.id,
        title: d.title,
        authors: d.authors,
        year: d.year,
        journal: d.journal,
        doi: d.doi,
        url: d.url,
        category: d.category,
        scope: d.scope,
        abstract: d.abstract,
        chunksCount: d._count.chunks,
        createdAt: d.createdAt,
      })),
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireUser();
    const { id: workspaceId } = await params;
    await requireWorkspaceAccess(user.id, workspaceId);

    const body = await req.json();
    const {
      title,
      authors = "Tim Finansial",
      year = new Date().getFullYear(),
      journal = "Internal Knowledge Document",
      doi,
      url,
      category = "FINANCIAL_CONSULTANT",
      scope = "INTERNAL",
      content,
    } = body;

    if (!title || !content) {
      return NextResponse.json(
        { error: "Judul dan konten dokumen wajib diisi" },
        { status: 400 }
      );
    }

    // Create KnowledgeDocument
    const doc = await prisma.knowledgeDocument.create({
      data: {
        workspaceId,
        title,
        authors: typeof authors === "string" ? authors : authors.join(", "),
        year: Number(year),
        journal,
        doi: doi || null,
        url: url || null,
        category,
        scope,
        abstract: content.slice(0, 500),
      },
    });

    // Chunk content into ~800 char chunks with overlap
    const chunkSize = 800;
    const overlap = 100;
    const chunks: string[] = [];
    for (let i = 0; i < content.length; i += chunkSize - overlap) {
      chunks.push(content.slice(i, i + chunkSize));
    }

    // Embed and store each chunk in pgvector
    for (let i = 0; i < chunks.length; i++) {
      const chunkText = `[${title} - ${journal} (${year})] ${chunks[i]}`;
      const embedding = await getEmbedding(chunkText);
      const chunkId = `chunk_${doc.id}_${i}`;
      await storeChunkWithEmbedding(chunkId, doc.id, i, chunkText, embedding);
    }

    return NextResponse.json(
      {
        success: true,
        document: doc,
        chunksCreated: chunks.length,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("[RAG Ingestion Error]:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
