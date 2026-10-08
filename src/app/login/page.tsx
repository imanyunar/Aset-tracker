"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "@/lib/auth-client";
import { ArrowRight, Lock, AlertCircle, Eye, EyeOff, CheckCircle } from "lucide-react";
import { z } from "zod";

const loginSchema = z.object({
  email: z.string().email("Format email tidak valid"),
  password: z.string().min(1, "Kata sandi wajib diisi"),
});

const HIGHLIGHT_SLIDES = [
  {
    badge: "MANAJEMEN KAS",
    title: "Pantau Saldo & Arus Kas Bisnis Secara Real-Time",
    description:
      "Pencatatan kas dan mutasi multi-rekening yang rapi dan terpusat. Pisahkan keuangan pribadi dan operasional bisnis dalam satu sistem.",
    metric: "Real-Time",
    metricLabel: "Sinkronisasi Mutasi",
    tag: "Multi-Rekening Bank",
  },
  {
    badge: "PENCATATAN PRAKTIS",
    title: "Catat Pengeluaran Harian Semudah Mengetik Pesan",
    description:
      "Cukup ketik transaksi harian seperti belanja atau tagihan dalam bahasa sehari-hari, sistem langsung mengelompokkan kategori dan saldo.",
    metric: "Instan",
    metricLabel: "Pencatatan Otomatis",
    tag: "Kategori Cerdas",
  },
  {
    badge: "INTEGRASI WHATSAPP",
    title: "Kelola Transaksi Finansial Langsung Lewat WhatsApp",
    description:
      "Catat mutasi belanja, periksa sisa saldo kas, dan terima ringkasan harian langsung dari obrolan WhatsApp tanpa repot.",
    metric: "24/7 Siaga",
    metricLabel: "Akses WhatsApp Bot",
    tag: "Notifikasi Otomatis",
  },
  {
    badge: "PAGU ANGGARAN",
    title: "Kontrol Anggaran Bulanan & Cegah Pengeluaran Berlebih",
    description:
      "Tetapkan batas pengeluaran per kategori dan pantau pemakaian secara visual agar cash flow operasional selalu sehat dan terkendali.",
    metric: "100% Kontrol",
    metricLabel: "Transparansi Anggaran",
    tag: "Peringatan Limit",
  },
];

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [currentSlide, setCurrentSlide] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentSlide((prev) => (prev + 1) % HIGHLIGHT_SLIDES.length);
        setIsTransitioning(false);
      }, 220);
    }, 4800);

    return () => clearInterval(timer);
  }, []);

  const handleSelectSlide = (idx: number) => {
    if (idx === currentSlide) return;
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentSlide(idx);
      setIsTransitioning(false);
    }, 220);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const validation = loginSchema.safeParse({ email, password });
    if (!validation.success) {
      setError(validation.error.issues[0]?.message || "Periksa kembali data masukan");
      return;
    }

    setLoading(true);

    try {
      const res = await signIn.email({
        email,
        password,
        rememberMe,
      });

      if (res.error) {
        setError(res.error.message || "Email atau kata sandi tidak cocok");
        setLoading(false);
        return;
      }

      router.push("/dashboard");
    } catch {
      setError("Terjadi kesalahan jaringan. Coba lagi beberapa saat lagi.");
      setLoading(false);
    }
  };

  const handleFillDemo = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword("admin123");
  };

  const slide = HIGHLIGHT_SLIDES[currentSlide];

  return (
    <div className="min-h-screen min-h-[100dvh] flex flex-col lg:flex-row bg-[#f8fafc] font-body overflow-x-hidden w-full">
      {/* ============================================================ */}
      {/* SEBELAH KIRI (DESKTOP) / HEADER COMPACT (MOBILE): Showcase    */}
      {/* ============================================================ */}
      <div className="relative bg-gradient-to-br from-[#001428] via-[#002244] to-[#003666] flex flex-col justify-between p-4 sm:p-6 lg:p-14 text-white overflow-hidden lg:flex-1 shrink-0 shadow-md lg:shadow-none">
        {/* Ambient Lights */}
        <div className="absolute -top-24 -left-24 w-72 sm:w-96 h-72 sm:h-96 rounded-full bg-[radial-gradient(circle,rgba(56,189,248,0.18)_0%,rgba(0,92,170,0)_70%)] pointer-events-none z-[1]" />
        <div className="absolute -bottom-24 -right-24 w-72 sm:w-96 h-72 sm:h-96 rounded-full bg-[radial-gradient(circle,rgba(0,92,170,0.25)_0%,rgba(0,20,40,0)_70%)] pointer-events-none z-[1]" />

        {/* Top Header */}
        <div className="flex items-center justify-between relative z-[2] gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-br from-[#005caa] to-[#0284c7] flex items-center justify-center shadow-[0_4px_12px_rgba(56,189,248,0.25)] border border-[rgba(56,189,248,0.35)] shrink-0">
              <svg width="22" height="22" viewBox="0 0 128 128" fill="none">
                <path d="M34 32 H48 V96 H34 Z" fill="#ffffff" />
                <path d="M80 32 H94 V96 H80 Z" fill="#ffffff" />
                <path d="M42 32 L86 96 H72 L34 40 Z" fill="#7dd3fc" />
                <circle cx="87" cy="34" r="5" fill="#38bdf8" />
              </svg>
            </div>
            <div>
              <div className="text-base sm:text-xl font-extrabold tracking-tight font-heading">
                Nexa<span className="text-[#38bdf8]">Finance</span>
              </div>
              <div className="text-[10px] sm:text-[11px] text-[#94a3b8] tracking-wider uppercase font-semibold">
                Manajemen Kas & Treasury
              </div>
            </div>
          </div>
        </div>

        {/* Desktop Showcase Content */}
        <div className="hidden lg:block relative z-[2] my-8 lg:my-12 max-w-xl">
          <div
            className={`transition-[opacity,transform] duration-300 ease-out will-change-[opacity,transform] ${
              isTransitioning ? "opacity-0 translate-y-2.5" : "opacity-100 translate-y-0"
            }`}
          >
            <div className="inline-block px-2.5 py-0.5 sm:px-3 sm:py-1 rounded bg-[rgba(56,189,248,0.15)] text-[#7dd3fc] text-[10px] sm:text-[11px] font-bold tracking-wider mb-3 sm:mb-4 border border-[rgba(56,189,248,0.3)]">
              {slide.badge}
            </div>

            <h2 className="text-xl sm:text-2xl lg:text-3xl xl:text-4xl font-extrabold leading-tight mb-2 sm:mb-3 font-heading text-white">
              {slide.title}
            </h2>

            <p className="text-xs sm:text-sm lg:text-base leading-relaxed text-[#cbd5e1] mb-5 sm:mb-6 max-w-lg">
              {slide.description}
            </p>

            <div className="flex items-center gap-3 sm:gap-4 flex-wrap">
              <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-[rgba(0,20,40,0.65)] border border-[rgba(56,189,248,0.25)] backdrop-blur shadow-[0_4px_16px_rgba(0,0,0,0.2)]">
                <div className="text-lg sm:text-2xl font-extrabold text-[#38bdf8] font-heading">
                  {slide.metric}
                </div>
                <div className="text-[10px] sm:text-[11px] text-[#94a3b8] mt-0.5 font-semibold">
                  {slide.metricLabel}
                </div>
              </div>

              <div className="hidden sm:block p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-[rgba(0,20,40,0.65)] border border-[rgba(255,255,255,0.1)] backdrop-blur">
                <div className="text-xs font-bold text-white">
                  {slide.tag}
                </div>
                <div className="text-[10px] sm:text-[11px] text-[#64748b] mt-0.5">
                  Sistem Terintegrasi
                </div>
              </div>
            </div>
          </div>

          {/* Slide Progress Dots */}
          <div className="flex items-center gap-2 mt-5 sm:mt-8 lg:mt-10">
            {HIGHLIGHT_SLIDES.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSelectSlide(idx)}
                title={`Buka ringkasan ${idx + 1}`}
                className={`h-1.5 sm:h-2 rounded-full transition-all duration-300 ${
                  currentSlide === idx ? "w-7 sm:w-8 bg-[#38bdf8]" : "w-2 bg-white/25 hover:bg-white/40"
                }`}
              />
            ))}
          </div>
        </div>

        {/* Mobile Compact Headline Bar */}
        <div className="lg:hidden relative z-[2] mt-2 pt-2 border-t border-white/10 flex items-center gap-2">
          <span className="px-2 py-0.5 rounded bg-[rgba(56,189,248,0.18)] text-[#7dd3fc] text-[9.5px] font-bold shrink-0">
            {slide.badge}
          </span>
          <span className="text-xs text-[#e2e8f0] font-semibold truncate">
            {slide.title}
          </span>
        </div>

        {/* Bottom Proof Strip */}
        <div className="hidden lg:flex relative z-[2] border-t border-white/10 pt-4 items-center justify-between text-xs text-[#94a3b8]">
          <div className="flex items-center gap-2">
            <Lock size={15} className="text-[#38bdf8]" />
            <span>Koneksi Aman Terenkripsi SSL/TLS 256-bit</span>
          </div>
          <div>© {new Date().getFullYear()} NexaFinance Inc.</div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* SEBELAH KANAN (DESKTOP) / KARTU UTAMA (MOBILE): Login Form    */}
      {/* ============================================================ */}
      <div className="flex-1 bg-white flex flex-col items-center justify-center p-5 sm:p-8 lg:p-14 relative w-full">
        <div className="w-full max-w-[400px]">
          {/* Header */}
          <div className="mb-6 sm:mb-7">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#001428] font-heading tracking-tight mb-1 sm:mb-1.5">
              Masuk ke Akun Anda
            </h1>
            <p className="text-xs sm:text-sm text-[#64748b]">
              Masukkan email dan kata sandi untuk mengelola keuangan Anda.
            </p>
          </div>

          {error && (
            <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs sm:text-sm flex items-center gap-2.5 mb-5">
              <AlertCircle size={16} className="shrink-0 text-red-600" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="form-group">
              <label className="form-label text-xs font-bold text-[#334155] uppercase tracking-wider">
                Alamat Email
              </label>
              <input
                type="email"
                placeholder="nama@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="form-input text-base sm:text-sm"
                required
              />
            </div>

            <div className="form-group relative">
              <label className="form-label text-xs font-bold text-[#334155] uppercase tracking-wider">
                Kata Sandi
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="form-input text-base sm:text-sm pr-11"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  title={showPassword ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-[#475569] pt-1 flex-wrap gap-2">
              <label className="inline-flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded accent-[#005caa] cursor-pointer w-4 h-4"
                />
                <span>Ingat saya</span>
              </label>

              <a
                href="#forgot"
                onClick={(e) => {
                  e.preventDefault();
                  alert("Silakan hubungi administrator workspace untuk pemulihan akun.");
                }}
                className="text-[#005caa] font-semibold hover:underline"
              >
                Lupa kata sandi?
              </a>
            </div>

            <button
              type="submit"
              className="btn btn-primary w-full !py-3.5 !rounded-full shadow-[0_4px_16px_rgba(0,92,170,0.25)] hover:shadow-[0_8px_24px_rgba(0,92,170,0.35)] text-sm font-bold mt-2 min-h-[48px]"
              disabled={loading}
            >
              <span>{loading ? "Memverifikasi..." : "Masuk ke NexaFinance"}</span>
              {!loading && <ArrowRight size={16} />}
            </button>
          </form>

          {/* Quick Demo Helper */}
          <div className="mt-5 p-3 rounded-xl bg-[#f0f6fa] border border-dashed border-[#b8d5ed] flex items-center justify-between text-xs flex-wrap gap-2">
            <span className="text-[#003666] font-medium">Akun Demo Cepat:</span>
            <button
              type="button"
              onClick={() => handleFillDemo("iman@gmail.com")}
              className="bg-white border border-[#005caa] text-[#005caa] font-bold hover:bg-[#005caa] hover:text-white px-3 py-1 rounded-full transition-colors"
            >
              Isi Akun Admin
            </button>
          </div>

          <div className="text-center mt-5 text-xs sm:text-sm text-[#64748b]">
            Belum memiliki akun?{" "}
            <Link href="/register" className="font-bold text-[#005caa] hover:underline">
              Daftar Sekarang
            </Link>
          </div>

          <div className="text-center mt-6 pt-4 border-t border-slate-100 text-[11.5px] text-[#64748b] flex items-center justify-center gap-1.5">
            <CheckCircle size={14} className="text-[#005caa]" />
            <span>Kerahasiaan data terjamin dengan enkripsi end-to-end</span>
          </div>
        </div>
      </div>
    </div>
  );
}
