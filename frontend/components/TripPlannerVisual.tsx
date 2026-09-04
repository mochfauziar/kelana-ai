// Illustration panel — right column of the two-column hero layout.
// Pure presentational component; no props required.

const STATS = [
  { value: "2,400+", label: "Trips planned\nthis month",  accent: "text-[var(--accent)]" },
  { value: "4.8 ★",  label: "Average\ntrip rating",       accent: "text-[var(--clay)]"   },
  { value: "12 min", label: "Median\nplanning time",       accent: "text-[var(--text-primary)]" },
] as const;

const CHIPS: { name: string; color: string }[] = [
  { name: "Bali",        color: "var(--accent)" },
  { name: "Kyoto",       color: "var(--clay)"   },
  { name: "Lisbon",      color: "var(--accent)" },
  { name: "Queenstown",  color: "var(--clay)"   },
  { name: "Santorini",   color: "var(--accent)" },
  { name: "Medellín",    color: "var(--clay)"   },
  { name: "Tbilisi",     color: "var(--accent)" },
];

export default function TripPlannerVisual() {
  return (
    <div
      className="relative flex flex-col justify-between overflow-hidden"
      style={{ background: "var(--bg-panel)" }}
    >
      {/* ── Topographic contour SVG (background texture) ────────────── */}
      <svg
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 h-full w-full"
        viewBox="0 0 800 700"
        preserveAspectRatio="xMidYMid slice"
      >
        {/* Group 1 — upper-right cluster, centered mid-panel */}
        {[320, 270, 220, 170, 120, 70].map((rx, i) => (
          <ellipse
            key={`a${i}`}
            cx={620} cy={380}
            rx={rx} ry={Math.round(rx * 0.59)}
            fill="none"
            stroke="rgba(143,212,160,0.065)"
            strokeWidth={1}
          />
        ))}
        {/* Group 2 — lower-left cluster */}
        {[240, 190, 140, 90, 44].map((rx, i) => (
          <ellipse
            key={`b${i}`}
            cx={140} cy={520}
            rx={rx} ry={Math.round(rx * 0.62)}
            fill="none"
            stroke="rgba(143,212,160,0.065)"
            strokeWidth={1}
          />
        ))}
        {/* Group 3 — center filler */}
        {[200, 150, 100].map((rx, i) => (
          <ellipse
            key={`c${i}`}
            cx={400} cy={370}
            rx={rx} ry={Math.round(rx * 0.55)}
            fill="none"
            stroke="rgba(143,212,160,0.045)"
            strokeWidth={1}
          />
        ))}
      </svg>

      {/* ── Radial glows ────────────────────────────────────────────── */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 70% 55% at 55% 38%, rgba(143,212,160,0.07) 0%, transparent 70%)," +
            "radial-gradient(ellipse 40% 30% at 80% 72%, rgba(207,138,92,0.05) 0%, transparent 60%)",
        }}
      />

      {/* ── Dashed flight-route + pin markers SVG ───────────────────── */}
      <svg
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 h-full w-full overflow-visible"
        viewBox="0 0 800 700"
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          <linearGradient id="routeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%"   stopColor="#8fd4a0" stopOpacity={0.55} />
            <stop offset="100%" stopColor="#cf8a5c" stopOpacity={0.55} />
          </linearGradient>
        </defs>

        {/*
          Route shifted down ~170px from original so it sits in the middle
          of the panel and doesn't overlap the "Where next?" heading at top.
          Original: M 160 130 → now M 160 300
          Original: end 720 460 → now 720 560 (stays in lower-mid zone)
        */}
        <path
          d="M 100 290 C 220 230, 460 270, 560 360 C 640 430, 680 480, 740 540"
          fill="none"
          stroke="url(#routeGrad)"
          strokeWidth={1.5}
          strokeDasharray="6 5"
          strokeLinecap="round"
        />

        {/* Pin: Tokyo */}
        <PinMarker cx={100}  cy={290} color="#8fd4a0" label="Tokyo"  labelSide="right" pulse />
        {/* Pin: Dubai */}
        <PinMarker cx={560}  cy={360} color="#cf8a5c" label="Dubai"  labelSide="right" />
        {/* Pin: Lisbon */}
        <PinMarker cx={740}  cy={540} color="#8fd4a0" label="Lisbon" labelSide="left"  pulse pulseDelay="1s" />

        {/* Small plane along mid-route */}
        <text
          x={370} y={300}
          fontSize={14}
          fill="rgba(143,212,160,0.6)"
          transform="rotate(-18 370 300)"
        >
          ✈
        </text>
      </svg>

      {/* ── Top heading ─────────────────────────────────────────────── */}
      <div className="relative z-10 px-11 pt-11">
        <h2
          className="text-[clamp(28px,3.2vw,40px)] font-semibold leading-[1.08] tracking-tight"
          style={{ fontFamily: "var(--font-fraunces)", color: "var(--text-primary)" }}
        >
          Where <em className="not-italic" style={{ color: "var(--accent)" }}>next?</em>
        </h2>
        <p
          className="mt-2.5 max-w-sm text-[13px] leading-relaxed"
          style={{ color: "var(--text-secondary)" }}
        >
          Answer three questions and our AI maps out every day — accommodation,
          transport, food, and hidden gems included.
        </p>
      </div>

      {/* ── Bottom block: stats + chips ─────────────────────────────── */}
      <div className="relative z-10 px-11 pb-12">

        {/* Stat cards */}
        <div className="mb-5 grid grid-cols-3 gap-2.5">
          {STATS.map((s) => (
            <div
              key={s.value}
              className="rounded-[13px] border p-3.5"
              style={{
                background: "rgba(18,22,19,0.72)",
                borderColor: "rgba(143,212,160,0.10)",
                backdropFilter: "blur(12px)",
                WebkitBackdropFilter: "blur(12px)",
              }}
            >
              <div
                className={`font-serif text-lg font-bold leading-none ${s.accent}`}
                style={{ fontFamily: "var(--font-fraunces)" }}
              >
                {s.value}
              </div>
              <div
                className="mt-1.5 text-[10px] font-medium leading-snug whitespace-pre-line"
                style={{ color: "var(--text-secondary)" }}
              >
                {s.label}
              </div>
            </div>
          ))}
        </div>

        {/* Chips */}
        <p
          className="mb-2.5 text-[10px] font-semibold uppercase tracking-widest"
          style={{ color: "var(--text-muted)" }}
        >
          Popular destinations
        </p>
        <div className="flex flex-wrap gap-2">
          {CHIPS.map((chip) => (
            <span
              key={chip.name}
              className="inline-flex cursor-default items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors"
              style={{
                background: "rgba(18,22,19,0.65)",
                borderColor: "var(--border)",
                color: "var(--text-secondary)",
                backdropFilter: "blur(8px)",
                WebkitBackdropFilter: "blur(8px)",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = "var(--accent-glow)";
                (e.currentTarget as HTMLElement).style.color       = "var(--text-primary)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = "var(--border)";
                (e.currentTarget as HTMLElement).style.color       = "var(--text-secondary)";
              }}
            >
              <span
                className="h-2 w-2 shrink-0 rounded-full"
                style={{ background: chip.color }}
              />
              {chip.name}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Internal SVG pin marker ────────────────────────────────────────────────

interface PinMarkerProps {
  cx: number;
  cy: number;
  color: string;
  label: string;
  labelSide: "left" | "right";
  pulse?: boolean;
  pulseDelay?: string;
}

function PinMarker({ cx, cy, color, label, labelSide, pulse, pulseDelay = "0s" }: PinMarkerProps) {
  const labelX = labelSide === "right" ? cx + 14 : cx - 14;
  const labelAnchor = labelSide === "right" ? "start" : "end";
  const labelY = cy + 4;

  return (
    <g>
      {/* Outer halo */}
      <circle cx={cx} cy={cy} r={14} fill={color} fillOpacity={0.08} />
      {/* Outer ring */}
      <circle cx={cx} cy={cy} r={9}  fill="none" stroke={color} strokeWidth={1} strokeOpacity={0.35} />
      {/* Core dot */}
      <circle cx={cx} cy={cy} r={5}  fill={color} />

      {/* Pulse ring (optional) */}
      {pulse && (
        <circle cx={cx} cy={cy} r={5} fill="none" stroke={color} strokeWidth={1.5} strokeOpacity={0.5}>
          <animate attributeName="r"              from="5"  to="18" dur="2s" begin={pulseDelay} repeatCount="indefinite" />
          <animate attributeName="stroke-opacity" from="0.5" to="0" dur="2s" begin={pulseDelay} repeatCount="indefinite" />
        </circle>
      )}

      {/* Label */}
      <text
        x={labelX}
        y={labelY}
        fontFamily="var(--font-geist-sans), Inter, system-ui, sans-serif"
        fontSize={10}
        fontWeight={600}
        fill={color}
        fillOpacity={0.8}
        textAnchor={labelAnchor}
      >
        {label}
      </text>
    </g>
  );
}
