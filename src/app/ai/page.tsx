"use client";

import React, { useState, useEffect, useRef } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { WorkspaceProvider, useWorkspace } from "@/context/workspace-context";
import { formatRupiah } from "@/lib/serialize";
import {
  Sparkles,
  Camera,
  PieChart,
  MessageSquare,
  Send,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  TrendingDown,
  TrendingUp,
  Layers,
  Upload,
  RefreshCw,
  Wallet,
  Tag,
  ArrowRightLeft,
  Bot,
  User,
} from "lucide-react";

type ActiveTab = "nlp" | "planner" | "chat";

function AiPageContent() {
  const { activeWorkspace, activeWorkspaceId, refreshWorkspaces } = useWorkspace();
  const [activeTab, setActiveTab] = useState<ActiveTab>("nlp");

  // Tab 1: NLP State
  const [nlpText, setNlpText] = useState("");
  const [nlpLoading, setNlpLoading] = useState(false);
  const [nlpResult, setNlpResult] = useState<any | null>(null);
  const [nlpSaveSuccess, setNlpSaveSuccess] = useState(false);
  const [nlpError, setNlpError] = useState<string | null>(null);

  // Tab 1: Vision State
  const [receiptBase64, setReceiptBase64] = useState<string | null>(null);
  const [receiptMimeType, setReceiptMimeType] = useState("image/jpeg");
  const [visionLoading, setVisionLoading] = useState(false);
  const [visionResult, setVisionResult] = useState<any | null>(null);
  const [visionSaveSuccess, setVisionSaveSuccess] = useState(false);
  const [visionError, setVisionError] = useState<string | null>(null);

  // Tab 2: 50/30/20 Planner State
  const [customIncome, setCustomIncome] = useState<string>("");
  const [plannerLoading, setPlannerLoading] = useState(false);
  const [planData, setPlanData] = useState<any | null>(null);

  // Tab 3: Chat State
  const [messages, setMessages] = useState<Array<{ role: "user" | "assistant"; content: string }>>([
    {
      role: "assistant",
      content:
        "Halo! Saya NexaAI, asisten perencanaan finansial profesional Anda. Saya memiliki akses ke data arus kas, saldo rekening, dan pagu anggaran di workspace ini. Apa yang ingin Anda konsultasikan hari ini?",
    },
  ]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // 1. Process NLP Input
  const handleProcessNLP = async (textToProcess?: string) => {
    const text = textToProcess || nlpText;
    if (!text.trim() || !activeWorkspaceId) return;

    setNlpLoading(true);
    setNlpError(null);
    setNlpResult(null);
    setNlpSaveSuccess(false);

    try {
      const res = await fetch(`/api/workspaces/${activeWorkspaceId}/ai/nlp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal memproses kalimat");
      setNlpResult(data.parsed);
    } catch (err: any) {
      setNlpError(err.message);
    } finally {
      setNlpLoading(false);
    }
  };

  // Save parsed NLP transaction to database
  const handleSaveNlpTransaction = async () => {
    if (!nlpResult || !activeWorkspaceId) return;
    setNlpLoading(true);
    setNlpError(null);

    try {
      const payload: any = {
        type: nlpResult.type,
        accountId: nlpResult.accountId,
        amount: nlpResult.amount,
        description: nlpResult.description,
        categoryId: nlpResult.categoryId || null,
        toAccountId: nlpResult.toAccountId || null,
      };

      const res = await fetch(`/api/workspaces/${activeWorkspaceId}/transactions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal menyimpan transaksi");

      setNlpSaveSuccess(true);
      setNlpText("");
      await refreshWorkspaces();
    } catch (err: any) {
      setNlpError(err.message);
    } finally {
      setNlpLoading(false);
    }
  };

  // 2. Handle Receipt Image Upload & Vision Scan
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setReceiptMimeType(file.type || "image/jpeg");
    const reader = new FileReader();
    reader.onloadend = () => {
      setReceiptBase64(reader.result as string);
      setVisionResult(null);
      setVisionSaveSuccess(false);
      setVisionError(null);
    };
    reader.readAsDataURL(file);
  };

  const handleScanReceipt = async () => {
    if (!receiptBase64 || !activeWorkspaceId) return;
    setVisionLoading(true);
    setVisionError(null);
    setVisionResult(null);

    try {
      const res = await fetch(`/api/workspaces/${activeWorkspaceId}/ai/receipt`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageBase64: receiptBase64,
          mimeType: receiptMimeType,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal membaca struk");
      setVisionResult(data.receipt);
    } catch (err: any) {
      setVisionError(err.message);
    } finally {
      setVisionLoading(false);
    }
  };

  const handleSaveReceiptTransaction = async () => {
    if (!visionResult || !activeWorkspaceId) return;
    setVisionLoading(true);
    setVisionError(null);

    try {
      // Fetch default account
      const accRes = await fetch(`/api/workspaces/${activeWorkspaceId}/accounts`);
      const accData = await accRes.json();
      const defaultAccount = accData.accounts?.[0];

      if (!defaultAccount) throw new Error("Tidak ada rekening aktif di workspace ini");

      const res = await fetch(`/api/workspaces/${activeWorkspaceId}/transactions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "EXPENSE",
          accountId: defaultAccount.id,
          amount: visionResult.totalAmount,
          description: `Struk: ${visionResult.merchantName}`,
          categoryId: visionResult.suggestedCategoryId || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal mencatat transaksi struk");

      setVisionSaveSuccess(true);
      await refreshWorkspaces();
    } catch (err: any) {
      setVisionError(err.message);
    } finally {
      setVisionLoading(false);
    }
  };

  // 3. Load 50/30/20 Plan
  const fetchPlanner = async (incomeOverride?: number) => {
    if (!activeWorkspaceId) return;
    setPlannerLoading(true);
    try {
      const res = await fetch(`/api/workspaces/${activeWorkspaceId}/ai/planner`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ monthlyIncome: incomeOverride }),
      });
      const data = await res.json();
      if (res.ok) setPlanData(data.plan);
    } catch (e) {
      console.error("Failed to load 50/30/20 planner", e);
    } finally {
      setPlannerLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "planner" && !planData) {
      fetchPlanner();
    }
  }, [activeTab, activeWorkspaceId]);

  // 4. Handle Chat
  const handleSendChat = async (presetPrompt?: string) => {
    const textToSend = presetPrompt || chatInput;
    if (!textToSend.trim() || !activeWorkspaceId) return;

    const newMessages = [...messages, { role: "user" as const, content: textToSend }];
    setMessages(newMessages);
    setChatInput("");
    setChatLoading(true);

    try {
      const res = await fetch(`/api/workspaces/${activeWorkspaceId}/ai/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newMessages }),
      });
      const data = await res.json();
      if (res.ok && data.reply) {
        setMessages([...newMessages, { role: "assistant", content: data.reply }]);
      } else {
        setMessages([
          ...newMessages,
          { role: "assistant", content: "Maaf, terjadi kendala saat memproses jawaban." },
        ]);
      }
    } catch {
      setMessages([
        ...newMessages,
        { role: "assistant", content: "Gagal menghubungi asisten AI." },
      ]);
    } finally {
      setChatLoading(false);
      setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    }
  };

  const nlpExamples = [
    "Makan siang soto ayam 35rb pake cash",
    "Beli token listrik PLN 250rb dari rekening BCA",
    "Terima transfer freelance 4.5 juta ke rekening BCA",
    "Transfer 300rb dari BCA ke dompet tunai",
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-[var(--color-navy)] font-heading">
              Asisten Finansial Cerdas (AI)
            </h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-[rgba(24,122,186,0.1)] text-[var(--color-primary)]">
              Dual Engine Groq & Gemini
            </span>
          </div>
          <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">
            Pencatatan natural language instan, pemindaian struk visi, dan kalkulator alokasi 50/30/20 di{" "}
            <span className="font-semibold text-[var(--color-navy)]">
              {activeWorkspace?.name}
            </span>
          </p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-[var(--color-border)] pb-3">
        <button
          type="button"
          onClick={() => setActiveTab("nlp")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
            activeTab === "nlp"
              ? "bg-[var(--color-navy)] text-white shadow-sm"
              : "bg-[#ffffff] text-[var(--color-text-secondary)] hover:text-[var(--color-navy)] border border-[var(--color-border)]"
          }`}
        >
          <Sparkles size={14} className={activeTab === "nlp" ? "text-white" : "text-[var(--color-primary)]"} />
          <span>Smart Input & Scan Struk</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("planner")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
            activeTab === "planner"
              ? "bg-[var(--color-navy)] text-white shadow-sm"
              : "bg-[#ffffff] text-[var(--color-text-secondary)] hover:text-[var(--color-navy)] border border-[var(--color-border)]"
          }`}
        >
          <PieChart size={14} className={activeTab === "planner" ? "text-white" : "text-[var(--color-primary)]"} />
          <span>Planner 50/30/20</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("chat")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
            activeTab === "chat"
              ? "bg-[var(--color-navy)] text-white shadow-sm"
              : "bg-[#ffffff] text-[var(--color-text-secondary)] hover:text-[var(--color-navy)] border border-[var(--color-border)]"
          }`}
        >
          <MessageSquare size={14} className={activeTab === "chat" ? "text-white" : "text-[var(--color-primary)]"} />
          <span>Tanya NexaAI (Chat)</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: NLP & VISION OCR */}
      {/* ========================================================================= */}
      {activeTab === "nlp" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Card 1: Natural Language Processing */}
          <div className="card p-6 bg-[#ffffff] space-y-4">
            <div className="flex items-center gap-2 mb-1">
              <Sparkles size={18} className="text-[var(--color-primary)]" />
              <h2 className="font-bold text-base text-[var(--color-navy)] font-heading">
                Input Transaksi Kalimat Bebas (Groq NLP)
              </h2>
            </div>
            <p className="text-xs text-[var(--color-text-secondary)]">
              Ketik pengeluaran atau pemasukan dalam kalimat santai. AI akan mengekstrak nominal, rekening, dan kategorinya secara otomatis.
            </p>

            {nlpError && (
              <div className="p-3 bg-[rgba(198,34,52,0.08)] border border-[rgba(198,34,52,0.2)] rounded-lg text-xs text-[var(--color-accent-red)] flex items-center gap-2">
                <AlertCircle size={15} />
                <span>{nlpError}</span>
              </div>
            )}

            {nlpSaveSuccess && (
              <div className="p-3 bg-[rgba(39,174,96,0.1)] border border-[rgba(39,174,96,0.2)] rounded-lg text-xs text-[#27ae60] flex items-center gap-2">
                <CheckCircle2 size={15} />
                <span>Transaksi berhasil disimpan ke database dan saldo rekening telah diperbarui!</span>
              </div>
            )}

            <div className="space-y-2">
              <textarea
                rows={3}
                placeholder="Contoh: Makan siang soto mie 35rb bayar pake uang tunai..."
                value={nlpText}
                onChange={(e) => setNlpText(e.target.value)}
                className="form-input text-xs"
              />

              {/* Quick Prompt Chips */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                {nlpExamples.map((ex, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => {
                      setNlpText(ex);
                      handleProcessNLP(ex);
                    }}
                    className="px-2.5 py-1 rounded bg-[#f5f5f5] hover:bg-[#eaeaea] text-[10px] text-[var(--color-navy)] transition-colors border border-[var(--color-border)]"
                  >
                    💡 {ex}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="button"
              disabled={nlpLoading || !nlpText.trim()}
              onClick={() => handleProcessNLP()}
              className="btn btn-primary text-xs w-full !py-2.5"
            >
              {nlpLoading ? (
                <>
                  <RefreshCw size={14} className="animate-spin" />
                  <span>Memproses dengan AI...</span>
                </>
              ) : (
                <>
                  <Sparkles size={14} />
                  <span>Ekstrak Entitas Transaksi</span>
                </>
              )}
            </button>

            {/* NLP Result Card */}
            {nlpResult && (
              <div className="p-4 rounded-xl border border-[var(--color-primary)] bg-[rgba(24,122,186,0.03)] space-y-3 animate-in fade-in duration-150">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-[var(--color-navy)]">Hasil Parsing AI</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[var(--color-primary)]/10 text-[var(--color-primary)]">
                    Confidence: {Math.round(nlpResult.confidence * 100)}%
                  </span>
                </div>

                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-[var(--color-text-secondary)]">Jenis:</span>
                    <span className="font-bold text-[var(--color-navy)]">{nlpResult.type}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--color-text-secondary)]">Nominal:</span>
                    <span className="font-bold text-[var(--color-navy)] font-mono">
                      {formatRupiah(nlpResult.amount)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--color-text-secondary)]">Keterangan:</span>
                    <span className="font-bold text-[var(--color-navy)]">{nlpResult.description}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--color-text-secondary)]">Rekening:</span>
                    <span className="font-semibold text-[var(--color-navy)]">
                      {nlpResult.accountName || "Rekening Utama"}
                    </span>
                  </div>
                  {nlpResult.categoryName && (
                    <div className="flex justify-between">
                      <span className="text-[var(--color-text-secondary)]">Kategori:</span>
                      <span className="font-semibold text-[var(--color-navy)]">
                        {nlpResult.categoryName}
                      </span>
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={handleSaveNlpTransaction}
                  disabled={nlpLoading}
                  className="btn btn-primary text-xs w-full !py-2 bg-[#27ae60] hover:bg-[#219653]"
                >
                  <CheckCircle2 size={14} />
                  <span>Konfirmasi & Simpan Transaksi</span>
                </button>
              </div>
            )}
          </div>

          {/* Card 2: Vision OCR Struk */}
          <div className="card p-6 bg-[#ffffff] space-y-4">
            <div className="flex items-center gap-2 mb-1">
              <Camera size={18} className="text-[var(--color-primary)]" />
              <h2 className="font-bold text-base text-[var(--color-navy)] font-heading">
                Pemindai Struk Belanja (Gemini Vision)
              </h2>
            </div>
            <p className="text-xs text-[var(--color-text-secondary)]">
              Unggah foto struk belanja minimarket, kwitansi, atau tiket belanja. Gemini 2.0 Flash akan mengekstrak total nominal belanja dan nama toko.
            </p>

            {visionError && (
              <div className="p-3 bg-[rgba(198,34,52,0.08)] border border-[rgba(198,34,52,0.2)] rounded-lg text-xs text-[var(--color-accent-red)] flex items-center gap-2">
                <AlertCircle size={15} />
                <span>{visionError}</span>
              </div>
            )}

            {visionSaveSuccess && (
              <div className="p-3 bg-[rgba(39,174,96,0.1)] border border-[rgba(39,174,96,0.2)] rounded-lg text-xs text-[#27ae60] flex items-center gap-2">
                <CheckCircle2 size={15} />
                <span>Transaksi struk belanja berhasil dicatat!</span>
              </div>
            )}

            <div className="border-2 border-dashed border-[var(--color-border)] rounded-xl p-6 text-center hover:bg-[#fafafa] transition-colors relative">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
              <Upload size={28} className="mx-auto text-[var(--color-text-secondary)] mb-2" />
              <div className="text-xs font-bold text-[var(--color-navy)]">
                Pilih atau Tarik Foto Struk ke Sini
              </div>
              <p className="text-[10px] text-[var(--color-text-secondary)] mt-1">
                Format PNG, JPG, atau JPEG (Maks. 5MB)
              </p>
            </div>

            {receiptBase64 && (
              <div className="flex items-center gap-3 p-2 border border-[var(--color-border)] rounded-lg">
                <img
                  src={receiptBase64}
                  alt="Preview Struk"
                  className="w-14 h-14 object-cover rounded-md border"
                />
                <div className="flex-1 text-xs">
                  <div className="font-bold text-[var(--color-navy)]">Foto Struk Terpilih</div>
                  <div className="text-[10px] text-[var(--color-text-secondary)]">Siap dianalisis oleh Gemini Vision</div>
                </div>
                <button
                  type="button"
                  onClick={handleScanReceipt}
                  disabled={visionLoading}
                  className="btn btn-primary text-xs !py-2 !px-3"
                >
                  {visionLoading ? "Memindai..." : "Scan Struk"}
                </button>
              </div>
            )}

            {/* Vision Result Card */}
            {visionResult && (
              <div className="p-4 rounded-xl border border-[var(--color-primary)] bg-[rgba(24,122,186,0.03)] space-y-3 animate-in fade-in duration-150">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-[var(--color-navy)]">Hasil OCR Vision</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[var(--color-primary)]/10 text-[var(--color-primary)]">
                    Confidence: {Math.round(visionResult.confidence * 100)}%
                  </span>
                </div>

                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-[var(--color-text-secondary)]">Merchant/Toko:</span>
                    <span className="font-bold text-[var(--color-navy)]">{visionResult.merchantName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--color-text-secondary)]">Total Belanja:</span>
                    <span className="font-bold text-[var(--color-navy)] font-mono">
                      {formatRupiah(visionResult.totalAmount)}
                    </span>
                  </div>
                  {visionResult.suggestedCategoryName && (
                    <div className="flex justify-between">
                      <span className="text-[var(--color-text-secondary)]">Rekomendasi Kategori:</span>
                      <span className="font-semibold text-[var(--color-navy)]">
                        {visionResult.suggestedCategoryName}
                      </span>
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={handleSaveReceiptTransaction}
                  disabled={visionLoading}
                  className="btn btn-primary text-xs w-full !py-2 bg-[#27ae60] hover:bg-[#219653]"
                >
                  <CheckCircle2 size={14} />
                  <span>Simpan Transaksi Struk Ini</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: 50/30/20 FINANCIAL PLANNER */}
      {/* ========================================================================= */}
      {activeTab === "planner" && (
        <div className="space-y-6">
          <div className="card p-6 bg-[#ffffff]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="font-bold text-base text-[var(--color-navy)] font-heading">
                  Rencana Alokasi Finansial 50/30/20
                </h2>
                <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">
                  Prinsip emas alokasi arus kas: 50% Kebutuhan Pokok, 30% Keinginan, dan 20% Tabungan/Investasi.
                </p>
              </div>

              {/* Custom Income Simulation */}
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  placeholder="Simulasi Pemasukan (Rp)..."
                  value={customIncome}
                  onChange={(e) => setCustomIncome(e.target.value)}
                  className="form-input text-xs w-48"
                />
                <button
                  type="button"
                  onClick={() => fetchPlanner(customIncome ? parseInt(customIncome, 10) : undefined)}
                  className="btn btn-secondary text-xs !py-2 !px-3"
                >
                  <span>Simulasi</span>
                </button>
              </div>
            </div>

            {plannerLoading || !planData ? (
              <div className="py-16 text-center text-xs text-[var(--color-text-secondary)] animate-pulse">
                Menghitung analisis 50/30/20...
              </div>
            ) : (
              <div className="space-y-6">
                {/* 3 Pillar Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  {/* Needs 50% */}
                  <div className="card p-5 bg-[#ffffff] border-t-4 border-t-[var(--color-primary)] flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between text-xs mb-2">
                        <span className="font-bold text-[var(--color-navy)]">50% Kebutuhan Pokok (Needs)</span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                            planData.needs.status === "HEALTHY"
                              ? "bg-[rgba(39,174,96,0.1)] text-[#27ae60]"
                              : "bg-[rgba(198,34,52,0.1)] text-[var(--color-accent-red)]"
                          }`}
                        >
                          {planData.needs.status === "HEALTHY" ? "Sesuai Target" : "Melebihi Batas"}
                        </span>
                      </div>
                      <div className="text-2xl font-extrabold text-[var(--color-navy)] font-heading">
                        {planData.needs.actualPercentage}%
                      </div>
                      <div className="w-full bg-[#f0f0f0] rounded-full h-2 my-2 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-[var(--color-primary)] transition-all"
                          style={{ width: `${Math.min(100, planData.needs.actualPercentage)}%` }}
                        />
                      </div>
                    </div>
                    <div className="text-xs text-[var(--color-text-secondary)] pt-2 border-t border-[var(--color-border)] mt-2 flex justify-between">
                      <span>Realisasi: {formatRupiah(planData.needs.actualAmount)}</span>
                      <span>Target: {formatRupiah(planData.needs.targetAmount)}</span>
                    </div>
                  </div>

                  {/* Wants 30% */}
                  <div className="card p-5 bg-[#ffffff] border-t-4 border-t-[#e67e22] flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between text-xs mb-2">
                        <span className="font-bold text-[var(--color-navy)]">30% Keinginan (Wants)</span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                            planData.wants.status === "HEALTHY"
                              ? "bg-[rgba(39,174,96,0.1)] text-[#27ae60]"
                              : "bg-[rgba(198,34,52,0.1)] text-[var(--color-accent-red)]"
                          }`}
                        >
                          {planData.wants.status === "HEALTHY" ? "Sesuai Target" : "Melebihi Batas"}
                        </span>
                      </div>
                      <div className="text-2xl font-extrabold text-[var(--color-navy)] font-heading">
                        {planData.wants.actualPercentage}%
                      </div>
                      <div className="w-full bg-[#f0f0f0] rounded-full h-2 my-2 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-[#e67e22] transition-all"
                          style={{ width: `${Math.min(100, planData.wants.actualPercentage)}%` }}
                        />
                      </div>
                    </div>
                    <div className="text-xs text-[var(--color-text-secondary)] pt-2 border-t border-[var(--color-border)] mt-2 flex justify-between">
                      <span>Realisasi: {formatRupiah(planData.wants.actualAmount)}</span>
                      <span>Target: {formatRupiah(planData.wants.targetAmount)}</span>
                    </div>
                  </div>

                  {/* Savings 20% */}
                  <div className="card p-5 bg-[#ffffff] border-t-4 border-t-[#27ae60] flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between text-xs mb-2">
                        <span className="font-bold text-[var(--color-navy)]">20% Tabungan (Savings)</span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                            planData.savings.status === "ON_TRACK"
                              ? "bg-[rgba(39,174,96,0.1)] text-[#27ae60]"
                              : "bg-[rgba(230,126,34,0.1)] text-[#e67e22]"
                          }`}
                        >
                          {planData.savings.status === "ON_TRACK" ? "Target Tercapai" : "Perlu Ditingkatkan"}
                        </span>
                      </div>
                      <div className="text-2xl font-extrabold text-[#27ae60] font-heading">
                        {planData.savings.actualPercentage}%
                      </div>
                      <div className="w-full bg-[#f0f0f0] rounded-full h-2 my-2 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-[#27ae60] transition-all"
                          style={{ width: `${Math.min(100, planData.savings.actualPercentage)}%` }}
                        />
                      </div>
                    </div>
                    <div className="text-xs text-[var(--color-text-secondary)] pt-2 border-t border-[var(--color-border)] mt-2 flex justify-between">
                      <span>Realisasi: {formatRupiah(planData.savings.actualAmount)}</span>
                      <span>Target: {formatRupiah(planData.savings.targetAmount)}</span>
                    </div>
                  </div>
                </div>

                {/* AI Actionable Recommendations */}
                <div className="card p-5 bg-[#fafafa] border border-[var(--color-border)] space-y-2">
                  <div className="font-bold text-xs text-[var(--color-navy)] flex items-center gap-2">
                    <Sparkles size={14} className="text-[var(--color-primary)]" />
                    <span>Rekomendasi Perbaikan Arus Kas oleh Gemini AI:</span>
                  </div>
                  <div className="space-y-1.5 text-xs text-[var(--color-text-secondary)]">
                    {planData.aiRecommendations.map((rec: string, idx: number) => (
                      <div key={idx} className="flex items-start gap-2">
                        <span className="text-[var(--color-primary)] font-bold">•</span>
                        <span>{rec}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: AI ADVISOR CHATBOT */}
      {/* ========================================================================= */}
      {activeTab === "chat" && (
        <div className="card bg-[#ffffff] flex flex-col h-[600px] overflow-hidden">
          {/* Chat Header */}
          <div className="p-4 border-b border-[var(--color-border)] flex items-center justify-between bg-[#fafafa]">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[var(--color-primary)] text-white flex items-center justify-center font-bold">
                <Bot size={18} />
              </div>
              <div>
                <h3 className="font-bold text-xs text-[var(--color-navy)]">
                  NexaAI Financial Consultant
                </h3>
                <span className="text-[10px] text-[#27ae60] font-medium flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#27ae60]" /> Konteks Workspace Terkoneksi
                </span>
              </div>
            </div>

            <div className="text-[11px] text-[var(--color-text-secondary)]">
              Model: Gemini 2.0 Flash
            </div>
          </div>

          {/* Chat Messages Body */}
          <div className="flex-1 p-4 overflow-y-auto space-y-4 text-xs">
            {messages.map((m, idx) => (
              <div
                key={idx}
                className={`flex gap-3 ${m.role === "user" ? "justify-end" : "justify-start"}`}
              >
                {m.role === "assistant" && (
                  <div className="w-7 h-7 rounded-lg bg-[var(--color-primary)] text-white flex items-center justify-center shrink-0 mt-0.5">
                    <Bot size={15} />
                  </div>
                )}

                <div
                  className={`p-3.5 rounded-xl max-w-[80%] leading-relaxed ${
                    m.role === "user"
                      ? "bg-[var(--color-primary)] text-white font-medium"
                      : "bg-[#f5f5f5] text-[var(--color-navy)] border border-[var(--color-border)] whitespace-pre-wrap"
                  }`}
                >
                  {m.content}
                </div>

                {m.role === "user" && (
                  <div className="w-7 h-7 rounded-lg bg-[var(--color-navy)] text-white flex items-center justify-center shrink-0 mt-0.5">
                    <User size={15} />
                  </div>
                )}
              </div>
            ))}

            {chatLoading && (
              <div className="flex gap-3 justify-start">
                <div className="w-7 h-7 rounded-lg bg-[var(--color-primary)] text-white flex items-center justify-center shrink-0">
                  <Bot size={15} />
                </div>
                <div className="p-3 bg-[#f5f5f5] rounded-xl text-xs text-[var(--color-text-secondary)] animate-pulse">
                  NexaAI sedang menganalisis data finansial Anda...
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Chat Quick Prompts */}
          <div className="px-4 py-2 bg-[#fafafa] border-t border-[var(--color-border)] flex items-center gap-1.5 overflow-x-auto scrollbar-none text-[11px]">
            <span className="text-[var(--color-text-secondary)] font-semibold shrink-0">Tanya Cepat:</span>
            <button
              type="button"
              onClick={() => handleSendChat("Bagaimana kondisi arus kas saya bulan ini?")}
              className="px-2.5 py-1 rounded-full bg-white border border-[var(--color-border)] hover:bg-[#f0f0f0] whitespace-nowrap text-[var(--color-navy)]"
            >
              📊 Kondisi Arus Kas
            </button>
            <button
              type="button"
              onClick={() => handleSendChat("Apakah rasio 50/30/20 saya sudah sehat?")}
              className="px-2.5 py-1 rounded-full bg-white border border-[var(--color-border)] hover:bg-[#f0f0f0] whitespace-nowrap text-[var(--color-navy)]"
            >
              🎯 Rasio 50/30/20
            </button>
            <button
              type="button"
              onClick={() => handleSendChat("Tips memangkas pos belanja terbesar bulan ini")}
              className="px-2.5 py-1 rounded-full bg-white border border-[var(--color-border)] hover:bg-[#f0f0f0] whitespace-nowrap text-[var(--color-navy)]"
            >
              💡 Tips Hemat
            </button>
          </div>

          {/* Chat Input Bar */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendChat();
            }}
            className="p-3 border-t border-[var(--color-border)] flex items-center gap-2"
          >
            <input
              type="text"
              placeholder="Ketik pertanyaan finansial Anda kepada NexaAI..."
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              className="form-input text-xs flex-1 !py-2.5"
            />
            <button
              type="submit"
              disabled={chatLoading || !chatInput.trim()}
              className="btn btn-primary text-xs !py-2.5 !px-4 shrink-0"
            >
              <Send size={14} />
              <span className="hidden sm:inline">Kirim</span>
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

export default function AiPage() {
  return (
    <WorkspaceProvider>
      <AppShell>
        <AiPageContent />
      </AppShell>
    </WorkspaceProvider>
  );
}
