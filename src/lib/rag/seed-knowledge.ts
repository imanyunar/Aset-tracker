import { prisma } from "@/lib/prisma";
import { INDONESIA_FINANCIAL_KNOWLEDGE_BASE } from "./academic-crawler";
import { getEmbedding, storeChunkWithEmbedding } from "./embedding-service";

export async function seedAcademicKnowledgeBase() {
  console.log("[RAG Knowledge Seeder] Checking existing knowledge documents in Neon...");
  const count = await prisma.knowledgeDocument.count();

  if (count > 0) {
    console.log(`[RAG Knowledge Seeder] Already seeded (${count} documents).`);
    return;
  }

  console.log(`[RAG Knowledge Seeder] Ingesting ${INDONESIA_FINANCIAL_KNOWLEDGE_BASE.length} seminal financial papers & standards...`);

  for (const paper of INDONESIA_FINANCIAL_KNOWLEDGE_BASE) {
    const doc = await prisma.knowledgeDocument.create({
      data: {
        id: paper.id,
        title: paper.title,
        authors: paper.authors.join(", "),
        year: paper.year,
        journal: paper.journalOrSource,
        doi: paper.doi || null,
        url: paper.url,
        category: paper.category,
        scope: paper.scope,
        abstract: paper.abstract,
      },
    });

    // Chunk the paper: Title + Abstract
    const chunkText = `[${paper.category} | ${paper.journalOrSource} (${paper.year})] ${paper.title} by ${paper.authors.join(", ")}.\n\nAbstract: ${paper.abstract}`;
    const embedding = await getEmbedding(chunkText);

    const chunkId = `chunk_${paper.id}_0`;
    await storeChunkWithEmbedding(chunkId, doc.id, 0, chunkText, embedding);
  }

  console.log("[RAG Knowledge Seeder] ✅ Ingestion of foundational papers complete!");
}
