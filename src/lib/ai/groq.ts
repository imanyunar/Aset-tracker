import Groq from "groq-sdk";

export interface ParsedTransaction {
  type: "EXPENSE" | "INCOME" | "TRANSFER";
  amount: number;
  description: string;
  accountId?: string | null;
  accountName?: string | null;
  toAccountId?: string | null;
  toAccountName?: string | null;
  categoryId?: string | null;
  categoryName?: string | null;
  date?: string;
  confidence: number;
}

export interface AccountContext {
  id: string;
  name: string;
  type: string;
}

export interface CategoryContext {
  id: string;
  name: string;
  type: "INCOME" | "EXPENSE";
}

/**
 * Parses natural language Indonesian input into a structured financial transaction.
 */
export async function parseNaturalLanguageTransaction(
  input: string,
  accounts: AccountContext[],
  categories: CategoryContext[]
): Promise<ParsedTransaction> {
  const apiKey = process.env.GROQ_API_KEY;

  if (apiKey) {
    try {
      const groq = new Groq({ apiKey });

      const accountsList = accounts.map((a) => `- ID: "${a.id}", Nama: "${a.name}" (${a.type})`).join("\n");
      const categoriesList = categories
        .map((c) => `- ID: "${c.id}", Nama: "${c.name}" (Tipe: ${c.type})`)
        .join("\n");

      const prompt = `Anda adalah parser transaksi keuangan Indonesia kelas institusional.
Tugas Anda adalah mengekstrak entitas dari kalimat pengguna dan mencocokkannya ke ID rekening dan kategori yang tersedia.

DAFTAR REKENING TERSEDIA:
${accountsList || "Tidak ada rekening khusus"}

DAFTAR KATEGORI TERSEDIA:
${categoriesList || "Tidak ada kategori khusus"}

KALIMAT TRANSAKSI DARI PENGGUNA:
"${input}"

ATURAN PARSING:
1. "type": Salah satu dari:
   - "INCOME": Bila kalimat menandakan uang masuk/pemasukan/pendapatan/gaji/penjualan/komisi/dapat uang/terima transfer/hasil dagang/bonus (contoh: "Pemasukan 500rb", "Gaji 5jt masuk bca", "Terima pembayaran 300rb", "+ 100k jualan").
   - "EXPENSE": Bila kalimat menandakan uang keluar/pengeluaran/belanja/bayar/beli/biaya (contoh: "Makan siang 35rb", "Beli bensin 50rb bayar tunai", "Bayar kos 1.5jt").
   - "TRANSFER": Bila kalimat memindahkan uang dari satu rekening ke rekening lain (contoh: "Transfer 300rb dari BCA ke Kas").
2. "amount": Angka integer Rupiah positif murni tanpa titik/koma (contoh: "35rb" / "35k" = 35000, "2.5 jt" / "2,5 juta" = 2500000, "50000" = 50000).
3. "description": Keterangan bersih dan ringkas (contoh: "Gaji Kantor", "Penjualan Barang Bekas", "Makan Siang Soto", "Komisi Affiliate").
4. "accountId":
   - Untuk INCOME: ID rekening penampung yang menerima dana pemasukan (misal rekening BCA, Mandiri, Kas). Jika pengguna tidak menyebutkan nama rekening, gunakan ID rekening pertama.
   - Untuk EXPENSE: ID rekening sumber pembayaran. Jika tidak disebutkan, gunakan rekening pertama.
   - Untuk TRANSFER: ID rekening asal pengiriman dana.
5. "toAccountId": ID rekening tujuan (hanya jika "type" adalah "TRANSFER").
6. "categoryId": ID kategori yang paling sesuai dari DAFTAR KATEGORI TERSEDIA (pastikan kategori INCOME jika type=INCOME, atau kategori EXPENSE jika type=EXPENSE).
7. "confidence": Nilai 0.0 - 1.0 tingkat keyakinan parsing.

Kembalikan HANYA JSON valid dengan struktur:
{
  "type": "EXPENSE" | "INCOME" | "TRANSFER",
  "amount": number,
  "description": string,
  "accountId": string | null,
  "toAccountId": string | null,
  "categoryId": string | null,
  "confidence": number
}`;

      // Try primary model (openai/gpt-oss-120b), fallback to qwen/qwen3.8-27b
      let chatCompletion;
      try {
        chatCompletion = await groq.chat.completions.create({
          messages: [
            {
              role: "system",
              content: "You are an expert Indonesian financial entity extractor that returns strict JSON output.",
            },
            {
              role: "user",
              content: prompt,
            },
          ],
          model: "openai/gpt-oss-120b",
          response_format: { type: "json_object" },
          temperature: 0.1,
        });
      } catch (primaryModelErr) {
        console.warn("[GroqNLP] Primary model failed, trying fallback model:", primaryModelErr);
        chatCompletion = await groq.chat.completions.create({
          messages: [
            {
              role: "system",
              content: "You are an expert Indonesian financial entity extractor that returns strict JSON output.",
            },
            {
              role: "user",
              content: prompt,
            },
          ],
          model: "qwen/qwen3.8-27b",
          response_format: { type: "json_object" },
          temperature: 0.1,
        });
      }

      const responseText = chatCompletion.choices[0]?.message?.content;
      if (responseText) {
        const parsed = JSON.parse(responseText);
        const matchedAccount = accounts.find((a) => a.id === parsed.accountId);
        const matchedToAccount = accounts.find((a) => a.id === parsed.toAccountId);
        const matchedCategory = categories.find((c) => c.id === parsed.categoryId);

        return {
          type: (parsed.type === "INCOME" || parsed.type === "TRANSFER") ? parsed.type : "EXPENSE",
          amount: Math.abs(parseInt(parsed.amount, 10) || 0),
          description: parsed.description || input,
          accountId: parsed.accountId || accounts[0]?.id || null,
          accountName: matchedAccount?.name,
          toAccountId: parsed.toAccountId || null,
          toAccountName: matchedToAccount?.name,
          categoryId: parsed.categoryId || null,
          categoryName: matchedCategory?.name,
          confidence: parsed.confidence || 0.95,
        };
      }
    } catch (err) {
      console.warn("[GroqNLP] Groq API error, falling back to intelligent rule parser:", err);
    }
  }

  // Fallback intelligent parser when GROQ_API_KEY is not configured or offline
  return fallbackRuleParser(input, accounts, categories);
}

/**
 * Intelligent rule-based parser for offline / development fallback.
 */
function fallbackRuleParser(
  input: string,
  accounts: AccountContext[],
  categories: CategoryContext[]
): ParsedTransaction {
  const lower = input.toLowerCase().trim();

  // 1. Detect Type
  let type: ParsedTransaction["type"] = "EXPENSE";

  const isTransfer =
    lower.includes("transfer") ||
    lower.includes("pindah dana") ||
    lower.includes("kirim ke") ||
    lower.includes("tarik tunai") ||
    lower.includes("pindahkan");

  const isExplicitIncomePrefix =
    lower.startsWith("+") ||
    lower.startsWith("in ") ||
    lower.startsWith("in:") ||
    lower.startsWith("masuk:") ||
    lower.startsWith("pemasukan:") ||
    lower.startsWith("income:");

  const isIncomeKeyword =
    lower.includes("pemasukan") ||
    lower.includes("income") ||
    lower.includes("inflow") ||
    lower.includes("gaji") ||
    lower.includes("salary") ||
    lower.includes("terima") ||
    lower.includes("diterima") ||
    lower.includes("penerimaan") ||
    lower.includes("masuk") ||
    lower.includes("uang masuk") ||
    lower.includes("tf masuk") ||
    lower.includes("transfer masuk") ||
    lower.includes("dapat") ||
    lower.includes("didapat") ||
    lower.includes("pendapatan") ||
    lower.includes("penjualan") ||
    lower.includes("jual") ||
    lower.includes("jualan") ||
    lower.includes("laba") ||
    lower.includes("untung") ||
    lower.includes("profit") ||
    lower.includes("bonus") ||
    lower.includes("omzet") ||
    lower.includes("omset") ||
    lower.includes("cair") ||
    lower.includes("pencairan") ||
    lower.includes("setor") ||
    lower.includes("setoran") ||
    lower.includes("komisi") ||
    lower.includes("dividen") ||
    lower.includes("rejeki") ||
    lower.includes("rezeki") ||
    lower.includes("uang jajan") ||
    lower.includes("klaim") ||
    lower.includes("proyek") ||
    lower.includes("project") ||
    lower.includes("freelance") ||
    lower.includes("dibayar") ||
    lower.includes("bayaran") ||
    lower.includes("hasil") ||
    lower.includes("honor") ||
    lower.includes("tips") ||
    lower.includes("angpao") ||
    lower.includes("hibah") ||
    lower.includes("hadiah") ||
    lower.includes("cashback") ||
    lower.includes("refund") ||
    lower.includes("pengembalian");

  if (isTransfer) {
    type = "TRANSFER";
  } else if (isExplicitIncomePrefix || isIncomeKeyword) {
    type = "INCOME";
  }

  // 2. Extract Amount
  let amount = 0;
  // Match "1.5 jt" or "1,5 juta" or "100rb" or "100k" or raw numbers "50000"
  const jtMatch = lower.match(/(\d+([.,]\d+)?)\s*(jt|juta)/);
  const rbMatch = lower.match(/(\d+([.,]\d+)?)\s*(rb|k|ribu)/);
  const rawMatch = lower.match(/rp?\s*(\d{1,3}(\.\d{3})+|\d+)/);

  if (jtMatch) {
    const val = parseFloat(jtMatch[1].replace(",", "."));
    amount = Math.round(val * 1000000);
  } else if (rbMatch) {
    const val = parseFloat(rbMatch[1].replace(",", "."));
    amount = Math.round(val * 1000);
  } else if (rawMatch) {
    amount = parseInt(rawMatch[1].replace(/\D/g, ""), 10);
  }

  // 3. Match Account
  let matchedAccount: AccountContext | undefined;
  for (const acc of accounts) {
    const accLower = acc.name.toLowerCase();
    if (
      lower.includes(accLower) ||
      (accLower.includes("bca") && lower.includes("bca")) ||
      (accLower.includes("mandiri") && lower.includes("mandiri")) ||
      (accLower.includes("bni") && lower.includes("bni")) ||
      (accLower.includes("bri") && lower.includes("bri")) ||
      (accLower.includes("jago") && lower.includes("jago")) ||
      (accLower.includes("gopay") && lower.includes("gopay")) ||
      (accLower.includes("ovo") && lower.includes("ovo")) ||
      (accLower.includes("dana") && lower.includes("dana")) ||
      (accLower.includes("tunai") && (lower.includes("cash") || lower.includes("tunai") || lower.includes("dompet")))
    ) {
      matchedAccount = acc;
      break;
    }
  }
  if (!matchedAccount && accounts.length > 0) {
    matchedAccount = accounts[0];
  }

  // 4. Match Category
  let matchedCategory: CategoryContext | undefined;
  const targetCategories = categories.filter((c) => c.type === (type === "INCOME" ? "INCOME" : "EXPENSE"));

  for (const cat of targetCategories) {
    const catLower = cat.name.toLowerCase();
    const keywords = catLower.split(/[\s&,/]+/);
    if (keywords.some((kw) => kw.length > 2 && lower.includes(kw))) {
      matchedCategory = cat;
      break;
    }
  }

  // Specific common category fallbacks
  if (!matchedCategory && targetCategories.length > 0) {
    if (type === "INCOME") {
      if (lower.includes("gaji") || lower.includes("salary") || lower.includes("honor")) {
        matchedCategory = targetCategories.find((c) => c.name.toLowerCase().includes("gaji"));
      } else if (lower.includes("jual") || lower.includes("omzet") || lower.includes("dagang") || lower.includes("toko")) {
        matchedCategory = targetCategories.find((c) => c.name.toLowerCase().includes("jual") || c.name.toLowerCase().includes("usaha"));
      } else if (lower.includes("bonus") || lower.includes("komisi") || lower.includes("tips") || lower.includes("freelance")) {
        matchedCategory = targetCategories.find((c) => c.name.toLowerCase().includes("bonus") || c.name.toLowerCase().includes("komisi") || c.name.toLowerCase().includes("lain"));
      }
      // If still not matched, pick first available income category
      if (!matchedCategory) {
        matchedCategory = targetCategories[0];
      }
    } else {
      if (lower.includes("makan") || lower.includes("minum") || lower.includes("kopi") || lower.includes("resto")) {
        matchedCategory = targetCategories.find((c) => c.name.toLowerCase().includes("makan"));
      } else if (lower.includes("bensin") || lower.includes("gojek") || lower.includes("grab") || lower.includes("tol")) {
        matchedCategory = targetCategories.find((c) => c.name.toLowerCase().includes("transport"));
      }
    }
  }

  // Clean description
  let description = input
    .replace(/^(\+|in:|masuk:|pemasukan:|income:)\s*/i, "")
    .replace(/(pake|pakai|dari|ke|rekening|sebesar|rp|\d+([.,]\d+)?\s*(jt|juta|rb|k|ribu)?)/gi, "")
    .trim();

  if (!description || description.length < 3) {
    description = type === "EXPENSE" ? "Pengeluaran" : type === "INCOME" ? "Pemasukan" : "Transfer Dana";
  }
  // Capitalize
  description = description.charAt(0).toUpperCase() + description.slice(1);

  return {
    type,
    amount,
    description,
    accountId: matchedAccount?.id || null,
    accountName: matchedAccount?.name,
    toAccountId: type === "TRANSFER" && accounts.length > 1 ? accounts[1].id : null,
    toAccountName: type === "TRANSFER" && accounts.length > 1 ? accounts[1].name : undefined,
    categoryId: matchedCategory?.id || targetCategories[0]?.id || null,
    categoryName: matchedCategory?.name || targetCategories[0]?.name,
    confidence: 0.9,
  };
}
