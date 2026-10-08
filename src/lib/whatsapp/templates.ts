import { formatRupiah } from "@/lib/serialize";

export function formatTransactionNotification({
  workspaceName,
  type,
  amount,
  accountName,
  toAccountName,
  categoryName,
  description,
  notes,
  accountBalance,
  transactedAt,
}: {
  workspaceName: string;
  type: "EXPENSE" | "INCOME" | "TRANSFER";
  amount: bigint | number;
  accountName: string;
  toAccountName?: string | null;
  categoryName?: string | null;
  description: string;
  notes?: string | null;
  accountBalance?: bigint | number;
  transactedAt?: Date;
}): string {
  const typeLabels = {
    EXPENSE: "🔴 *PENGELUARAN*",
    INCOME: "🟢 *PEMASUKAN*",
    TRANSFER: "🔵 *TRANSFER DANA*",
  };

  const dateObj = transactedAt ? new Date(transactedAt) : new Date();
  const formattedDate = dateObj
    .toLocaleString("id-ID", {
      timeZone: "Asia/Jakarta",
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    })
    .replace(/\./g, ":");

  let lines: string[] = [
    `🔔 *NEXAFINANCE NOTIFIKASI*`,
    `━━━━━━━━━━━━━━━━━━━━━━━━━`,
    `🏢 Workspace: *${workspaceName}*`,
    `📝 Jenis: ${typeLabels[type]}`,
    `💰 Nominal: *${formatRupiah(amount)}*`,
    `📂 Keterangan: *${description}*`,
  ];

  if (type === "TRANSFER") {
    lines.push(`💳 Dari Rekening: *${accountName}*`);
    lines.push(`🏦 Ke Rekening: *${toAccountName || "-"}*`);
  } else {
    lines.push(`💳 Rekening: *${accountName}*`);
    if (categoryName) {
      lines.push(`🏷️ Kategori: *${categoryName}*`);
    }
  }

  if (notes) {
    lines.push(`📌 Catatan: _${notes}_`);
  }

  lines.push(`🕒 Waktu: ${formattedDate} WIB`);

  if (accountBalance !== undefined) {
    lines.push(`━━━━━━━━━━━━━━━━━━━━━━━━━`);
    lines.push(`📊 Sisa Saldo: *${formatRupiah(accountBalance)}*`);
  }

  lines.push(`\n_Catatan keuangan otomatis dari sistem NexaFinance_`);

  return lines.join("\n");
}

export function formatBudgetAlert({
  workspaceName,
  categoryName,
  budgetAmount,
  spentAmount,
  percentage,
}: {
  workspaceName: string;
  categoryName: string;
  budgetAmount: bigint | number;
  spentAmount: bigint | number;
  percentage: number;
}): string {
  const isExceeded = percentage >= 100;
  const statusHeader = isExceeded
    ? `🚨 *PERINGATAN: PAGU ANGGARAN TERLEBIHI!*`
    : `⚠️ *PERINGATAN: ANGGARAN MENDEKATI BATAS (80%)*`;

  return [
    statusHeader,
    `━━━━━━━━━━━━━━━━━━━━━━━━━`,
    `🏢 Workspace: *${workspaceName}*`,
    `🏷️ Kategori: *${categoryName}*`,
    `🎯 Pagu Bulanan: *${formatRupiah(budgetAmount)}*`,
    `💸 Realisasi Pengeluaran: *${formatRupiah(spentAmount)}*`,
    `📊 Persentase Terpakai: *${percentage}%*`,
    `━━━━━━━━━━━━━━━━━━━━━━━━━`,
    isExceeded
      ? `Pengeluaran pada pos ini telah melampaui batas yang direncanakan. Evaluasi kembali alokasi pengeluaran Anda agar arus kas tetap surplus.`
      : `Pengeluaran telah mencapai ${percentage}% dari pagu anggaran. Mohon lebih selektif dalam pengeluaran sisa bulan ini.`,
    `\n_Peringatan otomatis NexaFinance AI Budget Guard_`,
  ].join("\n");
}
