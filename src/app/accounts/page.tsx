"use client";

import React, { useState, useEffect, useCallback } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { WorkspaceProvider, useWorkspace } from "@/context/workspace-context";
import { formatRupiah } from "@/lib/serialize";
import {
  Wallet,
  Landmark,
  Banknote,
  Smartphone,
  CreditCard,
  Coins,
  Plus,
  Edit2,
  Trash2,
  X,
  AlertCircle,
  Archive,
} from "lucide-react";

interface AccountData {
  id: string;
  workspaceId: string;
  name: string;
  type: "CASH" | "BANK" | "EWALLET" | "CREDIT_CARD" | "OTHER";
  openingBalance: number;
  balance: number;
  color: string;
  isArchived: boolean;
  _count?: {
    outgoingTransactions: number;
    incomingTransactions: number;
  };
}

const TYPE_CONFIG = {
  BANK: { label: "Rekening Bank", icon: Landmark },
  CASH: { label: "Kas Tunai", icon: Banknote },
  EWALLET: { label: "Dompet Digital", icon: Smartphone },
  CREDIT_CARD: { label: "Kartu Kredit", icon: CreditCard },
  OTHER: { label: "Lainnya", icon: Coins },
};

const COLOR_PALETTE = [
  "#187aba", // Morgan Stanley Blue
  "#003061", // Morgan Stanley Navy
  "#27ae60", // Green
  "#c62234", // Red Accent
  "#3860be", // Royal Blue
  "#9b59b6", // Purple
  "#e67e22", // Orange
  "#16a085", // Teal
];

function AccountsContent() {
  const { activeWorkspace, activeWorkspaceId, refreshWorkspaces } = useWorkspace();
  const [accounts, setAccounts] = useState<AccountData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<AccountData | null>(null);
  const [formName, setFormName] = useState("");
  const [formType, setFormType] = useState<AccountData["type"]>("BANK");
  const [formOpeningBalance, setFormOpeningBalance] = useState("0");
  const [formColor, setFormColor] = useState(COLOR_PALETTE[0]);
  const [submitting, setSubmitting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const fetchAccounts = useCallback(async () => {
    if (!activeWorkspaceId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/workspaces/${activeWorkspaceId}/accounts`);
      if (!res.ok) throw new Error("Gagal mengambil daftar rekening");
      const data = await res.json();
      setAccounts(data.accounts || []);
    } catch (err: any) {
      setError(err.message || "Terjadi kesalahan saat memuat rekening");
    } finally {
      setLoading(false);
    }
  }, [activeWorkspaceId]);

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  const handleOpenCreateModal = () => {
    setEditingAccount(null);
    setFormName("");
    setFormType("BANK");
    setFormOpeningBalance("0");
    setFormColor(COLOR_PALETTE[0]);
    setActionError(null);
    setModalOpen(true);
  };

  const handleOpenEditModal = (acc: AccountData) => {
    setEditingAccount(acc);
    setFormName(acc.name);
    setFormType(acc.type);
    setFormOpeningBalance(String(acc.openingBalance));
    setFormColor(acc.color || COLOR_PALETTE[0]);
    setActionError(null);
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeWorkspaceId) return;
    setSubmitting(true);
    setActionError(null);

    try {
      if (editingAccount) {
        // PUT update
        const res = await fetch(
          `/api/workspaces/${activeWorkspaceId}/accounts/${editingAccount.id}`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              name: formName,
              type: formType,
              color: formColor,
            }),
          }
        );
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Gagal memperbarui rekening");
      } else {
        // POST create
        const res = await fetch(`/api/workspaces/${activeWorkspaceId}/accounts`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: formName,
            type: formType,
            openingBalance: parseInt(formOpeningBalance.replace(/\D/g, "") || "0", 10),
            color: formColor,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Gagal membuat rekening baru");
      }

      setModalOpen(false);
      await fetchAccounts();
      await refreshWorkspaces();
    } catch (err: any) {
      setActionError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (acc: AccountData) => {
    if (!activeWorkspaceId) return;
    const confirmDelete = window.confirm(
      `Apakah Anda yakin ingin menghapus rekening "${acc.name}"?`
    );
    if (!confirmDelete) return;

    try {
      const res = await fetch(
        `/api/workspaces/${activeWorkspaceId}/accounts/${acc.id}`,
        {
          method: "DELETE",
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal menghapus rekening");

      await fetchAccounts();
      await refreshWorkspaces();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const totalBalance = accounts.reduce(
    (sum, a) => sum + (a.isArchived ? 0 : a.balance),
    0
  );

  return (
    <div>
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-navy)] font-heading">
            Rekening & Kas
          </h1>
          <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">
            Kelola seluruh sumber dana, rekening bank, dan dompet tunai di workspace{" "}
            <span className="font-semibold text-[var(--color-navy)]">
              {activeWorkspace?.name}
            </span>
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenCreateModal}
          className="btn btn-primary text-xs !py-2.5 !px-4"
        >
          <Plus size={15} />
          <span>Tambah Rekening Baru</span>
        </button>
      </div>

      {/* Net Worth Summary Card */}
      <div className="card p-6 bg-[#ffffff] mb-8 relative border-l-4 border-l-[var(--color-primary)] animate-fade-in-up delay-75 hover:shadow-md transition-all duration-300">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="text-xs text-[var(--color-text-secondary)] uppercase tracking-wider font-semibold">
              Total Likuiditas Workspace
            </div>
            <div className="text-3xl font-extrabold text-[var(--color-navy)] mt-1 font-heading">
              {formatRupiah(totalBalance)}
            </div>
            <div className="text-xs text-[var(--color-text-secondary)] mt-1">
              Dari {accounts.length} rekening terdaftar ({activeWorkspace?.type === "BUSINESS" ? "Akun Bisnis" : "Akun Pribadi"})
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1.5 rounded-lg bg-[rgba(24,122,186,0.08)] text-[var(--color-primary)] text-xs font-bold transition-transform hover:scale-105">
              Presisi Integer IDR
            </span>
          </div>
        </div>
      </div>

      {/* Global Error Banner */}
      {error && (
        <div className="p-4 bg-[rgba(198,34,52,0.08)] border border-[rgba(198,34,52,0.2)] rounded-lg text-xs text-[var(--color-accent-red)] flex items-center gap-2 mb-6 animate-shake">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {/* Accounts Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3].map((i) => (
            <div key={i} className="card p-6 bg-[#ffffff] animate-pulse h-40" />
          ))}
        </div>
      ) : accounts.length === 0 ? (
        <div className="card p-12 text-center bg-[#ffffff] animate-fade-in-up">
          <Wallet size={36} className="mx-auto text-[var(--color-text-secondary)] mb-3 opacity-50 animate-float" />
          <h3 className="font-bold text-base text-[var(--color-navy)]">Belum ada rekening</h3>
          <p className="text-xs text-[var(--color-text-secondary)] mt-1 mb-4">
            Tambahkan rekening pertama Anda untuk mulai mencatat transaksi.
          </p>
          <button
            type="button"
            onClick={handleOpenCreateModal}
            className="btn btn-primary text-xs !py-2 !px-4"
          >
            <Plus size={14} />
            <span>Tambah Rekening</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 animate-fade-in-up delay-150">
          {accounts.map((acc, idx) => {
            const config = TYPE_CONFIG[acc.type] || TYPE_CONFIG.OTHER;
            const Icon = config.icon;
            const txCount = (acc._count?.outgoingTransactions || 0) + (acc._count?.incomingTransactions || 0);

            return (
              <div
                key={acc.id}
                className="card p-5 bg-[#ffffff] relative hover:shadow-[var(--shadow-high)] hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between group"
                style={{ borderTop: `4px solid ${acc.color}` }}
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-9 h-9 rounded-lg flex items-center justify-center text-white transition-transform group-hover:scale-110 duration-200"
                        style={{ backgroundColor: acc.color }}
                      >
                        <Icon size={18} />
                      </div>
                      <div>
                        <h3 className="font-bold text-sm text-[var(--color-navy)] leading-tight group-hover:text-[var(--color-primary)] transition-colors">
                          {acc.name}
                        </h3>
                        <span className="text-[11px] text-[var(--color-text-secondary)]">
                          {config.label}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                      <button
                        type="button"
                        onClick={() => handleOpenEditModal(acc)}
                        className="p-1.5 text-[var(--color-text-secondary)] hover:text-[var(--color-primary)] rounded hover:bg-[#f0f0f0] transition-colors"
                        title="Edit Rekening"
                      >
                        <Edit2 size={13} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(acc)}
                        className="p-1.5 text-[var(--color-text-secondary)] hover:text-[var(--color-accent-red)] rounded hover:bg-[rgba(198,34,52,0.06)] transition-colors"
                        title="Hapus Rekening"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>

                  <div className="my-3">
                    <div className="text-[11px] text-[var(--color-text-secondary)]">Saldo Saat Ini</div>
                    <div className="text-xl font-extrabold text-[var(--color-navy)] font-heading">
                      {formatRupiah(acc.balance)}
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-[var(--color-border)] flex items-center justify-between text-[11px] text-[var(--color-text-secondary)] mt-2">
                  <span>Saldo Awal: {formatRupiah(acc.openingBalance)}</span>
                  <span>{txCount} Transaksi</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Add / Edit Account */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/45 z-50 flex items-center justify-center p-4 backdrop-blur-md animate-fade-in duration-200">
          <div className="bg-[#ffffff] rounded-2xl border border-[var(--color-border)] shadow-[var(--shadow-high)] w-full max-w-md p-6 animate-scale-in">
            <div className="flex justify-between items-center mb-5">
              <h3 className="font-bold text-base text-[var(--color-navy)] font-heading">
                {editingAccount ? "Edit Rekening" : "Tambah Rekening Baru"}
              </h3>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="text-[var(--color-text-secondary)] hover:text-[var(--color-navy)] p-1 rounded-lg hover:bg-[#f0f0f0] transition-all hover:rotate-90 duration-200"
              >
                <X size={18} />
              </button>
            </div>

            {actionError && (
              <div className="p-3 bg-[rgba(198,34,52,0.08)] border border-[rgba(198,34,52,0.2)] rounded-lg text-xs text-[var(--color-accent-red)] mb-4">
                {actionError}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="form-label">Nama Rekening</label>
                <input
                  type="text"
                  placeholder="Contoh: Rekening BCA Operasional / Dompet Tunai"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="form-input text-sm"
                  required
                />
              </div>

              <div>
                <label className="form-label">Tipe Rekening</label>
                <select
                  value={formType}
                  onChange={(e) => setFormType(e.target.value as any)}
                  className="form-input text-sm"
                >
                  <option value="BANK">Rekening Bank</option>
                  <option value="CASH">Kas Tunai (Cash)</option>
                  <option value="EWALLET">Dompet Digital (GoPay, OVO, ShopeePay, DANA)</option>
                  <option value="CREDIT_CARD">Kartu Kredit</option>
                  <option value="OTHER">Lainnya / Investasi</option>
                </select>
              </div>

              {!editingAccount && (
                <div>
                  <label className="form-label">Saldo Awal (Rupiah)</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={formOpeningBalance}
                    onChange={(e) => setFormOpeningBalance(e.target.value)}
                    className="form-input text-sm"
                    required
                  />
                  <p className="text-[11px] text-[var(--color-text-secondary)] mt-1">
                    Saldo awal tidak dapat diubah setelah rekening dibuat demi integritas mutasi.
                  </p>
                </div>
              )}

              <div>
                <label className="form-label">Warna Aksen</label>
                <div className="flex items-center gap-2 mt-1">
                  {COLOR_PALETTE.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setFormColor(color)}
                      className={`w-7 h-7 rounded-full transition-transform ${
                        formColor === color ? "scale-115 ring-2 ring-offset-2 ring-[var(--color-primary)]" : "hover:scale-105"
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3">
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
                  {submitting ? "Menyimpan..." : editingAccount ? "Simpan Perubahan" : "Buat Rekening"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AccountsPage() {
  return (
    <WorkspaceProvider>
      <AppShell>
        <AccountsContent />
      </AppShell>
    </WorkspaceProvider>
  );
}
