"use client";

import React, { useState, useEffect } from "react";
import { useWorkspace } from "@/context/workspace-context";
import { FINANCIAL_PERSONAS, FinancialPersona } from "@/lib/rag/personas";
import {
  Building2,
  TrendingUp,
  Scale,
  Briefcase,
  Search,
  BookOpen,
  Globe,
  Database,
  ExternalLink,
  Sparkles,
  RefreshCw,
  PlusCircle,
  FileText,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Library,
} from "lucide-react";

const PERSONA_ICONS: Record<FinancialPersona, any> = {
  INVESTMENT_BANKING: Building2,
  ASSET_MANAGEMENT: TrendingUp,
  AUDITOR: Scale,
  FINANCIAL_CONSULTANT: Briefcase,
};

export function FinancialRagHub() {
  const { activeWorkspace, activeWorkspaceId } = useWorkspace();

  const [selectedPersona, setSelectedPersona] = useState<FinancialPersona>("FINANCIAL_CONSULTANT");
  const [query, setQuery] = useState("");
  const [enableLiveSearch, setEnableLiveSearch] = useState(true);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Document library & crawling modal state
  const [showLibraryModal, setShowLibraryModal] = useState(false);
  const [documents, setDocuments] = useState<any[]>([]);
  const [libraryLoading, setLibraryLoading] = useState(false);
  const [crawlQuery, setCrawlQuery] = useState("");
  const [crawling, setCrawling] = useState(false);
  const [crawlMessage, setCrawlMessage] = useState<string | null>(null);

  const activePersonaConfig = FINANCIAL_PERSONAS[selectedPersona];

  const promptSuggestions = [
    {
      persona: "INVESTMENT_BANKING" as FinancialPersona,
      text: "Bagaimana cara menyusun valuasi DCF dan menghitung WACC dengan struktur modal optimal?",
    },
    {
      persona: "ASSET_MANAGEMENT" as FinancialPersona,
      text: "Bagaimana alokasi aset optimal berdasarkan Modern Portfolio Theory (Markowitz) untuk meminimalkan risiko?",
    },
    {
      persona: "AUDITOR" as FinancialPersona,
      text: "Bagaimana kepatuhan pengakuan pendapatan sesuai PSAK 72 / IFRS 15 dan indikasi anomali transaksi?",
    },
    {
      persona: "FINANCIAL_CONSULTANT" as FinancialPersona,
      text: "Bagaimana strategi mempercepat Cash Conversion Cycle (CCC) dan memperpanjang runway kas bisnis saya?",
    },
  ];

  const handleExecuteRag = async (overrideQuery?: string) => {
    const q = overrideQuery || query;
    if (!q.trim() || !activeWorkspaceId) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/workspaces/${activeWorkspaceId}/rag/query`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: q,
          persona: selectedPersona,
          enableLiveAcademicSearch: enableLiveSearch,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal memproses RAG");

      setResult(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchDocuments = async () => {
    if (!activeWorkspaceId) return;
    setLibraryLoading(true);
    try {
      const res = await fetch(`/api/workspaces/${activeWorkspaceId}/rag/documents`);
      const data = await res.json();
      if (res.ok) {
        setDocuments(data.documents || []);
      }
    } catch (err) {
      console.error("Failed to load documents:", err);
    } finally {
      setLibraryLoading(false);
    }
  };

  const handleCrawl = async () => {
    if (!crawlQuery.trim() || !activeWorkspaceId) return;
    setCrawling(true);
    setCrawlMessage(null);
    try {
      const res = await fetch(`/api/workspaces/${activeWorkspaceId}/rag/crawl`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: crawlQuery, source: "ALL", limit: 4 }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal crawling jurnal");

      setCrawlMessage(`✅ Berhasil meng-crawl & mengindeks ${data.ingestedCount} makalah ke Neon pgvector!`);
      setCrawlQuery("");
      await fetchDocuments();
    } catch (err: any) {
      setCrawlMessage(`❌ Error: ${err.message}`);
    } finally {
      setCrawling(false);
    }
  };

  useEffect(() => {
    if (showLibraryModal) {
      fetchDocuments();
    }
  }, [showLibraryModal, activeWorkspaceId]);

  return (
    <div className="space-y-6">
      {/* Persona Selection Header */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-sm font-bold text-[var(--color-navy)] uppercase tracking-wider">
              Pilih Persona Pakar Finansial
            </h2>
            <p className="text-xs text-[var(--color-text-secondary)]">
              Model berpikir disesuaikan dengan kerangka kerja akademis & standar institusional global.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowLibraryModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[var(--color-border)] bg-white hover:bg-[var(--color-surface)] text-xs font-semibold text-[var(--color-navy)] transition-colors shadow-sm"
          >
            <Library className="w-3.5 h-3.5 text-[var(--color-primary)]" />
            Basis Data Jurnal (Neon Vector)
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {(Object.keys(FINANCIAL_PERSONAS) as FinancialPersona[]).map((key) => {
            const persona = FINANCIAL_PERSONAS[key];
            const Icon = PERSONA_ICONS[key];
            const isSelected = selectedPersona === key;

            return (
              <div
                key={key}
                onClick={() => setSelectedPersona(key)}
                className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                  isSelected
                    ? "border-[var(--color-primary)] bg-[rgba(24,122,186,0.04)] shadow-sm ring-1 ring-[var(--color-primary)]"
                    : "border-[var(--color-border)] bg-white hover:border-[var(--color-primary-light)]"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div
                    className={`p-2 rounded-lg ${
                      isSelected
                        ? "bg-[var(--color-primary)] text-white"
                        : "bg-[var(--color-surface)] text-[var(--color-navy)]"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[var(--color-surface)] text-[var(--color-text-secondary)] border border-[var(--color-border)]">
                    {persona.badge}
                  </span>
                </div>
                <h3 className="text-xs font-bold text-[var(--color-navy)] mb-1">
                  {persona.title}
                </h3>
                <p className="text-[11px] text-[var(--color-text-secondary)] line-clamp-2 leading-relaxed">
                  {persona.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Query Input Section */}
      <div className="bg-white rounded-xl border border-[var(--color-border)] p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[var(--color-primary)]" />
            <h3 className="text-xs font-bold text-[var(--color-navy)]">
              Konsultasikan Masalah Keuangan Anda
            </h3>
          </div>

          <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-[var(--color-navy)]">
            <input
              type="checkbox"
              checked={enableLiveSearch}
              onChange={(e) => setEnableLiveSearch(e.target.checked)}
              className="rounded border-[var(--color-border)] text-[var(--color-primary)] focus:ring-[var(--color-primary)]"
            />
            <span className="flex items-center gap-1 text-[11px]">
              <Globe className="w-3.5 h-3.5 text-[var(--color-primary)]" />
              Live Academic Search (arXiv + OpenAlex + SINTA)
            </span>
          </label>
        </div>

        <div className="space-y-2">
          <textarea
            rows={3}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={`Tanyakan analisis finansial tingkat tinggi... (Contoh: "Bagaimana cara menghitung valuasi DCF untuk bisnis saya di workspace ${activeWorkspace?.name || 'ini'}?")`}
            className="w-full text-xs p-3 rounded-lg border border-[var(--color-border)] focus:outline-none focus:border-[var(--color-primary)] resize-none"
          />

          {/* Quick Suggestions */}
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            <span className="text-[10px] font-semibold text-[var(--color-text-secondary)] uppercase">
              Rekomendasi Topik:
            </span>
            {promptSuggestions.map((item, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setSelectedPersona(item.persona);
                  setQuery(item.text);
                }}
                className="text-[11px] px-2.5 py-1 rounded-md bg-[var(--color-surface)] border border-[var(--color-border)] hover:bg-white text-[var(--color-navy)] transition-colors text-left"
              >
                {item.text.slice(0, 48)}...
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div className="p-3 bg-red-50 text-red-700 text-xs rounded-lg flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="flex items-center justify-between pt-2 border-t border-[var(--color-border)]">
          <div className="flex items-center gap-2 text-[11px] text-[var(--color-text-secondary)]">
            <Database className="w-3.5 h-3.5 text-[var(--color-primary)]" />
            <span>Terhubung ke Neon pgvector + Konteks Workspace Live</span>
          </div>

          <button
            type="button"
            disabled={loading || !query.trim()}
            onClick={() => handleExecuteRag()}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] text-white text-xs font-semibold shadow-sm transition-all disabled:opacity-50"
          >
            {loading ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Menjalankan RAG & Analisis Riset...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5" />
                <span>Analisis dengan {activePersonaConfig.title.split("&")[0]}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Result Display */}
      {result && (
        <div className="space-y-4 animate-in fade-in duration-300">
          {/* Main Answer Card */}
          <div className="bg-white rounded-xl border border-[var(--color-border)] p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-[var(--color-border)] pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-[rgba(24,122,186,0.1)] text-[var(--color-primary)]">
                  {React.createElement(PERSONA_ICONS[selectedPersona], { className: "w-4 h-4" })}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[var(--color-navy)]">
                    {result.persona.title}
                  </h3>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-[var(--color-surface)] text-[var(--color-primary)]">
                    {result.persona.badge}
                  </span>
                </div>
              </div>

              {result.workspaceStatsApplied && (
                <div className="flex items-center gap-1.5 text-[11px] text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Konteks Saldo & Arus Kas Workspace Diintegrasikan</span>
                </div>
              )}
            </div>

            <div className="prose prose-sm max-w-none text-xs text-[var(--color-text)] leading-relaxed whitespace-pre-line">
              {result.answer}
            </div>
          </div>

          {/* Academic Citations Panel */}
          {result.citations && result.citations.length > 0 && (
            <div className="bg-white rounded-xl border border-[var(--color-border)] p-5 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-[var(--color-primary)]" />
                  <h4 className="text-xs font-bold text-[var(--color-navy)] uppercase tracking-wider">
                    Daftar Rujukan Jurnal Ilmiah & Regulasi Terverifikasi ({result.citations.length})
                  </h4>
                </div>
                <span className="text-[10px] text-[var(--color-text-secondary)]">
                  Disimpan & Diverifikasi via Neon pgvector
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                {result.citations.map((cite: any, i: number) => (
                  <div
                    key={i}
                    className="p-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] hover:bg-white transition-colors space-y-1.5"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-blue-100 text-blue-800">
                        {cite.sourceType}
                      </span>
                      <span className="text-[10px] text-[var(--color-text-secondary)] font-mono">
                        {cite.year}
                      </span>
                    </div>

                    <h5 className="text-xs font-bold text-[var(--color-navy)] leading-snug">
                      {cite.title}
                    </h5>

                    <p className="text-[11px] text-[var(--color-text-secondary)] italic">
                      {cite.authors} &bull; {cite.journal}
                    </p>

                    {cite.url && (
                      <a
                        href={cite.url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-[11px] font-medium text-[var(--color-primary)] hover:underline pt-1"
                      >
                        <span>Lihat Dokumen Asli</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modal: Knowledge Base Library & Live Crawler */}
      {showLibraryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl border border-[var(--color-border)] shadow-2xl max-w-2xl w-full max-h-[85vh] flex flex-col overflow-hidden">
            <div className="p-5 border-b border-[var(--color-border)] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Library className="w-5 h-5 text-[var(--color-primary)]" />
                <div>
                  <h3 className="text-sm font-bold text-[var(--color-navy)]">
                    Basis Data Jurnal & Makalah Ilmiah (Neon Vector)
                  </h3>
                  <p className="text-xs text-[var(--color-text-secondary)]">
                    Koleksi jurnal kuantitatif arXiv, OpenAlex, dan Standar Akuntansi Nasional PSAK.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowLibraryModal(false)}
                className="text-xs text-[var(--color-text-secondary)] hover:text-[var(--color-navy)] font-bold px-2 py-1"
              >
                Tutup ✕
              </button>
            </div>

            {/* Crawl New Topic Section */}
            <div className="p-5 border-b border-[var(--color-border)] bg-[var(--color-surface)] space-y-3">
              <h4 className="text-xs font-bold text-[var(--color-navy)] flex items-center gap-1.5">
                <Globe className="w-4 h-4 text-[var(--color-primary)]" />
                Crawl & Tambahkan Jurnal Baru Otomatis dari Internet
              </h4>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={crawlQuery}
                  onChange={(e) => setCrawlQuery(e.target.value)}
                  placeholder="Ketik topik ilmiah... (contoh: 'portfolio optimization', 'DCF valuation', 'PSAK 71')"
                  className="flex-1 text-xs p-2.5 rounded-lg border border-[var(--color-border)] bg-white focus:outline-none focus:border-[var(--color-primary)]"
                />
                <button
                  type="button"
                  disabled={crawling || !crawlQuery.trim()}
                  onClick={handleCrawl}
                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] text-white text-xs font-semibold disabled:opacity-50"
                >
                  {crawling ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Search className="w-3.5 h-3.5" />
                  )}
                  <span>Crawl & Simpan</span>
                </button>
              </div>

              {crawlMessage && (
                <p className="text-xs text-[var(--color-navy)] font-medium bg-white p-2.5 rounded border border-[var(--color-border)]">
                  {crawlMessage}
                </p>
              )}
            </div>

            {/* Document List */}
            <div className="p-5 overflow-y-auto flex-1 space-y-3">
              <h4 className="text-xs font-bold text-[var(--color-navy)] uppercase tracking-wider">
                Dokumen Tersimpan di Neon PostgreSQL ({documents.length})
              </h4>

              {libraryLoading ? (
                <div className="py-8 text-center text-xs text-[var(--color-text-secondary)]">
                  <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-[var(--color-primary)]" />
                  <span>Memuat repositori jurnal...</span>
                </div>
              ) : documents.length === 0 ? (
                <div className="py-8 text-center text-xs text-[var(--color-text-secondary)] border border-dashed rounded-lg">
                  Belum ada dokumen tersimpan. Gunakan fitur crawling di atas untuk menambahkan jurnal pertama Anda.
                </div>
              ) : (
                <div className="space-y-2.5">
                  {documents.map((doc) => (
                    <div
                      key={doc.id}
                      className="p-3 rounded-xl border border-[var(--color-border)] bg-white hover:border-[var(--color-primary)] transition-all space-y-1.5"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[var(--color-surface)] text-[var(--color-navy)]">
                          {doc.category}
                        </span>
                        <span className="text-[10px] text-[var(--color-text-secondary)]">
                          {doc.chunksCount} Vector Chunks (pgvector)
                        </span>
                      </div>

                      <h5 className="text-xs font-bold text-[var(--color-navy)]">
                        {doc.title}
                      </h5>

                      <p className="text-[11px] text-[var(--color-text-secondary)]">
                        Penulis: {doc.authors || "Pakar Keuangan"} &bull; {doc.journal} ({doc.year})
                      </p>

                      {doc.abstract && (
                        <p className="text-[11px] text-[var(--color-text-secondary)] line-clamp-2 italic bg-[var(--color-surface)] p-2 rounded">
                          &ldquo;{doc.abstract}&rdquo;
                        </p>
                      )}

                      {doc.url && (
                        <a
                          href={doc.url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-[11px] text-[var(--color-primary)] font-medium hover:underline pt-0.5"
                        >
                          <span>Buka Tautan Jurnal</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
