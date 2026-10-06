import { prisma } from "../src/lib/prisma";

async function main() {
  try {
    console.log("Enabling pgvector extension in Neon PostgreSQL...");
    await prisma.$executeRawUnsafe("CREATE EXTENSION IF NOT EXISTS vector;");
    console.log("✅ pgvector extension enabled successfully!");

    const res = await prisma.$queryRawUnsafe("SELECT extname, extversion FROM pg_extension WHERE extname = 'vector';");
    console.log("Extension details:", res);
  } catch (err) {
    console.error("❌ pgvector test error:", err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
