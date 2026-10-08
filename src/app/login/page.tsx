"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "@/lib/auth-client";
import { ArrowRight, ShieldCheck, AlertCircle } from "lucide-react";
import { z } from "zod";

const loginSchema = z.object({
  email: z.string().email("Format email tidak valid"),
  password: z.string().min(1, "Kata sandi wajib diisi"),
});

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      });

      if (res?.error) {
        setError(res.error.message || "Email atau kata sandi tidak cocok.");
      } else {
        if (typeof window !== "undefined") {
          try {
            localStorage.removeItem("nexa_explicit_logged_out");
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

  return (
    <div className="min-h-screen bg-[#ffffff] flex flex-col justify-center items-center p-5 animate-fade-in">
      <div className="w-full max-w-[440px] p-8 border border-[var(--color-border)] rounded-[var(--radius-card)] shadow-[var(--shadow-mid)] hover:shadow-[var(--shadow-high)] transition-all duration-300 bg-[#ffffff] animate-scale-in">
        {/* Brand */}
        <div className="text-center mb-7">
          <div className="w-12 h-12 bg-[var(--color-primary)] rounded-xl inline-flex items-center justify-center text-white font-extrabold text-2xl mb-3 shadow-[0_4px_14px_rgba(24,122,186,0.3)] animate-float">
            N
          </div>
          <h1 className="text-2xl text-[var(--color-navy)] tracking-tight">
            Nexa<span className="text-[var(--color-primary)]">Finance</span>
          </h1>
          <p className="text-sm text-[var(--color-text-secondary)] mt-1">
            Masuk ke portal manajemen keuangan cerdas Anda
          </p>
        </div>

        {error && (
          <div className="p-3 bg-[rgba(198,34,52,0.08)] border border-[rgba(198,34,52,0.2)] rounded-lg text-[var(--color-accent-red)] text-sm flex items-center gap-2 mb-5">
            <AlertCircle size={16} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input
              type="email"
              placeholder="nama@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="form-input"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Kata Sandi</label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="form-input"
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary w-full mt-2"
            disabled={loading}
          >
            {loading ? "Memverifikasi..." : "Masuk"}
            {!loading && <ArrowRight size={16} />}
          </button>
        </form>

        <div className="text-center mt-6 text-sm text-[var(--color-text-secondary)]">
          Belum memiliki akun?{" "}
          <Link href="/register" className="font-bold text-[var(--color-primary)] hover:underline">
            Daftar Sekarang
          </Link>
        </div>
      </div>
    </div>
  );
}
