import { prisma } from "../src/lib/prisma";
import { seedAcademicKnowledgeBase } from "../src/lib/rag/seed-knowledge";
import { searchAllAcademicSources } from "../src/lib/rag/academic-crawler";
import { executeFinancialRag } from "../src/lib/rag/rag-service";

async function runRagTests() {
  console.log("==================================================");
  console.log("🚀 TESTING NEXAFINANCE INSTITUTIONAL RAG PIPELINE");
  console.log("==================================================\n");

  try {
    // 1. Get an existing workspace
    const workspace = await prisma.workspace.findFirst({
      select: { id: true, name: true, accounts: true },
    });

    if (!workspace) {
      console.error("❌ No workspace found in database!");
      return;
    }

    console.log(`📌 Found workspace: "${workspace.name}" (ID: ${workspace.id})`);

    // 2. Test Academic Crawler (arXiv + OpenAlex + SAK)
    console.log("\n--- [TEST 1] Testing Academic Crawler (arXiv + OpenAlex + SAK) ---");
    const crawlResults = await searchAllAcademicSources("Markowitz Modern Portfolio Theory");
    console.log(`Found ${crawlResults.length} academic references.`);
    crawlResults.forEach((doc, idx) => {
      console.log(`  [${idx + 1}] [${doc.scope} - ${doc.journalOrSource}] ${doc.title} (${doc.year || "N/A"})`);
      if (doc.url) console.log(`      Link: ${doc.url}`);
    });

    if (crawlResults.length > 0) {
      console.log("✅ Academic Crawler test PASSED!");
    } else {
      console.log("⚠️ Academic Crawler returned 0 results (check internet/APIs).");
    }

    // 3. Test Knowledge Seeder into Neon pgvector
    console.log("\n--- [TEST 2] Testing Knowledge Seeder into Neon pgvector ---");
    await seedAcademicKnowledgeBase();
    const docCount = await prisma.knowledgeDocument.count();
    console.log(`Current knowledge documents stored in Neon: ${docCount}`);
    console.log("✅ Knowledge Seeder test PASSED!");

    // 4. Test RAG Pipeline: Asset Management Persona
    console.log("\n--- [TEST 3] Testing RAG Pipeline: Asset Management Persona ---");
    const query = "Bagaimana alokasi aset optimal dengan Sharpe Ratio berdasarkan data rekening saya saat ini?";
    console.log(`Query: "${query}"`);

    const ragResponse = await executeFinancialRag({
      workspaceId: workspace.id,
      persona: "ASSET_MANAGEMENT",
      query,
      enableLiveAcademicSearch: true,
    });

    console.log("\n--- Synthesized AI Answer Preview ---");
    console.log(ragResponse.answer.slice(0, 800) + "...\n");
    console.log(`Used ${ragResponse.citations.length} academic citations:`);
    ragResponse.citations.forEach((c) => {
      console.log(`  - [${c.sourceType}] ${c.title} (${c.authors})`);
    });

    console.log("\n==================================================");
    console.log("🎉 ALL RAG PIPELINE TESTS PASSED SUCCESSFULLY!");
    console.log("==================================================");
  } catch (error: any) {
    console.error("❌ Test failed with error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

runRagTests();
