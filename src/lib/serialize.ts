/**
 * Utility to serialize data containing BigInt (e.g. from Prisma)
 * so it can be safely returned in Next.js JSON API responses or props.
 */
export function serializeBigInt<T>(data: T): T {
  return JSON.parse(
    JSON.stringify(data, (_, value) =>
      typeof value === "bigint" ? Number(value) : value
    )
  );
}

/**
 * Formats integer Rupiah into Indonesian currency string (e.g., Rp 15.000.000)
 */
export function formatRupiah(amount: number | bigint | string): string {
  const num = typeof amount === "bigint" ? Number(amount) : Number(amount || 0);
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num);
}
