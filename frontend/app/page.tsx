"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createTrip, type TripRequest, type TripResult } from "@/services/tripServices";
import { getUser, clearSession, type AuthUser } from "@/services/authServices";
import DaysCard from "@/components/DaysCard";

// ─── Constants ────────────────────────────────────────────────────────────────

const TRAVEL_STYLES: { value: string; label: string; icon: string }[] = [
  { value: "Budget",   label: "Budget",   icon: "🎒" },
  { value: "Standard", label: "Standard", icon: "🧳" },
  { value: "Luxury",   label: "Luxury",   icon: "🌴" },
];

const INITIAL_FORM: TripRequest = {
  destination:  "",
  days:         5,
  budget:       1000,
  travel_style: "Standard",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function Label({ children }: { children: React.ReactNode }) {
  return (
    <span className="block text-xs font-semibold uppercase tracking-widest mb-1.5"
      style={{ color: "var(--text-secondary)" }}>
      {children}
    </span>
  );
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="card flex flex-col gap-0.5 p-4">
      <span className="text-xs font-semibold uppercase tracking-widest"
        style={{ color: "var(--text-muted)" }}>
        {label}
      </span>
      <span className="text-lg font-semibold leading-tight"
        style={{ color: "var(--text-primary)" }}>
        {value}
      </span>
    </div>
  );
}

function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded-xl ${className ?? ""}`}
    style={{ background: "var(--bg-elevated)" }} />;
}

// ─── Loading Overlay ──────────────────────────────────────────────────────────

const LOADING_STEPS = [
  { icon: "✈️",  text: "Booking your flight route…"           },
  { icon: "🗺️",  text: "Mapping the best destinations…"       },
  { icon: "🏨",  text: "Scouting top-rated stays…"            },
  { icon: "🍜",  text: "Discovering local food gems…"         },
  { icon: "🚆",  text: "Planning transport connections…"      },
  { icon: "🤖",  text: "AI crafting your itinerary…"          },
  { icon: "✨",  text: "Putting the final touches…"           },
];

function LoadingOverlay({ destination }: { destination: string }) {
  const [stepIdx, setStepIdx] = useState(0);
  const [visible, setVisible] = useState(true);

  // Cycle through steps every 2.2s with fade transition
  useEffect(() => {
    const interval = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setStepIdx((i) => (i + 1) % LOADING_STEPS.length);
        setVisible(true);
      }, 300);
    }, 2200);
    return () => clearInterval(interval);
  }, []);

  const step = LOADING_STEPS[stepIdx];

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-10 px-4"
      style={{ background: "rgba(13,13,13,0.96)", backdropFilter: "blur(12px)" }}
    >
      {/* ── Animated travel track ── */}
      <div className="w-full max-w-sm flex flex-col items-center gap-3">
        {/* Track */}
        <div className="relative w-full h-px" style={{ background: "var(--border)" }}>
          {/* Moving plane */}
          <div
            className="absolute -top-3 text-xl"
            style={{
              animation: "planeFly 2.8s ease-in-out infinite",
            }}
          >
            ✈️
          </div>
          {/* Origin dot */}
          <span className="absolute left-0 -top-1 h-2 w-2 rounded-full"
            style={{ background: "var(--accent)", transform: "translateY(-25%)" }} />
          {/* Dest dot pulse */}
          <span className="absolute right-0 -top-1 h-2 w-2 rounded-full"
            style={{ background: "var(--accent-glow)", transform: "translateY(-25%)" }}>
            <span className="absolute inset-0 rounded-full animate-ping"
              style={{ background: "var(--accent)", opacity: 0.5 }} />
          </span>
        </div>

        {/* Destination label */}
        <div className="flex items-center justify-between w-full">
          <span className="text-[10px] font-semibold uppercase tracking-widest"
            style={{ color: "var(--text-muted)" }}>Origin</span>
          <span className="text-xs font-bold" style={{ color: "var(--accent)" }}>
            {destination}
          </span>
        </div>
      </div>

      {/* ── Cycling status message ── */}
      <div className="flex flex-col items-center gap-3 text-center"
        style={{ transition: "opacity 0.3s", opacity: visible ? 1 : 0 }}>
        <span className="text-5xl" style={{ animation: "iconBounce 0.6s ease" }}>
          {step.icon}
        </span>
        <p className="text-base font-semibold" style={{ color: "var(--text-primary)" }}>
          {step.text}
        </p>
        <p className="text-xs" style={{ color: "var(--text-muted)" }}>
          Generating itinerary for{" "}
          <span style={{ color: "var(--accent)" }}>{destination}</span>
        </p>
      </div>

      {/* ── Progress dots ── */}
      <div className="flex items-center gap-2">
        {LOADING_STEPS.map((_, i) => (
          <span
            key={i}
            className="rounded-full transition-all duration-300"
            style={{
              width:   i === stepIdx ? "20px" : "6px",
              height:  "6px",
              background: i === stepIdx ? "var(--accent)" : "var(--border)",
            }}
          />
        ))}
      </div>

      {/* ── Skeleton preview cards ── */}
      <div className="w-full max-w-sm flex flex-col gap-3 opacity-20 pointer-events-none">
        <div className="grid grid-cols-4 gap-2">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-14" />)}
        </div>
        <Skeleton className="h-40" />
        <Skeleton className="h-28" />
      </div>

      {/* Inline keyframes */}
      <style>{`
        @keyframes planeFly {
          0%   { left: 0%;   transform: translateX(0)    scaleX(1); }
          48%  { left: 95%;  transform: translateX(-100%) scaleX(1); }
          50%  { left: 95%;  transform: translateX(-100%) scaleX(-1); }
          98%  { left: 0%;   transform: translateX(0)    scaleX(-1); }
          100% { left: 0%;   transform: translateX(0)    scaleX(1); }
        }
        @keyframes iconBounce {
          0%   { transform: scale(0.7) translateY(4px); opacity: 0; }
          60%  { transform: scale(1.15) translateY(-3px); }
          100% { transform: scale(1) translateY(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
}

// ─── Segmented Control ────────────────────────────────────────────────────────

function SegmentedControl({
  value,
  onChange,
  disabled,
}: {
  value: string;
  onChange: (v: string) => void;
  disabled: boolean;
}) {
  return (
    <div className="flex rounded-xl p-1 gap-1" style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)" }}>
      {TRAVEL_STYLES.map((s) => {
        const active = value === s.value;
        return (
          <button
            key={s.value}
            type="button"
            disabled={disabled}
            onClick={() => onChange(s.value)}
            className="flex-1 flex items-center justify-center gap-1.5 rounded-lg py-2.5 text-xs font-semibold transition-all duration-150 disabled:opacity-40"
            style={
              active
                ? { background: "var(--accent)", color: "#0D0D0D" }
                : { background: "transparent", color: "var(--text-secondary)" }
            }
          >
            <span>{s.icon}</span>
            <span>{s.label}</span>
          </button>
        );
      })}
    </div>
  );
}

// ─── Navbar ───────────────────────────────────────────────────────────────────

function Navbar({ user, onLogout }: { user: AuthUser | null; onLogout: () => void }) {
  return (
    <header className="border-b px-6 py-4 flex items-center gap-3"
      style={{ borderColor: "var(--border)", background: "var(--bg-base)" }}>
      <span className="h-2 w-2 rounded-full" style={{ background: "var(--accent)" }} />
      <span className="text-sm font-semibold tracking-widest uppercase"
        style={{ color: "var(--text-secondary)" }}>
        Kelana<span style={{ color: "var(--accent)" }}>AI</span>
      </span>
      <nav className="ml-auto flex items-center gap-2">
        <Link href="/ask"
          className="text-xs font-semibold uppercase tracking-widest px-4 py-2 rounded-xl border transition hover:opacity-80"
          style={{ color: "var(--accent)", borderColor: "var(--accent-glow)" }}>
          Ask AI
        </Link>
        <Link href="/trips"
          className="text-xs font-semibold uppercase tracking-widest px-4 py-2 rounded-xl border transition hover:opacity-80"
          style={{ color: "var(--text-secondary)", borderColor: "var(--border)" }}>
          My Trips
        </Link>
        {user ? (
          <>
            <Link href="/profile"
              className="text-xs font-semibold uppercase tracking-widest px-4 py-2 rounded-xl border transition hover:opacity-80 hidden sm:block"
              style={{ color: "var(--text-secondary)", borderColor: "var(--border)" }}>
              {user.name}
            </Link>
            <button onClick={onLogout}
              className="text-xs font-semibold uppercase tracking-widest px-4 py-2 rounded-xl border transition"
              style={{ color: "var(--text-muted)", borderColor: "var(--border)" }}
              onMouseEnter={e => (e.currentTarget.style.color = "#f87171")}
              onMouseLeave={e => (e.currentTarget.style.color = "var(--text-muted)")}>
              Logout
            </button>
          </>
        ) : (
          <Link href="/login"
            className="text-xs font-semibold uppercase tracking-widest px-4 py-2 rounded-xl border transition"
            style={{ color: "var(--accent)", borderColor: "var(--accent-glow)" }}>
            Sign In
          </Link>
        )}
      </nav>
    </header>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function Home() {
  const router = useRouter();

  const [form, setForm]       = useState<TripRequest>(INITIAL_FORM);
  const [result, setResult]   = useState<TripResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);
  const [user, setUser]       = useState<AuthUser | null>(null);

  useEffect(() => { setUser(getUser()); }, []);

  function handleLogout() {
    clearSession();
    setUser(null);
    router.push("/login");
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: name === "days" || name === "budget" ? Number(value) : value,
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const data = await createTrip(form);
      setResult(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  function handleReset() {
    setResult(null);
    setForm(INITIAL_FORM);
    setError(null);
  }

  return (
    <>
      {loading && <LoadingOverlay destination={form.destination} />}

      <main className="min-h-screen flex flex-col" style={{ background: "var(--bg-base)", color: "var(--text-primary)" }}>
        <Navbar user={user} onLogout={handleLogout} />

        {!result ? (
          /* ─────────── HERO + FORM ─────────── */
          <div className="relative flex-1 flex flex-col items-center justify-center px-4 py-16 overflow-hidden">
            {/* Subtle map grid overlay */}
            <div className="map-overlay absolute inset-0 pointer-events-none" />
            {/* Accent glow center */}
            <div className="absolute inset-0 pointer-events-none"
              style={{ background: "radial-gradient(ellipse 60% 40% at 50% 60%, rgba(86,171,124,0.06) 0%, transparent 70%)" }} />

            <div className="relative w-full max-w-md">
              {/* Hero text */}
              <div className="mb-10">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold mb-4"
                  style={{ background: "var(--accent-dim)", color: "var(--accent)", border: "1px solid var(--accent-glow)" }}>
                  <span className="h-1.5 w-1.5 rounded-full animate-pulse" style={{ background: "var(--accent)" }} />
                  AI-Powered Trip Planner
                </div>
                <h1 className="text-4xl font-bold tracking-tight leading-tight" style={{ color: "var(--text-primary)" }}>
                  KelanaAI<span style={{ color: "var(--accent)" }}>.</span>
                </h1>
                <p className="mt-2 text-sm" style={{ color: "var(--text-secondary)" }}>
                  Tell us where you&apos;re going and we&apos;ll handle the rest.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                {/* Destination */}
                <div>
                  <Label>Destination</Label>
                  <input
                    name="destination"
                    type="text"
                    placeholder="e.g. Japan, Bali, Paris"
                    value={form.destination}
                    onChange={handleChange}
                    required
                    disabled={loading}
                    className="input-base"
                  />
                </div>

                {/* Days + Budget */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Days</Label>
                    <input
                      name="days"
                      type="number"
                      min={1}
                      max={365}
                      value={form.days}
                      onChange={handleChange}
                      required
                      disabled={loading}
                      className="input-base"
                    />
                  </div>
                  <div>
                    <Label>Budget <span className="normal-case font-normal tracking-normal" style={{ color: "var(--text-muted)" }}>(USD)</span></Label>
                    <input
                      name="budget"
                      type="number"
                      min={1}
                      value={form.budget}
                      onChange={handleChange}
                      required
                      disabled={loading}
                      className="input-base"
                    />
                  </div>
                </div>

                {/* Travel Style — Segmented Control */}
                <div>
                  <Label>Travel Style</Label>
                  <SegmentedControl
                    value={form.travel_style}
                    onChange={(v) => setForm((p) => ({ ...p, travel_style: v }))}
                    disabled={loading}
                  />
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
                      Planning…
                    </>
                  ) : "Generate Trip Plan"}
                </button>
              </form>
            </div>
          </div>
        ) : (
          /* ─────────── RESULT ─────────── */
          <div className="flex-1 flex flex-col items-center px-4 py-16">
            <div className="w-full max-w-2xl animate-fade-up">
              <div className="mb-8">
                <p className="text-xs font-semibold uppercase tracking-widest mb-1"
                  style={{ color: "var(--accent)" }}>
                  Trip #{result.id}
                </p>
                <h1 className="text-3xl font-bold tracking-tight">{result.destination}</h1>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                <StatCard label="Total Budget"  value={formatCurrency(result.budget)} />
                <StatCard label="Daily Budget"  value={formatCurrency(result.daily_budget)} />
                <StatCard label="Days"          value={`${form.days} days`} />
                <StatCard label="Travel Style"  value={form.travel_style} />
              </div>

              {/* Category + Transport */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
                <div className="card p-4">
                  <Label>Category</Label>
                  <span className="inline-flex items-center gap-1.5 text-sm font-semibold"
                    style={{ color: "var(--accent)" }}>
                    <span className="h-1.5 w-1.5 rounded-full" style={{ background: "var(--accent)" }} />
                    {result.category}
                  </span>
                </div>
                <div className="card p-4">
                  <Label>Transportation</Label>
                  <span className="text-sm font-semibold">{result.recommendation_transportation}</span>
                </div>
              </div>

              {/* Itinerary */}
              <div className="card p-5 mb-6">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-xs font-semibold uppercase tracking-widest"
                    style={{ color: "var(--text-secondary)" }}>Itinerary</span>
                  <span style={{ color: "var(--text-muted)" }}>·</span>
                  <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                    {form.days} {form.days === 1 ? "day" : "days"}
                  </span>
                </div>
                <DaysCard text={result.ai_recommendation} />
              </div>

              {/* Local Food */}
              {result.local_food_recommendation && (
                <div className="card p-6 mb-6">
                  <div className="flex items-center gap-2 mb-3">
                    <Label>Local Food</Label>
                    <span className="mb-1.5 text-base">🍜</span>
                  </div>
                  <div className="text-sm leading-relaxed whitespace-pre-line"
                    style={{ color: "var(--text-secondary)" }}>
                    {result.local_food_recommendation}
                  </div>
                </div>
              )}

              {/* Footer */}
              <div className="flex items-center justify-between">
                <button onClick={handleReset}
                  className="text-xs font-semibold uppercase tracking-widest px-4 py-2.5 rounded-xl border transition"
                  style={{ color: "var(--text-muted)", borderColor: "var(--border)" }}>
                  + New Trip
                </button>
                <Link href="/trips"
                  className="text-xs font-semibold uppercase tracking-widest transition"
                  style={{ color: "var(--accent)" }}>
                  View all trips →
                </Link>
              </div>
            </div>
          </div>
        )}
      </main>
    </>
  );
}
