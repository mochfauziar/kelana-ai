"use client";

// Two-column hero: form (left) + illustration panel (right).
// All form state and submit logic live in page.tsx and flow in via props —
// this component is purely layout + presentation for the "no result yet" state.

import TripPlannerVisual from "@/components/TripPlannerVisual";
import type { TripRequest } from "@/services/tripServices";

// ─── Travel style config ───────────────────────────────────────────────────

const TRAVEL_STYLES: { value: string; label: string; icon: string }[] = [
  { value: "Budget",   label: "Budget",   icon: "🎒" },
  { value: "Standard", label: "Standard", icon: "🧳" },
  { value: "Luxury",   label: "Luxury",   icon: "🌴" },
];

// ─── Props ─────────────────────────────────────────────────────────────────

interface TripPlannerHeroProps {
  form:      TripRequest;
  loading:   boolean;
  error:     string | null;
  fieldErrors: Partial<Record<keyof TripRequest, string>>;
  onChange:  (e: React.ChangeEvent<HTMLInputElement>) => void;
  onStyleChange: (v: string) => void;
  onSubmit:  (e: React.FormEvent) => void;
}

// ─── Small shared sub-components ───────────────────────────────────────────

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <span
      className="mb-1.5 block text-[10px] font-semibold uppercase tracking-widest"
      style={{ color: "var(--text-muted)" }}
    >
      {children}
    </span>
  );
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p
      className="mt-1.5 text-[11px] font-medium"
      style={{ color: "#f87171" }}
      role="alert"
    >
      {message}
    </p>
  );
}

// ─── Segmented travel-style control ────────────────────────────────────────

function TravelStyleControl({
  value,
  onChange,
  disabled,
}: {
  value: string;
  onChange: (v: string) => void;
  disabled: boolean;
}) {
  return (
    <div
      className="flex gap-1 rounded-xl p-1"
      style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)" }}
      role="group"
      aria-label="Travel style"
    >
      {TRAVEL_STYLES.map((s) => {
        const active = value === s.value;
        return (
          <button
            key={s.value}
            type="button"
            disabled={disabled}
            onClick={() => onChange(s.value)}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2.5 text-xs font-semibold
                       transition-all duration-150 disabled:opacity-40"
            style={
              active
                ? { background: "var(--accent)", color: "#0c0f0d" }
                : { background: "transparent", color: "var(--text-secondary)" }
            }
            aria-pressed={active}
          >
            <span aria-hidden="true">{s.icon}</span>
            <span>{s.label}</span>
          </button>
        );
      })}
    </div>
  );
}

// ─── Main component ─────────────────────────────────────────────────────────

export default function TripPlannerHero({
  form,
  loading,
  error,
  fieldErrors,
  onChange,
  onStyleChange,
  onSubmit,
}: TripPlannerHeroProps) {
  return (
    /*
     * Split layout:
     *   – Left: form, fixed max-width ~560px
     *   – Right: illustration, fills remaining space
     *   – Below lg breakpoint: illustration hidden, form full-width
     *
     * We use a flex row so the illustration column can use flex-1.
     * The outer wrapper is flex-1 so it fills the remaining viewport height
     * below the navbar.
     */
    <div className="flex flex-1">
      {/* ── Form column ──────────────────────────────────────────── */}
      <section
        className="relative z-10 flex w-full flex-col justify-center px-8 py-14
                   lg:w-[560px] lg:shrink-0 lg:px-14"
        style={{ background: "var(--bg-base)" }}
      >
        {/* Subtle map-grid overlay (matches existing page style) */}
        <div className="map-overlay pointer-events-none absolute inset-0" aria-hidden="true" />

        {/* Accent glow behind form */}
        <div
          className="pointer-events-none absolute inset-0"
          aria-hidden="true"
          style={{
            background:
              "radial-gradient(ellipse 70% 50% at 50% 65%, rgba(143,212,160,0.05) 0%, transparent 70%)",
          }}
        />

        {/* Content wrapper — max-width so form doesn't sprawl on wide screens */}
        <div className="relative mx-auto w-full max-w-[460px]">

          {/* ── Hero text ── */}
          <div className="mb-10">
            {/* Badge */}
            <div
              className="mb-4 inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] font-semibold"
              style={{
                background:   "var(--accent-dim)",
                color:        "var(--accent)",
                border:       "1px solid var(--accent-glow)",
              }}
            >
              <span
                className="h-1.5 w-1.5 animate-pulse rounded-full"
                style={{ background: "var(--accent)" }}
                aria-hidden="true"
              />
              AI-Powered Trip Planner
            </div>

            {/* Headline — Fraunces serif */}
            <h1
              className="text-[clamp(34px,4.5vw,48px)] font-bold leading-[1.07] tracking-tight"
              style={{
                fontFamily: "var(--font-fraunces), Georgia, serif",
                color:      "var(--text-primary)",
              }}
            >
              Plan your next{" "}
              <em
                className="not-italic"
                style={{ color: "var(--accent)", fontStyle: "italic" }}
              >
                escape.
              </em>
            </h1>

            <p
              className="mt-2.5 text-sm leading-relaxed"
              style={{ color: "var(--text-secondary)" }}
            >
              Tell us where you&apos;re headed and we&apos;ll craft a full itinerary —
              stays, food, transport &amp; more.
            </p>
          </div>

          {/* ── Form ── */}
          <form onSubmit={onSubmit} className="flex flex-col gap-5" noValidate>

            {/* Destination */}
            <div>
              <FieldLabel>Destination</FieldLabel>
              <input
                name="destination"
                type="text"
                placeholder="e.g. Japan, Bali, Paris"
                value={form.destination}
                onChange={onChange}
                required
                disabled={loading}
                className="input-base"
                autoComplete="off"
                style={fieldErrors.destination ? { borderColor: "#f87171" } : undefined}
              />
              <FieldError message={fieldErrors.destination} />
            </div>

            {/* Days + Budget — two-column */}
            <div className="grid grid-cols-2 gap-4">

              {/* Days */}
              <div>
                <FieldLabel>Days</FieldLabel>
                {/* Wrapper for suffix adornment */}
                <div className="relative">
                  <input
                    name="days"
                    type="number"
                    min={1}
                    max={365}
                    placeholder="e.g. 7"
                    value={form.days || ""}
                    onChange={onChange}
                    required
                    disabled={loading}
                    /* extra right padding so number doesn't overlap "days" label */
                    className="input-base [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none
                               [&::-webkit-outer-spin-button]:appearance-none pr-12"
                    style={fieldErrors.days ? { borderColor: "#f87171" } : undefined}
                  />
                  <span
                    className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2
                               select-none text-xs font-semibold"
                    style={{ color: "var(--text-muted)" }}
                    aria-hidden="true"
                  >
                    days
                  </span>
                </div>
                <FieldError message={fieldErrors.days} />
              </div>

              {/* Budget */}
              <div>
                <FieldLabel>
                  Budget{" "}
                  <span
                    className="normal-case font-normal tracking-normal"
                    style={{ color: "var(--text-muted)" }}
                  >
                    (USD)
                  </span>
                </FieldLabel>
                {/* Wrapper for prefix adornment */}
                <div className="relative">
                  {/* $ prefix — absolute at 12px from left */}
                  <span
                    className="pointer-events-none absolute top-1/2 -translate-y-1/2
                               select-none text-sm font-semibold"
                    style={{ left: "12px", color: "var(--text-muted)" }}
                    aria-hidden="true"
                  >
                    $
                  </span>
                  <input
                    name="budget"
                    type="number"
                    min={1}
                    placeholder="e.g. 1500"
                    value={form.budget || ""}
                    onChange={onChange}
                    required
                    disabled={loading}
                    /* inline padding so Tailwind purge can't strip it */
                    className="input-base [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none
                               [&::-webkit-outer-spin-button]:appearance-none"
                    style={{ paddingLeft: "28px", ...(fieldErrors.budget ? { borderColor: "#f87171" } : {}) }}
                  />
                </div>
                <FieldError message={fieldErrors.budget} />
              </div>
            </div>

            {/* Travel style */}
            <div>
              <FieldLabel>Travel Style</FieldLabel>
              <TravelStyleControl
                value={form.travel_style}
                onChange={onStyleChange}
                disabled={loading}
              />
            </div>

            {/* Error */}
            {error && (
              <div
                className="flex items-start gap-3 rounded-xl px-4 py-3 text-xs"
                style={{
                  color:      "#f87171",
                  background: "rgba(127,29,29,0.25)",
                  border:     "1px solid rgba(127,29,29,0.5)",
                }}
                role="alert"
              >
                <span className="mt-0.5 shrink-0" aria-hidden="true">✕</span>
                <span>{error}</span>
              </div>
            )}

            {/* Submit */}
            <div className="mt-1">
              <button
                type="submit"
                disabled={loading}
                className="btn-cta w-full rounded-full py-3.5"
              >
                {loading ? (
                  <>
                    <span
                      className="h-3.5 w-3.5 animate-spin rounded-full border-2"
                      style={{
                        borderColor:    "rgba(12,15,13,0.35)",
                        borderTopColor: "transparent",
                      }}
                      aria-hidden="true"
                    />
                    Planning…
                  </>
                ) : (
                  <>
                    <svg
                      width={15} height={15} viewBox="0 0 15 15" fill="none"
                      aria-hidden="true"
                    >
                      <path
                        d="M1.5 7.5h12M9 3l4.5 4.5L9 12"
                        stroke="currentColor"
                        strokeWidth={1.7}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    Generate Trip Plan
                  </>
                )}
              </button>

              {/* Helper text */}
              <p
                className="mt-2.5 text-center text-[11px]"
                style={{ color: "var(--text-muted)" }}
              >
                Takes about{" "}
                <span style={{ color: "var(--text-secondary)" }}>15 seconds</span>
                {" "}·{" "}you can edit anything after
              </p>
            </div>

          </form>
        </div>
      </section>

      {/* ── Column divider ───────────────────────────────────────── */}
      <div
        className="hidden w-px shrink-0 lg:block"
        style={{ background: "var(--border)" }}
        aria-hidden="true"
      />

      {/* ── Illustration column (hidden below lg) ─────────────────── */}
      <div className="hidden flex-1 lg:flex">
        <TripPlannerVisual />
      </div>
    </div>
  );
}
