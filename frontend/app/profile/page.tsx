"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getMe, clearSession, type MeResponse } from "@/services/authServices";

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatCard({ label, value, icon }: { label: string; value: string; icon: string }) {
  return (
    <div className="card flex flex-col gap-2 p-5">
      <span className="text-xl">{icon}</span>
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest mb-0.5"
          style={{ color: "var(--text-muted)" }}>
          {label}
        </p>
        <p className="text-lg font-bold leading-tight" style={{ color: "var(--text-primary)" }}>
          {value}
        </p>
      </div>
    </div>
  );
}

function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded-xl ${className ?? ""}`}
    style={{ background: "var(--bg-elevated)" }} />;
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ProfilePage() {
  const router = useRouter();

  const [profile, setProfile] = useState<MeResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);

  useEffect(() => {
    getMe()
      .then(setProfile)
      .catch((err: unknown) => {
        const message = err instanceof Error ? err.message : "Failed to load profile";
        if (message === "Not authenticated" || message.includes("401")) {
          router.push("/login");
        } else {
          setError(message);
        }
      })
      .finally(() => setLoading(false));
  }, [router]);

  function handleLogout() {
    clearSession();
    router.push("/login");
  }

  function formatDate(iso: string) {
    return new Intl.DateTimeFormat("id-ID", {
      day: "numeric", month: "long", year: "numeric",
    }).format(new Date(iso));
  }

  return (
    <main className="min-h-screen flex flex-col"
      style={{ background: "var(--bg-base)", color: "var(--text-primary)" }}>

      {/* Navbar */}
      <header className="border-b px-6 py-4 flex items-center gap-3"
        style={{ borderColor: "var(--border)", background: "var(--bg-base)" }}>
        <span className="h-2 w-2 rounded-full" style={{ background: "var(--accent)" }} />
        <span className="text-sm font-semibold tracking-widest uppercase"
          style={{ color: "var(--text-secondary)" }}>
          Kelana<span style={{ color: "var(--accent)" }}>AI</span>
        </span>
        <nav className="ml-auto flex items-center gap-2">
          <Link href="/"
            className="text-xs font-semibold uppercase tracking-widest px-4 py-2 rounded-xl border transition"
            style={{ color: "var(--text-secondary)", borderColor: "var(--border)" }}>
            Home
          </Link>
          <Link href="/trips"
            className="text-xs font-semibold uppercase tracking-widest px-4 py-2 rounded-xl border transition"
            style={{ color: "var(--text-secondary)", borderColor: "var(--border)" }}>
            My Trips
          </Link>
          {/* Single logout button — only in navbar */}
          <button onClick={handleLogout}
            className="text-xs font-semibold uppercase tracking-widest px-4 py-2 rounded-xl border transition"
            style={{ color: "var(--text-muted)", borderColor: "var(--border)" }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLButtonElement).style.color = "#f87171";
              (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(127,29,29,0.5)";
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLButtonElement).style.color = "var(--text-muted)";
              (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--border)";
            }}>
            Logout
          </button>
        </nav>
      </header>

      <div className="flex-1 flex flex-col items-center justify-start px-4 py-16">
        <div className="w-full max-w-md">

          {/* Title */}
          <div className="mb-8">
            <p className="text-xs font-semibold uppercase tracking-widest mb-1"
              style={{ color: "var(--accent)" }}>
              Account
            </p>
            <h1 className="text-3xl font-bold tracking-tight">Profile</h1>
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-start gap-3 text-xs rounded-xl px-4 py-3 mb-6"
              style={{ color: "#f87171", background: "rgba(127,29,29,0.25)", border: "1px solid rgba(127,29,29,0.5)" }}>
              <span className="mt-0.5 shrink-0">✕</span>
              <span>{error}</span>
            </div>
          )}

          {/* Loading skeleton */}
          {loading && (
            <div className="flex flex-col gap-4">
              <Skeleton className="h-32 rounded-2xl" />
              <div className="grid grid-cols-2 gap-3">
                <Skeleton className="h-24" />
                <Skeleton className="h-24" />
              </div>
            </div>
          )}

          {/* Profile content */}
          {!loading && profile && (
            <div className="flex flex-col gap-4 animate-fade-up">

              {/* ── Single avatar + info card (no duplicate below) ── */}
              <div className="card rounded-2xl p-6 flex flex-col items-center text-center gap-4">
                {/* Avatar */}
                <div className="h-20 w-20 rounded-full flex items-center justify-center text-2xl font-bold"
                  style={{
                    background: "var(--accent-dim)",
                    border: "2px solid var(--accent-glow)",
                    color: "var(--accent)",
                  }}>
                  {profile.name.charAt(0).toUpperCase()}
                </div>
                {/* Name */}
                <div>
                  <p className="text-xl font-bold leading-tight">{profile.name}</p>
                  <p className="text-sm mt-0.5" style={{ color: "var(--text-secondary)" }}>
                    {profile.email}
                  </p>
                </div>
                {/* Accent divider */}
                <div className="w-12 h-0.5 rounded-full" style={{ background: "var(--accent)" }} />
              </div>

              {/* ── 2 Stat cards ── */}
              <div className="grid grid-cols-2 gap-3">
                <StatCard
                  icon="✈️"
                  label="Trips Generated"
                  value={`${profile.total_trips_generated}`}
                />
                <StatCard
                  icon="📅"
                  label="Member Since"
                  value={formatDate(profile.created_at)}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
