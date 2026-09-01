"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { askKnowledgeBase } from "@/services/tripServices";
import { getUser, clearSession, type AuthUser } from "@/services/authServices";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Message {
  role: "user" | "assistant";
  text: string;
  loading?: boolean;
}

// ─── Suggested questions ──────────────────────────────────────────────────────

const SUGGESTIONS = [
  "Apa destinasi wisata terbaik di Bali?",
  "Berapa budget ideal untuk liburan ke Jepang?",
  "Rekomendasikan itinerary 5 hari di Paris",
  "Tips aman bepergian solo ke Eropa",
];

// ─── Navbar ───────────────────────────────────────────────────────────────────

function Navbar({ user, onLogout }: { user: AuthUser | null; onLogout: () => void }) {
  return (
    <header
      className="border-b px-6 py-4 flex items-center gap-3"
      style={{ borderColor: "var(--border)", background: "var(--bg-base)" }}
    >
      <span className="h-2 w-2 rounded-full" style={{ background: "var(--accent)" }} />
      <span
        className="text-sm font-semibold tracking-widest uppercase"
        style={{ color: "var(--text-secondary)" }}
      >
        Kelana<span style={{ color: "var(--accent)" }}>AI</span>
      </span>

      <nav className="ml-auto flex items-center gap-2">
        <Link
          href="/"
          className="text-xs font-semibold uppercase tracking-widest px-4 py-2 rounded-xl border transition hover:opacity-80"
          style={{ color: "var(--text-secondary)", borderColor: "var(--border)" }}
        >
          Planner
        </Link>
        <Link
          href="/trips"
          className="text-xs font-semibold uppercase tracking-widest px-4 py-2 rounded-xl border transition hover:opacity-80"
          style={{ color: "var(--text-secondary)", borderColor: "var(--border)" }}
        >
          My Trips
        </Link>
        {user ? (
          <>
            <Link
              href="/profile"
              className="text-xs font-semibold uppercase tracking-widest px-4 py-2 rounded-xl border transition hover:opacity-80 hidden sm:block"
              style={{ color: "var(--text-secondary)", borderColor: "var(--border)" }}
            >
              {user.name}
            </Link>
            <button
              onClick={onLogout}
              className="text-xs font-semibold uppercase tracking-widest px-4 py-2 rounded-xl border transition"
              style={{ color: "var(--text-muted)", borderColor: "var(--border)" }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#f87171")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-muted)")}
            >
              Logout
            </button>
          </>
        ) : (
          <Link
            href="/login"
            className="text-xs font-semibold uppercase tracking-widest px-4 py-2 rounded-xl border transition"
            style={{ color: "var(--accent)", borderColor: "var(--accent-glow)" }}
          >
            Sign In
          </Link>
        )}
      </nav>
    </header>
  );
}

// ─── Typing indicator ─────────────────────────────────────────────────────────

function TypingDots() {
  return (
    <div className="flex items-center gap-1 px-1 py-0.5">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="h-1.5 w-1.5 rounded-full"
          style={{
            background: "var(--accent)",
            animation: `typingBounce 1.2s ease-in-out ${i * 0.2}s infinite`,
          }}
        />
      ))}
    </div>
  );
}

// ─── Message bubble ───────────────────────────────────────────────────────────

function Bubble({ msg }: { msg: Message }) {
  const isUser = msg.role === "user";

  return (
    <div className={`flex gap-3 ${isUser ? "flex-row-reverse" : "flex-row"}`}>
      {/* Avatar */}
      <div
        className="shrink-0 h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold mt-0.5"
        style={
          isUser
            ? { background: "var(--accent)", color: "#0D0D0D" }
            : { background: "var(--bg-elevated)", color: "var(--accent)", border: "1px solid var(--border)" }
        }
      >
        {isUser ? "U" : "✦"}
      </div>

      {/* Bubble */}
      <div
        className="max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed"
        style={
          isUser
            ? {
                background: "var(--accent)",
                color: "#0D0D0D",
                borderBottomRightRadius: "4px",
              }
            : {
                background: "var(--bg-surface)",
                color: "var(--text-primary)",
                border: "1px solid var(--border)",
                borderBottomLeftRadius: "4px",
              }
        }
      >
        {msg.loading ? <TypingDots /> : <span className="whitespace-pre-wrap">{msg.text}</span>}
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AskPage() {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setUser(getUser());
  }, []);

  // Auto-scroll ke pesan terbaru
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function handleLogout() {
    clearSession();
    setUser(null);
    router.push("/login");
  }

  async function sendMessage(question: string) {
    if (!question.trim() || loading) return;

    const userMsg: Message = { role: "user", text: question.trim() };
    const placeholderMsg: Message = { role: "assistant", text: "", loading: true };

    setMessages((prev) => [...prev, userMsg, placeholderMsg]);
    setInput("");
    setLoading(true);

    try {
      const res = await askKnowledgeBase(question.trim());
      setMessages((prev) => [
        ...prev.slice(0, -1),
        { role: "assistant", text: res.answer },
      ]);
    } catch (err: unknown) {
      const errText = err instanceof Error ? err.message : "Terjadi kesalahan.";
      setMessages((prev) => [
        ...prev.slice(0, -1),
        { role: "assistant", text: `⚠️ ${errText}` },
      ]);
    } finally {
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    sendMessage(input);
  }

  // Submit dengan Enter (Shift+Enter untuk newline)
  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  }

  const isEmpty = messages.length === 0;

  return (
    <>
      <style>{`
        @keyframes typingBounce {
          0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
          30%            { transform: translateY(-5px); opacity: 1; }
        }
        @keyframes msgFadeUp {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .msg-enter { animation: msgFadeUp 0.25s ease both; }
      `}</style>

      <div
        className="min-h-screen flex flex-col"
        style={{ background: "var(--bg-base)", color: "var(--text-primary)" }}
      >
        <Navbar user={user} onLogout={handleLogout} />

        {/* ── Chat area ── */}
        <div className="flex-1 flex flex-col max-w-2xl w-full mx-auto px-4 pb-4 overflow-hidden">

          {/* Empty state */}
          {isEmpty && (
            <div className="flex-1 flex flex-col items-center justify-center gap-8 py-16 animate-fade-up">
              {/* Icon */}
              <div
                className="h-14 w-14 rounded-2xl flex items-center justify-center text-2xl"
                style={{ background: "var(--accent-dim)", border: "1px solid var(--accent-glow)" }}
              >
                ✦
              </div>

              <div className="text-center">
                <h1 className="text-2xl font-bold tracking-tight mb-2">
                  Ask <span style={{ color: "var(--accent)" }}>KelanaAI</span>
                </h1>
                <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                  Tanyakan apa saja seputar perjalanan, destinasi, atau tips traveling.
                </p>
              </div>

              {/* Suggestion chips */}
              <div className="flex flex-wrap gap-2 justify-center max-w-md">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => sendMessage(s)}
                    className="text-xs px-3.5 py-2 rounded-full border transition hover:opacity-80"
                    style={{
                      background: "var(--bg-surface)",
                      borderColor: "var(--border)",
                      color: "var(--text-secondary)",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = "var(--accent-glow)";
                      e.currentTarget.style.color = "var(--accent)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = "var(--border)";
                      e.currentTarget.style.color = "var(--text-secondary)";
                    }}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Messages */}
          {!isEmpty && (
            <div className="flex-1 overflow-y-auto py-6 flex flex-col gap-4 min-h-0">
              {messages.map((msg, i) => (
                <div key={i} className="msg-enter">
                  <Bubble msg={msg} />
                </div>
              ))}
              <div ref={bottomRef} />
            </div>
          )}

          {/* ── Input bar ── */}
          <div
            className="shrink-0 rounded-2xl p-3"
            style={{
              background: "var(--bg-surface)",
              border: "1px solid var(--border)",
              boxShadow: "0 -4px 24px rgba(0,0,0,0.3)",
            }}
          >
            <form onSubmit={handleSubmit} className="flex items-end gap-3">
              <textarea
                ref={inputRef}
                rows={1}
                value={input}
                onChange={(e) => {
                  setInput(e.target.value);
                  // Auto-resize
                  e.target.style.height = "auto";
                  e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px";
                }}
                onKeyDown={handleKeyDown}
                placeholder="Tanya apa saja tentang perjalananmu…"
                disabled={loading}
                className="flex-1 resize-none bg-transparent text-sm outline-none leading-relaxed"
                style={{
                  color: "var(--text-primary)",
                  minHeight: "24px",
                  maxHeight: "120px",
                  overflow: "hidden",
                }}
              />
              <button
                type="submit"
                disabled={!input.trim() || loading}
                className="shrink-0 h-9 w-9 rounded-xl flex items-center justify-center transition"
                style={{
                  background: input.trim() && !loading ? "var(--accent)" : "var(--bg-elevated)",
                  color: input.trim() && !loading ? "#0D0D0D" : "var(--text-muted)",
                }}
              >
                {loading ? (
                  <span
                    className="h-3.5 w-3.5 rounded-full border-2 animate-spin"
                    style={{ borderColor: "var(--text-muted)", borderTopColor: "transparent" }}
                  />
                ) : (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="22" y1="2" x2="11" y2="13" />
                    <polygon points="22 2 15 22 11 13 2 9 22 2" />
                  </svg>
                )}
              </button>
            </form>

            <p className="text-[10px] mt-2 text-center" style={{ color: "var(--text-muted)" }}>
              Enter untuk kirim · Shift+Enter untuk baris baru
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
