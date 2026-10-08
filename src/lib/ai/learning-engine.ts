import { GoogleGenerativeAI } from "@google/generative-ai";
import { prisma } from "@/lib/prisma";
import { getEmbedding, storeChunkWithEmbedding, searchSimilarChunks } from "@/lib/rag/embedding-service";
import { formatRupiah } from "@/lib/serialize";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";
const genAI = GEMINI_API_KEY ? new GoogleGenerativeAI(GEMINI_API_KEY) : null;

export type MemoryCategory =
  | "USER_PREFERENCE"
  | "FINANCIAL_RULE"
  | "FINANCIAL_GOAL"
  | "USER_HABIT"
  | "PERSONAL_CONTEXT";

export interface LearnedMemory {
  id: string;
  workspaceId: string;
  category: MemoryCategory;
  title: string;
  fact: string;
  actionableRule?: string;
  confidence: number;
  createdAt: string;
}

/**
 * AI Memory & Preference Extractor:
 * Analyzes incoming user chat to detect if user is stating a preference, goal, rule, habit, or personal fact.
 */
export async function detectAndExtractMemory(
  userText: string
): Promise<{
  hasMemory: boolean;
  category?: MemoryCategory;
  title?: string;
  fact?: string;
  actionableRule?: string;
  confidence?: number;
}> {
  const sanitized = userText.trim();
  if (sanitized.length < 8) {
    return { hasMemory: false };
  }

  // Fast heuristic trigger check to avoid calling LLM for simple queries
  const lower = sanitized.toLowerCase();
  const triggerWords = [
    "target",
    "tujuan",
    "prefer",
    "lebih suka",
    "jangan",
    "mulai sekarang",
    "kalau saya",
    "jika saya",
    "setiap kali",
    "tiap kali",
    "tiap tanggal",
    "biasanya",
    "gaji saya",
    "gajian",
    "punya hutang",
    "cicilan",
    "mau beli",
    "mau kumpulin",
    "masuk kategori",
    "masuk ke",
    "masukkan ke",
    "kategori",
    "aturan",
    "ingatkan",
    "tolong ingat",
    "ingat ya",
    "saya adalah",
    "pekerjaan saya",
    "selalu",
  ];

  const hasTrigger = triggerWords.some((w) => lower.includes(w));
  if (!hasTrigger) {
    return { hasMemory: false };
  }

  if (genAI) {
    try {
      const model = genAI.getGenerativeModel({
        model: "gemini-2.5-flash",
        generationConfig: { responseMimeType: "application/json" },
      });

      const prompt = `Anda adalah Cognitive Memory Extractor untuk asisten keuangan pribadi.
Tugas Anda: Deteksi apakah pengguna menyatakan fakta pribadi, preferensi, target/tujuan finansial, kebiasaan arus kas, atau aturan transaksi baru.

TEKS PENGGUNA:
"${sanitized}"

KATEGORI YANG TERSEDIA:
- "FINANCIAL_GOAL": Target tabungan, investasi, pelunasan utang, atau pembelian aset.
- "USER_PREFERENCE": Preferensi produk, toleransi risiko, gaya hidup, atau dispensasi peringatan.
- "FINANCIAL_RULE": Aturan kustom (misal: "kalau beli X masuk kategori Y", "belanja Z selalu pakai rekening W").
- "USER_HABIT": Jadwal rutin (tanggal gajian, tanggal bayar tagihan, pengeluaran berulang).
- "PERSONAL_CONTEXT": Profesi, jumlah tanggungan, status pekerjaan, profil risiko.

Jika pesan pengguna HANYA pertanyaan umum, sapaan, atau instruksi transaksi biasa tanpa ada pernyataan preferensi/aturan jangka panjang, kembalikan:
{"hasMemory": false}

Jika pesan MENGANDUNG fakta/preferensi/aturan/target baru yang perlu dipelajari dan diingat untuk percakapan masa depan, kembalikan JSON:
{
  "hasMemory": true,
  "category": "FINANCIAL_GOAL" | "USER_PREFERENCE" | "FINANCIAL_RULE" | "USER_HABIT" | "PERSONAL_CONTEXT",
  "title": "Judul ringkas memori (maks 5 kata, contoh: 'Target Dana Darurat 20 Juta')",
  "fact": "Deskripsi fakta yang dipelajari (1-2 kalimat jelas)",
  "actionableRule": "Bagaimana asisten AI harus menerapkan fakta ini saat bertindak (1 kalimat)",
  "confidence": 0.95
}`;

      const res = await model.generateContent(prompt);
      const text = res.response.text();
      const parsed = JSON.parse(text);

      if (parsed?.hasMemory && parsed?.category && parsed?.fact) {
        return {
          hasMemory: true,
          category: parsed.category,
          title: parsed.title || "Preferensi Keuangan Pengguna",
          fact: parsed.fact,
          actionableRule: parsed.actionableRule,
          confidence: Number(parsed.confidence) || 0.9,
        };
      }
    } catch (err) {
      console.warn("[MemoryEngine] LLM memory extraction failed, using heuristic extractor:", err);
    }
  }

  // Deterministic Heuristic Fallback Extractor
  if (lower.includes("target") || lower.includes("mau kumpulin") || lower.includes("tujuan")) {
    return {
      hasMemory: true,
      category: "FINANCIAL_GOAL",
      title: "Target Finansial Pengguna",
      fact: sanitized,
      actionableRule: "Prioritaskan saran alokasi surplus tabungan untuk mendukung pencapaian target ini.",
      confidence: 0.85,
    };
  }

  if (
    lower.includes("masuk kategori") ||
    lower.includes("masuk ke kategori") ||
    lower.includes("masukkan ke") ||
    lower.includes("mulai sekarang") ||
    (lower.includes("kategori") && (lower.includes("selalu") || lower.includes("kalau") || lower.includes("jika")))
  ) {
    return {
      hasMemory: true,
      category: "FINANCIAL_RULE",
      title: "Aturan Klasifikasi Transaksi",
      fact: sanitized,
      actionableRule: "Terapkan aturan kategorisasi ini secara otomatis saat mencatat transaksi baru.",
      confidence: 0.9,
    };
  }

  if (lower.includes("gajian") || lower.includes("tiap tanggal") || lower.includes("biasanya") || lower.includes("gaji")) {
    return {
      hasMemory: true,
      category: "USER_HABIT",
      title: "Kebiasaan & Jadwal Arus Kas",
      fact: sanitized,
      actionableRule: "Perhitungkan pola arus kas berkala ini dalam perencanaan likuiditas.",
      confidence: 0.88,
    };
  }

  if (lower.includes("jangan ingatkan") || lower.includes("prefer") || lower.includes("lebih suka") || lower.includes("tidak suka")) {
    return {
      hasMemory: true,
      category: "USER_PREFERENCE",
      title: "Preferensi Kebiasaan Finansial",
      fact: sanitized,
      actionableRule: "Sesuaikan rekomendasi anggaran agar selaras dengan preferensi pengguna.",
      confidence: 0.85,
    };
  }

  return { hasMemory: false };
}

/**
 * Stores a learned memory into Neon Postgres KnowledgeDocument & DocumentChunk (pgvector)
 */
export async function saveLearnedMemory(
  workspaceId: string,
  memoryData: {
    category: MemoryCategory;
    title: string;
    fact: string;
    actionableRule?: string;
    confidence?: number;
  }
): Promise<LearnedMemory> {
  const { category, title, fact, actionableRule, confidence = 0.9 } = memoryData;

  // Check if a memory with exact or very similar title already exists in this workspace
  const existing = await prisma.knowledgeDocument.findFirst({
    where: {
      workspaceId,
      category,
      title: { contains: title, mode: "insensitive" },
    },
  });

  const fullAbstract = `${fact}${actionableRule ? `\nAturan Operasional: ${actionableRule}` : ""}`;
  const now = new Date();

  let docId = existing?.id;
  if (existing) {
    // Update existing memory
    await prisma.knowledgeDocument.update({
      where: { id: existing.id },
      data: {
        abstract: fullAbstract,
        authors: `AI Memory (Keyakinan: ${(confidence * 100).toFixed(0)}%)`,
        updatedAt: now,
      },
    });
  } else {
    // Create new memory document
    const created = await prisma.knowledgeDocument.create({
      data: {
        workspaceId,
        title,
        authors: `AI Memory (Keyakinan: ${(confidence * 100).toFixed(0)}%)`,
        year: now.getFullYear(),
        journal: "Nexa AI Active Cognitive Memory",
        category,
        scope: "USER_MEMORY",
        abstract: fullAbstract,
      },
    });
    docId = created.id;
  }

  // Vectorize and store into document_chunks for semantic retrieval
  const chunkText = `[${category} | Pemahaman Pengguna] ${title}\nFakta: ${fact}\nAturan AI: ${actionableRule || "-"}`;
  const embedding = await getEmbedding(chunkText);
  const chunkId = `chunk_mem_${docId}_0`;

  await storeChunkWithEmbedding(chunkId, docId!, 0, chunkText, embedding);

  return {
    id: docId!,
    workspaceId,
    category,
    title,
    fact,
    actionableRule,
    confidence,
    createdAt: now.toISOString(),
  };
}

/**
 * Retrieve all learned memories for a given workspace
 */
export async function getWorkspaceLearnedMemories(
  workspaceId: string
): Promise<LearnedMemory[]> {
  const docs = await prisma.knowledgeDocument.findMany({
    where: {
      workspaceId,
      category: {
        in: [
          "USER_PREFERENCE",
          "FINANCIAL_RULE",
          "FINANCIAL_GOAL",
          "USER_HABIT",
          "PERSONAL_CONTEXT",
        ],
      },
    },
    orderBy: { updatedAt: "desc" },
    take: 30,
  });

  return docs.map((d) => {
    const lines = (d.abstract || "").split("\nAturan Operasional: ");
    const fact = lines[0] || d.title;
    const rule = lines[1] || undefined;

    return {
      id: d.id,
      workspaceId: d.workspaceId || workspaceId,
      category: d.category as MemoryCategory,
      title: d.title,
      fact,
      actionableRule: rule,
      confidence: 0.9,
      createdAt: d.createdAt.toISOString(),
    };
  });
}

/**
 * Delete a specific learned memory
 */
export async function deleteLearnedMemory(
  workspaceId: string,
  memoryId: string
): Promise<boolean> {
  const doc = await prisma.knowledgeDocument.findFirst({
    where: { id: memoryId, workspaceId },
  });

  if (!doc) return false;

  await prisma.knowledgeDocument.delete({
    where: { id: memoryId },
  });

  return true;
}

/**
 * INFORMATION PROCESSING ENGINE:
 * Synthesizes learned memories, live financial numbers, and incoming user queries
 * into a rich, structured reasoning context for Gemini / Groq.
 */
export function synthesizeInformationContext({
  workspaceName,
  totalBalance,
  monthlyIncome,
  monthlyExpense,
  accounts,
  learnedMemories,
  userQuery,
}: {
  workspaceName: string;
  totalBalance: number;
  monthlyIncome: number;
  monthlyExpense: number;
  accounts: string[];
  learnedMemories: LearnedMemory[];
  userQuery?: string;
}): {
  synthesizedPromptContext: string;
  activeGoals: Array<{ title: string; fact: string; progressAssessment?: string }>;
  activeRules: Array<{ title: string; rule: string }>;
} {
  const netCashflow = monthlyIncome - monthlyExpense;

  const goals = learnedMemories.filter((m) => m.category === "FINANCIAL_GOAL");
  const rules = learnedMemories.filter((m) => m.category === "FINANCIAL_RULE");
  const preferences = learnedMemories.filter((m) => m.category === "USER_PREFERENCE");
  const habits = learnedMemories.filter((m) => m.category === "USER_HABIT");
  const contextFacts = learnedMemories.filter((m) => m.category === "PERSONAL_CONTEXT");

  // Process and evaluate financial goals against current balance
  const evaluatedGoals = goals.map((g) => {
    let progressStr = "Dalam Pemantauan Aktif";

    // Detect target number in text if present (e.g. 20 juta)
    const matchJt = g.fact.match(/(\d+(?:[.,]\d+)?)\s*(?:jt|juta)/i);
    const matchNum = g.fact.match(/(?:rp\.?|rp\s*)?(\d{1,3}(?:\.\d{3})+|\d{6,})/i);

    let targetNominal = 0;
    if (matchJt) {
      targetNominal = Math.round(parseFloat(matchJt[1].replace(",", ".")) * 1000000);
    } else if (matchNum) {
      targetNominal = parseInt(matchNum[1].replace(/\./g, ""), 10);
    }

    if (targetNominal > 0) {
      const percentage = Math.min(100, Math.round((totalBalance / targetNominal) * 100));
      const sisa = Math.max(0, targetNominal - totalBalance);
      progressStr = `Target: ${formatRupiah(targetNominal)} | Saldo Saat Ini: ${formatRupiah(totalBalance)} (${percentage}% tercapai, sisa: ${formatRupiah(sisa)})`;
    }

    return {
      title: g.title,
      fact: g.fact,
      progressAssessment: progressStr,
    };
  });

  const activeRulesList = rules.map((r) => ({
    title: r.title,
    rule: r.actionableRule || r.fact,
  }));

  // Construct structured intelligence block
  let memoryText = "";
  if (learnedMemories.length > 0) {
    memoryText = `
=== MEMORI & PEMAHAMAN YANG TELAH DIPELAJARI DARI PENGGUNA (CONTINUOUS LEARNING) ===
1. TARGET & GOALS FINANSIAL:
${evaluatedGoals.map((g) => `   - [${g.title}]: ${g.fact} -> Evaluasi Realitas: ${g.progressAssessment}`).join("\n") || "   (Belum ada target khusus yang diajarkan)"}

2. ATURAN TRANSAKSI KUSTOM (HARUS DITERAPKAN OTOMATIS):
${rules.map((r) => `   - ${r.title}: ${r.actionableRule || r.fact}`).join("\n") || "   (Belum ada aturan kustom)"}

3. PREFERENSI & GAYA HIDUP PENGGUNA:
${preferences.map((p) => `   - ${p.title}: ${p.fact}`).join("\n") || "   (Belum ada preferensi khusus)"}

4. KEBIASAAN ARUS KAS & JADWAL:
${habits.map((h) => `   - ${h.title}: ${h.fact}`).join("\n") || "   (Belum ada jadwal rutin tercatat)"}

5. FAKTA PRIBADI & PROFIL:
${contextFacts.map((c) => `   - ${c.title}: ${c.fact}`).join("\n") || "   (Profil umum pengguna)"}

PETUNJUK PENGOLAHAN INFORMASI OLEH AI:
- Hubungkan setiap pertanyaan pengguna dengan memori dan target yang telah Anda pelajari di atas.
- Jika pengguna menanyakan progres keuangan atau meminta analisis, gunakan evaluasi target di atas.
- Terapkan seluruh aturan kategorisasi transaksi kustom yang telah diajarkan pengguna.
- Tunjukkan bahwa Anda mengingat dan memahami instruksi yang telah diajarkan pengguna di percakapan sebelumnya.
`;
  } else {
    memoryText = `
=== MEMORI PENGGUNA ===
Belum ada memori atau aturan khusus yang diajarkan. Jika pengguna menyatakan target, kebiasaan, atau aturan baru dalam pesan ini, akui dan terapkan secara cerdas.
`;
  }

  return {
    synthesizedPromptContext: memoryText,
    activeGoals: evaluatedGoals,
    activeRules: activeRulesList,
  };
}
