"use client";

import React, { useState, useEffect, useCallback } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { WorkspaceProvider, useWorkspace } from "@/context/workspace-context";
import {
  Tags,
  Plus,
  Edit2,
  Trash2,
  X,
  AlertCircle,
  TrendingDown,
  TrendingUp,
  Utensils,
  Car,
  ShoppingBag,
  Zap,
  Film,
  HeartPulse,
  Briefcase,
  Gift,
  DollarSign,
  Home,
  Printer,
  Megaphone,
  FileText,
  Users,
  Cloud,
  Tag,
} from "lucide-react";

interface CategoryData {
  id: string;
  workspaceId: string;
  name: string;
  type: "INCOME" | "EXPENSE";
  icon: string;
  color: string;
  _count?: {
    transactions: number;
    budgets: number;
  };
}

const ICON_MAP: Record<string, React.ElementType> = {
  utensils: Utensils,
  car: Car,
  "shopping-bag": ShoppingBag,
  zap: Zap,
  film: Film,
  "heart-pulse": HeartPulse,
  briefcase: Briefcase,
  gift: Gift,
  "dollar-sign": DollarSign,
  home: Home,
  printer: Printer,
  megaphone: Megaphone,
  "file-text": FileText,
  users: Users,
  cloud: Cloud,
  tag: Tag,
};

const COLOR_PALETTE = [
  "#187aba", // Blue
  "#003061", // Navy
  "#27ae60", // Green
  "#c62234", // Red
  "#3860be", // Royal Blue
  "#9b59b6", // Purple
  "#e67e22", // Orange
  "#7f8c8d", // Gray
];

function CategoriesContent() {
  const { activeWorkspace, activeWorkspaceId } = useWorkspace();
  const [categories, setCategories] = useState<CategoryData[]>([]);
  const [filterType, setFilterType] = useState<"ALL" | "EXPENSE" | "INCOME">("ALL");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CategoryData | null>(null);
  const [formName, setFormName] = useState("");
  const [formType, setFormType] = useState<"EXPENSE" | "INCOME">("EXPENSE");
  const [formIcon, setFormIcon] = useState("tag");
  const [formColor, setFormColor] = useState(COLOR_PALETTE[0]);
  const [submitting, setSubmitting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const fetchCategories = useCallback(async () => {
    if (!activeWorkspaceId) return;
    setLoading(true);
    setError(null);
    try {
      const url =
        filterType === "ALL"
          ? `/api/workspaces/${activeWorkspaceId}/categories`
          : `/api/workspaces/${activeWorkspaceId}/categories?type=${filterType}`;

      const res = await fetch(url);
      if (!res.ok) throw new Error("Gagal mengambil daftar kategori");
      const data = await res.json();
      setCategories(data.categories || []);
    } catch (err: any) {
      setError(err.message || "Terjadi kesalahan saat memuat kategori");
    } finally {
      setLoading(false);
    }
  }, [activeWorkspaceId, filterType]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const handleOpenCreateModal = () => {
    setEditingCategory(null);
    setFormName("");
    setFormType("EXPENSE");
    setFormIcon("tag");
    setFormColor(COLOR_PALETTE[0]);
    setActionError(null);
    setModalOpen(true);
  };

  const handleOpenEditModal = (cat: CategoryData) => {
    setEditingCategory(cat);
    setFormName(cat.name);
    setFormType(cat.type);
    setFormIcon(cat.icon || "tag");
    setFormColor(cat.color || COLOR_PALETTE[0]);
    setActionError(null);
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeWorkspaceId) return;
    setSubmitting(true);
    setActionError(null);

    try {
      if (editingCategory) {
        // PUT update
        const res = await fetch(
          `/api/workspaces/${activeWorkspaceId}/categories/${editingCategory.id}`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              name: formName,
              icon: formIcon,
              color: formColor,
            }),
          }
        );
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Gagal memperbarui kategori");
      } else {
        // POST create
        const res = await fetch(`/api/workspaces/${activeWorkspaceId}/categories`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: formName,
            type: formType,
            icon: formIcon,
            color: formColor,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Gagal membuat kategori baru");
      }

      setModalOpen(false);
      await fetchCategories();
    } catch (err: any) {
      setActionError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (cat: CategoryData) => {
    if (!activeWorkspaceId) return;
    const confirmDelete = window.confirm(
      `Apakah Anda yakin ingin menghapus kategori "${cat.name}"?`
    );
    if (!confirmDelete) return;

    try {
      const res = await fetch(
        `/api/workspaces/${activeWorkspaceId}/categories/${cat.id}`,
        {
          method: "DELETE",
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal menghapus kategori");

      await fetchCategories();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const expenseCount = categories.filter((c) => c.type === "EXPENSE").length;
  const incomeCount = categories.filter((c) => c.type === "INCOME").length;

  return (
    <div>
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-navy)] font-heading">
            Kategori Anggaran
          </h1>
          <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">
            Klasifikasi pos pengeluaran dan sumber pemasukan untuk workspace{" "}
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
          <span>Tambah Kategori Baru</span>
        </button>
      </div>

      {/* Tabs Filter */}
      <div className="flex items-center gap-2 mb-6 border-b border-[var(--color-border)] pb-3">
        <button
          type="button"
          onClick={() => setFilterType("ALL")}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            filterType === "ALL"
              ? "bg-[var(--color-navy)] text-white shadow-sm"
              : "bg-[#ffffff] text-[var(--color-text-secondary)] hover:text-[var(--color-navy)] border border-[var(--color-border)]"
          }`}
        >
          Semua ({categories.length})
        </button>
        <button
          type="button"
          onClick={() => setFilterType("EXPENSE")}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
            filterType === "EXPENSE"
              ? "bg-[var(--color-accent-red)] text-white shadow-sm"
              : "bg-[#ffffff] text-[var(--color-text-secondary)] hover:text-[var(--color-navy)] border border-[var(--color-border)]"
          }`}
        >
          <TrendingDown size={14} />
          <span>Pengeluaran ({expenseCount})</span>
        </button>
        <button
          type="button"
          onClick={() => setFilterType("INCOME")}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
            filterType === "INCOME"
              ? "bg-[#27ae60] text-white shadow-sm"
              : "bg-[#ffffff] text-[var(--color-text-secondary)] hover:text-[var(--color-navy)] border border-[var(--color-border)]"
          }`}
        >
          <TrendingUp size={14} />
          <span>Pemasukan ({incomeCount})</span>
        </button>
      </div>

      {/* Global Error Banner */}
      {error && (
        <div className="p-4 bg-[rgba(198,34,52,0.08)] border border-[rgba(198,34,52,0.2)] rounded-lg text-xs text-[var(--color-accent-red)] flex items-center gap-2 mb-6">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {/* Categories Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="card p-5 bg-[#ffffff] animate-pulse h-28" />
          ))}
        </div>
      ) : categories.length === 0 ? (
        <div className="card p-12 text-center bg-[#ffffff]">
          <Tags size={36} className="mx-auto text-[var(--color-text-secondary)] mb-3 opacity-50" />
          <h3 className="font-bold text-base text-[var(--color-navy)]">Belum ada kategori</h3>
          <p className="text-xs text-[var(--color-text-secondary)] mt-1 mb-4">
            Tambahkan kategori untuk mengelompokkan setiap transaksi Anda.
          </p>
          <button
            type="button"
            onClick={handleOpenCreateModal}
            className="btn btn-primary text-xs !py-2 !px-4"
          >
            <Plus size={14} />
            <span>Tambah Kategori</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {categories.map((cat) => {
            const Icon = ICON_MAP[cat.icon] || Tag;
            const isExpense = cat.type === "EXPENSE";

            return (
              <div
                key={cat.id}
                className="card p-4 bg-[#ffffff] relative hover:shadow-[var(--shadow-mid)] transition-all flex flex-col justify-between"
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-white shrink-0"
                      style={{ backgroundColor: cat.color }}
                    >
                      <Icon size={16} />
                    </div>
                    <div>
                      <h3 className="font-bold text-xs text-[var(--color-navy)] leading-tight">
                        {cat.name}
                      </h3>
                      <span
                        className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold mt-0.5 ${
                          isExpense
                            ? "bg-[rgba(198,34,52,0.08)] text-[var(--color-accent-red)]"
                            : "bg-[rgba(39,174,96,0.08)] text-[#27ae60]"
                        }`}
                      >
                        {isExpense ? "Pengeluaran" : "Pemasukan"}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleOpenEditModal(cat)}
                      className="p-1 text-[var(--color-text-secondary)] hover:text-[var(--color-primary)] rounded hover:bg-[#f0f0f0]"
                      title="Edit Kategori"
                    >
                      <Edit2 size={12} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(cat)}
                      className="p-1 text-[var(--color-text-secondary)] hover:text-[var(--color-accent-red)] rounded hover:bg-[rgba(198,34,52,0.06)]"
                      title="Hapus Kategori"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>

                <div className="text-[11px] text-[var(--color-text-secondary)] pt-2 border-t border-[var(--color-border)] mt-2">
                  {cat._count?.transactions || 0} Transaksi Terkait
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Add / Edit Category */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#ffffff] rounded-xl border border-[var(--color-border)] shadow-[var(--shadow-high)] w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-5">
              <h3 className="font-bold text-base text-[var(--color-navy)] font-heading">
                {editingCategory ? "Edit Kategori" : "Tambah Kategori Baru"}
              </h3>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="text-[var(--color-text-secondary)] hover:text-[var(--color-navy)]"
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
                <label className="form-label">Nama Kategori</label>
                <input
                  type="text"
                  placeholder="Contoh: Langganan Software / Bahan Baku"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="form-input text-sm"
                  required
                />
              </div>

              {!editingCategory && (
                <div>
                  <label className="form-label">Tipe Kategori</label>
                  <div className="grid grid-cols-2 gap-3 mt-1">
                    <button
                      type="button"
                      onClick={() => setFormType("EXPENSE")}
                      className={`p-2.5 rounded-lg border text-center text-xs font-bold transition-all ${
                        formType === "EXPENSE"
                          ? "border-[var(--color-accent-red)] bg-[rgba(198,34,52,0.06)] text-[var(--color-accent-red)] ring-1 ring-[var(--color-accent-red)]"
                          : "border-[var(--color-border)] text-[var(--color-text-secondary)]"
                      }`}
                    >
                      Pengeluaran (Expense)
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormType("INCOME")}
                      className={`p-2.5 rounded-lg border text-center text-xs font-bold transition-all ${
                        formType === "INCOME"
                          ? "border-[#27ae60] bg-[rgba(39,174,96,0.06)] text-[#27ae60] ring-1 ring-[#27ae60]"
                          : "border-[var(--color-border)] text-[var(--color-text-secondary)]"
                      }`}
                    >
                      Pemasukan (Income)
                    </button>
                  </div>
                </div>
              )}

              <div>
                <label className="form-label">Pilih Icon</label>
                <div className="grid grid-cols-8 gap-2 mt-1">
                  {Object.keys(ICON_MAP).map((iconKey) => {
                    const IconComp = ICON_MAP[iconKey];
                    return (
                      <button
                        key={iconKey}
                        type="button"
                        onClick={() => setFormIcon(iconKey)}
                        className={`w-9 h-9 rounded-lg border flex items-center justify-center transition-all ${
                          formIcon === iconKey
                            ? "border-[var(--color-primary)] bg-[rgba(24,122,186,0.1)] text-[var(--color-primary)] ring-1 ring-[var(--color-primary)]"
                            : "border-[var(--color-border)] text-[var(--color-text-secondary)] hover:bg-[#fafafa]"
                        }`}
                      >
                        <IconComp size={16} />
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="form-label">Warna Kategori</label>
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
                  {submitting ? "Menyimpan..." : editingCategory ? "Simpan Perubahan" : "Buat Kategori"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function CategoriesPage() {
  return (
    <WorkspaceProvider>
      <AppShell>
        <CategoriesContent />
      </AppShell>
    </WorkspaceProvider>
  );
}
