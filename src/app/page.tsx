import Link from "next/link";
import {
  ArrowRight,
  Shield,
  ShieldCheck,
  Check,
  Sparkles,
  Smartphone,
  Wallet,
  Receipt,
  Zap,
  Lock,
  Sliders,
  CheckCircle2,
  TrendingUp,
  MessageSquare,
  Building2,
  Play,
  Mail,
  User,
  MoreVertical,
  Send,
  PlusCircle,
  Clock,
  PieChart,
} from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#faf8ff] text-[#171b26] font-sans flex flex-col selection:bg-[#006948] selection:text-white">
      {/* ============================================================ */}
      {/* 1. STICKY TOPBAR / HEADER                                     */}
      {/* ============================================================ */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-[#faf8ff]/85 backdrop-blur-xl border-b border-[#e2e8f0]/80 shadow-[0_1px_8px_rgba(0,0,0,0.03)]">
        <div className="h-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="w-9 h-9 rounded-lg bg-[#006948] flex items-center justify-center text-white font-bold text-lg shadow-[0_2px_8px_rgba(0,105,72,0.25)] group-hover:scale-105 transition-transform">
                N
              </div>
              <span className="font-bold text-lg tracking-tight text-[#171b26]">
                Nexa<span className="text-[#006948]">Finance</span>
              </span>
            </Link>

            <nav className="hidden lg:flex items-center gap-7">
              <a href="#fitur" className="text-[#3d4a42] hover:text-[#006948] text-sm font-medium transition-colors">
                Fitur
              </a>
              <a href="#cara-kerja" className="text-[#3d4a42] hover:text-[#006948] text-sm font-medium transition-colors">
                Cara Kerja
              </a>
              <a href="#integrasi-whatsapp" className="text-[#3d4a42] hover:text-[#006948] text-sm font-medium transition-colors">
                Integrasi WhatsApp
              </a>
              <a href="#pagu-anggaran" className="text-[#3d4a42] hover:text-[#006948] text-sm font-medium transition-colors">
                Pagu Anggaran
              </a>
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="px-4 py-2 rounded-lg text-sm font-semibold text-[#171b26] hover:bg-[#f2f3ff] transition-colors"
            >
              Masuk
            </Link>
            <Link
              href="/login"
              className="px-4 py-2 rounded-lg bg-[#006948] hover:bg-[#00855d] text-white text-sm font-semibold shadow-[0_2px_6px_rgba(0,105,72,0.25)] transition-all flex items-center gap-1.5"
            >
              <span>Mulai Gratis</span>
              <ArrowRight size={15} />
            </Link>
          </div>
        </div>
      </header>

      {/* ============================================================ */}
      {/* MAIN CONTAINER                                               */}
      {/* ============================================================ */}
      <main className="w-full pt-16 bg-[#faf8ff] flex-1">
        {/* Ambient Top Glows */}
        <div className="relative w-full overflow-hidden">
          <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[720px] h-[360px] bg-[#006948]/10 rounded-full blur-[120px] pointer-events-none" />
          <div className="absolute top-48 right-10 w-[380px] h-[280px] bg-[#4b41e1]/10 rounded-full blur-[100px] pointer-events-none" />

          {/* ============================================================ */}
          {/* 2. HERO SECTION                                              */}
          {/* ============================================================ */}
          <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 md:pt-16 pb-16">
            <div className="flex flex-col items-center text-center max-w-4xl mx-auto">
              {/* Live Technology Pill */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#ebedfc] text-xs shadow-sm mb-6 border border-[#dfe2f1] hover:shadow transition-shadow">
                <span className="w-2 h-2 rounded-full bg-[#006948] animate-pulse" />
                <span className="text-[#171b26] font-semibold tracking-wide">
                  ⚡ AI Dual-Engine & WhatsApp 2-Arah
                </span>
                <span className="text-[#6d7a72]">•</span>
                <span className="text-[#006948] font-bold uppercase text-[11px] tracking-wider">
                  v3.4 Production
                </span>
              </div>

              {/* Headline */}
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-[#171b26] tracking-tight leading-[1.12] mb-5">
                Kelola Arus Kas Bisnis <br className="hidden sm:inline" />
                <span className="text-[#006948]">Tanpa Selisih Rupiah</span>
              </h1>

              {/* Subheadline */}
              <p className="text-base sm:text-lg text-[#3d4a42] max-w-2xl mb-8 leading-relaxed">
                Platform treasury cerdas untuk UMKM & Startup. Pantau arus kas multi-kanal real-time,
                kontrol pagu anggaran, dan catat transaksi instan cukup via WhatsApp.
              </p>

              {/* CTA Cluster */}
              <div className="flex flex-col sm:flex-row items-center gap-3.5 w-full sm:w-auto mb-8">
                <Link
                  href="/login"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3 rounded-lg bg-[#006948] hover:bg-[#00855d] text-white font-semibold text-sm shadow-[0_4px_12px_rgba(0,105,72,0.25)] transition-all"
                >
                  <span>Coba Gratis 14 Hari</span>
                  <ArrowRight size={17} />
                </Link>
                <Link
                  href="/login"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3 rounded-lg bg-white hover:bg-[#ebedfc] text-[#171b26] font-medium text-sm border border-[#dfe2f1] shadow-sm transition-all"
                >
                  <Play size={16} className="text-[#006948] fill-[#006948]" />
                  <span>Lihat Demo Interaktif</span>
                </Link>
              </div>

              {/* Trust Badges */}
              <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-2 text-[#3d4a42] text-xs">
                <div className="flex items-center gap-1.5 font-medium">
                  <CheckCircle2 size={16} className="text-[#006948]" />
                  <span>Dipercaya 1,200+ Pemilik Bisnis</span>
                </div>
                <div className="flex items-center gap-1.5 font-medium">
                  <Sliders size={16} className="text-[#4b41e1]" />
                  <span>Zero-drift BigInt Precision</span>
                </div>
                <div className="flex items-center gap-1.5 font-medium">
                  <Lock size={16} className="text-[#006948]" />
                  <span>Enkripsi 256-bit AES</span>
                </div>
              </div>
            </div>

            {/* ============================================================ */}
            {/* 3. HERO VISUAL PREVIEW: TREASURY DASHBOARD MOCKUP            */}
            {/* ============================================================ */}
            <div className="mt-12 relative max-w-5xl mx-auto">
              <div className="rounded-xl bg-white border border-[#e2e8f0] shadow-[0_12px_40px_rgba(0,0,0,0.06)] p-4 sm:p-7">
                {/* Mockup Topbar */}
                <div className="flex flex-wrap items-center justify-between pb-5 border-b border-[#f2f3ff] gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5">
                      <div className="w-3 h-3 rounded-full bg-[#ba1a1a]/40" />
                      <div className="w-3 h-3 rounded-full bg-[#d97706]/40" />
                      <div className="w-3 h-3 rounded-full bg-[#006948]/40" />
                    </div>
                    <div className="ml-2 pl-3 border-l border-[#dfe2f1] flex items-center gap-2">
                      <Building2 size={17} className="text-[#006948]" />
                      <span className="font-bold text-sm text-[#171b26]">Workspace Operasional</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#f2f3ff] text-[#006948] text-xs font-semibold">
                      <span className="w-2 h-2 rounded-full bg-[#006948] animate-ping" />
                      WhatsApp Sync Aktif
                    </span>
                    <span className="text-xs font-mono text-[#6d7a72] bg-[#f2f3ff] px-2.5 py-1 rounded">
                      IDR (Rp)
                    </span>
                  </div>
                </div>

                {/* Top Metric Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 my-5">
                  {/* Card 1: Total Treasury */}
                  <div className="p-4 rounded-lg bg-[#f2f3ff] border border-[#e5e7f6] flex flex-col justify-between">
                    <div className="flex items-center justify-between text-[#6d7a72] mb-1">
                      <span className="text-[11px] font-bold uppercase tracking-wider">Total Kas Terkonsolidasi</span>
                      <Wallet size={18} className="text-[#006948]" />
                    </div>
                    <div className="my-2">
                      <span className="text-2xl font-extrabold text-[#171b26] tabular-nums tracking-tight">
                        Rp 348.650.000
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-[#006948] text-xs font-semibold">
                      <TrendingUp size={14} />
                      <span>+12.4% vs bulan lalu</span>
                    </div>
                  </div>

                  {/* Card 2: Multi-Bank Active */}
                  <div className="p-4 rounded-lg bg-[#f2f3ff] border border-[#e5e7f6] flex flex-col justify-between">
                    <div className="flex items-center justify-between text-[#6d7a72] mb-1">
                      <span className="text-[11px] font-bold uppercase tracking-wider">Dompet Kas Operasional</span>
                      <Wallet size={18} className="text-[#4b41e1]" />
                    </div>
                    <div className="flex flex-col gap-1.5 my-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-[#171b26]">Kasir & POS (Cabang)</span>
                        <span className="font-bold text-[#171b26] tabular-nums">Rp 210.450.000</span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-[#171b26]">Settlement QRIS / E-Wallet</span>
                        <span className="font-bold text-[#171b26] tabular-nums">Rp 138.200.000</span>
                      </div>
                    </div>
                    <div className="text-[#6d7a72] text-[11px]">Sinkronisasi mutasi tiap 3 menit</div>
                  </div>

                  {/* Card 3: Pagu Anggaran Operasional */}
                  <div className="p-4 rounded-lg bg-[#f2f3ff] border border-[#e5e7f6] flex flex-col justify-between">
                    <div className="flex items-center justify-between text-[#6d7a72] mb-1">
                      <span className="text-[11px] font-bold uppercase tracking-wider">Pagu Anggaran Operasional</span>
                      <Shield size={18} className="text-[#00873c]" />
                    </div>
                    <div className="my-1">
                      <div className="flex justify-between items-baseline mb-1.5">
                        <span className="text-lg font-bold text-[#171b26] tabular-nums">Rp 42.150.000</span>
                        <span className="text-xs text-[#6d7a72]">/ Rp 60.000.000</span>
                      </div>
                      <div className="w-full bg-[#dfe2f1] h-2 rounded-full overflow-hidden">
                        <div className="bg-[#006948] h-full rounded-full transition-all" style={{ width: "70.25%" }} />
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[#006948] font-bold">Tersisa 29.75% (Aman)</span>
                      <span className="text-[#6d7a72]">Reset dlm 11 hari</span>
                    </div>
                  </div>
                </div>

                {/* Transaction Stream Mini Table */}
                <div className="rounded-lg bg-[#f2f3ff] p-3.5 border border-[#e5e7f6]">
                  <div className="flex items-center justify-between mb-2.5 px-1">
                    <span className="text-xs font-bold text-[#171b26] uppercase tracking-wider">
                      Workspace Nexa Creative Hub — Mutasi Terakhir
                    </span>
                    <Link href="/login" className="text-xs text-[#006948] font-semibold hover:underline">
                      Semua Mutasi →
                    </Link>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    {/* Row 1 */}
                    <div className="flex items-center justify-between p-2.5 bg-white rounded-md border border-[#e2e8f0]/60 text-xs">
                      <div className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded-full bg-[#006948]/10 flex items-center justify-center text-[#006948] shrink-0">
                          <MessageSquare size={14} />
                        </div>
                        <div>
                          <div className="font-semibold text-[#171b26]">Beli es batu 20rb bayar tunai</div>
                          <div className="text-[10px] text-[#6d7a72]">Kasir Cabang Senopati • WhatsApp Bot</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-[#ba1a1a] tabular-nums">- Rp 20.000</div>
                        <div className="text-[10px] text-[#006948] font-semibold">Tercatat Otomatis</div>
                      </div>
                    </div>

                    {/* Row 2 */}
                    <div className="flex items-center justify-between p-2.5 bg-white rounded-md border border-[#e2e8f0]/60 text-xs">
                      <div className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded-full bg-[#4b41e1]/10 flex items-center justify-center text-[#4b41e1] shrink-0">
                          <Receipt size={14} />
                        </div>
                        <div>
                          <div className="font-semibold text-[#171b26]">Restock Biji Kopi Arabika 15kg</div>
                          <div className="text-[10px] text-[#6d7a72]">PT Tani Roastery • OCR Nota Otomatis</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-[#ba1a1a] tabular-nums">- Rp 2.450.000</div>
                        <div className="text-[10px] text-[#6d7a72]">Kas Operasional</div>
                      </div>
                    </div>

                    {/* Row 3 */}
                    <div className="flex items-center justify-between p-2.5 bg-white rounded-md border border-[#e2e8f0]/60 text-xs">
                      <div className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded-full bg-[#00873c]/10 flex items-center justify-center text-[#00873c] shrink-0">
                          <Wallet size={14} />
                        </div>
                        <div>
                          <div className="font-semibold text-[#171b26]">Settlement QRIS EDC Statis Hari Ini</div>
                          <div className="text-[10px] text-[#6d7a72]">Rekonsiliasi QRIS Settlement POS</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-[#00873c] tabular-nums">+ Rp 8.840.000</div>
                        <div className="text-[10px] text-[#00873c] font-semibold">Tersinkron QRIS</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Floating WhatsApp Notification Card */}
              <div className="hidden sm:flex absolute -bottom-5 -right-4 md:-right-6 bg-white p-3.5 rounded-xl border border-[#e2e8f0] shadow-xl items-center gap-3.5 max-w-sm">
                <div className="w-10 h-10 rounded-full bg-[#25d366] flex items-center justify-center text-white shrink-0 shadow-sm">
                  <MessageSquare size={19} />
                </div>
                <div>
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className="text-xs font-bold text-[#171b26]">WhatsApp Bot</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-[#25d366]" />
                    <span className="text-[10px] text-[#6d7a72]">Baru Saja</span>
                  </div>
                  <p className="text-xs text-[#3d4a42] leading-tight">
                    “Kasir: Beli es batu 20rb tunai” <br />
                    <strong className="text-[#006948] font-semibold">→ Tercatat otomatis ke Ledger Operasional</strong>
                  </p>
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* ============================================================ */}
        {/* 4. PARTNER LOGO STRIP                                        */}
        {/* ============================================================ */}
        <section className="w-full bg-[#f2f3ff] py-10 border-y border-[#e5e7f6]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <p className="text-center text-[11px] font-bold uppercase text-[#6d7a72] tracking-widest mb-6">
              TERHUBUNG DENGAN PAYMENT GATEWAY, E-WALLET & SISTEM KASIR MODERN
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-3 items-center justify-items-center opacity-85 hover:opacity-100 transition-opacity">
              {["QRIS", "MIDTRANS", "XENDIT", "WHATSAPP", "GOPAY", "OVO", "SHOPEEPAY", "POS KASIR"].map(
                (brand) => (
                  <div
                    key={brand}
                    className="px-4 py-2.5 rounded-lg bg-white shadow-xs border border-[#e2e8f0] flex items-center justify-center w-28 h-11"
                  >
                    <span className={`text-xs font-extrabold tracking-tight ${brand === "QRIS" || brand === "WHATSAPP" ? "text-[#006948]" : "text-[#171b26]"}`}>
                      {brand}
                    </span>
                  </div>
                )
              )}
            </div>
          </div>
        </section>

        {/* ============================================================ */}
        {/* 5. CORE FEATURE PILLARS (3 FONDASI)                          */}
        {/* ============================================================ */}
        <section id="fitur" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 w-full">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <span className="text-xs uppercase text-[#006948] tracking-widest font-bold">
              Infrastruktur Treasury Modern
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#171b26] mt-2 mb-3 tracking-tight">
              Tiga Fondasi Kontrol Finansial Tanpa Kompromi
            </h2>
            <p className="text-sm sm:text-base text-[#3d4a42]">
              Otomasi pembukuan real-time, perlindungan cadangan kas, dan rekonsiliasi bebas stres yang dirancang sesuai alur kerja UMKM di Indonesia.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Pillar 1 */}
            <div className="p-6 rounded-xl bg-white border border-[#e2e8f0] shadow-sm hover:shadow-md transition-all flex flex-col justify-between group">
              <div>
                <div className="w-12 h-12 rounded-lg bg-[#006948]/10 flex items-center justify-center text-[#006948] mb-5 group-hover:bg-[#006948] group-hover:text-white transition-colors">
                  <Wallet size={24} />
                </div>
                <h3 className="font-bold text-lg text-[#171b26] mb-2">1. Multi-Kas & Dompet Bisnis</h3>
                <p className="text-sm text-[#3d4a42] leading-relaxed mb-6">
                  Pisahkan kas operasional toko, petty cash kasir, hingga e-wallet penjualan secara rapi. Kelola kas multi-kanal tanpa repot dan tanpa ketergantungan API perbankan.
                </p>
              </div>
              <div className="p-3.5 rounded-lg bg-[#f2f3ff] flex flex-col gap-1.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-[#171b26] font-semibold">Kas Operasional & Petty Cash</span>
                  <span className="text-[#006948] font-bold">Terpisah</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#171b26] font-semibold">E-Wallet & QRIS Toko</span>
                  <span className="text-[#4b41e1] font-bold">Tersinkron</span>
                </div>
              </div>
            </div>

            {/* Pillar 2 */}
            <div id="integrasi-whatsapp" className="p-6 rounded-xl bg-white border border-[#e2e8f0] shadow-sm hover:shadow-md transition-all flex flex-col justify-between group">
              <div>
                <div className="w-12 h-12 rounded-lg bg-[#4b41e1]/10 flex items-center justify-center text-[#4b41e1] mb-5 group-hover:bg-[#4b41e1] group-hover:text-white transition-colors">
                  <MessageSquare size={24} />
                </div>
                <h3 className="font-bold text-lg text-[#171b26] mb-2">2. Bot WhatsApp 2-Arah</h3>
                <p className="text-sm text-[#3d4a42] leading-relaxed mb-6">
                  Cukup chat via WhatsApp untuk rekap pengeluaran kas kecil, lampirkan foto struk nota, dan cek sisa saldo kas operasional dalam 2 detik tanpa perlu buka laptop.
                </p>
              </div>
              <div className="p-3.5 rounded-lg bg-[#f2f3ff] flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#00873c]" />
                  <span className="text-[#171b26] font-semibold">Workspace Nexa Creative Hub</span>
                </div>
                <span className="text-[#4b41e1] font-bold">OCR & NLP Aktif</span>
              </div>
            </div>

            {/* Pillar 3 */}
            <div id="pagu-anggaran" className="p-6 rounded-xl bg-white border border-[#e2e8f0] shadow-sm hover:shadow-md transition-all flex flex-col justify-between group">
              <div>
                <div className="w-12 h-12 rounded-lg bg-[#00873c]/10 flex items-center justify-center text-[#00873c] mb-5 group-hover:bg-[#00873c] group-hover:text-white transition-colors">
                  <Shield size={24} />
                </div>
                <h3 className="font-bold text-lg text-[#171b26] mb-2">3. Guardrail Pagu Anggaran</h3>
                <p className="text-sm text-[#3d4a42] leading-relaxed mb-6">
                  Sistem peringatan dini otomatis cegah overbudget sebelum kas tiris. Pasang batas pengeluaran kategori operasional dan terima notifikasi proaktif saat pagu menyentuh 80%.
                </p>
              </div>
              <div className="p-3.5 rounded-lg bg-[#f2f3ff] flex flex-col gap-1.5 text-xs">
                <div className="flex justify-between text-[11px] text-[#6d7a72]">
                  <span>Batas Operasional Toko</span>
                  <span className="text-[#00873c] font-bold">Aman (68%)</span>
                </div>
                <div className="w-full bg-[#dfe2f1] h-1.5 rounded-full overflow-hidden">
                  <div className="bg-[#00873c] h-full rounded-full" style={{ width: "68%" }} />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ============================================================ */}
        {/* 6. INTERACTIVE WHATSAPP BOT SHOWCASE                         */}
        {/* ============================================================ */}
        <section id="cara-kerja" className="w-full bg-[#f2f3ff] py-20 border-y border-[#e5e7f6]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              {/* Left Column: Feature Highlights */}
              <div className="flex flex-col">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#dfe2f1] text-[#4b41e1] text-[11px] font-bold w-fit mb-4">
                  DUAL-ENGINE NATURAL LANGUAGE PARSER
                </div>
                <h2 className="text-3xl sm:text-4xl font-extrabold text-[#171b26] mb-4 tracking-tight">
                  Input Transaksi Secepat Mengetik Pesan Santai
                </h2>
                <p className="text-base text-[#3d4a42] mb-8 leading-relaxed">
                  Karyawan atau kasir tidak perlu diajari akuntansi. Cukup kirim chat biasa seperti
                  “Beli solar genset 150rb” atau foto struk nota pasar, model AI NexaFinance memvalidasi
                  angka, mengkategorikan akun COA, dan memperbarui buku besar secara instan.
                </p>

                <div className="flex flex-col gap-4">
                  <div className="flex items-start gap-3.5">
                    <div className="w-9 h-9 rounded-lg bg-[#006948]/10 flex items-center justify-center text-[#006948] shrink-0 mt-0.5">
                      <Zap size={18} />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-[#171b26]">Dual AI Core (Groq & Gemini Llama 3.3)</h4>
                      <p className="text-xs text-[#6d7a72] mt-0.5">
                        Pemrosesan semantik bahasa Indonesia non-formal, singkatan lokal (rb, k, jt), dan dialek sehari-hari.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3.5">
                    <div className="w-9 h-9 rounded-lg bg-[#4b41e1]/10 flex items-center justify-center text-[#4b41e1] shrink-0 mt-0.5">
                      <Receipt size={18} />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-[#171b26]">OCR Nota & Struk Otomatis</h4>
                      <p className="text-xs text-[#6d7a72] mt-0.5">
                        Kamera langsung mendeteksi total nominal, nama merchant, dan nomor faktur tanpa input manual.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3.5">
                    <div className="w-9 h-9 rounded-lg bg-[#00873c]/10 flex items-center justify-center text-[#00873c] shrink-0 mt-0.5">
                      <Lock size={18} />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-[#171b26]">Audit Trail Terenkripsi</h4>
                      <p className="text-xs text-[#6d7a72] mt-0.5">
                        Setiap transaksi mencatat ID nomor WhatsApp pengirim, timestamp presisi milidetik, dan approval flow.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: WhatsApp Interactive Chat Mockup */}
              <div className="flex justify-center">
                <div className="w-full max-w-md rounded-2xl bg-white border border-[#e2e8f0] shadow-xl overflow-hidden">
                  {/* WA Header */}
                  <div className="bg-[#ebedfc] px-4 py-3 flex items-center justify-between border-b border-[#dfe2f1]">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-[#006948] flex items-center justify-center text-white font-bold text-sm">
                        N
                      </div>
                      <div>
                        <div className="text-xs font-bold text-[#171b26] flex items-center gap-1">
                          <span>NexaFinance Bot</span>
                          <CheckCircle2 size={13} className="text-[#006948]" />
                        </div>
                        <div className="text-[10px] text-[#006948] font-medium">online • AI Treasury Agent</div>
                      </div>
                    </div>
                    <MoreVertical size={16} className="text-[#6d7a72]" />
                  </div>

                  {/* WA Chat Canvas */}
                  <div className="p-4 bg-[#ebedfc]/60 flex flex-col gap-3 min-h-[360px]">
                    {/* Message 1: Staff */}
                    <div className="self-end max-w-[82%] bg-white p-3 rounded-xl rounded-tr-none shadow-xs border border-[#e2e8f0]">
                      <p className="text-xs text-[#171b26]">
                        Kasir shift 1: beli sabun cuci piring dan spons 35rb tunai
                      </p>
                      <div className="text-right mt-1">
                        <span className="text-[10px] text-[#6d7a72]">10:41 • Kasir Rian</span>
                      </div>
                    </div>

                    {/* Message 2: Bot */}
                    <div className="self-start max-w-[88%] bg-white p-3 rounded-xl rounded-tl-none shadow-xs border border-[#e2e8f0]">
                      <div className="flex items-center gap-1 text-[#006948] text-xs font-bold mb-1">
                        <CheckCircle2 size={14} />
                        <span>Tercatat Otomatis #TX-9021</span>
                      </div>
                      <div className="text-xs font-bold text-[#171b26]">
                        Rp 35.000 (Pengeluaran Kas Kecil)
                      </div>
                      <p className="text-[11px] text-[#6d7a72] mt-1 leading-snug">
                        Kategori: Beban Perlengkapan & Kebersihan <br />
                        Sisa Pagu Kategori: Rp 1.465.000 (Aman)
                      </p>
                      <div className="text-right mt-1">
                        <span className="text-[10px] text-[#6d7a72]">10:41 • Nexa AI</span>
                      </div>
                    </div>

                    {/* Message 3: Founder */}
                    <div className="self-end max-w-[82%] bg-white p-3 rounded-xl rounded-tr-none shadow-xs border border-[#e2e8f0]">
                      <p className="text-xs text-[#171b26]">Cek saldo kas operasional & e-wallet sekarang</p>
                      <div className="text-right mt-1">
                        <span className="text-[10px] text-[#6d7a72]">10:42 • Founder (Owner)</span>
                      </div>
                    </div>

                    {/* Message 4: Bot Live Balances */}
                    <div className="self-start max-w-[88%] bg-white p-3 rounded-xl rounded-tl-none shadow-xs border border-[#e2e8f0]">
                      <div className="flex items-center gap-1 text-[#4b41e1] text-xs font-bold mb-1">
                        <Sparkles size={14} />
                        <span>Treasury Snapshot Real-Time</span>
                      </div>
                      <div className="flex flex-col gap-1 text-xs text-[#171b26] mt-1">
                        <div className="flex justify-between">
                          <span className="text-[#6d7a72]">• Kas Operasional Toko:</span>
                          <span className="font-bold tabular-nums">Rp 210.450.000</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[#6d7a72]">• Dompet QRIS & E-Wallet:</span>
                          <span className="font-bold tabular-nums">Rp 138.200.000</span>
                        </div>
                        <div className="flex justify-between border-t border-[#e2e8f0] pt-1 mt-1 font-bold text-[#006948]">
                          <span>Total Kas Bisnis:</span>
                          <span className="tabular-nums">Rp 348.650.000</span>
                        </div>
                      </div>
                      <div className="text-right mt-1.5">
                        <span className="text-[10px] text-[#6d7a72]">10:42 • Nexa AI</span>
                      </div>
                    </div>
                  </div>

                  {/* WA Footer Mockup */}
                  <div className="p-3 bg-[#ebedfc] flex items-center gap-2 border-t border-[#dfe2f1]">
                    <PlusCircle size={20} className="text-[#6d7a72]" />
                    <div className="flex-1 bg-white rounded-full px-3.5 py-1.5 text-[#6d7a72] text-xs border border-[#dfe2f1]">
                      Ketik instruksi transaksi atau invoice...
                    </div>
                    <div className="w-8 h-8 rounded-full bg-[#006948] flex items-center justify-center text-white">
                      <Send size={14} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ============================================================ */}
        {/* 7. METRICS STRIP                                             */}
        {/* ============================================================ */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 w-full">
          <div className="rounded-2xl bg-white border border-[#e2e8f0] p-8 shadow-sm">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center divide-y md:divide-y-0 md:divide-x divide-[#e2e8f0]">
              <div className="flex flex-col items-center pt-4 md:pt-0">
                <span className="text-4xl sm:text-5xl font-extrabold text-[#006948] tracking-tight">
                  99.98%
                </span>
                <span className="font-bold text-sm text-[#171b26] mt-1.5">Akurasi Pembukuan</span>
                <p className="text-xs text-[#6d7a72] max-w-xs mt-1">
                  Rekonsiliasi otomatis kas multi-kanal tanpa selisih desimal atau rounding error.
                </p>
              </div>

              <div className="flex flex-col items-center pt-4 md:pt-0">
                <span className="text-4xl sm:text-5xl font-extrabold text-[#4b41e1] tracking-tight">
                  3.5 Jam
                </span>
                <span className="font-bold text-sm text-[#171b26] mt-1.5">Waktu Dihemat Tiap Minggu</span>
                <p className="text-xs text-[#6d7a72] max-w-xs mt-1">
                  Bebaskan staf dan finance operator dari pekerjaan manual entri struk nota berulang.
                </p>
              </div>

              <div className="flex flex-col items-center pt-4 md:pt-0">
                <span className="text-4xl sm:text-5xl font-extrabold text-[#00873c] tracking-tight">
                  &lt;150ms
                </span>
                <span className="font-bold text-sm text-[#171b26] mt-1.5">Respon AI WhatsApp</span>
                <p className="text-xs text-[#6d7a72] max-w-xs mt-1">
                  Deteksi intent sekejap mata dengan engine Llama 3.3 ultra-low latency.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ============================================================ */}
        {/* 8. BOTTOM CONVERSION CTA                                     */}
        {/* ============================================================ */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20 w-full">
          <div className="rounded-2xl bg-[#ebedfc] p-8 sm:p-14 text-center shadow-md relative overflow-hidden border border-[#dfe2f1]">
            <div className="absolute -right-16 -top-16 w-64 h-64 bg-[#006948]/10 rounded-full blur-3xl pointer-events-none" />

            <div className="max-w-2xl mx-auto relative z-10 flex flex-col items-center">
              <span className="text-xs uppercase text-[#006948] font-bold tracking-widest mb-2">
                MULAI DALAM 60 DETIK
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-[#171b26] mb-3 tracking-tight">
                Mulai Rapikan Kas Bisnis Anda Hari Ini
              </h2>
              <p className="text-sm sm:text-base text-[#3d4a42] mb-8 max-w-lg">
                Tinggalkan spreadsheet kusut dan selisih nota yang membingungkan. Uji coba seluruh fitur premium NexaFinance tanpa kartu kredit.
              </p>

              <div className="flex flex-col sm:flex-row items-center gap-3 w-full max-w-md mb-5">
                <div className="relative w-full">
                  <Mail size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#6d7a72]" />
                  <input
                    type="email"
                    placeholder="nama@perusahaan.com"
                    className="w-full pl-10 pr-4 py-3 rounded-lg bg-white text-[#171b26] text-sm border border-[#cbd5e1] focus:outline-none focus:ring-2 focus:ring-[#006948] shadow-xs"
                  />
                </div>
                <Link
                  href="/login"
                  className="w-full sm:w-auto px-6 py-3 rounded-lg bg-[#006948] hover:bg-[#00855d] text-white text-sm font-semibold shadow-md transition-all whitespace-nowrap shrink-0"
                >
                  Daftar Sekarang
                </Link>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-4 text-[#3d4a42] text-xs">
                <span className="flex items-center gap-1 font-medium">
                  <Check size={14} className="text-[#006948]" /> Gratis 14 Hari
                </span>
                <span>•</span>
                <span className="flex items-center gap-1 font-medium">
                  <Check size={14} className="text-[#006948]" /> Tanpa Kartu Kredit
                </span>
                <span>•</span>
                <span className="flex items-center gap-1 font-medium">
                  <Check size={14} className="text-[#006948]" /> Setup Instan
                </span>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* ============================================================ */}
      {/* 9. FOOTER                                                    */}
      {/* ============================================================ */}
      <footer className="w-full bg-[#f2f3ff] pt-14 pb-10 border-t border-[#e5e7f6]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-5 gap-10 pb-10 border-b border-[#dfe2f1]">
            <div className="md:col-span-2 flex flex-col gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#006948] flex items-center justify-center text-white font-bold text-sm">
                  N
                </div>
                <span className="font-bold text-base text-[#171b26]">NexaFinance</span>
              </div>
              <p className="text-[#6d7a72] text-xs leading-relaxed max-w-sm">
                Platform treasury cerdas SME &amp; Enterprise. Solusi keuangan dan pembukuan instan berbasis AI dan WhatsApp untuk UMKM serta startup modern.
              </p>
              <div className="pt-2">
                <span className="inline-flex items-center px-3 py-1 rounded-full bg-[#dfe2f1] text-[#171b26] text-[10px] font-bold tracking-wider uppercase">
                  OJK COMPLIANT SANDBOX
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-2.5">
              <span className="text-[11px] font-bold uppercase text-[#6d7a72] tracking-wider">Produk</span>
              <a href="#fitur" className="text-xs text-[#3d4a42] hover:text-[#006948] transition-colors">Manajemen Kas</a>
              <a href="#integrasi-whatsapp" className="text-xs text-[#3d4a42] hover:text-[#006948] transition-colors">Bot WhatsApp Sync</a>
              <a href="#cara-kerja" className="text-xs text-[#3d4a42] hover:text-[#006948] transition-colors">OCR Struk & Invoice</a>
              <Link href="/login" className="text-xs text-[#3d4a42] hover:text-[#006948] transition-colors">Pencatatan Kas & Mutasi</Link>
            </div>

            <div className="flex flex-col gap-2.5">
              <span className="text-[11px] font-bold uppercase text-[#6d7a72] tracking-wider">Solusi</span>
              <a href="#fitur" className="text-xs text-[#3d4a42] hover:text-[#006948] transition-colors">Untuk Startup</a>
              <a href="#fitur" className="text-xs text-[#3d4a42] hover:text-[#006948] transition-colors">Untuk F&B & Ritel</a>
              <a href="#fitur" className="text-xs text-[#3d4a42] hover:text-[#006948] transition-colors">Paket Enterprise</a>
              <a href="#fitur" className="text-xs text-[#3d4a42] hover:text-[#006948] transition-colors">Keamanan Finansial</a>
            </div>

            <div className="flex flex-col gap-2.5">
              <span className="text-[11px] font-bold uppercase text-[#6d7a72] tracking-wider">Perusahaan</span>
              <a href="#" className="text-xs text-[#3d4a42] hover:text-[#006948] transition-colors">Tentang Nexa</a>
              <a href="#" className="text-xs text-[#3d4a42] hover:text-[#006948] transition-colors">Pusat Bantuan</a>
              <a href="#" className="text-xs text-[#3d4a42] hover:text-[#006948] transition-colors">Syarat & Ketentuan</a>
              <a href="#" className="text-xs text-[#3d4a42] hover:text-[#006948] transition-colors">Kebijakan Privasi</a>
            </div>
          </div>

          <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#6d7a72]">
            <span>© 2026 NexaFinance. Seluruh hak cipta dilindungi undang-undang.</span>
            <div className="flex items-center gap-6">
              <a href="#" className="hover:text-[#006948] transition-colors">Status Sistem</a>
              <a href="#" className="hover:text-[#006948] transition-colors">Dokumentasi API</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
