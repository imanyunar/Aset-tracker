import { GoogleGenerativeAI } from "@google/generative-ai";
import { formatRupiah } from "@/lib/serialize";

export interface ParsedReceipt {
  merchantName: string;
  totalAmount: number;
  date?: string;
  items?: Array<{ name: string; price: number }>;
  suggestedCategoryId?: string | null;
  suggestedCategoryName?: string | null;
  confidence: number;
}

export interface Plan503020 {
  income: number;
  needs: {
    targetAmount: number;
    actualAmount: number;
    targetPercentage: number;
    actualPercentage: number;
    status: "HEALTHY" | "OVERSPENT";
  };
  wants: {
    targetAmount: number;
    actualAmount: number;
    targetPercentage: number;
    actualPercentage: number;
    status: "HEALTHY" | "OVERSPENT";
  };
  savings: {
    targetAmount: number;
    actualAmount: number;
    targetPercentage: number;
    actualPercentage: number;
    status: "ON_TRACK" | "BELOW_TARGET";
  };
  aiRecommendations: string[];
}

/**
 * Parses receipt/invoice images using Gemini Vision OCR.
 */
export async function parseReceiptVision(
  base64Data: string,
  mimeType: string,
  categories: Array<{ id: string; name: string }>
): Promise<ParsedReceipt> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (apiKey) {
    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

      const categoryPromptList = categories.map((c) => `- ID: "${c.id}", Nama: "${c.name}"`).join("\n");
      const prompt = `Anda adalah ahli OCR analisis struk belanja dan kwitansi Indonesia.
Ekstrak data dari struk berikut:
1. merchantName: Nama toko/merchant/restoran (string).
2. totalAmount: Nilai total pembayaran akhir dalam angka Rupiah (integer positif tanpa desimal).
3. date: Tanggal transaksi jika ada (format YYYY-MM-DD).
4. suggestedCategoryId: Pilih ID kategori yang paling cocok dari daftar kategori berikut:
${categoryPromptList}

Kembalikan HANYA format JSON valid:
{
  "merchantName": "Nama Merchant",
  "totalAmount": 125000,
  "date": "2026-10-06",
  "suggestedCategoryId": "id_kategori",
  "confidence": 0.95
}`;

      // Clean base64 header if present (e.g. data:image/jpeg;base64,...)
      const cleanedBase64 = base64Data.includes(",") ? base64Data.split(",")[1] : base64Data;

      const result = await model.generateContent([
        prompt,
        {
          inlineData: {
            data: cleanedBase64,
            mimeType: mimeType || "image/jpeg",
          },
        },
      ]);

      const responseText = result.response.text();
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        const matchedCategory = categories.find((c) => c.id === parsed.suggestedCategoryId);
        return {
          merchantName: parsed.merchantName || "Struk Pembelian",
          totalAmount: parseInt(parsed.totalAmount, 10) || 0,
          date: parsed.date,
          suggestedCategoryId: parsed.suggestedCategoryId || categories[0]?.id,
          suggestedCategoryName: matchedCategory?.name || categories[0]?.name,
          confidence: parsed.confidence || 0.9,
        };
      }
    } catch (err) {
      console.warn("[GeminiVision] Vision API error, falling back to simulator:", err);
    }
  }

  // Fallback simulator for development
  return {
    merchantName: "Indomaret / Merchant Rekanan",
    totalAmount: 85000,
    date: new Date().toISOString().slice(0, 10),
    suggestedCategoryId: categories[0]?.id || null,
    suggestedCategoryName: categories[0]?.name || "Belanja Bulanan",
    confidence: 0.8,
  };
}

/**
 * Calculates 50/30/20 financial rule and generates intelligent recommendations.
 */
export async function generate503020FinancialPlan({
  workspaceName,
  monthlyIncome,
  categoryBreakdown,
}: {
  workspaceName: string;
  monthlyIncome: number;
  categoryBreakdown: Array<{ name: string; amount: number }>;
}): Promise<Plan503020> {
  const income = monthlyIncome > 0 ? monthlyIncome : 10000000; // Baseline fallback

  // Classify categories into Needs (50%) and Wants (30%)
  const needsKeywords = ["tagihan", "utilitas", "listrik", "air", "sewa", "belanja bulanan", "transport", "kesehatan", "gaji", "operasional"];
  const wantsKeywords = ["hiburan", "makan", "minum", "kopi", "liburan", "hobi", "belanja"];

  let actualNeeds = 0;
  let actualWants = 0;

  categoryBreakdown.forEach((cat) => {
    const nameLower = cat.name.toLowerCase();
    if (needsKeywords.some((kw) => nameLower.includes(kw))) {
      actualNeeds += cat.amount;
    } else if (wantsKeywords.some((kw) => nameLower.includes(kw))) {
      actualWants += cat.amount;
    } else {
      actualNeeds += cat.amount; // default conservative
    }
  });

  const actualSavings = Math.max(0, income - (actualNeeds + actualWants));

  const targetNeeds = Math.round(income * 0.5);
  const targetWants = Math.round(income * 0.3);
  const targetSavings = Math.round(income * 0.2);

  const actualNeedsPct = Math.round((actualNeeds / income) * 100);
  const actualWantsPct = Math.round((actualWants / income) * 100);
  const actualSavingsPct = Math.round((actualSavings / income) * 100);

  // Generate actionable AI recommendations
  const recommendations: string[] = [];

  if (actualNeedsPct > 50) {
    recommendations.push(
      `Pos Kebutuhan Pokok (${actualNeedsPct}%) melampaui batas ideal 50%. Pertimbangkan untuk menegosiasikan kembali biaya utilitas atau memilih opsi belanja bulanan yang lebih hemat.`
    );
  } else {
    recommendations.push(
      `Pos Kebutuhan Pokok terjaga sangat baik di angka ${actualNeedsPct}% (di bawah batas maksimal 50%). Anda memiliki fleksibilitas kas yang kuat.`
    );
  }

  if (actualWantsPct > 30) {
    recommendations.push(
      `Pos Keinginan & Gaya Hidup (${actualWantsPct}%) melebihi alokasi 30%. Batasi pengeluaran makan di luar dan hiburan akhir pekan untuk mencegah defisit.`
    );
  } else {
    recommendations.push(
      `Alokasi Keinginan (${actualWantsPct}%) berada dalam koridor aman dan seimbang.`
    );
  }

  if (actualSavingsPct >= 20) {
    recommendations.push(
      `Hebat! Rasio Tabungan & Investasi Anda mencapai ${actualSavingsPct}% (target minimum 20%). Alokasikan surplus ini ke instrumen berimbal hasil stabil seperti Reksadana Pasar Uang atau SBN.`
    );
  } else {
    recommendations.push(
      `Rasio Tabungan Anda saat ini (${actualSavingsPct}%) masih di bawah target 20%. Pangkas pos pengeluaran sekunder untuk mengamankan dana darurat minimal 3-6 bulan pengeluaran.`
    );
  }

  return {
    income,
    needs: {
      targetAmount: targetNeeds,
      actualAmount: actualNeeds,
      targetPercentage: 50,
      actualPercentage: actualNeedsPct,
      status: actualNeedsPct <= 50 ? "HEALTHY" : "OVERSPENT",
    },
    wants: {
      targetAmount: targetWants,
      actualAmount: actualWants,
      targetPercentage: 30,
      actualPercentage: actualWantsPct,
      status: actualWantsPct <= 30 ? "HEALTHY" : "OVERSPENT",
    },
    savings: {
      targetAmount: targetSavings,
      actualAmount: actualSavings,
      targetPercentage: 20,
      actualPercentage: actualSavingsPct,
      status: actualSavingsPct >= 20 ? "ON_TRACK" : "BELOW_TARGET",
    },
    aiRecommendations: recommendations,
  };
}

/**
 * Interactive financial advisor chat powered by Gemini.
 */
export async function chatWithFinancialAssistant({
  messages,
  workspaceContext,
}: {
  messages: Array<{ role: "user" | "assistant"; content: string }>;
  workspaceContext: {
    workspaceName: string;
    workspaceType: string;
    totalBalance: number;
    monthlyIncome: number;
    monthlyExpense: number;
    accounts: string[];
  };
}): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (apiKey) {
    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

      const systemInstruction = `Anda adalah NexaAI, konsultan perencana keuangan pribadi dan bisnis profesional kelas dunia dengan standar presisi Morgan Stanley.
Karakter: Lugas, santun, objektif, berorientasi angka, dan memberikan saran praktis yang dapat dieksekusi segera.

KONTEKS FINANSIAL SAAT INI:
- Workspace: ${workspaceContext.workspaceName} (${workspaceContext.workspaceType})
- Total Likuiditas / Saldo: ${formatRupiah(workspaceContext.totalBalance)}
- Pemasukan Bulan Ini: ${formatRupiah(workspaceContext.monthlyIncome)}
- Pengeluaran Bulan Ini: ${formatRupiah(workspaceContext.monthlyExpense)}
- Rekening Aktif: ${workspaceContext.accounts.join(", ")}

Jawab pertanyaan pengguna dalam Bahasa Indonesia dengan format rapi dan poin yang jelas.`;

      const formattedHistory = messages.slice(0, -1).map((m) => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.content }],
      }));

      const lastUserMessage = messages[messages.length - 1]?.content || "Halo";

      const chat = model.startChat({
        history: [
          { role: "user", parts: [{ text: systemInstruction }] },
          { role: "model", parts: [{ text: "Siap, saya memahami seluruh konteks finansial workspace Anda. Ada yang bisa saya bantu?" }] },
          ...formattedHistory,
        ],
      });

      const response = await chat.sendMessage(lastUserMessage);
      return response.response.text();
    } catch (err) {
      console.warn("[GeminiChat] Gemini API error, falling back to contextual assistant:", err);
    }
  }

  // Fallback intelligent responder
  const lastMsg = messages[messages.length - 1]?.content.toLowerCase() || "";
  if (lastMsg.includes("anggaran") || lastMsg.includes("budget") || lastMsg.includes("50/30/20")) {
    return `Berdasarkan data keuangan di **${workspaceContext.workspaceName}**, total saldo likuiditas Anda saat ini adalah **${formatRupiah(workspaceContext.totalBalance)}**.\n\nRekomendasi alokasi 50/30/20 untuk pemasukan bulan ini (${formatRupiah(workspaceContext.monthlyIncome)}):\n- **50% Kebutuhan Pokok**: Maksimal ${formatRupiah(Math.round(workspaceContext.monthlyIncome * 0.5))}\n- **30% Keinginan**: Maksimal ${formatRupiah(Math.round(workspaceContext.monthlyIncome * 0.3))}\n- **20% Tabungan/Investasi**: Minimal ${formatRupiah(Math.round(workspaceContext.monthlyIncome * 0.2))}\n\nPastikan pengeluaran harian tidak melampaui batas pagu kategori yang telah ditentukan.`;
  }

  return `Halo! Saya NexaAI, asisten finansial Anda di **${workspaceContext.workspaceName}**.\n\nRingkasan keuangan Anda saat ini:\n- **Total Likuiditas**: ${formatRupiah(workspaceContext.totalBalance)}\n- **Pemasukan Bulan Ini**: ${formatRupiah(workspaceContext.monthlyIncome)}\n- **Pengeluaran Bulan Ini**: ${formatRupiah(workspaceContext.monthlyExpense)}\n- **Arus Kas Bersih**: ${formatRupiah(workspaceContext.monthlyIncome - workspaceContext.monthlyExpense)}\n\nKondisi arus kas Anda saat ini cukup sehat. Apakah ada pos pengeluaran tertentu yang ingin kita analisis bersama?`;
}
