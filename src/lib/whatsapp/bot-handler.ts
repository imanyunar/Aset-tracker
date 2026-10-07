import { prisma } from "@/lib/prisma";
import { normalizeIndonesianPhone } from "./fonnte.driver";
import { formatRupiah } from "@/lib/serialize";
import { parseNaturalLanguageTransaction } from "@/lib/ai/groq";
import { createTransactionAtomic, TransactionError } from "@/lib/transaction-service";
import { checkAndSendBudgetAlert } from "@/lib/budget-service";
import { TransactionType } from "@prisma/client";

export interface InboundWhatsAppPayload {
  sender: string;
  message: string;
  senderName?: string;
  source?: string;
}

export interface BotProcessResult {
  reply: string;
  actionTaken:
    | "USER_NOT_FOUND"
    | "NO_WORKSPACE"
    | "COMMAND_HELP"
    | "CHECK_BALANCE"
    | "CHECK_SUMMARY"
    | "CHECK_BUDGET"
    | "CHECK_ACCOUNTS"
    | "TRANSACTION_CREATED"
    | "PARSE_FAILED"
    | "ERROR";
  transactionId?: string;
  workspaceName?: string;
}

/**
 * Normalizes phone variants for robust database querying.
 */
function getPhoneSearchVariants(raw: string): string[] {
  const normalized = normalizeIndonesianPhone(raw);
  const variants = new Set<string>();

  variants.add(normalized); // e.g. 6281234567890
  if (normalized.startsWith("62")) {
    variants.add("0" + normalized.slice(2)); // e.g. 081234567890
    variants.add("+" + normalized); // e.g. +6281234567890
  }
  return Array.from(variants);
}

/**
 * Processes incoming WhatsApp messages and returns an intelligent response.
 */
export async function processInboundWhatsAppMessage(
  payload: InboundWhatsAppPayload
): Promise<BotProcessResult> {
  const { sender, message } = payload;
  const cleanPhone = normalizeIndonesianPhone(sender);
  const trimmedMsg = (message || "").trim();

  if (!trimmedMsg) {
    return {
      reply: "Halo! Kirim *menu* atau ketik transaksi keuangan Anda (contoh: _Makan siang 35rb bayar bca_).",
      actionTaken: "COMMAND_HELP",
    };
  }

  // 1. Identify User by registered WhatsApp number
  const phoneVariants = getPhoneSearchVariants(cleanPhone);
  const user = await prisma.user.findFirst({
    where: {
      OR: phoneVariants.map((num) => ({ whatsappNumber: num })),
    },
    include: {
      memberships: {
        include: {
          workspace: true,
        },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!user) {
    return {
      reply: [
        `👋 *Halo dari NexaFinance!*`,
        `━━━━━━━━━━━━━━━━━━━━━━━━━`,
        `Nomor WhatsApp Anda (*${cleanPhone}*) belum terdaftar di sistem kami.`,
        ``,
        `📌 *Langkah Mudah Mengaktifkan:*`,
        `1. Masuk ke dashboard web *NexaFinance*.`,
        `2. Buka menu profil/pengaturan pengguna.`,
        `3. Masukkan nomor WhatsApp ini (*${cleanPhone}*).`,
        ``,
        `Setelah terhubung, Anda dapat mencatat pengeluaran, pemasukan, dan cek saldo langsung via chat ini! ✨`,
      ].join("\n"),
      actionTaken: "USER_NOT_FOUND",
    };
  }

  // 2. Determine active workspace (Prefer PERSONAL or first member workspace)
  const activeMembership =
    user.memberships.find((m) => m.workspace.type === "PERSONAL") ||
    user.memberships[0];

  if (!activeMembership || !activeMembership.workspace) {
    return {
      reply: `Halo *${user.name}*, akun Anda belum memiliki Workspace aktif. Silakan buat workspace baru di web NexaFinance terlebih dahulu.`,
      actionTaken: "NO_WORKSPACE",
    };
  }

  const workspace = activeMembership.workspace;
  const lowerMsg = trimmedMsg.toLowerCase();

  // 3. Command: Menu / Help
  if (
    lowerMsg === "menu" ||
    lowerMsg === "help" ||
    lowerMsg === "bantuan" ||
    lowerMsg === "?" ||
    lowerMsg === "/start" ||
    lowerMsg === "/help"
  ) {
    return {
      reply: [
        `🤖 *NEXAFINANCE ASISTEN WHATSAPP*`,
        `━━━━━━━━━━━━━━━━━━━━━━━━━`,
        `Halo *${user.name}*! Terhubung ke: *${workspace.name}*`,
        ``,
        `⚡ *Perintah Cepat:*`,
        `• *saldo* : Cek saldo seluruh rekening & kas`,
        `• *ringkasan* : Cek rekap arus kas bulan ini`,
        `• *anggaran* : Cek status pagu anggaran bulanan`,
        `• *rekening* : Daftar rekening & dompet aktif`,
        ``,
        `📝 *Catat Transaksi Instan (AI Natural Language):*`,
        `Cukup ketik kalimat sehari-hari, contoh:`,
        `• _Makan siang padang 35rb bayar bca_`,
        `• _Beli bensin pertamax 50rb bayar tunai_`,
        `• _Gaji freelance 2.5jt masuk bca_`,
        `• _Transfer 300rb dari BCA ke Kas Dompet_`,
        `━━━━━━━━━━━━━━━━━━━━━━━━━`,
        `_NexaFinance Institutional Finance Intelligence_`,
      ].join("\n"),
      actionTaken: "COMMAND_HELP",
      workspaceName: workspace.name,
    };
  }

  // 4. Command: Cek Saldo
  if (
    lowerMsg === "saldo" ||
    lowerMsg === "/saldo" ||
    lowerMsg === "cek saldo" ||
    lowerMsg === "total saldo"
  ) {
    const accounts = await prisma.financialAccount.findMany({
      where: { workspaceId: workspace.id, isArchived: false },
      orderBy: { createdAt: "asc" },
    });

    if (accounts.length === 0) {
      return {
        reply: `Belum ada rekening aktif di workspace *${workspace.name}*. Silakan tambahkan rekening di menu Akun web NexaFinance.`,
        actionTaken: "CHECK_BALANCE",
        workspaceName: workspace.name,
      };
    }

    const totalBalance = accounts.reduce((acc, a) => acc + BigInt(a.balance), BigInt(0));
    const nowTime = new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });

    const accountLines = accounts.map(
      (a) => `• *${a.name}* (${a.type}): *${formatRupiah(a.balance)}*`
    );

    return {
      reply: [
        `💳 *SALDO REKENING & DOMPET KAS*`,
        `🏢 Workspace: *${workspace.name}*`,
        `━━━━━━━━━━━━━━━━━━━━━━━━━`,
        ...accountLines,
        `━━━━━━━━━━━━━━━━━━━━━━━━━`,
        `💰 *Total Likuiditas: ${formatRupiah(totalBalance)}*`,
        `🕒 _Pembaruan: ${nowTime} WIB_`,
      ].join("\n"),
      actionTaken: "CHECK_BALANCE",
      workspaceName: workspace.name,
    };
  }

  // 5. Command: Ringkasan Bulan Ini
  if (
    lowerMsg === "ringkasan" ||
    lowerMsg === "/ringkasan" ||
    lowerMsg === "laporan" ||
    lowerMsg === "bulan ini" ||
    lowerMsg === "arus kas"
  ) {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    const [stats, txCount] = await Promise.all([
      prisma.transaction.groupBy({
        by: ["type"],
        where: {
          workspaceId: workspace.id,
          transactedAt: { gte: startOfMonth, lte: endOfMonth },
        },
        _sum: { amount: true },
      }),
      prisma.transaction.count({
        where: {
          workspaceId: workspace.id,
          transactedAt: { gte: startOfMonth, lte: endOfMonth },
        },
      }),
    ]);

    let income = BigInt(0);
    let expense = BigInt(0);

    stats.forEach((st) => {
      const sum = st._sum.amount || BigInt(0);
      if (st.type === TransactionType.INCOME) income += sum;
      else if (st.type === TransactionType.EXPENSE) expense += sum;
    });

    const netCashflow = income - expense;
    const monthName = now.toLocaleString("id-ID", { month: "long", year: "numeric" });

    return {
      reply: [
        `📊 *RINGKASAN ARUS KAS BULAN INI*`,
        `🏢 Workspace: *${workspace.name}*`,
        `📅 Periode: *${monthName}*`,
        `━━━━━━━━━━━━━━━━━━━━━━━━━`,
        `🟢 Total Pemasukan: *${formatRupiah(income)}*`,
        `🔴 Total Pengeluaran: *${formatRupiah(expense)}*`,
        `━━━━━━━━━━━━━━━━━━━━━━━━━`,
        `💵 Arus Kas Bersih: *${netCashflow >= 0 ? "+" : ""}${formatRupiah(netCashflow)}*`,
        `📝 Jumlah Transaksi: *${txCount} catatan*`,
        ``,
        `_Ketik 'saldo' untuk melihat rincian saldo saat ini._`,
      ].join("\n"),
      actionTaken: "CHECK_SUMMARY",
      workspaceName: workspace.name,
    };
  }

  // 6. Command: Status Pagu Anggaran
  if (
    lowerMsg === "anggaran" ||
    lowerMsg === "/anggaran" ||
    lowerMsg === "budget" ||
    lowerMsg === "pagu"
  ) {
    const now = new Date();
    const period = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    const budgets = await prisma.budget.findMany({
      where: { workspaceId: workspace.id, period },
      include: { category: true },
    });

    if (budgets.length === 0) {
      return {
        reply: `Belum ada pagu anggaran yang disetel untuk periode *${period}* di workspace *${workspace.name}*.\nAnda dapat mengaturnya di menu *Pagu Anggaran* pada aplikasi web.`,
        actionTaken: "CHECK_BUDGET",
        workspaceName: workspace.name,
      };
    }

    const budgetLines: string[] = [];

    for (const b of budgets) {
      const agg = await prisma.transaction.aggregate({
        where: {
          workspaceId: workspace.id,
          categoryId: b.categoryId,
          type: TransactionType.EXPENSE,
          transactedAt: { gte: startOfMonth, lte: endOfMonth },
        },
        _sum: { amount: true },
      });

      const spent = agg._sum.amount || BigInt(0);
      const budgetNum = Number(b.amount);
      const spentNum = Number(spent);
      const pct = budgetNum > 0 ? Math.round((spentNum / budgetNum) * 100) : 0;

      let badge = "🟢";
      if (pct >= 100) badge = "🚨 OVERLIMIT";
      else if (pct >= 80) badge = "⚠️ WASPADA";
      else badge = "🟢 AMAN";

      budgetLines.push(
        `🏷️ *${b.category.name}* [${badge}]\n` +
          `   Pagu: ${formatRupiah(b.amount)} | Terpakai: ${formatRupiah(spent)} (${pct}%)`
      );
    }

    return {
      reply: [
        `🎯 *STATUS PAGU ANGGARAN (${period})*`,
        `🏢 Workspace: *${workspace.name}*`,
        `━━━━━━━━━━━━━━━━━━━━━━━━━`,
        ...budgetLines,
        `━━━━━━━━━━━━━━━━━━━━━━━━━`,
        `_Sistem otomatis memperingatkan bila pengeluaran mencapai 80% & 100%._`,
      ].join("\n"),
      actionTaken: "CHECK_BUDGET",
      workspaceName: workspace.name,
    };
  }

  // 7. Command: Daftar Rekening
  if (lowerMsg === "rekening" || lowerMsg === "/rekening") {
    const accounts = await prisma.financialAccount.findMany({
      where: { workspaceId: workspace.id, isArchived: false },
    });
    return {
      reply: [
        `🏦 *DAFTAR REKENING AKTIF*`,
        `🏢 Workspace: *${workspace.name}*`,
        `━━━━━━━━━━━━━━━━━━━━━━━━━`,
        ...accounts.map((a) => `• *${a.name}* (Tipe: ${a.type})`),
      ].join("\n"),
      actionTaken: "CHECK_ACCOUNTS",
      workspaceName: workspace.name,
    };
  }

  // 8. Natural Language Transaction Processing
  const [accounts, categories] = await Promise.all([
    prisma.financialAccount.findMany({
      where: { workspaceId: workspace.id, isArchived: false },
      select: { id: true, name: true, type: true },
    }),
    prisma.category.findMany({
      where: { workspaceId: workspace.id },
      select: { id: true, name: true, type: true },
    }),
  ]);

  if (accounts.length === 0) {
    return {
      reply: `Tidak ditemukan rekening aktif di workspace *${workspace.name}* untuk mencatat transaksi.`,
      actionTaken: "ERROR",
      workspaceName: workspace.name,
    };
  }

  const parsed = await parseNaturalLanguageTransaction(trimmedMsg, accounts, categories);

  if (!parsed || parsed.amount <= 0 || !parsed.accountId) {
    return {
      reply: [
        `🤔 *Pesan Belum Dikenali*`,
        `Saya belum dapat mengenali nominal transaksi dari pesan:`,
        `_"${trimmedMsg}"_`,
        ``,
        `💡 *Contoh Format yang Didukung:*`,
        `• _Makan siang padang 35rb bayar bca_`,
        `• _Beli kopi kenangan 22.000_`,
        `• _Gaji freelance 1.5 jt masuk mandiri_`,
        `• _Transfer 250rb dari BCA ke Kas Dompet_`,
        ``,
        `Ketik *menu* untuk melihat daftar perintah bantuan.`,
      ].join("\n"),
      actionTaken: "PARSE_FAILED",
      workspaceName: workspace.name,
    };
  }

  try {
    const transaction = await createTransactionAtomic({
      workspaceId: workspace.id,
      userId: user.id,
      accountId: parsed.accountId,
      toAccountId: parsed.toAccountId,
      categoryId: parsed.categoryId,
      type: parsed.type,
      amount: BigInt(parsed.amount),
      description: parsed.description,
      notes: `Dicatat via WhatsApp Bot (${cleanPhone})`,
      transactedAt: new Date(),
    });

    // Check budget alert if expense
    if (parsed.type === "EXPENSE" && parsed.categoryId) {
      await checkAndSendBudgetAlert({
        workspaceId: workspace.id,
        categoryId: parsed.categoryId,
        whatsappNumber: user.whatsappNumber,
        workspaceName: workspace.name,
      });
    }

    // Fetch updated account balance
    const updatedAccount = await prisma.financialAccount.findUnique({
      where: { id: parsed.accountId },
      select: { balance: true, name: true },
    });

    const typeIcons = {
      EXPENSE: "🔴 *Pengeluaran*",
      INCOME: "🟢 *Pemasukan*",
      TRANSFER: "🔵 *Transfer Dana*",
    };

    const replyLines = [
      `✅ *TRANSAKSI BERHASIL DICATAT!*`,
      `━━━━━━━━━━━━━━━━━━━━━━━━━`,
      `🏢 Workspace: *${workspace.name}*`,
      `📝 Jenis: ${typeIcons[parsed.type]}`,
      `💰 Nominal: *${formatRupiah(parsed.amount)}*`,
      `📂 Keterangan: *${parsed.description}*`,
      `💳 Rekening: *${parsed.accountName || updatedAccount?.name || "Rekening"}*`,
    ];

    if (parsed.type === "TRANSFER" && parsed.toAccountName) {
      replyLines.push(`🏦 Rekening Tujuan: *${parsed.toAccountName}*`);
    }

    if (parsed.categoryName && parsed.type !== "TRANSFER") {
      replyLines.push(`🏷️ Kategori: *${parsed.categoryName}*`);
    }

    if (updatedAccount) {
      replyLines.push(`━━━━━━━━━━━━━━━━━━━━━━━━━`);
      replyLines.push(`📊 Sisa Saldo ${updatedAccount.name}: *${formatRupiah(updatedAccount.balance)}*`);
    }

    replyLines.push(``);
    replyLines.push(`_Ketik 'saldo' untuk melihat seluruh kas atau 'ringkasan' untuk arus kas._`);

    return {
      reply: replyLines.join("\n"),
      actionTaken: "TRANSACTION_CREATED",
      transactionId: transaction.id,
      workspaceName: workspace.name,
    };
  } catch (err: any) {
    console.error("[WhatsAppBot] Error saving transaction:", err);
    return {
      reply: `❌ *Gagal Menyimpan Transaksi:* ${err.message || "Terjadi kesalahan sistem"}`,
      actionTaken: "ERROR",
      workspaceName: workspace.name,
    };
  }
}
