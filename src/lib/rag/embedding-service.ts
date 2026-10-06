import { GoogleGenerativeAI } from "@google/generative-ai";
import { prisma } from "@/lib/prisma";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";
const genAI = GEMINI_API_KEY ? new GoogleGenerativeAI(GEMINI_API_KEY) : null;

export const EMBEDDING_DIMENSION = 768;

/**
 * Generate 768-dimensional embedding vector for text
 * Uses Gemini text-embedding-004 when key is configured,
 * with deterministic semantic hashing fallback.
 */
export async function getEmbedding(text: string): Promise<number[]> {
  const sanitized = text.slice(0, 4000).trim();
  if (!sanitized) {
    return new Array(EMBEDDING_DIMENSION).fill(0);
  }

  if (genAI) {
    try {
      const model = genAI.getGenerativeModel({ model: "text-embedding-004" });
      const result = await model.embedContent(sanitized);
      if (result.embedding?.values && result.embedding.values.length > 0) {
        return result.embedding.values;
      }
    } catch (err) {
      console.warn("[EmbeddingService] Gemini embedding call failed, using mathematical fallback:", err);
    }
  }

  // Fallback: Deterministic normalized pseudo-vector based on character/token distribution
  return generateDeterministicEmbedding(sanitized, EMBEDDING_DIMENSION);
}

function generateDeterministicEmbedding(text: string, dimensions: number): number[] {
  const vec = new Array(dimensions).fill(0);
  const words = text.toLowerCase().split(/\s+/);
  
  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    let hash = 0;
    for (let j = 0; j < word.length; j++) {
      hash = (hash << 5) - hash + word.charCodeAt(j);
      hash |= 0;
    }
    const idx = Math.abs(hash) % dimensions;
    vec[idx] += 1 / (i + 1);
  }

  // Normalize to unit length (L2 norm)
  let norm = 0;
  for (let i = 0; i < dimensions; i++) {
    norm += vec[i] * vec[i];
  }
  norm = Math.sqrt(norm) || 1;

  for (let i = 0; i < dimensions; i++) {
    vec[i] = Number((vec[i] / norm).toFixed(6));
  }

  return vec;
}

export interface SimilarChunkResult {
  id: string;
  documentId: string;
  chunkIndex: number;
  content: string;
  title: string;
  authors: string | null;
  year: number | null;
  journal: string | null;
  doi: string | null;
  url: string | null;
  category: string;
  scope: string;
  similarity: number;
}

/**
 * Query top-K similar chunks using pgvector cosine distance (<=>)
 */
export async function searchSimilarChunks(
  queryEmbedding: number[],
  topK = 5,
  categoryFilter?: string
): Promise<SimilarChunkResult[]> {
  try {
    const vectorStr = `[${queryEmbedding.join(",")}]`;
    let query: string;

    if (categoryFilter) {
      query = `
        SELECT dc.id, dc."documentId", dc."chunkIndex", dc.content,
               kd.title, kd.authors, kd.year, kd.journal, kd.doi, kd.url, kd.category, kd.scope,
               (1 - (dc.embedding <=> '${vectorStr}'::vector)) as similarity
        FROM document_chunks dc
        JOIN knowledge_documents kd ON dc."documentId" = kd.id
        WHERE dc.embedding IS NOT NULL AND kd.category = '${categoryFilter}'
        ORDER BY dc.embedding <=> '${vectorStr}'::vector ASC
        LIMIT ${topK};
      `;
    } else {
      query = `
        SELECT dc.id, dc."documentId", dc."chunkIndex", dc.content,
               kd.title, kd.authors, kd.year, kd.journal, kd.doi, kd.url, kd.category, kd.scope,
               (1 - (dc.embedding <=> '${vectorStr}'::vector)) as similarity
        FROM document_chunks dc
        JOIN knowledge_documents kd ON dc."documentId" = kd.id
        WHERE dc.embedding IS NOT NULL
        ORDER BY dc.embedding <=> '${vectorStr}'::vector ASC
        LIMIT ${topK};
      `;
    }

    const rows = (await prisma.$queryRawUnsafe(query)) as any[];
    return rows.map((r) => ({
      id: r.id,
      documentId: r.documentId,
      chunkIndex: r.chunkIndex,
      content: r.content,
      title: r.title,
      authors: r.authors,
      year: r.year,
      journal: r.journal,
      doi: r.doi,
      url: r.url,
      category: r.category,
      scope: r.scope,
      similarity: Number(r.similarity || 0),
    }));
  } catch (err) {
    console.error("[EmbeddingService] Error querying pgvector:", err);
    return [];
  }
}

/**
 * Store a document chunk with its vector embedding in Neon pgvector
 */
export async function storeChunkWithEmbedding(
  chunkId: string,
  documentId: string,
  chunkIndex: number,
  content: string,
  embedding: number[]
) {
  const vectorStr = `[${embedding.join(",")}]`;
  const escapedContent = content.replace(/'/g, "''");

  await prisma.$executeRawUnsafe(`
    INSERT INTO document_chunks ("id", "documentId", "chunkIndex", "content", "embedding", "createdAt")
    VALUES ('${chunkId}', '${documentId}', ${chunkIndex}, '${escapedContent}', '${vectorStr}'::vector, NOW())
    ON CONFLICT (id) DO UPDATE SET
      content = EXCLUDED.content,
      embedding = EXCLUDED.embedding;
  `);
}
