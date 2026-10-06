import { describe, it, expect } from "vitest";
import { serializeBigInt, formatRupiah } from "@/lib/serialize";

describe("Serialization & Currency Utilities", () => {
  it("should convert BigInt values into safe Numbers for JSON serialization", () => {
    const raw = {
      id: "tx-123",
      amount: BigInt(500000),
      nested: {
        balance: BigInt(15000000),
        items: [BigInt(100), BigInt(200)],
      },
    };

    const serialized = serializeBigInt(raw);

    expect(serialized.amount).toBe(500000);
    expect(typeof serialized.amount).toBe("number");
    expect(serialized.nested.balance).toBe(15000000);
    expect(serialized.nested.items).toEqual([100, 200]);
    // Ensure it can be JSON.stringified without throwing
    expect(() => JSON.stringify(serialized)).not.toThrow();
  });

  it("should format amounts to standard Indonesian Rupiah format", () => {
    expect(formatRupiah(1500000)).toMatch(/Rp\s*1\.500\.000/);
    expect(formatRupiah(BigInt(38697000))).toMatch(/Rp\s*38\.697\.000/);
    expect(formatRupiah(0)).toMatch(/Rp\s*0/);
  });
});
