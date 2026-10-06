import Link from "next/link";
import { ArrowRight, ShieldCheck, PieChart, Sparkles, Smartphone, Layers, CheckCircle } from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#ffffff] text-[var(--color-text-primary)] flex flex-col">
      {/* Navigation Bar */}
      <header className="border-b border-[var(--color-border)] sticky top-0 bg-[#ffffff]/95 backdrop-blur z-50">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[var(--color-primary)] rounded-lg flex items-center justify-center text-white font-extrabold text-xl shadow-[0_2px_8px_rgba(24,122,186,0.25)]">
              N
            </div>
            <div>
              <span className="font-extrabold text-xl tracking-tight text-[var(--color-navy)] font-heading">
                Nexa<span className="text-[var(--color-primary)]">Finance</span>
              </span>
              <span className="hidden sm:inline-block ml-3 px-2 py-0.5 text-[10px] tracking-wider uppercase font-semibold bg-[rgba(24,122,186,0.08)] text-[var(--color-primary)] rounded">
                Enterprise Precision
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Link
              href="/login"
              className="text-sm font-semibold text-[var(--color-navy)] hover:text-[var(--color-primary)] px-3 py-2 transition-colors"
            >
              Masuk
            </Link>
            <Link
              href="/register"
              className="btn btn-primary text-sm !py-2.5 !px-5"
            >
              <span>Daftar Sekarang</span>
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 lg:py-28 px-6 max-w-7xl mx-auto w-full flex flex-col items-center text-center animate-page-enter">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-[var(--color-border)] bg-[#fafafa] text-xs font-semibold text-[var(--color-text-secondary)] mb-6 animate-fade-in hover:scale-105 transition-transform cursor-default">
          <Sparkles size={14} className="text-[var(--color-primary)] animate-pulse" />
          <span>Generasi Baru Manajemen Finansial dengan AI & WhatsApp</span>
        </div>

        <h1 className="text-4xl sm:text-5xl lg:text-6xl max-w-4xl font-extrabold text-[var(--color-navy)] tracking-tight leading-[1.15] mb-6 font-heading animate-fade-in-up delay-75">
          Pengelolaan Keuangan Presisi Tinggi untuk Pertumbuhan Finansial Anda
        </h1>

        <p className="text-lg sm:text-xl text-[var(--color-text-secondary)] max-w-2xl mb-10 leading-relaxed font-body animate-fade-in-up delay-150">
          Pisahkan keuangan pribadi dan operasional bisnis secara tegas. Catat arus kas via input natural AI, pantau metrik real-time, dan dapatkan notifikasi WhatsApp instan.
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto animate-fade-in-up delay-200">
          <Link
            href="/login"
            className="btn btn-primary text-base !py-3.5 !px-8 w-full sm:w-auto shadow-[0_4px_16px_rgba(24,122,186,0.25)] hover:shadow-[0_8px_24px_rgba(24,122,186,0.35)]"
          >
            <ShieldCheck size={18} />
            <span>Coba Akun Demo Alex (1-Klik)</span>
          </Link>
          <Link
            href="/register"
            className="btn btn-secondary text-base !py-3.5 !px-8 w-full sm:w-auto group"
          >
            <span>Daftar Akun Baru</span>
            <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
          </Link>
        </div>

        {/* Highlight Strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-16 pt-12 border-t border-[var(--color-border)] w-full text-left animate-fade-in-up delay-300">
          <div className="p-3 rounded-lg hover:bg-[#fafafa] transition-colors">
            <div className="text-2xl font-extrabold text-[var(--color-navy)]">100% Presisi</div>
            <div className="text-xs text-[var(--color-text-secondary)] mt-1">Saldo Integer Rupiah (No Float Drift)</div>
          </div>
          <div className="p-3 rounded-lg hover:bg-[#fafafa] transition-colors">
            <div className="text-2xl font-extrabold text-[var(--color-navy)]">Multi-Workspace</div>
            <div className="text-xs text-[var(--color-text-secondary)] mt-1">Isolasi Personal & Bisnis</div>
          </div>
          <div className="p-3 rounded-lg hover:bg-[#fafafa] transition-colors">
            <div className="text-2xl font-extrabold text-[var(--color-navy)]">AI Dual-Engine</div>
            <div className="text-xs text-[var(--color-text-secondary)] mt-1">Groq NLP + Gemini Vision Planner</div>
          </div>
          <div className="p-3 rounded-lg hover:bg-[#fafafa] transition-colors">
            <div className="text-2xl font-extrabold text-[var(--color-navy)]">WhatsApp Bot</div>
            <div className="text-xs text-[var(--color-text-secondary)] mt-1">Alert transaksi & limit anggaran</div>
          </div>
        </div>
      </section>

      {/* Feature Cards Grid (Morgan Stanley Style) */}
      <section className="bg-[#fafafa] py-20 px-6 border-y border-[var(--color-border)]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <h2 className="text-3xl font-extrabold text-[var(--color-navy)] font-heading">
              Arsitektur Finansial Kelas Institusional
            </h2>
            <p className="text-[var(--color-text-secondary)] mt-2">
              Didesain khusus untuk efisiensi eksekusi dan kejelasan pelaporan keuangan.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Card 1 */}
            <div className="card p-7 bg-[#ffffff] relative hover:-translate-y-2 hover:shadow-xl transition-all duration-300 group">
              <div className="w-12 h-12 rounded-lg bg-[rgba(24,122,186,0.08)] flex items-center justify-center text-[var(--color-primary)] mb-5 transition-transform group-hover:scale-110 duration-200">
                <Layers size={24} />
              </div>
              <h3 className="text-xl font-bold text-[var(--color-navy)] mb-2 font-heading group-hover:text-[var(--color-primary)] transition-colors">
                Multi-Workspace Terisolasi
              </h3>
              <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed mb-4">
                Kelola rekening pribadi dan pembukuan PT/CV dalam satu dasbor tanpa risiko saldo tertukar. Role-based access control memastikan anggota tim hanya mengakses workspace yang diizinkan.
              </p>
              <div className="text-xs font-semibold text-[var(--color-primary)] flex items-center gap-1">
                <CheckCircle size={14} /> Keuangan pribadi & bisnis terpisah
              </div>
            </div>

            {/* Card 2 */}
            <div className="card p-7 bg-[#ffffff] relative hover:-translate-y-2 hover:shadow-xl transition-all duration-300 group">
              <div className="w-12 h-12 rounded-lg bg-[rgba(0,48,97,0.08)] flex items-center justify-center text-[var(--color-navy)] mb-5 transition-transform group-hover:scale-110 duration-200">
                <PieChart size={24} />
              </div>
              <h3 className="text-xl font-bold text-[var(--color-navy)] mb-2 font-heading group-hover:text-[var(--color-primary)] transition-colors">
                Saldo Atomik & Pagu Anggaran
              </h3>
              <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed mb-4">
                Setiap mutasi pengeluaran, pemasukan, atau transfer antar rekening dieksekusi dengan transaksi database atomik (ACID) untuk memastikan saldo rekening selalu akurat hingga digit terakhir.
              </p>
              <div className="text-xs font-semibold text-[var(--color-primary)] flex items-center gap-1">
                <CheckCircle size={14} /> Integritas data terjamin 100%
              </div>
            </div>

            {/* Card 3 */}
            <div className="card p-7 bg-[#ffffff] relative hover:-translate-y-2 hover:shadow-xl transition-all duration-300 group">
              <div className="w-12 h-12 rounded-lg bg-[rgba(39,174,96,0.08)] flex items-center justify-center text-[#27ae60] mb-5 transition-transform group-hover:scale-110 duration-200">
                <Smartphone size={24} />
              </div>
              <h3 className="text-xl font-bold text-[var(--color-navy)] mb-2 font-heading group-hover:text-[var(--color-primary)] transition-colors">
                WhatsApp Alert & AI Planner
              </h3>
              <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed mb-4">
                Terima ringkasan mutasi langsung ke nomor WhatsApp Anda tanpa jeda. Asisten AI siap membantu simulasi alokasi 50/30/20 dan ekstraksi foto struk belanja secara otomatis.
              </p>
              <div className="text-xs font-semibold text-[var(--color-primary)] flex items-center gap-1">
                <CheckCircle size={14} /> Terintegrasi Fonnte WhatsApp API
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto py-10 px-6 border-t border-[var(--color-border)] bg-[#ffffff]">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-[var(--color-text-secondary)]">
          <div>
            © {new Date().getFullYear()} NexaFinance. Dibangun dengan Next.js 15, Prisma & Better Auth.
          </div>
          <div className="flex items-center gap-6">
            <Link href="/login" className="hover:text-[var(--color-primary)]">Masuk</Link>
            <Link href="/register" className="hover:text-[var(--color-primary)]">Daftar</Link>
            <span>Desain Terinspirasi Morgan Stanley</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
