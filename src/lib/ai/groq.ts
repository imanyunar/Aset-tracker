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
1. "type": Salah satu dari "EXPENSE", "INCOME", atau "TRANSFER".
2. "amount": Angka integer Rupiah positif (contoh: "35rb" / "35k" = 35000, "2.5 jt" / "2,5 juta" = 2500000).
3. "description": Keterangan bersih dan ringkas (contoh: "Makan Siang Soto", "Gaji Freelance UI/UX").
4. "accountId": ID rekening sumber yang paling cocok dari daftar. Jika tidak disebutkan, gunakan rekening pertama.
5. "toAccountId": ID rekening tujuan (hanya jika "type" adalah "TRANSFER").
6. "categoryId": ID kategori yang paling sesuai dari daftar rekening (sesuai tipe EXPENSE atau INCOME).
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

      const chatCompletion = await groq.chat.completions.create({
        messages: [
          {
            role: "system",
            content: "You are an expert financial entity extractor that returns strict JSON output.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        model: "llama-3.3-70b-versatile",
        response_format: { type: "json_object" },
        temperature: 0.1,
      });

      const responseText = chatCompletion.choices[0]?.message?.content;
      if (responseText) {
        const parsed = JSON.parse(responseText);
        const matchedAccount = accounts.find((a) => a.id === parsed.accountId);
        const matchedToAccount = accounts.find((a) => a.id === parsed.toAccountId);
        const matchedCategory = categories.find((c) => c.id === parsed.categoryId);

        return {
          type: parsed.type || "EXPENSE",
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

  // Fallback intelligent parser when GROQ_API_KEY is not configured
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
  const lower = input.toLowerCase();

  // 1. Detect Type
  let type: ParsedTransaction["type"] = "EXPENSE";
  if (
    lower.includes("transfer") ||
    lower.includes("pindah dana") ||
    lower.includes("kirim ke") ||
    lower.includes("tarik tunai")
  ) {
    type = "TRANSFER";
  } else if (
    lower.includes("gaji") ||
    lower.includes("terima") ||
    lower.includes("masuk") ||
    lower.includes("dapat") ||
    lower.includes("pendapatan") ||
    lower.includes("penjualan") ||
    lower.includes("bonus") ||
    lower.includes("omzet")
  ) {
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
    if (lower.includes(accLower) || (accLower.includes("bca") && lower.includes("bca")) || (accLower.includes("tunai") && lower.includes("cash"))) {
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
    if (keywords.some((kw) => kw.length > 3 && lower.includes(kw))) {
      matchedCategory = cat;
      break;
    }
  }

  // Specific common category fallbacks
  if (!matchedCategory && targetCategories.length > 0) {
    if (lower.includes("makan") || lower.includes("minum") || lower.includes("kopi") || lower.includes("resto")) {
      matchedCategory = targetCategories.find((c) => c.name.toLowerCase().includes("makan"));
    } else if (lower.includes("bensin") || lower.includes("gojek") || lower.includes("grab") || lower.includes("tol")) {
      matchedCategory = targetCategories.find((c) => c.name.toLowerCase().includes("transport"));
    }
  }

  // Clean description
  let description = input
    .replace(/(pake|pakai|dari|ke|rekening|sebesar|rp|\d+(jt|juta|rb|k|ribu)?)/gi, "")
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
    confidence: 0.85,
  };
}
