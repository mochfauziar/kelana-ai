// ─── Types ────────────────────────────────────────────────────────────────────

interface DaySection {
  dayNumber: number;
  title: string;
  items: string[];
}

// ─── Parser ───────────────────────────────────────────────────────────────────

/**
 * Parse the raw AI itinerary string into structured day sections.
 *
 * Handles these heading formats from the AI:
 *   ## Day 1: Arrival in Tokyo
 *   ## Day 1 - Arrival in Tokyo
 *   **Day 1: Arrival**
 *   Day 1: Arrival
 *
 * Everything between two headings becomes bullet items for that day.
 */
function parseItinerary(text: string): DaySection[] {
  // Regex: matches any line that looks like a "Day N" heading
  const DAY_HEADING = /^(?:#{1,3}\s*|\*{1,2})?Day\s+(\d+)\s*[:\-–]\s*(.+?)(?:\*{1,2})?$/im;

  // Split text into lines and find heading positions
  const lines = text.split("\n");
  const sections: DaySection[] = [];
  let current: DaySection | null = null;

  for (const raw of lines) {
    const line = raw.trim();
    const headingMatch = line.match(DAY_HEADING);

    if (headingMatch) {
      // Save previous section
      if (current) sections.push(current);

      current = {
        dayNumber: parseInt(headingMatch[1], 10),
        // Clean bold markers from title
        title: headingMatch[2].replace(/\*+/g, "").trim(),
        items: [],
      };
      continue;
    }

    if (!current) continue;

    // Collect bullet lines (-, *, •) and plain non-empty lines
    const bulletMatch = line.match(/^[-*•]\s+(.+)/);
    if (bulletMatch) {
      // Strip inline bold (**text**) to plain text
      const clean = bulletMatch[1].replace(/\*\*(.+?)\*\*/g, "$1").trim();
      if (clean) current.items.push(clean);
    } else if (line && !line.startsWith("#")) {
      // Plain paragraph line — include if meaningful
      const clean = line.replace(/\*\*(.+?)\*\*/g, "$1").trim();
      if (clean.length > 2) current.items.push(clean);
    }
  }

  // Push the last section
  if (current) sections.push(current);

  return sections;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function DayBadge({ day }: { day: number }) {
  return (
    <div className="shrink-0 flex items-center justify-center h-8 w-8 rounded-full bg-emerald-950/60 border border-emerald-900/60 text-xs font-bold text-emerald-400">
      {day}
    </div>
  );
}

function BulletItem({ text }: { text: string }) {
  // Detect cost hints like "$20", "USD 50", "¥500" to highlight them
  const costRegex = /(\$[\d,]+(?:\s*[-–]\s*\$[\d,]+)?|USD\s*[\d,]+|¥[\d,]+|£[\d,]+|€[\d,]+)/g;
  const parts = text.split(costRegex);

  return (
    <li className="flex items-start gap-2.5 text-sm text-neutral-300 leading-relaxed">
      <span className="mt-1.5 shrink-0 h-1 w-1 rounded-full bg-neutral-600" />
      <span>
        {parts.map((part, i) =>
          costRegex.test(part) ? (
            <span key={i} className="text-emerald-400 font-medium">
              {part}
            </span>
          ) : (
            part
          )
        )}
      </span>
    </li>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

interface DaysCardProps {
  /** Raw AI itinerary text from the backend */
  text: string;
}

export default function DaysCard({ text }: DaysCardProps) {
  const sections = parseItinerary(text);

  // Fallback: if regex found nothing, render plain text
  if (sections.length === 0) {
    return (
      <div className="text-sm text-neutral-300 leading-relaxed whitespace-pre-line">
        {text}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {sections.map((section) => (
        <div
          key={section.dayNumber}
          className="rounded-xl bg-neutral-950/60 border border-neutral-800 overflow-hidden"
        >
          {/* Day header */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-neutral-800/60">
            <DayBadge day={section.dayNumber} />
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-neutral-600">
                Day {section.dayNumber}
              </p>
              <p className="text-sm font-semibold text-white leading-tight">
                {section.title}
              </p>
            </div>
          </div>

          {/* Activities list */}
          {section.items.length > 0 && (
            <ul className="flex flex-col gap-2 px-4 py-3">
              {section.items.map((item, i) => (
                <BulletItem key={i} text={item} />
              ))}
            </ul>
          )}
        </div>
      ))}
    </div>
  );
}
