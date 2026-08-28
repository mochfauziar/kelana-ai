"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getMe, clearSession, type MeResponse } from "@/services/authServices";

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="flex flex-col gap-1 p-5 rounded-xl bg-neutral-900 border border-neutral-800">
      <span className="text-xs font-semibold uppercase tracking-widest text-neutral-500">
        {label}
      </span>
      <span className="text-lg font-semibold text-white leading-tight">{value}</span>
    </div>
  );
}

function Skeleton({ className }: { className?: string }) {
  return (
    <div className={`animate-pulse rounded-xl bg-neutral-800 ${className ?? ""}`} />
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ProfilePage() {
  const router = useRouter();

  const [profile, setProfile]   = useState<MeResponse | null>(null);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState<string | null>(null);

  useEffect(() => {
    getMe()
      .then(setProfile)
      .catch((err: unknown) => {
        const message = err instanceof Error ? err.message : "Failed to load profile";
        // Token tidak valid atau tidak ada — redirect ke login
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

  // ── Format tanggal ─────────────────────────────────────────────────────────
  function formatDate(iso: string) {
    return new Intl.DateTimeFormat("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(new Date(iso));
  }

  return (
    <main className="min-h-screen bg-neutral-950 text-white flex flex-col">
      {/* Header */}
      <header className="border-b border-neutral-900 px-6 py-4 flex items-center gap-3">
        <span className="h-2 w-2 rounded-full bg-emerald-400" />
        <span className="text-sm font-semibold tracking-widest uppercase text-neutral-300">
          Kelana<span className="text-emerald-400">AI</span>
        </span>
        <nav className="ml-auto flex items-center gap-3">
          <Link
            href="/"
            className="text-xs font-semibold uppercase tracking-widest text-neutral-500 hover:text-white border border-neutral-800 hover:border-neutral-600 rounded-xl px-4 py-2 transition"
          >
            Home
          </Link>
          <Link
            href="/trips"
            className="text-xs font-semibold uppercase tracking-widest text-neutral-500 hover:text-white border border-neutral-800 hover:border-neutral-600 rounded-xl px-4 py-2 transition"
          >
            My Trips
          </Link>
          <button
            onClick={handleLogout}
            className="text-xs font-semibold uppercase tracking-widest text-neutral-500 hover:text-red-400 border border-neutral-800 hover:border-red-900 rounded-xl px-4 py-2 transition"
          >
            Logout
          </button>
        </nav>
      </header>

      <div className="flex-1 flex flex-col items-center justify-start px-4 py-16">
        <div className="w-full max-w-lg">

          {/* Title */}
          <div className="mb-10">
            <p className="text-xs font-semibold uppercase tracking-widest text-emerald-400 mb-1">
              Account
            </p>
            <h1 className="text-3xl font-bold tracking-tight">Profile</h1>
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-start gap-3 text-xs text-red-400 bg-red-950/40 border border-red-900/50 rounded-xl px-4 py-3 mb-6">
              <span className="mt-0.5 shrink-0">✕</span>
              <span>{error}</span>
            </div>
          )}

          {/* Loading skeleton */}
          {loading && (
            <div className="flex flex-col gap-4">
              {/* Avatar skeleton */}
              <div className="flex items-center gap-4 p-5 rounded-xl bg-neutral-900 border border-neutral-800">
                <Skeleton className="h-14 w-14 rounded-full" />
                <div className="flex flex-col gap-2 flex-1">
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-3 w-2/3" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Skeleton className="h-20" />
                <Skeleton className="h-20" />
              </div>
              <Skeleton className="h-20" />
            </div>
          )}

          {/* Profile content */}
          {!loading && profile && (
            <div className="flex flex-col gap-4">

              {/* Avatar + name card */}
              <div className="flex items-center gap-5 p-5 rounded-xl bg-neutral-900 border border-neutral-800">
                {/* Avatar initials */}
                <div className="flex-shrink-0 h-14 w-14 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
                  <span className="text-lg font-bold text-emerald-400">
                    {profile.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <p className="text-base font-semibold text-white leading-tight">
                    {profile.name}
                  </p>
                  <p className="text-sm text-neutral-400 mt-0.5">{profile.email}</p>
                </div>
              </div>

              {/* Stats grid */}
              <div className="grid grid-cols-2 gap-3">
                <StatCard label="Name"  value={profile.name} />
                <StatCard label="Email" value={profile.email} />
              </div>

              <StatCard
                label="Total Trips Generated"
                value={`${profile.total_trips_generated} trip${profile.total_trips_generated !== 1 ? "s" : ""}`}
              />

              <StatCard
                label="Member Since"
                value={formatDate(profile.created_at)}
              />

              {/* Actions */}
              <div className="flex justify-end pt-2">
                <button
                  onClick={handleLogout}
                  className="text-xs font-semibold uppercase tracking-widest text-red-400 hover:text-red-300 border border-red-900/50 hover:border-red-700 rounded-xl px-5 py-2.5 transition"
                >
                  Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
