"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useWorkspace } from "@/context/workspace-context";
import { signOut, useSession } from "@/lib/auth-client";
import { formatRupiah } from "@/lib/serialize";
import {
  Building2,
  User,
  ChevronDown,
  Plus,
  LayoutDashboard,
  Wallet,
  Tags,
  Receipt,
  Sparkles,
  LogOut,
  Check,
  X,
  Shield,
  BellRing,
} from "lucide-react";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = useSession();
  const {
    workspaces,
    activeWorkspace,
    activeWorkspaceId,
    setActiveWorkspaceId,
    createWorkspace,
  } = useWorkspace();

  const [wsDropdownOpen, setWsDropdownOpen] = useState(false);
  const [createWsModalOpen, setCreateWsModalOpen] = useState(false);
  const [newWsName, setNewWsName] = useState("");
  const [newWsType, setNewWsType] = useState<"PERSONAL" | "BUSINESS">("BUSINESS");
  const [creatingWs, setCreatingWs] = useState(false);
  const [createWsError, setCreateWsError] = useState<string | null>(null);

  const handleLogout = async () => {
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("nexa_explicit_logged_out", "true");
        localStorage.removeItem("nexa_last_activity");
        sessionStorage.clear();
      } catch {}
    }
    try {
      await signOut();
    } catch {}
    router.push("/login");
  };

  const handleCreateWorkspace = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWsName.trim()) return;
    setCreatingWs(true);
    setCreateWsError(null);
    try {
      await createWorkspace(newWsName.trim(), newWsType);
      setNewWsName("");
      setCreateWsModalOpen(false);
      setWsDropdownOpen(false);
    } catch (err: any) {
      setCreateWsError(err.message || "Gagal membuat workspace");
    } finally {
      setCreatingWs(false);
    }
  };

  const navItems = [
    { href: "/dashboard", label: "Ringkasan", icon: LayoutDashboard },
    { href: "/accounts", label: "Rekening & Kas", icon: Wallet },
    { href: "/categories", label: "Kategori", icon: Tags },
    { href: "/transactions", label: "Transaksi", icon: Receipt },
    { href: "/budgets", label: "Pagu Anggaran & WA", icon: BellRing },
    { href: "/ai", label: "Asisten AI", icon: Sparkles },
  ];

  return (
    <div className="min-h-screen bg-[#fafafa] flex flex-col font-sans">
      {/* Top Header */}
      <header className="bg-[#ffffff] border-b border-[var(--color-border)] sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          {/* Brand + Workspace Selector */}
          <div className="flex items-center gap-6">
            <Link href="/dashboard" className="flex items-center gap-2.5">
              <div className="w-8 h-8 bg-[var(--color-primary)] rounded-lg flex items-center justify-center text-white font-extrabold text-base shadow-[0_2px_6px_rgba(24,122,186,0.3)]">
                N
              </div>
              <span className="font-extrabold text-lg tracking-tight text-[var(--color-navy)] font-heading">
                Nexa<span className="text-[var(--color-primary)]">Finance</span>
              </span>
            </Link>

            {/* Vertical Divider */}
            <div className="h-6 w-[1px] bg-[var(--color-border)] hidden sm:block" />

            {/* Workspace Switcher */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setWsDropdownOpen(!wsDropdownOpen)}
                className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg border border-[var(--color-border)] hover:border-[var(--color-primary)] bg-[#ffffff] transition-all text-left text-xs"
              >
                <div
                  className={`w-6 h-6 rounded flex items-center justify-center text-white text-xs ${
                    activeWorkspace?.type === "BUSINESS" ? "bg-[var(--color-navy)]" : "bg-[var(--color-primary)]"
                  }`}
                >
                  {activeWorkspace?.type === "BUSINESS" ? <Building2 size={13} /> : <User size={13} />}
                </div>
                <div className="hidden sm:block">
                  <div className="font-bold text-[var(--color-navy)] truncate max-w-[140px]">
                    {activeWorkspace?.name || "Pilih Workspace"}
                  </div>
                  <div className="text-[10px] text-[var(--color-text-secondary)]">
                    {activeWorkspace?.type === "BUSINESS" ? "Bisnis" : "Pribadi"} · {activeWorkspace ? formatRupiah(activeWorkspace.totalBalance) : "Rp 0"}
                  </div>
                </div>
                <ChevronDown size={14} className="text-[var(--color-text-secondary)] ml-1" />
              </button>

              {/* Workspace Dropdown Menu */}
              {wsDropdownOpen && (
                <div className="absolute left-0 mt-2 w-72 bg-[#ffffff] border border-[var(--color-border)] rounded-xl shadow-[var(--shadow-high)] z-50 p-2 animate-scale-in origin-top-left">
                  <div className="px-3 py-2 text-[11px] font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider">
                    Daftar Workspace Anda
                  </div>
                  <div className="space-y-1 max-h-60 overflow-y-auto">
                    {workspaces.map((ws) => (
                      <button
                        key={ws.id}
                        type="button"
                        onClick={() => {
                          setActiveWorkspaceId(ws.id);
                          setWsDropdownOpen(false);
                        }}
                        className={`w-full text-left px-3 py-2 rounded-lg text-xs flex items-center justify-between transition-all ${
                          ws.id === activeWorkspaceId
                            ? "bg-[rgba(24,122,186,0.08)] text-[var(--color-primary)] font-bold shadow-sm"
                            : "hover:bg-[#f5f5f5] text-[var(--color-navy)] hover:translate-x-1"
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <div
                            className={`w-5 h-5 rounded flex items-center justify-center text-white text-[10px] transition-transform ${
                              ws.type === "BUSINESS" ? "bg-[var(--color-navy)]" : "bg-[var(--color-primary)]"
                            }`}
                          >
                            {ws.type === "BUSINESS" ? <Building2 size={11} /> : <User size={11} />}
                          </div>
                          <div>
                            <div>{ws.name}</div>
                            <div className="text-[10px] text-[var(--color-text-secondary)] font-normal">
                              {formatRupiah(ws.totalBalance)}
                            </div>
                          </div>
                        </div>
                        {ws.id === activeWorkspaceId && <Check size={14} className="text-[var(--color-primary)]" />}
                      </button>
                    ))}
                  </div>

                  <div className="border-t border-[var(--color-border)] mt-2 pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setCreateWsModalOpen(true);
                        setWsDropdownOpen(false);
                      }}
                      className="w-full text-left px-3 py-2 rounded-lg text-xs text-[var(--color-primary)] hover:bg-[rgba(24,122,186,0.06)] font-bold flex items-center gap-2 transition-all hover:translate-x-1"
                    >
                      <Plus size={14} />
                      <span>Buat Workspace Baru</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* User Profile & Actions */}
          <div className="flex items-center gap-3">
            {session?.user && (
              <div className="hidden md:flex items-center gap-2 text-xs text-[var(--color-navy)]">
                <div className="w-8 h-8 rounded-full bg-[rgba(24,122,186,0.1)] text-[var(--color-primary)] font-bold flex items-center justify-center shadow-sm">
                  {session.user.name?.charAt(0) || "U"}
                </div>
                <div>
                  <div className="font-bold leading-tight">{session.user.name}</div>
                  <div className="text-[10px] text-[var(--color-text-secondary)]">
                    {session.user.email}
                  </div>
                </div>
              </div>
            )}

            <button
              type="button"
              onClick={handleLogout}
              className="p-2 text-[var(--color-text-secondary)] hover:text-[var(--color-accent-red)] rounded-lg hover:bg-[rgba(198,34,52,0.06)] transition-all hover:scale-105 active:scale-95"
              title="Keluar"
            >
              <LogOut size={17} />
            </button>
          </div>
        </div>

        {/* Navigation Bar */}
        <div className="border-t border-[var(--color-border)] bg-[#ffffff]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center gap-1 overflow-x-auto scrollbar-none">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname?.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`group flex items-center gap-2 px-4 py-3 text-xs font-semibold border-b-2 transition-all whitespace-nowrap active:scale-95 ${
                    isActive
                      ? "border-[var(--color-primary)] text-[var(--color-primary)] bg-[rgba(24,122,186,0.04)] shadow-[inset_0_-2px_0_0_var(--color-primary)]"
                      : "border-transparent text-[var(--color-text-secondary)] hover:text-[var(--color-navy)] hover:border-[var(--color-border)] hover:bg-[#fafafa]"
                  }`}
                >
                  <Icon size={15} className="transition-transform group-hover:scale-110 duration-200" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </header>

      {/* Main Page Content with Page Transition */}
      <main key={pathname} className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 animate-page-enter">
        {children}
      </main>

      {/* Create Workspace Modal */}
      {createWsModalOpen && (
        <div className="fixed inset-0 bg-black/45 z-50 flex items-center justify-center p-4 backdrop-blur-md animate-fade-in duration-200">
          <div className="bg-[#ffffff] rounded-2xl border border-[var(--color-border)] shadow-[var(--shadow-high)] w-full max-w-md p-6 animate-scale-in">
            <div className="flex justify-between items-center mb-5">
              <div className="flex items-center gap-2">
                <Shield size={18} className="text-[var(--color-primary)]" />
                <h3 className="font-bold text-base text-[var(--color-navy)] font-heading">
                  Buat Workspace Baru
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setCreateWsModalOpen(false)}
                className="text-[var(--color-text-secondary)] hover:text-[var(--color-navy)] p-1 rounded-lg hover:bg-[#f0f0f0] transition-all hover:rotate-90 duration-200"
              >
                <X size={18} />
              </button>
            </div>

            {createWsError && (
              <div className="p-3 bg-[rgba(198,34,52,0.08)] border border-[rgba(198,34,52,0.2)] rounded-lg text-xs text-[var(--color-accent-red)] mb-4">
                {createWsError}
              </div>
            )}

            <form onSubmit={handleCreateWorkspace} className="space-y-4">
              <div>
                <label className="form-label">Nama Workspace</label>
                <input
                  type="text"
                  placeholder="Contoh: PT Studio Kreatif / Tabungan Rumah"
                  value={newWsName}
                  onChange={(e) => setNewWsName(e.target.value)}
                  className="form-input text-sm"
                  required
                />
              </div>

              <div>
                <label className="form-label">Tipe Workspace</label>
                <div className="grid grid-cols-2 gap-3 mt-1">
                  <button
                    type="button"
                    onClick={() => setNewWsType("PERSONAL")}
                    className={`p-3 rounded-lg border text-left text-xs transition-all ${
                      newWsType === "PERSONAL"
                        ? "border-[var(--color-primary)] bg-[rgba(24,122,186,0.06)] ring-1 ring-[var(--color-primary)]"
                        : "border-[var(--color-border)] hover:bg-[#fafafa]"
                    }`}
                  >
                    <User size={16} className="text-[var(--color-primary)] mb-1" />
                    <div className="font-bold text-[var(--color-navy)]">Keuangan Pribadi</div>
                    <div className="text-[10px] text-[var(--color-text-secondary)] mt-0.5">
                      Untuk anggaran rumah tangga & individu
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setNewWsType("BUSINESS")}
                    className={`p-3 rounded-lg border text-left text-xs transition-all ${
                      newWsType === "BUSINESS"
                        ? "border-[var(--color-primary)] bg-[rgba(24,122,186,0.06)] ring-1 ring-[var(--color-primary)]"
                        : "border-[var(--color-border)] hover:bg-[#fafafa]"
                    }`}
                  >
                    <Building2 size={16} className="text-[var(--color-navy)] mb-1" />
                    <div className="font-bold text-[var(--color-navy)]">Operasional Bisnis</div>
                    <div className="text-[10px] text-[var(--color-text-secondary)] mt-0.5">
                      Untuk UMKM, CV, PT & pembukuan tim
                    </div>
                  </button>
                </div>
              </div>

              <div className="p-3 bg-[#fafafa] border border-[var(--color-border)] rounded-lg text-[11px] text-[var(--color-text-secondary)]">
                💡 Workspace baru akan otomatis dibuatkan rekening dan kategori terstruktur sesuai tipenya.
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setCreateWsModalOpen(false)}
                  className="btn btn-secondary text-xs"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={creatingWs}
                  className="btn btn-primary text-xs"
                >
                  {creatingWs ? "Membuat..." : "Buat Workspace"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
