"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signUp } from "@/lib/auth-client";
import { ArrowRight, AlertCircle, CheckCircle2 } from "lucide-react";
import { z } from "zod";

const registerSchema = z
  .object({
    name: z.string("Nama lengkap wajib diisi").min(2, "Nama minimal 2 karakter"),
    email: z.string("Email wajib diisi").email("Format email tidak valid"),
    whatsappNumber: z
      .string("Nomor WhatsApp wajib diisi")
      .min(9, "Nomor WhatsApp minimal 9 digit")
      .regex(/^(\+?62|0)[0-9]{8,13}$/, "Format WhatsApp tidak valid (contoh: 08123456789)"),
    password: z.string("Kata sandi wajib diisi").min(8, "Kata sandi minimal 8 karakter"),
    confirmPassword: z.string("Konfirmasi kata sandi wajib diisi").min(8, "Konfirmasi kata sandi minimal 8 karakter"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Konfirmasi kata sandi tidak cocok",
    path: ["confirmPassword"],
  });

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setFieldErrors({});

    const result = registerSchema.safeParse({
      name,
      email,
      whatsappNumber,
      password,
      confirmPassword,
    });

    if (!result.success) {
      const formattedErrors: Record<string, string> = {};
      result.error.issues.forEach((issue) => {
        const fieldName = issue.path[0] as string;
        if (fieldName && !formattedErrors[fieldName]) {
          formattedErrors[fieldName] = issue.message;
        }
      });
      setFieldErrors(formattedErrors);
      setError(result.error.issues[0]?.message ?? "Periksa kembali isian formulir");
      return;
    }

    setLoading(true);
    try {
      // Format whatsapp number to standardize e.g. 0812 -> 62812 if preferred or keep standard
      const cleanWa = whatsappNumber.startsWith("0")
        ? "62" + whatsappNumber.slice(1)
        : whatsappNumber.replace("+", "");

      const res = await signUp.email({
        name,
        email,
        password,
        whatsappNumber: cleanWa,
      } as Parameters<typeof signUp.email>[0]);

      if (res?.error) {
        setError(res.error.message || "Pendaftaran gagal. Silakan coba kembali.");
      } else {
        router.push("/dashboard");
        router.refresh();
      }
    } catch {
      setError("Gagal menghubungi server pendaftaran.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#ffffff] flex flex-col justify-center items-center p-5 animate-fade-in">
      <div className="w-full max-w-[480px] p-8 border border-[var(--color-border)] rounded-[var(--radius-card)] shadow-[var(--shadow-mid)] hover:shadow-[var(--shadow-high)] transition-all duration-300 bg-[#ffffff] animate-scale-in">
        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="w-12 h-12 bg-[var(--color-primary)] rounded-xl inline-flex items-center justify-center text-white font-extrabold text-2xl mb-3 shadow-[0_4px_14px_rgba(24,122,186,0.3)] animate-float">
            N
          </div>
          <h1 className="text-2xl text-[var(--color-navy)] tracking-tight">
            Nexa<span className="text-[var(--color-primary)]">Finance</span>
          </h1>
          <p className="text-sm text-[var(--color-text-secondary)] mt-1">
            Buka akun Anda dan mulai kendalikan arus kas dengan AI
          </p>
        </div>

        {/* Global Error Banner */}
        {error && (
          <div className="p-3 bg-[rgba(198,34,52,0.08)] border border-[rgba(198,34,52,0.2)] rounded-lg text-[var(--color-accent-red)] text-sm flex items-center gap-2 mb-5">
            <AlertCircle size={16} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="form-group">
            <label className="form-label">Nama Lengkap</label>
            <input
              type="text"
              placeholder="Contoh: Alex Pratama"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={`form-input ${fieldErrors.name ? "!border-[var(--color-accent-red)]" : ""}`}
              required
            />
            {fieldErrors.name && (
              <p className="text-xs text-[var(--color-accent-red)] mt-1">{fieldErrors.name}</p>
            )}
          </div>

          <div className="form-group">
            <label className="form-label">Alamat Email</label>
            <input
              type="email"
              placeholder="nama@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={`form-input ${fieldErrors.email ? "!border-[var(--color-accent-red)]" : ""}`}
              required
            />
            {fieldErrors.email && (
              <p className="text-xs text-[var(--color-accent-red)] mt-1">{fieldErrors.email}</p>
            )}
          </div>

          <div className="form-group">
            <label className="form-label flex justify-between items-center">
              <span>Nomor WhatsApp (Aktif)</span>
              <span className="text-[11px] text-[var(--color-text-secondary)] font-normal">
                Untuk notifikasi otomatis
              </span>
            </label>
            <input
              type="tel"
              placeholder="081234567890"
              value={whatsappNumber}
              onChange={(e) => setWhatsappNumber(e.target.value)}
              className={`form-input ${fieldErrors.whatsappNumber ? "!border-[var(--color-accent-red)]" : ""}`}
              required
            />
            {fieldErrors.whatsappNumber && (
              <p className="text-xs text-[var(--color-accent-red)] mt-1">
                {fieldErrors.whatsappNumber}
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="form-group">
              <label className="form-label">Kata Sandi</label>
              <input
                type="password"
                placeholder="Min 8 karakter"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`form-input ${fieldErrors.password ? "!border-[var(--color-accent-red)]" : ""}`}
                required
              />
              {fieldErrors.password && (
                <p className="text-xs text-[var(--color-accent-red)] mt-1">{fieldErrors.password}</p>
              )}
            </div>

            <div className="form-group">
              <label className="form-label">Ulangi Kata Sandi</label>
              <input
                type="password"
                placeholder="Ulangi kata sandi"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className={`form-input ${fieldErrors.confirmPassword ? "!border-[var(--color-accent-red)]" : ""}`}
                required
              />
              {fieldErrors.confirmPassword && (
                <p className="text-xs text-[var(--color-accent-red)] mt-1">
                  {fieldErrors.confirmPassword}
                </p>
              )}
            </div>
          </div>

          {/* Benefits summary */}
          <div className="p-3 bg-[rgba(24,122,186,0.04)] border border-[rgba(24,122,186,0.15)] rounded-lg text-xs text-[var(--color-text-secondary)] space-y-1.5">
            <div className="flex items-center gap-1.5 font-semibold text-[var(--color-primary)]">
              <CheckCircle2 size={14} /> Otomatisasi pendaftaran:
            </div>
            <div>• Otomatis membuat Workspace "Keuangan Pribadi"</div>
            <div>• 2 Rekening default (Dompet Tunai & Rekening Bank)</div>
            <div>• 11 Kategori keuangan terstruktur (Pemasukan & Pengeluaran)</div>
          </div>

          <button
            type="submit"
            className="btn btn-primary w-full mt-3 !py-3"
            disabled={loading}
          >
            {loading ? "Mendaftarkan Akun..." : "Daftar Akun Sekarang"}
            {!loading && <ArrowRight size={16} />}
          </button>
        </form>

        <div className="text-center mt-6 text-sm text-[var(--color-text-secondary)]">
          Sudah memiliki akun?{" "}
          <Link href="/login" className="font-bold text-[var(--color-primary)] hover:underline">
            Masuk ke Akun
          </Link>
        </div>
      </div>
    </div>
  );
}
