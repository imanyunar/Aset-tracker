"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "@/lib/auth-client";
import { ArrowRight, ShieldCheck, AlertCircle, Sparkles, Eye, EyeOff } from "lucide-react";
import { z } from "zod";

const loginSchema = z.object({
  email: z.string().email("Format email tidak valid"),
  password: z.string().min(1, "Kata sandi wajib diisi"),
});

const HIGHLIGHT_SLIDES = [
  {
    badge: "PRESISI INSTITUSIONAL",
    title: "Manajemen Kas & Treasury Presisi Tinggi",
    description:
      "Pencatatan integer Rupiah tanpa kompromi floating-point drift. Pisahkan kas operasional bisnis dan pribadi dengan isolasi multi-workspace.",
    metric: "100% Presisi",
    metricLabel: "Nol Selisih Saldo",
    tag: "Enterprise Treasury",
  },
  {
    badge: "INTELLIGENT AI ENGINE",
    title: "Input Transaksi Bebas Bahasa Alami",
    description:
      "Ketik kalimat santai seperti 'Makan siang 35rb bayar bca', AI otomatis mengekstrak nominal, rekening, dan kategori secara instan.",
    metric: "< 150ms",
    metricLabel: "Kecepatan Respon AI",
    tag: "Groq & Gemini Dual-Engine",
  },
  {
    badge: "WHATSAPP 2-WAY BOT",
    title: "Asisten Keuangan Interaktif Langsung di WhatsApp",
    description:
      "Catat pemasukan, belanja, cek saldo kas, dan terima peringatan overlimit pagu anggaran otomatis langsung dari aplikasi WhatsApp Anda 24/7.",
    metric: "Real-Time",
    metricLabel: "Sinkronisasi Cloud Bot",
    tag: "Fonnte Gateway 2-Way",
  },
  {
    badge: "VISIBILITAS KEUANGAN",
    title: "Analitik Pagu Anggaran & Pengawasan Likuiditas",
    description:
      "Visualisasi komprehensif pagu anggaran bulanan, rasio burn rate, dan riwayat mutasi kas dalam antarmuka berkecepatan tinggi.",
    metric: "93+ Score",
    metricLabel: "Lighthouse Performance",
    tag: "Morgan Stanley Standard",
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
      }, 250);
    }, 4500);

    return () => clearInterval(timer);
  }, []);

  const handleSelectSlide = (idx: number) => {
    if (idx === currentSlide) return;
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentSlide(idx);
      setIsTransitioning(false);
    }, 200);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const validation = loginSchema.safeParse({ email, password });
    if (!validation.success) {
      setError(validation.error.issues[0]?.message ?? "Input tidak valid");
      return;
    }

    setLoading(true);
    try {
      const res = await signIn.email({
        email,
        password,
        rememberMe,
      });

      if (res?.error) {
        setError(res.error.message || "Email atau kata sandi tidak cocok.");
      } else {
        if (typeof window !== "undefined") {
          try {
            localStorage.removeItem("nexa_explicit_logged_out");
            localStorage.setItem("nexa_last_activity", String(Date.now()));
            sessionStorage.setItem("nexa_session_active", "true");
          } catch {}
        }
        router.push("/dashboard");
        router.refresh();
      }
    } catch {
      setError("Gagal terhubung ke server autentikasi.");
    } finally {
      setLoading(false);
    }
  };

  const handleFillDemo = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword("admin123");
  };

  const slide = HIGHLIGHT_SLIDES[currentSlide];

  return (
    <div className="min-h-screen min-h-[100dvh] flex flex-col lg:flex-row bg-[#001428] font-body overflow-x-hidden w-full">
      {/* ============================================================ */}
      {/* SEBELAH KIRI / ATAS: Showcase Brand & Teks Animasi Dinamis   */}
      {/* ============================================================ */}
      <div className="relative bg-gradient-to-br from-[#001224] via-[#002244] to-[#003666] flex flex-col justify-between p-6 sm:p-10 lg:p-14 text-white overflow-hidden lg:flex-1 shrink-0">
        {/* Ambient Lights */}
        <div className="absolute -top-24 -left-24 w-72 sm:w-96 h-72 sm:h-96 rounded-full bg-[radial-gradient(circle,rgba(56,189,248,0.22)_0%,rgba(0,92,170,0)_70%)] pointer-events-none z-[1]" />
        <div className="absolute -bottom-24 -right-24 w-72 sm:w-96 h-72 sm:h-96 rounded-full bg-[radial-gradient(circle,rgba(0,92,170,0.35)_0%,rgba(0,20,40,0)_70%)] pointer-events-none z-[1]" />

        {/* Top Header */}
        <div className="flex items-center justify-between relative z-[2] gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-br from-[#005caa] to-[#0284c7] flex items-center justify-center shadow-[0_4px_16px_rgba(56,189,248,0.35)] border border-[rgba(56,189,248,0.4)] shrink-0">
              <svg width="22" height="22" viewBox="0 0 128 128" fill="none">
                <path d="M34 32 H48 V96 H34 Z" fill="#ffffff" />
                <path d="M80 32 H94 V96 H80 Z" fill="#ffffff" />
                <path d="M42 32 L86 96 H72 L34 40 Z" fill="#7dd3fc" />
                <circle cx="87" cy="34" r="5" fill="#38bdf8" />
              </svg>
            </div>
            <div>
              <div className="text-lg sm:text-xl font-extrabold tracking-tight font-heading">
                Nexa<span className="text-[#38bdf8]">Finance</span>
              </div>
              <div className="text-[10px] sm:text-[11px] text-[#94a3b8] tracking-wider uppercase font-semibold">
                Institutional Wealth OS
              </div>
            </div>
          </div>

          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[rgba(56,189,248,0.1)] border border-[rgba(56,189,248,0.25)] text-[11px] font-semibold text-[#38bdf8] whitespace-nowrap">
            <span className="w-2 h-2 rounded-full bg-[#38bdf8] shadow-[0_0_8px_#38bdf8]" />
            AES-256 ENCRYPTION
          </div>
        </div>

        {/* Dynamic Animated Text */}
        <div className="relative z-[2] my-6 sm:my-8 lg:my-12 max-w-xl">
          <div
            className={`transition-all duration-300 ease-out ${
              isTransitioning ? "opacity-0 translate-y-2.5" : "opacity-100 translate-y-0"
            }`}
          >
            <div className="inline-block px-2.5 py-0.5 sm:px-3 sm:py-1 rounded bg-[rgba(56,189,248,0.15)] text-[#7dd3fc] text-[10px] sm:text-[11px] font-bold tracking-wider mb-3 sm:mb-4 border border-[rgba(56,189,248,0.3)]">
              {slide.badge}
            </div>

            <h2 className="text-xl sm:text-2xl lg:text-3xl xl:text-4xl font-extrabold leading-tight mb-2 sm:mb-3 font-heading text-white">
              {slide.title}
            </h2>

            <p className="text-xs sm:text-sm lg:text-base leading-relaxed text-[#cbd5e1] mb-5 sm:mb-6 max-w-lg line-clamp-2 sm:line-clamp-none">
              {slide.description}
            </p>

            <div className="flex items-center gap-3 sm:gap-4 flex-wrap">
              <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-[rgba(0,20,40,0.65)] border border-[rgba(56,189,248,0.25)] backdrop-blur shadow-[0_8px_24px_rgba(0,0,0,0.3)]">
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
                  Active Infrastructure
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
                title={`Buka slide ${idx + 1}`}
                className={`h-1.5 sm:h-2 rounded-full transition-all duration-300 ${
                  currentSlide === idx ? "w-7 sm:w-8 bg-[#38bdf8]" : "w-2 bg-white/25 hover:bg-white/40"
                }`}
              />
            ))}
          </div>
        </div>

        {/* Bottom Proof Strip */}
        <div className="hidden md:flex relative z-[2] border-t border-white/10 pt-4 items-center justify-between text-xs text-[#94a3b8]">
          <div className="flex items-center gap-2">
            <ShieldCheck size={16} className="text-[#38bdf8]" />
            <span>Sertifikasi FinTech Institusional Berkecepatan Tinggi</span>
          </div>
          <div>© {new Date().getFullYear()} NexaFinance Inc.</div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* SEBELAH KANAN / BAWAH: Formulir Masuk (Login Form)            */}
      {/* ============================================================ */}
      <div className="flex-1 bg-white flex flex-col items-center justify-center p-5 sm:p-8 lg:p-14 relative w-full">
        <div className="w-full max-w-[440px]">
          {/* Header */}
          <div className="mb-6 sm:mb-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-[#e8f2fa] text-[#005caa] text-[11px] sm:text-xs font-bold mb-2 sm:mb-3">
              <Sparkles size={13} className="text-[#005caa]" />
              <span>PORTAL AUTENTIKASI AMAN</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#001428] font-heading tracking-tight mb-1 sm:mb-2">
              Masuk ke Akun Anda
            </h1>
            <p className="text-xs sm:text-sm text-[#64748b]">
              Masukkan email dan kata sandi untuk mengakses workspace keuangan Anda.
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
                <span>Ingat saya di perangkat ini</span>
              </label>

              <a
                href="#forgot"
                onClick={(e) => {
                  e.preventDefault();
                  alert("Silakan hubungi administrator workspace Anda untuk pemulihan akun.");
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
              <span>{loading ? "Memverifikasi..." : "Masuk ke Portal Keuangan"}</span>
              {!loading && <ArrowRight size={16} />}
            </button>
          </form>

          {/* Quick Demo Helper */}
          <div className="mt-5 p-3 rounded-xl bg-slate-50 border border-dashed border-slate-300 flex items-center justify-between text-xs flex-wrap gap-2">
            <span className="text-[#64748b]">Ingin tes cepat akun admin?</span>
            <button
              type="button"
              onClick={() => handleFillDemo("iman@gmail.com")}
              className="text-[#005caa] font-bold hover:underline px-2 py-1 rounded"
            >
              Isi Otomatis
            </button>
          </div>

          <div className="text-center mt-5 text-xs sm:text-sm text-[#64748b]">
            Belum memiliki akun?{" "}
            <Link href="/register" className="font-bold text-[#005caa] hover:underline">
              Daftar Sekarang
            </Link>
          </div>

          <div className="text-center mt-6 pt-4 border-t border-slate-100 text-[11px] sm:text-xs text-[#94a3b8] flex items-center justify-center gap-1.5">
            <ShieldCheck size={14} className="text-[#005caa]" />
            <span>Dilindungi Protokol Zero-Trust & Neon Cloud Database</span>
          </div>
        </div>
      </div>
    </div>
  );
}
