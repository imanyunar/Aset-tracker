import { describe, it, expect } from "vitest";
import { parseNaturalLanguageTransaction } from "@/lib/ai/groq";

describe("AI Natural Language Parser (NLP)", () => {
  const dummyAccounts = [
    { id: "acc-1", name: "BCA Prioritas", type: "BANK" },
    { id: "acc-2", name: "Dompet Tunai", type: "CASH" },
  ];

  const dummyCategories = [
    { id: "cat-1", name: "Makanan & Minuman", type: "EXPENSE" as const },
    { id: "cat-2", name: "Transportasi", type: "EXPENSE" as const },
    { id: "cat-3", name: "Gaji & Upah", type: "INCOME" as const },
  ];

  it("should extract expense transaction with amount and account", async () => {
    const res = await parseNaturalLanguageTransaction(
      "Makan soto 35rb pake cash",
      dummyAccounts,
      dummyCategories
    );

    expect(res.type).toBe("EXPENSE");
    expect(res.amount).toBe(35000);
    expect(res.accountName).toBe("Dompet Tunai");
  });

  it("should extract income transaction with million abbreviation (jt)", async () => {
    const res = await parseNaturalLanguageTransaction(
      "Terima gaji 5.5 jt ke rekening bca",
      dummyAccounts,
      dummyCategories
    );

    expect(res.type).toBe("INCOME");
    expect(res.amount).toBe(5500000);
    expect(res.accountName).toBe("BCA Prioritas");
  });

  it("should detect transfer transaction", async () => {
    const res = await parseNaturalLanguageTransaction(
      "Transfer 200rb dari BCA ke dompet tunai",
      dummyAccounts,
      dummyCategories
    );

    expect(res.type).toBe("TRANSFER");
    expect(res.amount).toBe(200000);
  });
});
