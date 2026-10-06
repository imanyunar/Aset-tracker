import { describe, it, expect, beforeEach } from "vitest";
import { MockWhatsAppDriver } from "@/lib/whatsapp/mock.driver";
import { normalizeIndonesianPhone } from "@/lib/whatsapp/fonnte.driver";
import {
  formatTransactionNotification,
  formatBudgetAlert,
} from "@/lib/whatsapp/templates";

describe("WhatsApp Driver Pattern & Templates", () => {
  beforeEach(() => {
    MockWhatsAppDriver.clearHistory();
  });

  it("should normalize diverse Indonesian phone formats into 628... format", () => {
    expect(normalizeIndonesianPhone("081234567890")).toBe("6281234567890");
    expect(normalizeIndonesianPhone("+6281234567890")).toBe("6281234567890");
    expect(normalizeIndonesianPhone("6281234567890")).toBe("6281234567890");
    expect(normalizeIndonesianPhone("0812-3456-7890")).toBe("6281234567890");
  });

  it("should send and record messages via MockWhatsAppDriver", async () => {
    const driver = new MockWhatsAppDriver();
    const result = await driver.sendMessage({
      to: "081298765432",
      message: "Halo dari unit test",
    });

    expect(result.success).toBe(true);
    expect(result.driver).toBe("mock");

    const history = MockWhatsAppDriver.getHistory();
    expect(history.length).toBe(1);
    expect(history[0].to).toBe("6281298765432");
    expect(history[0].message).toBe("Halo dari unit test");
  });

  it("should generate professional transaction notification templates", () => {
    const text = formatTransactionNotification({
      workspaceName: "Keuangan Pribadi",
      type: "EXPENSE",
      amount: BigInt(75000),
      accountName: "BCA Prioritas",
      categoryName: "Makanan & Minuman",
      description: "Makan Siang Soto",
      accountBalance: BigInt(15000000),
    });

    expect(text).toContain("Keuangan Pribadi");
    expect(text).toContain("PENGELUARAN");
    expect(text).toContain("BCA Prioritas");
    expect(text).toContain("Makanan & Minuman");
    expect(text).toContain("Makan Siang Soto");
  });

  it("should generate warning vs exceeded budget alert templates", () => {
    const warningText = formatBudgetAlert({
      workspaceName: "Keuangan Pribadi",
      categoryName: "Hiburan",
      budgetAmount: BigInt(1000000),
      spentAmount: BigInt(850000),
      percentage: 85,
    });
    expect(warningText).toContain("80%");
    expect(warningText).toContain("Hiburan");

    const exceededText = formatBudgetAlert({
      workspaceName: "Keuangan Pribadi",
      categoryName: "Hiburan",
      budgetAmount: BigInt(1000000),
      spentAmount: BigInt(1100000),
      percentage: 110,
    });
    expect(exceededText).toContain("PAGU ANGGARAN TERLEBIHI");
  });
});
