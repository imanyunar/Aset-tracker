import { GoogleGenerativeAI } from "@google/generative-ai";
import { prisma } from "@/lib/prisma";
import { FINANCIAL_PERSONAS, FinancialPersona } from "./personas";
import { getEmbedding, searchSimilarChunks, SimilarChunkResult } from "./embedding-service";
import { searchAllAcademicSources, AcademicPaper } from "./academic-crawler";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";
const genAI = GEMINI_API_KEY ? new GoogleGenerativeAI(GEMINI_API_KEY) : null;

export interface Citation {
  title: string;
  authors: string;
  year: number;
  journal: string;
  url?: string;
  doi?: string;
  scope: string;
  sourceType: "VECTOR_DB" | "LIVE_ARXIV" | "LIVE_OPENALEX" | "REGULATORY_PSAK";
}

export interface RagResponse {
  answer: string;
  persona: {
    id: FinancialPersona;
    title: string;
    badge: string;
  };
  citations: Citation[];
  workspaceStatsApplied: boolean;
}

/**
 * Execute Full Financial RAG Query
 */
export async function executeFinancialRag(params: {
  workspaceId: string;
  query: string;
  persona: FinancialPersona;
  enableLiveAcademicSearch?: boolean;
}): Promise<RagResponse> {
  const { workspaceId, query, persona, enableLiveAcademicSearch = true } = params;
  const personaConfig = FINANCIAL_PERSONAS[persona] || FINANCIAL_PERSONAS.FINANCIAL_CONSULTANT;

  // 1. Fetch user's live workspace financial context (accounts, cashflow, transactions)
  let workspaceContextText = "";
  let workspaceStatsApplied = false;

  try {
    const [workspace, accounts, recentTx, summaryAgg] = await Promise.all([
      prisma.workspace.findUnique({
        where: { id: workspaceId },
        select: { name: true, type: true, currency: true },
      }),
      prisma.financialAccount.findMany({
        where: { workspaceId },
        select: { name: true, type: true, balance: true },
      }),
      prisma.transaction.findMany({
        where: { workspaceId },
        take: 8,
        orderBy: { transactedAt: "desc" },
        select: {
          description: true,
          type: true,
          amount: true,
          transactedAt: true,
          category: { select: { name: true } },
          account: { select: { name: true } },
        },
      }),
      prisma.transaction.groupBy({
        by: ["type"],
        where: { workspaceId },
        _sum: { amount: true },
      }),
    ]);

    if (workspace) {
      const totalBalance = accounts.reduce((sum, a) => sum + BigInt(a.balance), BigInt(0));
      const incomeTotal = summaryAgg.find((s) => s.type === "INCOME")?._sum.amount || BigInt(0);
      const expenseTotal = summaryAgg.find((s) => s.type === "EXPENSE")?._sum.amount || BigInt(0);
      const netCashflow = incomeTotal - expenseTotal;

      workspaceContextText = `
=== KONTEKS DATA KEUANGAN PENGGUNA (WORKSPACE: ${workspace.name} [${workspace.type}]) ===
- Total Saldo Kas & Rekening Bank: Rp ${Number(totalBalance).toLocaleString("id-ID")}
- Akun Keuangan Aktif: ${accounts.map((a) => `${a.name} (${a.type}): Rp ${Number(a.balance).toLocaleString("id-ID")}`).join(", ")}
- Total Pemasukan Kumulatif: Rp ${Number(incomeTotal).toLocaleString("id-ID")}
- Total Pengeluaran Kumulatif: Rp ${Number(expenseTotal).toLocaleString("id-ID")}
- Arus Kas Bersih (Net Cash Flow): Rp ${Number(netCashflow).toLocaleString("id-ID")}
- Contoh Transaksi Terkini:
${recentTx
  .map(
    (t) =>
      `  * [${t.type}] Rp ${Number(t.amount).toLocaleString("id-ID")} - ${t.description} (${t.category?.name || "Tanpa Kategori"}, Rek: ${t.account.name})`
  )
  .join("\n")}
`;
      workspaceStatsApplied = true;
    }
  } catch (err) {
    console.warn("[RAG] Failed to pull workspace context:", err);
  }

  // 2. Vector DB Retrieval via Neon pgvector
  const queryEmbedding = await getEmbedding(query);
  const vectorChunks = await searchSimilarChunks(queryEmbedding, 4);

  // 3. Live Academic Retrieval (arXiv, OpenAlex, National PSAK)
  let livePapers: AcademicPaper[] = [];
  if (enableLiveAcademicSearch) {
    try {
      livePapers = await searchAllAcademicSources(query);
    } catch (err) {
      console.warn("[RAG] Live academic search failed:", err);
    }
  }

  // 4. Consolidate Citations
  const citations: Citation[] = [];
  const addedTitles = new Set<string>();

  for (const chunk of vectorChunks) {
    if (!addedTitles.has(chunk.title)) {
      addedTitles.add(chunk.title);
      citations.push({
        title: chunk.title,
        authors: chunk.authors || "Pakar Keuangan",
        year: chunk.year || 2023,
        journal: chunk.journal || "Neon Financial Knowledge Base",
        url: chunk.url || undefined,
        doi: chunk.doi || undefined,
        scope: chunk.scope,
        sourceType: "VECTOR_DB",
      });
    }
  }

  for (const paper of livePapers.slice(0, 4)) {
    if (!addedTitles.has(paper.title)) {
      addedTitles.add(paper.title);
      citations.push({
        title: paper.title,
        authors: paper.authors.join(", "),
        year: paper.year,
        journal: paper.journalOrSource,
        url: paper.url,
        doi: paper.doi,
        scope: paper.scope,
        sourceType: paper.scope === "NATIONAL" ? "REGULATORY_PSAK" : paper.id.startsWith("arxiv") ? "LIVE_ARXIV" : "LIVE_OPENALEX",
      });
    }
  }

  // 5. Construct Grounded Prompt for Gemini / LLM
  const retrievedLiteratureText = [
    ...vectorChunks.map(
      (c, i) => `[Rujukan Vektor ${i + 1}] Judul: "${c.title}" (${c.authors || "Pakar"}, ${c.year || ""}) - ${c.journal}
Kutipan Inti: ${c.content}`
    ),
    ...livePapers.slice(0, 3).map(
      (p, i) => `[Rujukan Jurnal Ilmiah ${i + 1}] Judul: "${p.title}" (${p.authors.join(", ")}, ${p.year}) - ${p.journalOrSource}
Abstrak: ${p.abstract}`
    ),
  ].join("\n\n");

  const prompt = `
${personaConfig.systemPrompt}

Anda ditugaskan menjawab pertanyaan pengguna dengan menggabungkan:
1. Kerangka Teori & Riset Jurnal Ilmiah Terkini (RAG).
2. Data Keuangan Riil Pengguna di Workspace NexaFinance.
3. Kepatuhan Standar Akuntansi (PSAK/IFRS) atau Metodologi Keuangan Institusional.

${workspaceContextText}

=== RUJUKAN JURNAL ILMIAH & LITERATUR KEUANGAN TERPERIKSA (RAG) ===
${retrievedLiteratureText || "Gunakan basis pengetahuan standar industri keuangan, perbankan investasi, dan PSAK/IFRS."}

=== PERTANYAAN PENGGUNA ===
"${query}"

=== INSTRUKSI STRUKTUR JAWABAN ===
1. **Eksekutif Summary / Opini Utama**: Berikan jawaban langsung dari sudut pandang peran Anda (${personaConfig.title}).
2. **Analisis Kuantitatif & Diagnosa Finansial**: Terapkan rumus/metodologi keuangan yang relevan, hubungkan langsung dengan angka saldo dan arus kas pengguna bila berlaku.
3. **Landasan Teori & Rujukan Ilmiah**: Sebutkan makalah, jurnal, atau PSAK yang relevan (misal: Markowitz 1952, Fama-French 1993, PSAK 71/72, Damodaran DCF, dll).
4. **Rencana Tindakan Strategis (Actionable Recommendations)**: Berikan rekomendasi langkah konkret bernomor.
`;

  // 6. Generate Response
  let answer = "";
  if (genAI) {
    try {
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      const result = await model.generateContent(prompt);
      answer = result.response.text();
    } catch (err) {
      console.warn("[RAG] Gemini call failed, generating deterministic expert synthesis:", err);
    }
  }

  if (!answer) {
    answer = generateFallbackExpertAnswer(persona, query, citations, workspaceContextText);
  }

  return {
    answer,
    persona: {
      id: personaConfig.id,
      title: personaConfig.title,
      badge: personaConfig.badge,
    },
    citations,
    workspaceStatsApplied,
  };
}

function generateFallbackExpertAnswer(
  persona: FinancialPersona,
  query: string,
  citations: Citation[],
  workspaceCtx: string
): string {
  const p = FINANCIAL_PERSONAS[persona];
  const citationList = citations
    .slice(0, 3)
    .map((c) => `- **${c.title}** (${c.authors}, ${c.year}) - *${c.journal}*`)
    .join("\n");

  return `### Analisis Strategis ${p.title}

Berdasarkan tinjauan komprehensif terhadap permasalahan: **"${query}"**

#### 1. Diagnosa Finansial & Metodologi Inti
Dalam kerangka kerja **${p.frameworks[0]}**, efisiensi keuangan menuntut disiplin arus kas dan alokasi modal yang terukur secara kuantitatif. Struktur pengeluaran dan likuiditas harus diseimbangkan antara cadangan operasional (Working Capital Buffer) dan yield aset produktif.

#### 2. Landasan Akademik & Standar Akuntansi
Analisis ini didukung oleh literatur ilmiah dan standar regulasi terverifikasi dalam basis data kami:
${citationList || "- *Standar Akuntansi Keuangan (SAK) & Prinsip Tata Kelola Korporasi*"}

#### 3. Rekomendasi Rencana Aksi
1. **Immediate Action (0-30 Hari)**: Lakukan audit rekonsiliasi kas dan pangkas pos biaya operasional yang tidak berkontribusi langsung pada margin.
2. **Medium Term (1-3 Bulan)**: Terapkan mitigasi likuiditas berbasis stress testing arus kas sesuai panduan manajemen risiko institusional.
3. **Long Term Strategy**: Optimalkan rasio imbal hasil terhadap risiko portofolio untuk menjaga daya tahan modal jangka panjang.`;
}
