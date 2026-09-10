"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { register } from "@/services/authServices";
import { useGuestGuard } from "@/lib/useAuthGuard";

function EyeIcon({ open }: { open: boolean }) {
  return open ? (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  ) : (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
    </svg>
  );
}

export default function RegisterPage() {
  const router = useRouter();
  const { ready } = useGuestGuard();

  const [form, setForm]           = useState({ name: "", email: "", password: "" });
  const [showPassword, setShowPw] = useState(false);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState<string | null>(null);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await register({ name: form.name, email: form.email, password: form.password });
      router.push("/login");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  if (!ready) return null;

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4 relative overflow-hidden"
      style={{ background: "var(--bg-base)", color: "var(--text-primary)" }}>
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: "radial-gradient(ellipse 50% 35% at 50% 55%, rgba(86,171,124,0.06) 0%, transparent 70%)" }} />

      <div className="relative w-full max-w-sm">
        {/* Logo */}
        <div className="flex items-center gap-2 mb-10">
          <span className="h-2 w-2 rounded-full" style={{ background: "var(--accent)" }} />
          <span className="text-sm font-semibold tracking-widest uppercase" style={{ color: "var(--text-secondary)" }}>
            Kelana<span style={{ color: "var(--accent)" }}>AI</span>
          </span>
        </div>

        <h1 className="text-2xl font-bold tracking-tight mb-1">Create account</h1>
        <p className="text-sm mb-8" style={{ color: "var(--text-secondary)" }}>
          Start planning AI-powered trips today.
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Name */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-widest mb-1.5"
              style={{ color: "var(--text-secondary)" }}>Name</label>
            <input name="name" type="text" placeholder="Alice"
              value={form.name} onChange={handleChange}
              required disabled={loading} className="input-base" />
          </div>

          {/* Email */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-widest mb-1.5"
              style={{ color: "var(--text-secondary)" }}>Email</label>
            <input name="email" type="email" placeholder="alice@email.com"
              value={form.email} onChange={handleChange}
              required disabled={loading} className="input-base" />
          </div>

          {/* Password */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-widest mb-1.5"
              style={{ color: "var(--text-secondary)" }}>Password</label>
            <div className="relative">
              <input
                name="password"
                type={showPassword ? "text" : "password"}
                placeholder="Min. 8 characters"
                value={form.password}
                onChange={handleChange}
                required
                minLength={8}
                disabled={loading}
                className="input-base pr-11"
              />
              <button type="button" onClick={() => setShowPw((v) => !v)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 transition"
                style={{ color: "var(--text-muted)" }} tabIndex={-1}
                aria-label={showPassword ? "Hide password" : "Show password"}>
                <EyeIcon open={showPassword} />
              </button>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-start gap-3 text-xs rounded-xl px-4 py-3"
              style={{ color: "#f87171", background: "rgba(127,29,29,0.25)", border: "1px solid rgba(127,29,29,0.5)" }}>
              <span className="mt-0.5 shrink-0">✕</span>
              <span>{error}</span>
            </div>
          )}

          {/* Submit */}
          <button type="submit" disabled={loading} className="btn-accent mt-1 w-full py-3">
            {loading ? (
              <>
                <span className="h-3.5 w-3.5 rounded-full border-2 border-t-transparent animate-spin"
                  style={{ borderColor: "rgba(13,13,13,0.4)", borderTopColor: "transparent" }} />
                Creating account…
              </>
            ) : "Create Account"}
          </button>
        </form>

        <p className="mt-6 text-center text-xs" style={{ color: "var(--text-muted)" }}>
          Already have an account?{" "}
          <Link href="/login" className="font-semibold" style={{ color: "var(--accent)" }}>
            Sign In
          </Link>
        </p>
      </div>
    </main>
  );
}
