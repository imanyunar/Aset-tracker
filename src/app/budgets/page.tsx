"use client";

import React, { useState, useEffect, useCallback } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { WorkspaceProvider, useWorkspace } from "@/context/workspace-context";
import { useSession } from "@/lib/auth-client";
import { formatRupiah } from "@/lib/serialize";
import {
  BellRing,
  Plus,
  Send,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  X,
  Edit2,
  Trash2,
  Smartphone,
  ShieldCheck,
  TrendingDown,
  Percent,
} from "lucide-react";

interface BudgetItem {
  id: string;
  categoryId: string;
  categoryName: string;
  categoryColor: string;
  categoryIcon: string;
  amount: number;
  spent: number;
  remaining: number;
  percentage: number;
  period: string;
  status: "NORMAL" | "WARNING" | "EXCEEDED";
}

interface BudgetResponse {
  period: string;
  budgets: BudgetItem[];
  summary: {
    totalBudget: number;
    totalSpent: number;
    totalRemaining: number;
    overallPercentage: number;
  };
}

interface CategoryOption {
  id: string;
  name: string;
  type: string;
  color: string;
}

function BudgetsContent() {
  const { activeWorkspace, activeWorkspaceId } = useWorkspace();
  const { data: session } = useSession();

  const [data, setData] = useState<BudgetResponse | null>(null);
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal State Budget
  const [budgetModalOpen, setBudgetModalOpen] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState("");
  const [budgetAmount, setBudgetAmount] = useState("");
  const [savingBudget, setSavingBudget] = useState(false);
  const [budgetModalError, setBudgetModalError] = useState<string | null>(null);

  // Modal State WhatsApp Test & 2-Way Simulator
  const [waModalOpen, setWaModalOpen] = useState(false);
  const [waTab, setWaTab] = useState<"simulator" | "outbound">("simulator");
  const [testPhone, setTestPhone] = useState("");
  const [testMessage, setTestMessage] = useState("");
  const [sendingWa, setSendingWa] = useState(false);
  const [waResult, setWaResult] = useState<{ success?: boolean; message?: string } | null>(null);

  // Simulator Chat State
  const [simInput, setSimInput] = useState("");
  const [simLoading, setSimLoading] = useState(false);
  const [simMessages, setSimMessages] = useState<
    Array<{ sender: "user" | "bot"; text: string; time: string }>
  >([
    {
      sender: "bot",
      text: "🤖 *NEXAFINANCE ASISTEN WHATSAPP*\nHalo! Kirim *menu* atau ketik transaksi keuangan Anda (contoh: _Makan siang 35rb bayar bca_ / _saldo_ / _ringkasan_).",
      time: "Baru saja",
    },
  ]);

  const fetchBudgets = useCallback(async () => {
    if (!activeWorkspaceId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/workspaces/${activeWorkspaceId}/budgets`);
      if (!res.ok) throw new Error("Gagal memuat anggaran");
      const json = await res.json();
      setData(json);
    } catch (err: any) {
      setError(err.message || "Terjadi kesalahan saat memuat anggaran");
    } finally {
      setLoading(false);
    }
  }, [activeWorkspaceId]);

  const fetchCategories = useCallback(async () => {
    if (!activeWorkspaceId) return;
    try {
      const res = await fetch(`/api/workspaces/${activeWorkspaceId}/categories?type=EXPENSE`);
      if (res.ok) {
        const json = await res.json();
        setCategories(json.categories || []);
      }
    } catch (e) {
      console.error("Gagal memuat kategori pengeluaran", e);
    }
  }, [activeWorkspaceId]);

  useEffect(() => {
    fetchBudgets();
    fetchCategories();
  }, [fetchBudgets, fetchCategories]);

  useEffect(() => {
    if (session?.user) {
      setTestPhone((session.user as any).whatsappNumber || "");
    }
  }, [session]);

  const handleOpenAddBudget = (presetCategoryId?: string, presetAmount?: number) => {
    setSelectedCategoryId(presetCategoryId || categories[0]?.id || "");
    setBudgetAmount(presetAmount ? String(presetAmount) : "");
    setBudgetModalError(null);
    setBudgetModalOpen(true);
  };

  const handleSaveBudget = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeWorkspaceId) return;
    setSavingBudget(true);
    setBudgetModalError(null);

    const cleanAmount = parseInt(budgetAmount.replace(/\D/g, "") || "0", 10);
    if (cleanAmount <= 0) {
      setBudgetModalError("Nominal pagu anggaran harus lebih besar dari Rp 0");
      setSavingBudget(false);
      return;
    }

    try {
      const res = await fetch(`/api/workspaces/${activeWorkspaceId}/budgets`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          categoryId: selectedCategoryId,
          amount: cleanAmount,
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Gagal menyimpan pagu anggaran");

      setBudgetModalOpen(false);
      await fetchBudgets();
    } catch (err: any) {
      setBudgetModalError(err.message);
    } finally {
      setSavingBudget(false);
    }
  };

  const handleDeleteBudget = async (budgetId: string, catName: string) => {
    if (!activeWorkspaceId) return;
    const confirmDel = window.confirm(`Hapus batas anggaran untuk kategori "${catName}"?`);
    if (!confirmDel) return;

    try {
      const res = await fetch(`/api/workspaces/${activeWorkspaceId}/budgets/${budgetId}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Gagal menghapus pagu anggaran");

      await fetchBudgets();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleSendTestWa = async (e: React.FormEvent) => {
    e.preventDefault();
    setSendingWa(true);
    setWaResult(null);

    try {
      const res = await fetch("/api/whatsapp/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: testPhone,
          message: testMessage || undefined,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        setWaResult({ success: false, message: json.error || "Gagal mengirim notifikasi" });
      } else {
        setWaResult({
          success: true,
          message: `${json.message} (Driver: ${json.driver})`,
        });
      }
    } catch (err: any) {
      setWaResult({ success: false, message: err.message || "Gagal menghubungi server" });
    } finally {
      setSendingWa(false);
    }
  };

  const handleSendSimulator = async (presetText?: string) => {
    const textToSend = presetText || simInput;
    const phone = testPhone || (session?.user as any)?.whatsappNumber;
    if (!phone) {
      alert("Harap masukkan nomor WhatsApp Anda atau isi profil nomor WhatsApp terlebih dahulu.");
      return;
    }
    const now = new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });

    setSimMessages((prev) => [...prev, { sender: "user", text: textToSend, time: now }]);
    setSimInput("");
    setSimLoading(true);

    try {
      const res = await fetch("/api/whatsapp/webhook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sender: phone,
          message: textToSend,
        }),
      });
      const data = await res.json();
      const replyText = data.replyPreview || data.error || "Tidak ada respon dari bot.";
      setSimMessages((prev) => [
        ...prev,
        {
          sender: "bot",
          text: replyText,
          time: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
      if (data.actionTaken === "TRANSACTION_CREATED") {
        fetchBudgets();
      }
    } catch (err: any) {
      setSimMessages((prev) => [
        ...prev,
        { sender: "bot", text: `❌ Terjadi kesalahan: ${err.message}`, time: now },
      ]);
    } finally {
      setSimLoading(false);
    }
  };

  const summary = data?.summary || {
    totalBudget: 0,
    totalSpent: 0,
    totalRemaining: 0,
    overallPercentage: 0,
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-[var(--color-navy)] font-heading">
              Pagu Anggaran & Notifikasi WhatsApp
            </h1>
          </div>
          <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">
            Kendalikan pos belanja bulanan dan terima notifikasi instan via WhatsApp di workspace{" "}
            <span className="font-semibold text-[var(--color-navy)]">
              {activeWorkspace?.name}
            </span>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setWaResult(null);
              setWaModalOpen(true);
            }}
            className="btn btn-secondary text-xs !py-2.5 !px-3.5"
          >
            <Smartphone size={14} className="text-[var(--color-primary)]" />
            <span>Tes WhatsApp</span>
          </button>

          <button
            type="button"
            onClick={() => handleOpenAddBudget()}
            className="btn btn-primary text-xs !py-2.5 !px-4"
          >
            <Plus size={14} />
            <span>Atur Pagu Anggaran</span>
          </button>
        </div>
      </div>

      {/* Global Error Banner */}
      {error && (
        <div className="p-4 bg-[rgba(198,34,52,0.08)] border border-[rgba(198,34,52,0.2)] rounded-lg text-xs text-[var(--color-accent-red)] flex items-center gap-2">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {/* Summary KPI Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="card p-5 bg-[#ffffff] border-t-4 border-t-[var(--color-primary)] animate-fade-in-up delay-75 hover:shadow-md transition-all duration-300">
          <div className="text-[11px] font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider">
            Total Pagu Anggaran
          </div>
          <div className="text-2xl font-extrabold text-[var(--color-navy)] mt-2 font-heading">
            {formatRupiah(summary.totalBudget)}
          </div>
          <div className="text-[11px] text-[var(--color-text-secondary)] mt-1">
            Periode {data?.period || "Bulan Ini"}
          </div>
        </div>

        <div className="card p-5 bg-[#ffffff] border-t-4 border-t-[var(--color-accent-red)] animate-fade-in-up delay-150 hover:shadow-md transition-all duration-300">
          <div className="text-[11px] font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider">
            Realisasi Belanja
          </div>
          <div className="text-2xl font-extrabold text-[var(--color-accent-red)] mt-2 font-heading">
            {formatRupiah(summary.totalSpent)}
          </div>
          <div className="text-[11px] text-[var(--color-text-secondary)] mt-1">
            Pengeluaran pos teranggarkan
          </div>
        </div>

        <div className="card p-5 bg-[#ffffff] border-t-4 border-t-[#27ae60] animate-fade-in-up delay-200 hover:shadow-md transition-all duration-300">
          <div className="text-[11px] font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider">
            Sisa Anggaran Aman
          </div>
          <div className="text-2xl font-extrabold text-[#27ae60] mt-2 font-heading">
            {formatRupiah(summary.totalRemaining)}
          </div>
          <div className="text-[11px] text-[var(--color-text-secondary)] mt-1">
            Tersedia untuk dibelanjakan
          </div>
        </div>

        <div className="card p-5 bg-[#ffffff] border-t-4 border-t-[var(--color-navy)] animate-fade-in-up delay-250 hover:shadow-md transition-all duration-300">
          <div className="text-[11px] font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider flex items-center justify-between">
            <span>Rasio Terpakai</span>
            <Percent size={14} className="text-[var(--color-navy)]" />
          </div>
          <div className="text-2xl font-extrabold text-[var(--color-navy)] mt-2 font-heading">
            {summary.overallPercentage}%
          </div>
          <div className="w-full bg-[#f0f0f0] rounded-full h-2 mt-2 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-700 ease-out ${
                summary.overallPercentage >= 100
                  ? "bg-[var(--color-accent-red)]"
                  : summary.overallPercentage >= 80
                  ? "bg-[#e67e22]"
                  : "bg-[#27ae60]"
              }`}
              style={{ width: `${Math.min(100, summary.overallPercentage)}%` }}
            />
          </div>
        </div>
      </div>

      {/* WhatsApp Integration Status Box */}
      <div className="card p-5 bg-[rgba(24,122,186,0.03)] border border-[rgba(24,122,186,0.18)] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-[var(--color-primary)] text-white flex items-center justify-center shrink-0 shadow-[0_2px_8px_rgba(24,122,186,0.25)]">
            <Smartphone size={20} />
          </div>
          <div>
            <div className="font-bold text-sm text-[var(--color-navy)] flex items-center gap-2">
              <span>NexaFinance WhatsApp Bot Guard</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#27ae60]/10 text-[#27ae60] border border-[#27ae60]/20">
                Driver Aktif
              </span>
            </div>
            <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">
              Notifikasi mutasi transaksi otomatis dikirim ke nomor WhatsApp Anda tanpa jeda. Jika belanja pos kategori mencapai <span className="font-bold text-[var(--color-navy)]">80%</span> atau melebihi <span className="font-bold text-[var(--color-navy)]">100%</span> pagu, bot akan mengirimkan peringatan dini.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            setWaResult(null);
            setWaModalOpen(true);
          }}
          className="btn btn-secondary text-xs !py-2 !px-3 shrink-0"
        >
          <span>Uji Coba Notifikasi</span>
        </button>
      </div>

      {/* Budgets Grid */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-base text-[var(--color-navy)] font-heading">
            Daftar Alokasi Pagu Kategori ({data?.budgets.length || 0})
          </h2>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1, 2, 3].map((i) => (
              <div key={i} className="card p-6 bg-[#ffffff] animate-pulse h-40" />
            ))}
          </div>
        ) : !data || data.budgets.length === 0 ? (
          <div className="card p-12 text-center bg-[#ffffff]">
            <BellRing size={36} className="mx-auto text-[var(--color-text-secondary)] mb-3 opacity-40" />
            <h3 className="font-bold text-sm text-[var(--color-navy)]">Belum ada pagu anggaran aktif</h3>
            <p className="text-xs text-[var(--color-text-secondary)] mt-1 mb-4">
              Tetapkan batas belanja untuk kategori pengeluaran Anda agar arus kas tetap surplus.
            </p>
            <button
              type="button"
              onClick={() => handleOpenAddBudget()}
              className="btn btn-primary text-xs !py-2 !px-4"
            >
              <Plus size={14} />
              <span>Tetapkan Pagu Sekarang</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 animate-fade-in-up delay-300">
            {data.budgets.map((b) => {
              const isExceeded = b.status === "EXCEEDED";
              const isWarning = b.status === "WARNING";

              return (
                <div
                  key={b.id}
                  className="card p-5 bg-[#ffffff] relative hover:shadow-[var(--shadow-high)] hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between group"
                  style={{ borderTop: `4px solid ${b.categoryColor}` }}
                >
                  <div>
                    {/* Header Card */}
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div className="flex items-center gap-2.5">
                        <span
                          className="w-3 h-3 rounded-full shrink-0"
                          style={{ backgroundColor: b.categoryColor }}
                        />
                        <div>
                          <h3 className="font-bold text-sm text-[var(--color-navy)] leading-tight">
                            {b.categoryName}
                          </h3>
                          <span className="text-[10px] text-[var(--color-text-secondary)] font-mono">
                            Periode {b.period}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleOpenAddBudget(b.categoryId, b.amount)}
                          className="p-1.5 text-[var(--color-text-secondary)] hover:text-[var(--color-primary)] rounded hover:bg-[#f0f0f0]"
                          title="Edit Pagu"
                        >
                          <Edit2 size={13} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteBudget(b.id, b.categoryName)}
                          className="p-1.5 text-[var(--color-text-secondary)] hover:text-[var(--color-accent-red)] rounded hover:bg-[rgba(198,34,52,0.06)]"
                          title="Hapus Pagu"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="my-3">
                      <div className="flex items-baseline justify-between text-xs mb-1.5">
                        <span className="text-[var(--color-text-secondary)] font-medium">
                          Terpakai {formatRupiah(b.spent)}
                        </span>
                        <span className="font-bold font-mono text-[var(--color-navy)]">
                          {b.percentage}%
                        </span>
                      </div>
                      <div className="w-full bg-[#f0f0f0] rounded-full h-2 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            isExceeded
                              ? "bg-[var(--color-accent-red)]"
                              : isWarning
                              ? "bg-[#e67e22]"
                              : "bg-[#27ae60]"
                          }`}
                          style={{ width: `${Math.min(100, b.percentage)}%` }}
                        />
                      </div>
                    </div>

                    {/* Amounts Breakdown */}
                    <div className="grid grid-cols-2 gap-2 text-xs pt-2">
                      <div>
                        <div className="text-[10px] text-[var(--color-text-secondary)]">Pagu Target</div>
                        <div className="font-bold font-mono text-[var(--color-navy)]">
                          {formatRupiah(b.amount)}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-[10px] text-[var(--color-text-secondary)]">Sisa Anggaran</div>
                        <div
                          className={`font-bold font-mono ${
                            isExceeded ? "text-[var(--color-accent-red)]" : "text-[#27ae60]"
                          }`}
                        >
                          {isExceeded ? `Defisit ${formatRupiah(b.spent - b.amount)}` : formatRupiah(b.remaining)}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Status Badge Footer */}
                  <div className="pt-3 border-t border-[var(--color-border)] mt-3 flex items-center justify-between text-[11px]">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold ${
                        isExceeded
                          ? "bg-[rgba(198,34,52,0.1)] text-[var(--color-accent-red)]"
                          : isWarning
                          ? "bg-[rgba(230,126,34,0.1)] text-[#e67e22]"
                          : "bg-[rgba(39,174,96,0.1)] text-[#27ae60]"
                      }`}
                    >
                      {isExceeded ? (
                        <>
                          <AlertTriangle size={11} /> Melebihi Batas
                        </>
                      ) : isWarning ? (
                        <>
                          <AlertCircle size={11} /> Waspada (≥80%)
                        </>
                      ) : (
                        <>
                          <CheckCircle2 size={11} /> Anggaran Aman
                        </>
                      )}
                    </span>

                    <span className="text-[10px] text-[var(--color-text-secondary)]">
                      WhatsApp Alert Aktif
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal Add / Edit Budget */}
      {budgetModalOpen && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#ffffff] rounded-xl border border-[var(--color-border)] shadow-[var(--shadow-high)] w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-5">
              <h3 className="font-bold text-base text-[var(--color-navy)] font-heading">
                Atur Pagu Anggaran Kategori
              </h3>
              <button
                type="button"
                onClick={() => setBudgetModalOpen(false)}
                className="text-[var(--color-text-secondary)] hover:text-[var(--color-navy)]"
              >
                <X size={18} />
              </button>
            </div>

            {budgetModalError && (
              <div className="p-3 bg-[rgba(198,34,52,0.08)] border border-[rgba(198,34,52,0.2)] rounded-lg text-xs text-[var(--color-accent-red)] mb-4">
                {budgetModalError}
              </div>
            )}

            <form onSubmit={handleSaveBudget} className="space-y-4">
              <div>
                <label className="form-label">Pilih Pos Kategori Pengeluaran</label>
                <select
                  value={selectedCategoryId}
                  onChange={(e) => setSelectedCategoryId(e.target.value)}
                  className="form-input text-xs"
                  required
                >
                  <option value="">Pilih Kategori</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="form-label">Target Batas Pagu Bulanan (Rupiah)</label>
                <input
                  type="number"
                  min="1000"
                  placeholder="Contoh: 2500000"
                  value={budgetAmount}
                  onChange={(e) => setBudgetAmount(e.target.value)}
                  className="form-input text-sm font-bold font-mono text-[var(--color-navy)]"
                  required
                />
                {budgetAmount && parseInt(budgetAmount, 10) > 0 && (
                  <p className="text-[11px] text-[var(--color-primary)] font-semibold mt-1">
                    {formatRupiah(parseInt(budgetAmount, 10))} / bulan
                  </p>
                )}
              </div>

              <div className="p-3 bg-[#fafafa] rounded-lg text-[11px] text-[var(--color-text-secondary)] space-y-1">
                <div className="font-semibold text-[var(--color-navy)]">Ketentuan Notifikasi:</div>
                <div>• Notifikasi dikirim otomatis saat belanja mencapai 80% dari pagu.</div>
                <div>• Notifikasi darurat dikirim jika belanja melebihi 100% pagu.</div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[var(--color-border)]">
                <button
                  type="button"
                  onClick={() => setBudgetModalOpen(false)}
                  className="btn btn-secondary text-xs"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={savingBudget}
                  className="btn btn-primary text-xs"
                >
                  {savingBudget ? "Menyimpan..." : "Simpan Pagu Anggaran"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal WhatsApp Hub (2-Way Simulator & Outbound Test) */}
      {waModalOpen && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#ffffff] rounded-2xl border border-[var(--color-border)] shadow-[var(--shadow-high)] w-full max-w-xl p-6 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center pb-3 border-b border-[var(--color-border)]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[rgba(16,135,78,0.12)] text-[#10874e] flex items-center justify-center">
                  <Smartphone size={18} />
                </div>
                <div>
                  <h3 className="font-bold text-base text-[var(--color-navy)] font-heading leading-tight">
                    WhatsApp Integration Hub
                  </h3>
                  <p className="text-[11px] text-[var(--color-text-secondary)]">
                    Bot 2-Arah Interaktif & Peringatan Anggaran Real-Time
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setWaModalOpen(false)}
                className="text-[var(--color-text-secondary)] hover:text-[var(--color-navy)] p-1 rounded-md"
              >
                <X size={18} />
              </button>
            </div>

            {/* Sub-tabs */}
            <div className="flex border-b border-[var(--color-border)] my-3 gap-2">
              <button
                type="button"
                onClick={() => setWaTab("simulator")}
                className={`pb-2 text-xs font-semibold px-2 border-b-2 transition-colors ${
                  waTab === "simulator"
                    ? "border-[var(--color-primary)] text-[var(--color-primary)]"
                    : "border-transparent text-[var(--color-text-secondary)] hover:text-[var(--color-text)]"
                }`}
              >
                💬 Simulator Bot 2-Way (Inbound)
              </button>
              <button
                type="button"
                onClick={() => setWaTab("outbound")}
                className={`pb-2 text-xs font-semibold px-2 border-b-2 transition-colors ${
                  waTab === "outbound"
                    ? "border-[var(--color-primary)] text-[var(--color-primary)]"
                    : "border-transparent text-[var(--color-text-secondary)] hover:text-[var(--color-text)]"
                }`}
              >
                🚀 Uji Kirim Keluar (Outbound)
              </button>
            </div>

            {waTab === "simulator" ? (
              <div className="flex-1 flex flex-col min-h-0 space-y-3">
                {/* Webhook Endpoint Banner */}
                <div className="p-2.5 rounded-lg bg-[var(--color-bg-subtle)] border border-[var(--color-border)] flex items-center justify-between text-xs">
                  <div className="truncate">
                    <span className="text-[10px] uppercase font-bold text-[var(--color-text-muted)] tracking-wider block">
                      Endpoint Webhook Fonnte / Wablas:
                    </span>
                    <code className="text-[11px] font-mono text-[var(--color-navy)] font-semibold select-all">
                      /api/whatsapp/webhook
                    </code>
                  </div>
                  <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded font-medium ml-2">
                    Aktif
                  </span>
                </div>

                {/* Chat Messages Window */}
                <div className="flex-1 overflow-y-auto space-y-2.5 p-3 rounded-xl bg-[#f0f4f8] border border-[var(--color-border)] max-h-[300px] min-h-[200px]">
                  {simMessages.map((msg, idx) => (
                    <div
                      key={idx}
                      className={`flex flex-col ${
                        msg.sender === "user" ? "items-end" : "items-start"
                      }`}
                    >
                      <div
                        className={`max-w-[85%] rounded-2xl px-3.5 py-2 text-xs whitespace-pre-wrap leading-relaxed shadow-sm ${
                          msg.sender === "user"
                            ? "bg-[#d9fdd3] text-[#111b21] rounded-tr-none font-medium"
                            : "bg-[#ffffff] text-[#111b21] rounded-tl-none border border-slate-200"
                        }`}
                      >
                        {msg.text}
                      </div>
                      <span className="text-[9px] text-[var(--color-text-muted)] mt-0.5 px-1">
                        {msg.time}
                      </span>
                    </div>
                  ))}
                  {simLoading && (
                    <div className="flex items-center gap-1.5 text-xs text-[var(--color-text-secondary)] bg-white px-3 py-1.5 rounded-full w-fit shadow-sm">
                      <div className="w-1.5 h-1.5 rounded-full bg-[var(--color-primary)] animate-ping" />
                      <span>Bot sedang memproses transaksi...</span>
                    </div>
                  )}
                </div>

                {/* Quick Prompts Chips */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px]">
                  <span className="text-[10px] text-[var(--color-text-muted)] shrink-0 font-medium">
                    Coba:
                  </span>
                  {[
                    "Makan siang soto 35rb bayar bca",
                    "saldo",
                    "ringkasan",
                    "anggaran",
                    "menu",
                  ].map((quickText) => (
                    <button
                      key={quickText}
                      type="button"
                      disabled={simLoading}
                      onClick={() => handleSendSimulator(quickText)}
                      className="px-2.5 py-1 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 shrink-0 text-[10px] font-medium border border-slate-200 transition-colors"
                    >
                      {quickText}
                    </button>
                  ))}
                </div>

                {/* Chat Input Form */}
                <div className="flex gap-2 pt-1">
                  <input
                    type="text"
                    placeholder="Ketik transaksi atau perintah (contoh: Beli bensin 50rb bayar cash)..."
                    value={simInput}
                    disabled={simLoading}
                    onChange={(e) => setSimInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSendSimulator();
                      }
                    }}
                    className="form-input text-xs flex-1"
                  />
                  <button
                    type="button"
                    disabled={simLoading || !simInput.trim()}
                    onClick={() => handleSendSimulator()}
                    className="btn btn-primary text-xs px-4"
                  >
                    <Send size={13} />
                    <span>Kirim</span>
                  </button>
                </div>
              </div>
            ) : (
              <div>
                {waResult && (
                  <div
                    className={`p-3 rounded-lg text-xs flex items-center gap-2 mb-4 ${
                      waResult.success
                        ? "bg-[rgba(39,174,96,0.1)] text-[#27ae60] border border-[rgba(39,174,96,0.2)]"
                        : "bg-[rgba(198,34,52,0.1)] text-[var(--color-accent-red)] border border-[rgba(198,34,52,0.2)]"
                    }`}
                  >
                    {waResult.success ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                    <span>{waResult.message}</span>
                  </div>
                )}

                <form onSubmit={handleSendTestWa} className="space-y-4">
                  <div>
                    <label className="form-label">Nomor WhatsApp Tujuan</label>
                    <input
                      type="tel"
                      placeholder="0812xxxxxxxx"
                      value={testPhone}
                      onChange={(e) => setTestPhone(e.target.value)}
                      className="form-input text-xs"
                      required
                    />
                    <p className="text-[10px] text-[var(--color-text-secondary)] mt-1">
                      Format Indonesia (contoh: 0812xxxxxxxx atau 62812xxxxxxxx)
                    </p>
                  </div>

                  <div>
                    <label className="form-label">Pesan Uji Coba (Opsional)</label>
                    <textarea
                      rows={3}
                      placeholder="Ketik pesan kustom atau biarkan kosong untuk pesan salam default..."
                      value={testMessage}
                      onChange={(e) => setTestMessage(e.target.value)}
                      className="form-input text-xs"
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setWaModalOpen(false)}
                      className="btn btn-secondary text-xs"
                    >
                      Tutup
                    </button>
                    <button
                      type="submit"
                      disabled={sendingWa}
                      className="btn btn-primary text-xs"
                    >
                      <Send size={13} />
                      <span>{sendingWa ? "Mengirim..." : "Kirim Sekarang"}</span>
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function BudgetsPage() {
  return (
    <WorkspaceProvider>
      <AppShell>
        <BudgetsContent />
      </AppShell>
    </WorkspaceProvider>
  );
}
