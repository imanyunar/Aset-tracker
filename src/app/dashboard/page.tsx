"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { WorkspaceProvider, useWorkspace } from "@/context/workspace-context";
import { formatRupiah } from "@/lib/serialize";
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  PieChart as PieIcon,
  BarChart3,
  ArrowRight,
  ArrowDownLeft,
  ArrowUpRight,
  ArrowRightLeft,
  Calendar,
  Sparkles,
  CreditCard,
  Landmark,
  Banknote,
  Smartphone,
  AlertCircle,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
} from "recharts";

interface AnalyticsData {
  kpi: {
    totalBalance: number;
    currentMonthIncome: number;
    currentMonthExpense: number;
    netCashflow: number;
    lastMonthIncome: number;
    lastMonthExpense: number;
    savingsRate: number;
    activeAccountsCount: number;
  };
  monthlyTrend: Array<{
    key: string;
    month: string;
    income: number;
    expense: number;
    net: number;
  }>;
  categoryBreakdown: Array<{
    categoryId: string;
    name: string;
    color: string;
    icon: string;
    amount: number;
    percentage: number;
  }>;
  topAccounts: Array<{
    id: string;
    name: string;
    type: string;
    balance: number;
    color: string;
  }>;
  recentTransactions: Array<{
    id: string;
    type: "EXPENSE" | "INCOME" | "TRANSFER";
    amount: number;
    description: string;
    transactedAt: string;
    account: { id: string; name: string; color: string };
    toAccount?: { id: string; name: string; color: string } | null;
    category?: { id: string; name: string; color: string; icon: string } | null;
  }>;
}

const ACCOUNT_ICONS: Record<string, React.ElementType> = {
  BANK: Landmark,
  CASH: Banknote,
  EWALLET: Smartphone,
  CREDIT_CARD: CreditCard,
};

// Custom Tooltip for Recharts
function CustomBarTooltip({ active, payload, label }: any) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#ffffff] p-3 border border-[var(--color-border)] rounded-lg shadow-[var(--shadow-mid)] text-xs">
        <div className="font-bold text-[var(--color-navy)] mb-1.5">{label}</div>
        {payload.map((item: any, idx: number) => (
          <div key={idx} className="flex items-center justify-between gap-4 py-0.5">
            <span className="flex items-center gap-1.5 text-[var(--color-text-secondary)]">
              <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: item.color }} />
              {item.name}:
            </span>
            <span className="font-mono font-bold text-[var(--color-navy)]">
              {formatRupiah(item.value)}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
}

function CustomPieTooltip({ active, payload }: any) {
  if (active && payload && payload.length) {
    const item = payload[0];
    return (
      <div className="bg-[#ffffff] p-3 border border-[var(--color-border)] rounded-lg shadow-[var(--shadow-mid)] text-xs">
        <div className="font-bold text-[var(--color-navy)] flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.payload.color }} />
          {item.name}
        </div>
        <div className="mt-1 font-mono font-bold text-[var(--color-navy)]">
          {formatRupiah(item.value)} ({item.payload.percentage}%)
        </div>
      </div>
    );
  }
  return null;
}

function DashboardContent() {
  const { activeWorkspace, activeWorkspaceId } = useWorkspace();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalytics = useCallback(async () => {
    if (!activeWorkspaceId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/workspaces/${activeWorkspaceId}/analytics`);
      if (!res.ok) throw new Error("Gagal memuat data analitik");
      const json = await res.json();
      setData(json);
    } catch (err: any) {
      setError(err.message || "Terjadi kesalahan saat memuat dashboard");
    } finally {
      setLoading(false);
    }
  }, [activeWorkspaceId]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  const kpi = data?.kpi || {
    totalBalance: 0,
    currentMonthIncome: 0,
    currentMonthExpense: 0,
    netCashflow: 0,
    lastMonthIncome: 0,
    lastMonthExpense: 0,
    savingsRate: 0,
    activeAccountsCount: 0,
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-[var(--color-navy)] font-heading">
              Dasbor Ringkasan
            </h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-[rgba(24,122,186,0.08)] text-[var(--color-primary)]">
              {activeWorkspace?.type === "BUSINESS" ? "Akun Bisnis" : "Akun Pribadi"}
            </span>
          </div>
          <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">
            Analisis arus kas presisi, alokasi anggaran, dan likuiditas di{" "}
            <span className="font-semibold text-[var(--color-navy)]">
              {activeWorkspace?.name}
            </span>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/transactions"
            className="btn btn-primary text-xs !py-2.5 !px-4"
          >
            <span>Catat Transaksi</span>
            <ArrowRight size={14} />
          </Link>
        </div>
      </div>

      {/* Global Error Banner */}
      {error && (
        <div className="p-4 bg-[rgba(198,34,52,0.08)] border border-[rgba(198,34,52,0.2)] rounded-lg text-xs text-[var(--color-accent-red)] flex items-center gap-2">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {/* KPI Cards Row (Morgan Stanley 4-Box Metric Hierarchy) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Likuiditas */}
        <div className="card p-5 bg-[#ffffff] border-t-4 border-t-[var(--color-primary)] relative">
          <div className="flex items-center justify-between text-[11px] font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider">
            <span>Total Likuiditas</span>
            <Wallet size={16} className="text-[var(--color-primary)]" />
          </div>
          <div className="text-2xl font-extrabold text-[var(--color-navy)] mt-2 font-heading">
            {formatRupiah(kpi.totalBalance)}
          </div>
          <div className="text-[11px] text-[var(--color-text-secondary)] mt-1">
            Dari {kpi.activeAccountsCount} rekening aktif
          </div>
        </div>

        {/* Card 2: Pemasukan Bulan Ini */}
        <div className="card p-5 bg-[#ffffff] border-t-4 border-t-[#27ae60] relative">
          <div className="flex items-center justify-between text-[11px] font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider">
            <span>Pemasukan Bulan Ini</span>
            <TrendingUp size={16} className="text-[#27ae60]" />
          </div>
          <div className="text-2xl font-extrabold text-[#27ae60] mt-2 font-heading">
            {formatRupiah(kpi.currentMonthIncome)}
          </div>
          <div className="text-[11px] text-[var(--color-text-secondary)] mt-1">
            Bulan lalu: {formatRupiah(kpi.lastMonthIncome)}
          </div>
        </div>

        {/* Card 3: Pengeluaran Bulan Ini */}
        <div className="card p-5 bg-[#ffffff] border-t-4 border-t-[var(--color-accent-red)] relative">
          <div className="flex items-center justify-between text-[11px] font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider">
            <span>Pengeluaran Bulan Ini</span>
            <TrendingDown size={16} className="text-[var(--color-accent-red)]" />
          </div>
          <div className="text-2xl font-extrabold text-[var(--color-accent-red)] mt-2 font-heading">
            {formatRupiah(kpi.currentMonthExpense)}
          </div>
          <div className="text-[11px] text-[var(--color-text-secondary)] mt-1">
            Bulan lalu: {formatRupiah(kpi.lastMonthExpense)}
          </div>
        </div>

        {/* Card 4: Rasio Tabungan */}
        <div className="card p-5 bg-[#ffffff] border-t-4 border-t-[var(--color-navy)] relative">
          <div className="flex items-center justify-between text-[11px] font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider">
            <span>Rasio Tabungan</span>
            <Sparkles size={16} className="text-[var(--color-navy)]" />
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-2xl font-extrabold text-[var(--color-navy)] font-heading">
              {kpi.savingsRate}%
            </span>
            <span
              className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                kpi.savingsRate >= 20
                  ? "bg-[rgba(39,174,96,0.1)] text-[#27ae60]"
                  : "bg-[rgba(230,126,34,0.1)] text-[#e67e22]"
              }`}
            >
              {kpi.savingsRate >= 20 ? "Target Ideal" : "Perlu Optimasi"}
            </span>
          </div>
          <div className="text-[11px] text-[var(--color-text-secondary)] mt-1">
            Net: {formatRupiah(kpi.netCashflow)}
          </div>
        </div>
      </div>

      {/* Main Charts Grid (Morgan Stanley Clean Institutional Layout) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Trend Arus Kas 6 Bulan (2 Columns) */}
        <div className="card p-6 bg-[#ffffff] lg:col-span-2 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-sm text-[var(--color-navy)] font-heading flex items-center gap-2">
                  <BarChart3 size={16} className="text-[var(--color-primary)]" />
                  <span>Trend Arus Kas (6 Bulan Terakhir)</span>
                </h3>
                <p className="text-[11px] text-[var(--color-text-secondary)] mt-0.5">
                  Perbandingan pemasukan dan pengeluaran historis
                </p>
              </div>
            </div>

            <div className="h-72 w-full pt-2">
              {loading || !data ? (
                <div className="h-full flex items-center justify-center text-xs text-[var(--color-text-secondary)] animate-pulse">
                  Memuat grafik tren...
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={data.monthlyTrend}
                    margin={{ top: 10, right: 10, left: 10, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                    <XAxis
                      dataKey="month"
                      tick={{ fill: "#666", fontSize: 11 }}
                      axisLine={{ stroke: "#e5e5e5" }}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fill: "#666", fontSize: 10 }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(val) => {
                        if (val >= 1000000) return `${(val / 1000000).toFixed(0)}Jt`;
                        if (val >= 1000) return `${(val / 1000).toFixed(0)}Rb`;
                        return String(val);
                      }}
                    />
                    <Tooltip content={<CustomBarTooltip />} />
                    <Legend
                      verticalAlign="top"
                      align="right"
                      iconType="circle"
                      iconSize={8}
                      wrapperStyle={{ fontSize: 11, paddingBottom: 10 }}
                    />
                    <Bar
                      name="Pemasukan"
                      dataKey="income"
                      fill="#27ae60"
                      radius={[4, 4, 0, 0]}
                      maxBarSize={32}
                    />
                    <Bar
                      name="Pengeluaran"
                      dataKey="expense"
                      fill="#c62234"
                      radius={[4, 4, 0, 0]}
                      maxBarSize={32}
                    />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>

        {/* Distribusi Pengeluaran Kategori (1 Column) */}
        <div className="card p-6 bg-[#ffffff] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-sm text-[var(--color-navy)] font-heading flex items-center gap-2">
                  <PieIcon size={16} className="text-[var(--color-primary)]" />
                  <span>Alokasi Kategori Bulan Ini</span>
                </h3>
                <p className="text-[11px] text-[var(--color-text-secondary)] mt-0.5">
                  Distribusi pos belanja terbesar
                </p>
              </div>
            </div>

            <div className="h-56 w-full flex items-center justify-center">
              {loading || !data ? (
                <div className="text-xs text-[var(--color-text-secondary)] animate-pulse">
                  Memuat distribusi...
                </div>
              ) : data.categoryBreakdown.length === 0 ? (
                <div className="text-center text-xs text-[var(--color-text-secondary)] p-6">
                  Belum ada pengeluaran tercatat di bulan ini
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={data.categoryBreakdown}
                      dataKey="amount"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={75}
                      paddingAngle={3}
                    >
                      {data.categoryBreakdown.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomPieTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Top 3 Categories legend */}
          {data && data.categoryBreakdown.length > 0 && (
            <div className="mt-3 pt-3 border-t border-[var(--color-border)] space-y-1.5 text-xs">
              {data.categoryBreakdown.slice(0, 3).map((cat) => (
                <div key={cat.categoryId} className="flex items-center justify-between">
                  <span className="flex items-center gap-2 truncate max-w-[140px] text-[var(--color-navy)]">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: cat.color }}
                    />
                    <span className="truncate">{cat.name}</span>
                  </span>
                  <span className="font-bold font-mono text-[var(--color-navy)]">
                    {cat.percentage}% ({formatRupiah(cat.amount)})
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Bottom Grid: Top Accounts & Recent 5 Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top Accounts (1 Column) */}
        <div className="card p-6 bg-[#ffffff]">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-sm text-[var(--color-navy)] font-heading">
              Rekening & Kas
            </h3>
            <Link
              href="/accounts"
              className="text-xs text-[var(--color-primary)] font-semibold hover:underline flex items-center gap-1"
            >
              <span>Kelola</span>
              <ArrowRight size={12} />
            </Link>
          </div>

          <div className="space-y-3">
            {data?.topAccounts.map((acc) => {
              const Icon = ACCOUNT_ICONS[acc.type] || Wallet;
              return (
                <div
                  key={acc.id}
                  className="p-3 rounded-lg border border-[var(--color-border)] flex items-center justify-between hover:bg-[#fafafa] transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-white"
                      style={{ backgroundColor: acc.color }}
                    >
                      <Icon size={16} />
                    </div>
                    <div>
                      <div className="font-bold text-xs text-[var(--color-navy)]">
                        {acc.name}
                      </div>
                      <div className="text-[10px] text-[var(--color-text-secondary)]">
                        {acc.type}
                      </div>
                    </div>
                  </div>
                  <div className="font-bold text-xs text-[var(--color-navy)] font-mono">
                    {formatRupiah(acc.balance)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Recent Transactions (2 Columns) */}
        <div className="card p-6 bg-[#ffffff] lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-sm text-[var(--color-navy)] font-heading">
              Transaksi Terkini
            </h3>
            <Link
              href="/transactions"
              className="text-xs text-[var(--color-primary)] font-semibold hover:underline flex items-center gap-1"
            >
              <span>Lihat Semua</span>
              <ArrowRight size={12} />
            </Link>
          </div>

          <div className="divide-y divide-[var(--color-border)]">
            {data?.recentTransactions.length === 0 ? (
              <div className="py-8 text-center text-xs text-[var(--color-text-secondary)]">
                Belum ada transaksi terkini
              </div>
            ) : (
              data?.recentTransactions.map((tx) => {
                const isExpense = tx.type === "EXPENSE";
                const isIncome = tx.type === "INCOME";

                return (
                  <div
                    key={tx.id}
                    className="py-3 flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs ${
                          isExpense
                            ? "bg-[rgba(198,34,52,0.1)] text-[var(--color-accent-red)]"
                            : isIncome
                            ? "bg-[rgba(39,174,96,0.1)] text-[#27ae60]"
                            : "bg-[rgba(24,122,186,0.1)] text-[var(--color-primary)]"
                        }`}
                      >
                        {isExpense && <ArrowDownLeft size={14} />}
                        {isIncome && <ArrowUpRight size={14} />}
                        {!isExpense && !isIncome && <ArrowRightLeft size={14} />}
                      </div>
                      <div>
                        <div className="font-bold text-[var(--color-navy)]">
                          {tx.description}
                        </div>
                        <div className="text-[10px] text-[var(--color-text-secondary)]">
                          {new Date(tx.transactedAt).toLocaleDateString("id-ID", {
                            day: "numeric",
                            month: "short",
                          })}{" "}
                          · {tx.account.name}
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div
                        className={`font-bold font-mono ${
                          isExpense
                            ? "text-[var(--color-accent-red)]"
                            : isIncome
                            ? "text-[#27ae60]"
                            : "text-[var(--color-primary)]"
                        }`}
                      >
                        {isExpense ? "- " : isIncome ? "+ " : ""}
                        {formatRupiah(tx.amount)}
                      </div>
                      {tx.category && (
                        <div className="text-[10px] text-[var(--color-text-secondary)]">
                          {tx.category.name}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <WorkspaceProvider>
      <AppShell>
        <DashboardContent />
      </AppShell>
    </WorkspaceProvider>
  );
}
