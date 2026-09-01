import { useState } from "react";
import Link from "next/link";
import { type TripSummary } from "@/services/tripServices";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

/** Strip markdown syntax and return plain text preview */
function stripMarkdown(text: string): string {
  return text
    .replace(/#{1,6}\s+/g, "")          // headings
    .replace(/\*\*(.*?)\*\*/g, "$1")     // bold
    .replace(/\*(.*?)\*/g, "$1")         // italic
    .replace(/`{1,3}(.*?)`{1,3}/g, "$1")// code
    .replace(/\[(.*?)\]\(.*?\)/g, "$1") // links
    .replace(/^[-*+]\s+/gm, "")         // unordered list markers
    .replace(/^\d+\.\s+/gm, "")         // ordered list markers
    .replace(/^>\s+/gm, "")             // blockquotes
    .replace(/\n{2,}/g, " ")            // collapse blank lines
    .replace(/\n/g, " ")                // newlines → spaces
    .trim();
}

/** Map destination name to an Unsplash search keyword for thumbnail */
function getThumbnailUrl(destination: string): string {
  const keyword = encodeURIComponent(destination.trim().split(",")[0]);
  // 400×200 landscape from Unsplash Source (free, no API key needed)
  return `https://source.unsplash.com/400x200/?${keyword},travel,landmark`;
}

// ─── Category badge colour ────────────────────────────────────────────────────

function categoryStyle(category: string): React.CSSProperties {
  const map: Record<string, { bg: string; color: string; border: string }> = {
    Budget:   { bg: "rgba(234,179,8,0.12)",  color: "#eab308", border: "rgba(234,179,8,0.3)" },
    Standard: { bg: "rgba(86,171,124,0.12)", color: "#56AB7C", border: "rgba(86,171,124,0.3)" },
    Comfort:  { bg: "rgba(99,102,241,0.12)", color: "#818cf8", border: "rgba(99,102,241,0.3)" },
    Luxury:   { bg: "rgba(236,72,153,0.12)", color: "#f472b6", border: "rgba(236,72,153,0.3)" },
    Family:   { bg: "rgba(251,146,60,0.12)", color: "#fb923c", border: "rgba(251,146,60,0.3)" },
  };
  return map[category] ?? { bg: "rgba(86,171,124,0.12)", color: "#56AB7C", border: "rgba(86,171,124,0.3)" };
}

// ─── Confirm Dialog ───────────────────────────────────────────────────────────

function ConfirmDialog({
  destination, onConfirm, onCancel,
}: { destination: string; onConfirm: () => void; onCancel: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 backdrop-blur-sm"
      style={{ background: "rgba(13,13,13,0.85)" }} onClick={onCancel}>
      <div className="w-full max-w-sm rounded-2xl p-6 flex flex-col gap-5 shadow-2xl"
        style={{ background: "var(--bg-surface)", border: "1px solid var(--border)" }}
        onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-center h-11 w-11 rounded-full"
          style={{ background: "rgba(127,29,29,0.4)", border: "1px solid rgba(127,29,29,0.5)" }}>
          <span className="text-red-400 text-lg">⚠</span>
        </div>
        <div>
          <h3 className="text-base font-semibold leading-snug">Delete this trip?</h3>
          <p className="mt-1.5 text-xs leading-relaxed" style={{ color: "var(--text-secondary)" }}>
            <span style={{ color: "var(--text-primary)" }} className="font-medium">{destination}</span>{" "}
            will be permanently removed. This cannot be undone.
          </p>
        </div>
        <div className="flex gap-3">
          <button onClick={onCancel}
            className="flex-1 rounded-xl py-2.5 text-xs font-semibold uppercase tracking-widest transition"
            style={{ border: "1px solid var(--border)", color: "var(--text-secondary)" }}>
            Cancel
          </button>
          <button onClick={onConfirm}
            className="flex-1 rounded-xl py-2.5 text-xs font-semibold uppercase tracking-widest text-white transition"
            style={{ background: "#dc2626" }}>
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

interface TripCardProps {
  trip: TripSummary;
  onDelete?: (id: number) => void;
}

export default function TripCard({ trip, onDelete }: TripCardProps) {
  const [confirming, setConfirming] = useState(false);
  const [imgError, setImgError]     = useState(false);

  const catStyle  = categoryStyle(trip.category);
  const plainText = trip.ai_recommendation ? stripMarkdown(trip.ai_recommendation) : "";

  return (
    <>
      {confirming && (
        <ConfirmDialog
          destination={trip.destination}
          onConfirm={() => { setConfirming(false); onDelete?.(trip.id); }}
          onCancel={() => setConfirming(false)}
        />
      )}

      <div className="group flex flex-col rounded-2xl overflow-hidden transition-all duration-200 hover:-translate-y-0.5"
        style={{
          background: "var(--bg-surface)",
          border: "1px solid var(--border)",
          boxShadow: "0 0 0 0 transparent",
        }}
        onMouseEnter={e => (e.currentTarget.style.boxShadow = "0 8px 32px rgba(0,0,0,0.4)")}
        onMouseLeave={e => (e.currentTarget.style.boxShadow = "0 0 0 0 transparent")}
      >
        {/* Thumbnail */}
        <div className="relative h-36 overflow-hidden"
          style={{ background: "var(--bg-elevated)" }}>
          {!imgError ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={getThumbnailUrl(trip.destination)}
              alt={trip.destination}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              onError={() => setImgError(true)}
            />
          ) : (
            /* Fallback gradient */
            <div className="w-full h-full flex items-center justify-center text-3xl"
              style={{ background: "linear-gradient(135deg, #1a1a1a 0%, #222 100%)" }}>
              🗺️
            </div>
          )}
          {/* Gradient overlay */}
          <div className="absolute inset-0"
            style={{ background: "linear-gradient(to top, rgba(26,26,26,0.85) 0%, transparent 60%)" }} />
          {/* Destination name over thumbnail */}
          <div className="absolute bottom-0 left-0 right-0 px-4 pb-3">
            <p className="text-[10px] font-semibold uppercase tracking-widest mb-0.5"
              style={{ color: "rgba(240,240,240,0.5)" }}>
              Trip #{trip.id}
            </p>
            <h2 className="text-base font-bold leading-tight text-white drop-shadow">
              {trip.destination}
            </h2>
          </div>
        </div>

        {/* Body */}
        <div className="flex flex-col gap-3 p-4">
          {/* Category badge */}
          <div>
            <span className="inline-flex items-center text-xs font-semibold px-2.5 py-1 rounded-full"
              style={{ background: catStyle.bg, color: catStyle.color, border: `1px solid ${catStyle.border}` }}>
              {trip.category}
            </span>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: "Budget", value: formatCurrency(trip.budget) },
              { label: "Daily",  value: formatCurrency(trip.daily_budget) },
              { label: "Days",   value: `${trip.days}d` },
            ].map((s) => (
              <div key={s.label} className="flex flex-col gap-0.5 rounded-xl px-3 py-2"
                style={{ background: "var(--bg-elevated)" }}>
                <span className="text-[10px] font-semibold uppercase tracking-widest"
                  style={{ color: "var(--text-muted)" }}>{s.label}</span>
                <span className="text-sm font-semibold">{s.value}</span>
              </div>
            ))}
          </div>

          {/* Plain text preview — no markdown */}
          {plainText && (
            <p className="text-xs leading-relaxed line-clamp-2"
              style={{ color: "var(--text-secondary)" }}>
              {plainText}
            </p>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between pt-1">
            <Link href={`/trips/${trip.id}`}
              className="text-xs font-semibold transition"
              style={{ color: "var(--accent)" }}>
              View details →
            </Link>
            {onDelete && (
              <button onClick={() => setConfirming(true)}
                className="text-xs font-semibold transition"
                style={{ color: "var(--text-muted)" }}
                onMouseEnter={e => (e.currentTarget.style.color = "#f87171")}
                onMouseLeave={e => (e.currentTarget.style.color = "var(--text-muted)")}>
                Delete
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
