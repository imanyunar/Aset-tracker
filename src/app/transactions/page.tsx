"use client";

import React, { useState, useEffect, useCallback } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { WorkspaceProvider, useWorkspace } from "@/context/workspace-context";
import { formatRupiah } from "@/lib/serialize";
import {
  Receipt,
  Plus,
  Search,
  Filter,
  ArrowDownLeft,
  ArrowUpRight,
  ArrowRightLeft,
  Calendar,
  X,
  AlertCircle,
  Edit2,
  Trash2,
  Tag,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
} from "lucide-react";

interface AccountOption {
  id: string;
  name: string;
  type: string;
  color: string;
}

interface CategoryOption {
  id: string;
  name: string;
  type: "INCOME" | "EXPENSE";
  icon: string;
  color: string;
}

interface TransactionData {
  id: string;
  type: "EXPENSE" | "INCOME" | "TRANSFER";
  amount: number;
  description: string;
  notes?: string | null;
  transactedAt: string;
  account: {
    id: string;
    name: string;
    color: string;
  };
  toAccount?: {
    id: string;
    name: string;
    color: string;
  } | null;
  category?: {
    id: string;
    name: string;
    color: string;
    icon: string;
  } | null;
}

function TransactionsContent() {
  const { activeWorkspace, activeWorkspaceId, refreshWorkspaces } = useWorkspace();

  // State
  const [transactions, setTransactions] = useState<TransactionData[]>([]);
  const [accounts, setAccounts] = useState<AccountOption[]>([]);
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [summary, setSummary] = useState({
    totalIncome: 0,
    totalExpense: 0,
    netCashflow: 0,
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 1,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<string>("");
  const [filterAccountId, setFilterAccountId] = useState<string>("");
  const [filterCategoryId, setFilterCategoryId] = useState<string>("");

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTx, setEditingTx] = useState<TransactionData | null>(null);
  const [formType, setFormType] = useState<"EXPENSE" | "INCOME" | "TRANSFER">("EXPENSE");
  const [formAmount, setFormAmount] = useState("");
  const [formAccountId, setFormAccountId] = useState("");
  const [formToAccountId, setFormToAccountId] = useState("");
  const [formCategoryId, setFormCategoryId] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formNotes, setFormNotes] = useState("");
  const [formDate, setFormDate] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  // Load auxiliary data: accounts & categories
  const loadMeta = useCallback(async () => {
    if (!activeWorkspaceId) return;
    try {
      const [accRes, catRes] = await Promise.all([
        fetch(`/api/workspaces/${activeWorkspaceId}/accounts`),
        fetch(`/api/workspaces/${activeWorkspaceId}/categories`),
      ]);
      if (accRes.ok) {
        const accData = await accRes.json();
        setAccounts(accData.accounts || []);
      }
      if (catRes.ok) {
        const catData = await catRes.json();
        setCategories(catData.categories || []);
      }
    } catch (e) {
      console.error("Failed to load accounts/categories meta", e);
    }
  }, [activeWorkspaceId]);

  // Load transactions list with active filters
  const fetchTransactions = useCallback(
    async (pageToLoad = 1) => {
      if (!activeWorkspaceId) return;
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams();
        params.set("page", String(pageToLoad));
        params.set("limit", "20");
        if (search.trim()) params.set("search", search.trim());
        if (filterType) params.set("type", filterType);
        if (filterAccountId) params.set("accountId", filterAccountId);
        if (filterCategoryId) params.set("categoryId", filterCategoryId);

        const res = await fetch(
          `/api/workspaces/${activeWorkspaceId}/transactions?${params.toString()}`
        );
        if (!res.ok) throw new Error("Gagal mengambil data transaksi");
        const data = await res.json();
        setTransactions(data.transactions || []);
        setPagination(data.pagination || { page: 1, limit: 20, total: 0, totalPages: 1 });
        setSummary(data.summary || { totalIncome: 0, totalExpense: 0, netCashflow: 0 });
      } catch (err: any) {
        setError(err.message || "Terjadi kesalahan saat memuat transaksi");
      } finally {
        setLoading(false);
      }
    },
    [activeWorkspaceId, search, filterType, filterAccountId, filterCategoryId]
  );

  useEffect(() => {
    loadMeta();
  }, [loadMeta]);

  useEffect(() => {
    fetchTransactions(1);
  }, [fetchTransactions]);

  const handleOpenCreateModal = (presetType: "EXPENSE" | "INCOME" | "TRANSFER" = "EXPENSE") => {
    setEditingTx(null);
    setFormType(presetType);
    setFormAmount("");
    setFormAccountId(accounts[0]?.id || "");
    setFormToAccountId(accounts[1]?.id || "");
    setFormCategoryId(
      categories.find((c) => c.type === (presetType === "INCOME" ? "INCOME" : "EXPENSE"))?.id || ""
    );
    setFormDescription("");
    setFormNotes("");
    // Current datetime local ISO
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    setFormDate(now.toISOString().slice(0, 16));
    setModalError(null);
    setModalOpen(true);
  };

  const handleOpenEditModal = (tx: TransactionData) => {
    setEditingTx(tx);
    setFormType(tx.type);
    setFormAmount(String(tx.amount));
    setFormAccountId(tx.account.id);
    setFormToAccountId(tx.toAccount?.id || "");
    setFormCategoryId(tx.category?.id || "");
    setFormDescription(tx.description);
    setFormNotes(tx.notes || "");
    const dateObj = new Date(tx.transactedAt);
    dateObj.setMinutes(dateObj.getMinutes() - dateObj.getTimezoneOffset());
    setFormDate(dateObj.toISOString().slice(0, 16));
    setModalError(null);
    setModalOpen(true);
  };

  const handleSubmitModal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeWorkspaceId) return;
    setSubmitting(true);
    setModalError(null);

    const cleanAmount = parseInt(formAmount.replace(/\D/g, "") || "0", 10);
    if (cleanAmount <= 0) {
      setModalError("Nominal transaksi harus lebih dari Rp 0");
      setSubmitting(false);
      return;
    }

    try {
      const payload: any = {
        type: formType,
        accountId: formAccountId,
        amount: cleanAmount,
        description: formDescription,
        notes: formNotes || null,
        transactedAt: new Date(formDate).toISOString(),
      };

      if (formType === "TRANSFER") {
        if (!formToAccountId) throw new Error("Pilih rekening tujuan untuk transfer");
        if (formToAccountId === formAccountId) throw new Error("Rekening tujuan tidak boleh sama");
        payload.toAccountId = formToAccountId;
      } else {
        payload.categoryId = formCategoryId || null;
      }

      if (editingTx) {
        const res = await fetch(
          `/api/workspaces/${activeWorkspaceId}/transactions/${editingTx.id}`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          }
        );
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Gagal memperbarui transaksi");
      } else {
        const res = await fetch(`/api/workspaces/${activeWorkspaceId}/transactions`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Gagal mencatat transaksi");
      }

      setModalOpen(false);
      await fetchTransactions(pagination.page);
      await refreshWorkspaces();
    } catch (err: any) {
      setModalError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (tx: TransactionData) => {
    if (!activeWorkspaceId) return;
    const confirmDelete = window.confirm(
      `Hapus transaksi "${tx.description}" (${formatRupiah(tx.amount)})? Saldo rekening terkait akan otomatis disesuaikan.`
    );
    if (!confirmDelete) return;

    try {
      const res = await fetch(
        `/api/workspaces/${activeWorkspaceId}/transactions/${tx.id}`,
        {
          method: "DELETE",
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal menghapus transaksi");

      await fetchTransactions(pagination.page);
      await refreshWorkspaces();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const resetFilters = () => {
    setSearch("");
    setFilterType("");
    setFilterAccountId("");
    setFilterCategoryId("");
  };

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-navy)] font-heading">
            Riwayat Transaksi
          </h1>
          <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">
            Pencatatan mutasi pengeluaran, pemasukan, dan transfer dana di workspace{" "}
            <span className="font-semibold text-[var(--color-navy)]">
              {activeWorkspace?.name}
            </span>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => handleOpenCreateModal("EXPENSE")}
            className="btn btn-primary text-xs !py-2.5 !px-3.5 bg-[var(--color-accent-red)] hover:bg-[#b01e2e]"
          >
            <ArrowDownLeft size={14} />
            <span>Pengeluaran</span>
          </button>
          <button
            type="button"
            onClick={() => handleOpenCreateModal("INCOME")}
            className="btn btn-primary text-xs !py-2.5 !px-3.5 bg-[#27ae60] hover:bg-[#219653]"
          >
            <ArrowUpRight size={14} />
            <span>Pemasukan</span>
          </button>
          <button
            type="button"
            onClick={() => handleOpenCreateModal("TRANSFER")}
            className="btn btn-primary text-xs !py-2.5 !px-3.5"
          >
            <ArrowRightLeft size={14} />
            <span>Transfer</span>
          </button>
        </div>
      </div>

      {/* Summary Row (Morgan Stanley Metrics Card) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="card p-5 bg-[#ffffff] border-t-4 border-t-[#27ae60]">
          <div className="text-[11px] font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider flex items-center justify-between">
            <span>Total Pemasukan</span>
            <ArrowUpRight size={15} className="text-[#27ae60]" />
          </div>
          <div className="text-2xl font-extrabold text-[#27ae60] mt-1.5 font-heading">
            {formatRupiah(summary.totalIncome)}
          </div>
        </div>

        <div className="card p-5 bg-[#ffffff] border-t-4 border-t-[var(--color-accent-red)]">
          <div className="text-[11px] font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider flex items-center justify-between">
            <span>Total Pengeluaran</span>
            <ArrowDownLeft size={15} className="text-[var(--color-accent-red)]" />
          </div>
          <div className="text-2xl font-extrabold text-[var(--color-accent-red)] mt-1.5 font-heading">
            {formatRupiah(summary.totalExpense)}
          </div>
        </div>

        <div className="card p-5 bg-[#ffffff] border-t-4 border-t-[var(--color-primary)]">
          <div className="text-[11px] font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider flex items-center justify-between">
            <span>Arus Kas Bersih (Net Flow)</span>
            <Receipt size={15} className="text-[var(--color-primary)]" />
          </div>
          <div
            className={`text-2xl font-extrabold mt-1.5 font-heading ${
              summary.netCashflow >= 0 ? "text-[var(--color-navy)]" : "text-[var(--color-accent-red)]"
            }`}
          >
            {formatRupiah(summary.netCashflow)}
          </div>
        </div>
      </div>

      {/* Interactive Filters Bar */}
      <div className="card p-4 bg-[#ffffff] mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 items-center">
          {/* Search */}
          <div className="relative md:col-span-2">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-secondary)]"
            />
            <input
              type="text"
              placeholder="Cari transaksi..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="form-input text-xs pl-8 py-2"
            />
          </div>

          {/* Type Filter */}
          <div>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="form-input text-xs py-2"
            >
              <option value="">Semua Jenis Mutasi</option>
              <option value="EXPENSE">Pengeluaran</option>
              <option value="INCOME">Pemasukan</option>
              <option value="TRANSFER">Transfer Dana</option>
            </select>
          </div>

          {/* Account Filter */}
          <div>
            <select
              value={filterAccountId}
              onChange={(e) => setFilterAccountId(e.target.value)}
              className="form-input text-xs py-2"
            >
              <option value="">Semua Rekening</option>
              {accounts.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {acc.name}
                </option>
              ))}
            </select>
          </div>

          {/* Category Filter */}
          <div className="flex items-center gap-2">
            <select
              value={filterCategoryId}
              onChange={(e) => setFilterCategoryId(e.target.value)}
              className="form-input text-xs py-2 flex-1"
            >
              <option value="">Semua Kategori</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name} ({cat.type === "EXPENSE" ? "Pengeluaran" : "Pemasukan"})
                </option>
              ))}
            </select>

            {(search || filterType || filterAccountId || filterCategoryId) && (
              <button
                type="button"
                onClick={resetFilters}
                className="p-2 text-[var(--color-text-secondary)] hover:text-[var(--color-navy)] rounded hover:bg-[#f0f0f0]"
                title="Reset Filter"
              >
                <RotateCcw size={14} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Global Error Banner */}
      {error && (
        <div className="p-4 bg-[rgba(198,34,52,0.08)] border border-[rgba(198,34,52,0.2)] rounded-lg text-xs text-[var(--color-accent-red)] flex items-center gap-2 mb-6">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {/* Transactions Table Card */}
      <div className="card bg-[#ffffff] overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-[var(--color-text-secondary)]">
            Memuat daftar transaksi...
          </div>
        ) : transactions.length === 0 ? (
          <div className="p-16 text-center">
            <Receipt size={40} className="mx-auto text-[var(--color-text-secondary)] mb-3 opacity-40" />
            <h3 className="font-bold text-sm text-[var(--color-navy)]">Belum ada transaksi ditemukan</h3>
            <p className="text-xs text-[var(--color-text-secondary)] mt-1 mb-4">
              Coba sesuaikan filter pencarian atau catat transaksi baru.
            </p>
            <button
              type="button"
              onClick={() => handleOpenCreateModal("EXPENSE")}
              className="btn btn-primary text-xs !py-2 !px-4"
            >
              <Plus size={14} />
              <span>Catat Transaksi Sekarang</span>
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-[var(--color-border)] bg-[#fafafa] text-[var(--color-text-secondary)] font-semibold uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-4">Tanggal & Jam</th>
                  <th className="py-3 px-4">Jenis</th>
                  <th className="py-3 px-4">Deskripsi</th>
                  <th className="py-3 px-4">Kategori</th>
                  <th className="py-3 px-4">Rekening</th>
                  <th className="py-3 px-4 text-right">Nominal</th>
                  <th className="py-3 px-4 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border)]">
                {transactions.map((tx) => {
                  const isExpense = tx.type === "EXPENSE";
                  const isIncome = tx.type === "INCOME";
                  const isTransfer = tx.type === "TRANSFER";
                  const txDate = new Date(tx.transactedAt);

                  return (
                    <tr
                      key={tx.id}
                      className="hover:bg-[#fbfbfb] transition-colors"
                    >
                      {/* Date */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-[var(--color-text-secondary)] font-mono text-[11px]">
                        <div>
                          {txDate.toLocaleDateString("id-ID", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })}
                        </div>
                        <div className="text-[10px] text-zinc-400">
                          {txDate.toLocaleTimeString("id-ID", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </div>
                      </td>

                      {/* Type Badge */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold ${
                            isExpense
                              ? "bg-[rgba(198,34,52,0.08)] text-[var(--color-accent-red)]"
                              : isIncome
                              ? "bg-[rgba(39,174,96,0.08)] text-[#27ae60]"
                              : "bg-[rgba(24,122,186,0.08)] text-[var(--color-primary)]"
                          }`}
                        >
                          {isExpense && <ArrowDownLeft size={11} />}
                          {isIncome && <ArrowUpRight size={11} />}
                          {isTransfer && <ArrowRightLeft size={11} />}
                          <span>
                            {isExpense ? "Keluar" : isIncome ? "Masuk" : "Transfer"}
                          </span>
                        </span>
                      </td>

                      {/* Description & Notes */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-[var(--color-navy)]">
                          {tx.description}
                        </div>
                        {tx.notes && (
                          <div className="text-[10px] text-[var(--color-text-secondary)] italic">
                            {tx.notes}
                          </div>
                        )}
                      </td>

                      {/* Category */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {tx.category ? (
                          <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-[#f5f5f5] text-[11px] font-medium text-[var(--color-navy)]">
                            <span
                              className="w-2 h-2 rounded-full"
                              style={{ backgroundColor: tx.category.color }}
                            />
                            <span>{tx.category.name}</span>
                          </div>
                        ) : isTransfer ? (
                          <span className="text-[11px] text-[var(--color-text-secondary)]">-</span>
                        ) : (
                          <span className="text-[11px] text-[var(--color-text-secondary)]">Tanpa Kategori</span>
                        )}
                      </td>

                      {/* Accounts */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-[11px]">
                        {isTransfer ? (
                          <div className="flex items-center gap-1 text-[var(--color-navy)]">
                            <span className="font-medium">{tx.account.name}</span>
                            <ArrowRightLeft size={11} className="text-[var(--color-text-secondary)]" />
                            <span className="font-medium">{tx.toAccount?.name || "Tujuan"}</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5">
                            <span
                              className="w-2 h-2 rounded-full"
                              style={{ backgroundColor: tx.account.color }}
                            />
                            <span className="font-medium text-[var(--color-navy)]">
                              {tx.account.name}
                            </span>
                          </div>
                        )}
                      </td>

                      {/* Amount */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-right font-bold text-xs font-mono">
                        <span
                          className={
                            isExpense
                              ? "text-[var(--color-accent-red)]"
                              : isIncome
                              ? "text-[#27ae60]"
                              : "text-[var(--color-primary)]"
                          }
                        >
                          {isExpense ? "- " : isIncome ? "+ " : ""}
                          {formatRupiah(tx.amount)}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleOpenEditModal(tx)}
                            className="p-1 text-[var(--color-text-secondary)] hover:text-[var(--color-primary)] rounded hover:bg-[#f0f0f0]"
                            title="Edit Transaksi"
                          >
                            <Edit2 size={12} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(tx)}
                            className="p-1 text-[var(--color-text-secondary)] hover:text-[var(--color-accent-red)] rounded hover:bg-[rgba(198,34,52,0.06)]"
                            title="Hapus Transaksi"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        {pagination.totalPages > 1 && (
          <div className="p-3 border-t border-[var(--color-border)] bg-[#fafafa] flex items-center justify-between text-xs text-[var(--color-text-secondary)]">
            <div>
              Menampilkan {transactions.length} dari {pagination.total} transaksi
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={pagination.page <= 1}
                onClick={() => fetchTransactions(pagination.page - 1)}
                className="btn btn-secondary !py-1 !px-2.5 text-xs disabled:opacity-40"
              >
                <ChevronLeft size={13} />
                <span>Sebelumnya</span>
              </button>
              <span className="font-semibold text-[var(--color-navy)]">
                {pagination.page} / {pagination.totalPages}
              </span>
              <button
                type="button"
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => fetchTransactions(pagination.page + 1)}
                className="btn btn-secondary !py-1 !px-2.5 text-xs disabled:opacity-40"
              >
                <span>Berikutnya</span>
                <ChevronRight size={13} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal Add / Edit Transaction */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#ffffff] rounded-xl border border-[var(--color-border)] shadow-[var(--shadow-high)] w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-base text-[var(--color-navy)] font-heading">
                {editingTx ? "Edit Transaksi" : "Catat Transaksi Baru"}
              </h3>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="text-[var(--color-text-secondary)] hover:text-[var(--color-navy)]"
              >
                <X size={18} />
              </button>
            </div>

            {modalError && (
              <div className="p-3 bg-[rgba(198,34,52,0.08)] border border-[rgba(198,34,52,0.2)] rounded-lg text-xs text-[var(--color-accent-red)] mb-4">
                {modalError}
              </div>
            )}

            <form onSubmit={handleSubmitModal} className="space-y-4">
              {/* Type Switcher */}
              <div className="grid grid-cols-3 gap-2 p-1 bg-[#f5f5f5] rounded-lg">
                <button
                  type="button"
                  onClick={() => setFormType("EXPENSE")}
                  className={`py-2 rounded-md text-xs font-bold transition-all ${
                    formType === "EXPENSE"
                      ? "bg-[var(--color-accent-red)] text-white shadow-sm"
                      : "text-[var(--color-text-secondary)] hover:text-[var(--color-navy)]"
                  }`}
                >
                  Pengeluaran
                </button>
                <button
                  type="button"
                  onClick={() => setFormType("INCOME")}
                  className={`py-2 rounded-md text-xs font-bold transition-all ${
                    formType === "INCOME"
                      ? "bg-[#27ae60] text-white shadow-sm"
                      : "text-[var(--color-text-secondary)] hover:text-[var(--color-navy)]"
                  }`}
                >
                  Pemasukan
                </button>
                <button
                  type="button"
                  onClick={() => setFormType("TRANSFER")}
                  className={`py-2 rounded-md text-xs font-bold transition-all ${
                    formType === "TRANSFER"
                      ? "bg-[var(--color-primary)] text-white shadow-sm"
                      : "text-[var(--color-text-secondary)] hover:text-[var(--color-navy)]"
                  }`}
                >
                  Transfer Dana
                </button>
              </div>

              {/* Amount */}
              <div>
                <label className="form-label">Nominal (Rupiah)</label>
                <input
                  type="number"
                  min="1"
                  placeholder="Contoh: 150000"
                  value={formAmount}
                  onChange={(e) => setFormAmount(e.target.value)}
                  className="form-input text-base font-bold font-mono text-[var(--color-navy)]"
                  required
                />
                {formAmount && parseInt(formAmount, 10) > 0 && (
                  <p className="text-[11px] text-[var(--color-primary)] font-semibold mt-1">
                    {formatRupiah(parseInt(formAmount, 10))}
                  </p>
                )}
              </div>

              {/* Accounts Selection */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="form-label">
                    {formType === "TRANSFER" ? "Dari Rekening (Sumber)" : "Rekening"}
                  </label>
                  <select
                    value={formAccountId}
                    onChange={(e) => setFormAccountId(e.target.value)}
                    className="form-input text-xs"
                    required
                  >
                    <option value="">Pilih Rekening</option>
                    {accounts.map((acc) => (
                      <option key={acc.id} value={acc.id}>
                        {acc.name}
                      </option>
                    ))}
                  </select>
                </div>

                {formType === "TRANSFER" ? (
                  <div>
                    <label className="form-label">Ke Rekening (Tujuan)</label>
                    <select
                      value={formToAccountId}
                      onChange={(e) => setFormToAccountId(e.target.value)}
                      className="form-input text-xs"
                      required
                    >
                      <option value="">Pilih Rekening Tujuan</option>
                      {accounts
                        .filter((a) => a.id !== formAccountId)
                        .map((acc) => (
                          <option key={acc.id} value={acc.id}>
                            {acc.name}
                          </option>
                        ))}
                    </select>
                  </div>
                ) : (
                  <div>
                    <label className="form-label">Kategori</label>
                    <select
                      value={formCategoryId}
                      onChange={(e) => setFormCategoryId(e.target.value)}
                      className="form-input text-xs"
                    >
                      <option value="">Pilih Kategori</option>
                      {categories
                        .filter((c) => c.type === (formType === "INCOME" ? "INCOME" : "EXPENSE"))
                        .map((cat) => (
                          <option key={cat.id} value={cat.id}>
                            {cat.name}
                          </option>
                        ))}
                    </select>
                  </div>
                )}
              </div>

              {/* Date & Time */}
              <div>
                <label className="form-label">Tanggal & Jam</label>
                <input
                  type="datetime-local"
                  value={formDate}
                  onChange={(e) => setFormDate(e.target.value)}
                  className="form-input text-xs"
                  required
                />
              </div>

              {/* Description */}
              <div>
                <label className="form-label">Keterangan Transaksi</label>
                <input
                  type="text"
                  placeholder="Contoh: Makan Siang Klien / Gaji Freelance"
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="form-input text-xs"
                  required
                />
              </div>

              {/* Notes */}
              <div>
                <label className="form-label">Catatan Tambahan (Opsional)</label>
                <textarea
                  rows={2}
                  placeholder="Catatan pelengkap atau rincian transaksi..."
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  className="form-input text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[var(--color-border)]">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="btn btn-secondary text-xs"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn btn-primary text-xs"
                >
                  {submitting ? "Menyimpan..." : editingTx ? "Simpan Perubahan" : "Simpan Transaksi"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function TransactionsPage() {
  return (
    <WorkspaceProvider>
      <AppShell>
        <TransactionsContent />
      </AppShell>
    </WorkspaceProvider>
  );
}
