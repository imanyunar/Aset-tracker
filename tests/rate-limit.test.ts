import { describe, it, expect } from "vitest";
import { checkRateLimit } from "@/lib/rate-limit";

describe("Rate Limiting Service", () => {
  it("should allow requests under the defined limit", async () => {
    const key = `test-ip-${Date.now()}`;
    const res1 = await checkRateLimit(key, 3, 10);
    expect(res1.allowed).toBe(true);
    expect(res1.remaining).toBe(2);

    const res2 = await checkRateLimit(key, 3, 10);
    expect(res2.allowed).toBe(true);
    expect(res2.remaining).toBe(1);

    const res3 = await checkRateLimit(key, 3, 10);
    expect(res3.allowed).toBe(true);
    expect(res3.remaining).toBe(0);
  });

  it("should block requests that exceed the limit", async () => {
    const key = `test-blocked-${Date.now()}`;
    // Limit is 2
    await checkRateLimit(key, 2, 10);
    await checkRateLimit(key, 2, 10);

    // Third request should be blocked
    const res3 = await checkRateLimit(key, 2, 10);
    expect(res3.allowed).toBe(false);
    expect(res3.remaining).toBe(0);
  });
});
