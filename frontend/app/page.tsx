"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createTrip, type TripRequest, type TripResult } from "@/services/tripServices";
import { getUser, clearSession, type AuthUser } from "@/services/authServices";
import DaysCard from "@/components/DaysCard";
import TripPlannerHero from "@/components/TripPlannerHero";

// ─── Constants ────────────────────────────────────────────────────────────────

const INITIAL_FORM: TripRequest = {
  destination:  "",
  days:         0,
  budget:       0,
  travel_style: "Standard",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style:                 "currency",
    currency:              "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function Label({ children }: { children: React.ReactNode }) {
  return (
    <span
      className="block text-xs font-semibold uppercase tracking-widest mb-1.5"
      style={{ color: "var(--text-secondary)" }}
    >
      {children}
    </span>
  );
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="card flex flex-col gap-0.5 p-4">
      <span
        className="text-xs font-semibold uppercase tracking-widest"
        style={{ color: "var(--text-muted)" }}
      >
        {label}
      </span>
      <span
        className="text-lg font-semibold leading-tight"
        style={{ color: "var(--text-primary)" }}
      >
        {value}
      </span>
    </div>
  );
}

function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-xl ${className ?? ""}`}
      style={{ background: "var(--bg-elevated)" }}
    />
  );
}

// ─── Loading Overlay ──────────────────────────────────────────────────────────

const LOADING_STEPS = [
  { icon: "✈️",  text: "Booking your flight route…"      },
  { icon: "🗺️",  text: "Mapping the best destinations…"  },
  { icon: "🏨",  text: "Scouting top-rated stays…"       },
  { icon: "🍜",  text: "Discovering local food gems…"    },
  { icon: "🚆",  text: "Planning transport connections…" },
  { icon: "🤖",  text: "AI crafting your itinerary…"     },
  { icon: "✨",  text: "Putting the final touches…"      },
];

function LoadingOverlay({ destination }: { destination: string }) {
  const [stepIdx, setStepIdx] = useState(0);
  const [visible, setVisible] = useState(true);

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
      {/* Animated travel track */}
      <div className="w-full max-w-sm flex flex-col items-center gap-3">
        <div className="relative w-full h-px" style={{ background: "var(--border)" }}>
          <div
            className="absolute -top-3 text-xl"
            style={{ animation: "planeFly 2.8s ease-in-out infinite" }}
          >
            ✈️
          </div>
          <span
            className="absolute left-0 -top-1 h-2 w-2 rounded-full"
            style={{ background: "var(--accent)", transform: "translateY(-25%)" }}
          />
          <span
            className="absolute right-0 -top-1 h-2 w-2 rounded-full"
            style={{ background: "var(--accent-glow)", transform: "translateY(-25%)" }}
          >
            <span
              className="absolute inset-0 rounded-full animate-ping"
              style={{ background: "var(--accent)", opacity: 0.5 }}
            />
          </span>
        </div>
        <div className="flex items-center justify-between w-full">
          <span
            className="text-[10px] font-semibold uppercase tracking-widest"
            style={{ color: "var(--text-muted)" }}
          >
            Origin
          </span>
          <span className="text-xs font-bold" style={{ color: "var(--accent)" }}>
            {destination}
          </span>
        </div>
      </div>

      {/* Cycling status */}
      <div
        className="flex flex-col items-center gap-3 text-center"
        style={{ transition: "opacity 0.3s", opacity: visible ? 1 : 0 }}
      >
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

      {/* Progress dots */}
      <div className="flex items-center gap-2">
        {LOADING_STEPS.map((_, i) => (
          <span
            key={i}
            className="rounded-full transition-all duration-300"
            style={{
              width:      i === stepIdx ? "20px" : "6px",
              height:     "6px",
              background: i === stepIdx ? "var(--accent)" : "var(--border)",
            }}
          />
        ))}
      </div>

      {/* Skeleton preview */}
      <div className="w-full max-w-sm flex flex-col gap-3 opacity-20 pointer-events-none">
        <div className="grid grid-cols-4 gap-2">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-14" />)}
        </div>
        <Skeleton className="h-40" />
        <Skeleton className="h-28" />
      </div>

      <style>{`
        @keyframes planeFly {
          0%   { left: 0%;  transform: translateX(0)     scaleX(1);  }
          48%  { left: 95%; transform: translateX(-100%) scaleX(1);  }
          50%  { left: 95%; transform: translateX(-100%) scaleX(-1); }
          98%  { left: 0%;  transform: translateX(0)     scaleX(-1); }
          100% { left: 0%;  transform: translateX(0)     scaleX(1);  }
        }
        @keyframes iconBounce {
          0%   { transform: scale(0.7) translateY(4px);  opacity: 0; }
          60%  { transform: scale(1.15) translateY(-3px);            }
          100% { transform: scale(1)   translateY(0);    opacity: 1; }
        }
      `}</style>
    </div>
  );
}

// ─── Navbar ───────────────────────────────────────────────────────────────────

function Navbar({ user, onLogout }: { user: AuthUser | null; onLogout: () => void }) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    if (!dropdownOpen) return;
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [dropdownOpen]);

  // Derive initials from user name (e.g. "Alex Johnson" → "AJ")
  const initials = user?.name
    ? user.name
        .split(" ")
        .slice(0, 2)
        .map((w) => w[0]?.toUpperCase() ?? "")
        .join("")
    : "?";

  return (
    <header
      className="sticky top-0 z-30 flex items-center gap-3 border-b px-6 py-0 h-[60px]"
      style={{ borderColor: "var(--border)", background: "var(--bg-base)" }}
    >
      {/* Brand */}
      <span className="h-2 w-2 rounded-full" style={{ background: "var(--accent)" }} />
      <span
        className="text-sm font-bold tracking-widest uppercase"
        style={{ color: "var(--text-secondary)" }}
      >
        Kelana<span style={{ color: "var(--accent)" }}>AI</span>
      </span>

      <nav className="ml-auto flex items-center gap-2">
        {/* Ask AI pill */}
        <Link
          href="/ask"
          className="text-xs font-semibold uppercase tracking-widest px-4 py-2 rounded-full border
                     transition-opacity hover:opacity-75"
          style={{ color: "var(--accent)", borderColor: "var(--accent-glow)", background: "var(--accent-dim)" }}
        >
          Ask AI
        </Link>

        {/* Chat pill */}
        <Link
          href="/chat"
          className="text-xs font-semibold uppercase tracking-widest px-4 py-2 rounded-full border
                     transition-opacity hover:opacity-75"
          style={{ color: "var(--text-secondary)", borderColor: "var(--border)" }}
        >
          Chat
        </Link>

        {/* My Trips pill */}
        <Link
          href="/trips"
          className="text-xs font-semibold uppercase tracking-widest px-4 py-2 rounded-full border
                     transition-opacity hover:opacity-75"
          style={{ color: "var(--text-secondary)", borderColor: "var(--border)" }}
        >
          My Trips
        </Link>

        {/* Avatar / sign-in */}
        {user ? (
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen((o) => !o)}
              aria-label="Account menu"
              aria-expanded={dropdownOpen}
              aria-haspopup="menu"
              className="relative flex h-8 w-8 items-center justify-center rounded-full border
                         text-[11px] font-bold tracking-wide transition-colors"
              style={{
                background:   "var(--bg-elevated)",
                borderColor:  dropdownOpen ? "var(--accent-glow)" : "var(--border)",
                color:        "var(--accent)",
              }}
            >
              {initials}
              {/* Online dot */}
              <span
                className="absolute bottom-0 right-0 h-[7px] w-[7px] rounded-full"
                style={{
                  background:  "var(--accent)",
                  border:      "1.5px solid var(--bg-base)",
                }}
                aria-hidden="true"
              />
            </button>

            {/* Dropdown menu */}
            {dropdownOpen && (
              <div
                className="absolute right-0 top-[calc(100%+8px)] z-50 min-w-[180px] rounded-xl border py-1.5
                           shadow-xl animate-fade-in"
                style={{
                  background:  "var(--bg-surface)",
                  borderColor: "var(--border)",
                }}
                role="menu"
              >
                {/* User name row */}
                <div
                  className="px-4 py-2.5 border-b"
                  style={{ borderColor: "var(--border)" }}
                >
                  <p
                    className="text-xs font-semibold truncate"
                    style={{ color: "var(--text-primary)" }}
                  >
                    {user.name}
                  </p>
                  <p className="text-[10px] mt-0.5 truncate" style={{ color: "var(--text-muted)" }}>
                    Signed in
                  </p>
                </div>

                {/* My Trips */}
                <Link
                  href="/trips"
                  role="menuitem"
                  onClick={() => setDropdownOpen(false)}
                  className="flex w-full items-center gap-2.5 px-4 py-2.5 text-xs font-medium
                             transition-colors hover:bg-[var(--bg-elevated)]"
                  style={{ color: "var(--text-secondary)" }}
                >
                  <span aria-hidden="true">🗺️</span> My Trips
                </Link>

                {/* Profile */}
                <Link
                  href="/profile"
                  role="menuitem"
                  onClick={() => setDropdownOpen(false)}
                  className="flex w-full items-center gap-2.5 px-4 py-2.5 text-xs font-medium
                             transition-colors hover:bg-[var(--bg-elevated)]"
                  style={{ color: "var(--text-secondary)" }}
                >
                  <span aria-hidden="true">👤</span> Profile
                </Link>

                {/* Divider */}
                <div className="my-1 border-t" style={{ borderColor: "var(--border)" }} />

                {/* Logout */}
                <button
                  role="menuitem"
                  onClick={() => { setDropdownOpen(false); onLogout(); }}
                  className="flex w-full items-center gap-2.5 px-4 py-2.5 text-xs font-medium
                             transition-colors hover:bg-[var(--bg-elevated)]"
                  style={{ color: "var(--text-muted)" }}
                  onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = "#f87171")}
                  onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = "var(--text-muted)")}
                >
                  <span aria-hidden="true">↩</span> Logout
                </button>
              </div>
            )}
          </div>
        ) : (
          <Link
            href="/login"
            className="text-xs font-semibold uppercase tracking-widest px-4 py-2 rounded-full border
                       transition-opacity hover:opacity-75"
            style={{ color: "var(--accent)", borderColor: "var(--accent-glow)" }}
          >
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

  const [form, setForm]         = useState<TripRequest>(INITIAL_FORM);
  const [result, setResult]     = useState<TripResult | null>(null);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState<string | null>(null);
  const [user, setUser]         = useState<AuthUser | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof TripRequest, string>>>({});

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
    // Clear field error on change
    if (fieldErrors[name as keyof TripRequest]) {
      setFieldErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    // ── Validation ──────────────────────────────────────────────
    const errors: Partial<Record<keyof TripRequest, string>> = {};
    if (!form.destination.trim()) {
      errors.destination = "Destination is required.";
    }
    if (!form.days || form.days < 1) {
      errors.days = "Please enter at least 1 day.";
    } else if (form.days > 365) {
      errors.days = "Maximum is 365 days.";
    }
    if (!form.budget || form.budget < 1) {
      errors.budget = "Please enter a budget greater than $0.";
    }
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }
    setFieldErrors({});
    // ────────────────────────────────────────────────────────────

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
    setFieldErrors({});
  }

  return (
    <>
      {loading && <LoadingOverlay destination={form.destination} />}

      <main
        className="min-h-screen flex flex-col"
        style={{ background: "var(--bg-base)", color: "var(--text-primary)" }}
      >
        <Navbar user={user} onLogout={handleLogout} />

        {!result ? (
          /* ── Two-column hero (form + illustration) ── */
          <TripPlannerHero
            form={form}
            loading={loading}
            error={error}
            fieldErrors={fieldErrors}
            onChange={handleChange}
            onStyleChange={(v) => setForm((p) => ({ ...p, travel_style: v }))}
            onSubmit={handleSubmit}
          />
        ) : (
          /* ── Result view (unchanged) ── */
          <div className="flex-1 flex flex-col items-center px-4 py-16">
            <div className="w-full max-w-2xl animate-fade-up">
              <div className="mb-8">
                <p
                  className="text-xs font-semibold uppercase tracking-widest mb-1"
                  style={{ color: "var(--accent)" }}
                >
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
                  <span
                    className="inline-flex items-center gap-1.5 text-sm font-semibold"
                    style={{ color: "var(--accent)" }}
                  >
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
                  <span
                    className="text-xs font-semibold uppercase tracking-widest"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    Itinerary
                  </span>
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
                  <div
                    className="text-sm leading-relaxed whitespace-pre-line"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    {result.local_food_recommendation}
                  </div>
                </div>
              )}

              {/* Footer */}
              <div className="flex items-center justify-between">
                <button
                  onClick={handleReset}
                  className="text-xs font-semibold uppercase tracking-widest px-4 py-2.5
                             rounded-xl border transition"
                  style={{ color: "var(--text-muted)", borderColor: "var(--border)" }}
                >
                  + New Trip
                </button>
                <Link
                  href="/trips"
                  className="text-xs font-semibold uppercase tracking-widest transition"
                  style={{ color: "var(--accent)" }}
                >
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
