"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  createConversation,
  listConversations,
  sendMessage,
  getMessages,
  renameConversation,
} from "@/services/chatServices";
import { clearSession, type AuthUser } from "@/services/authServices";
import type { Conversation, Message } from "@/types/chat";
import { useAuthGuard } from "@/lib/useAuthGuard";

// ─── Types ────────────────────────────────────────────────────────────────────

/** UI-only message shape — adds a loading flag for the typing indicator */
interface ChatMessage {
  id?:     number;
  role:    "user" | "assistant";
  text:    string;
  loading?: boolean;
}

// ─── Navbar ───────────────────────────────────────────────────────────────────

function Navbar({
  user,
  onLogout,
}: {
  user: AuthUser | null;
  onLogout: () => void;
}) {
  return (
    <header
      className="sticky top-0 z-30 flex items-center gap-3 border-b px-5 h-[56px] shrink-0"
      style={{ borderColor: "var(--border)", background: "var(--bg-base)" }}
    >
      <span className="h-2 w-2 rounded-full" style={{ background: "var(--accent)" }} />
      <Link
        href="/"
        className="text-sm font-bold tracking-widest uppercase transition-opacity hover:opacity-75"
        style={{ color: "var(--text-secondary)" }}
      >
        Kelana<span style={{ color: "var(--accent)" }}>AI</span>
      </Link>

      <nav className="ml-auto flex items-center gap-2">
        <Link
          href="/"
          className="text-xs font-semibold uppercase tracking-widest px-3 py-1.5 rounded-full border transition-opacity hover:opacity-75"
          style={{ color: "var(--text-secondary)", borderColor: "var(--border)" }}
        >
          Planner
        </Link>
        <Link
          href="/trips"
          className="text-xs font-semibold uppercase tracking-widest px-3 py-1.5 rounded-full border transition-opacity hover:opacity-75"
          style={{ color: "var(--text-secondary)", borderColor: "var(--border)" }}
        >
          My Trips
        </Link>
        <Link
          href="/ask"
          className="text-xs font-semibold uppercase tracking-widest px-3 py-1.5 rounded-full border transition-opacity hover:opacity-75"
          style={{ color: "var(--text-secondary)", borderColor: "var(--border)" }}
        >
          Ask AI
        </Link>

        {user ? (
          <button
            onClick={onLogout}
            className="text-xs font-semibold uppercase tracking-widest px-3 py-1.5 rounded-full border transition-opacity hover:opacity-75"
            style={{ color: "var(--text-muted)", borderColor: "var(--border)" }}
          >
            Logout
          </button>
        ) : (
          <Link
            href="/login"
            className="text-xs font-semibold uppercase tracking-widest px-3 py-1.5 rounded-full border transition-opacity hover:opacity-75"
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
            animation:  `typingBounce 1.2s ease-in-out ${i * 0.2}s infinite`,
          }}
        />
      ))}
    </div>
  );
}

// ─── Message Bubble ───────────────────────────────────────────────────────────

function MessageBubble({ msg }: { msg: ChatMessage }) {
  const isUser = msg.role === "user";
  return (
    <div
      className={`msg-enter flex w-full ${isUser ? "justify-end" : "justify-start"}`}
    >
      <div
        className="max-w-[78%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap"
        style={
          isUser
            ? {
                background:  "var(--accent-dim)",
                border:      "1px solid var(--accent-glow)",
                color:       "var(--text-primary)",
                borderRadius: "18px 18px 4px 18px",
              }
            : {
                background:  "var(--bg-surface)",
                border:      "1px solid var(--border)",
                color:       "var(--text-primary)",
                borderRadius: "18px 18px 18px 4px",
              }
        }
      >
        {msg.loading ? <TypingDots /> : msg.text}
      </div>
    </div>
  );
}

// ─── Conversation List Item ───────────────────────────────────────────────────

function ConversationItem({
  conv,
  isActive,
  onClick,
}: {
  conv:     Conversation;
  isActive: boolean;
  onClick:  () => void;
}) {
  const date = new Date(conv.created_at).toLocaleDateString("id-ID", {
    day:   "numeric",
    month: "short",
  });

  return (
    <button
      onClick={onClick}
      className="w-full text-left px-3 py-2.5 rounded-xl transition-colors"
      style={{
        background:  isActive ? "var(--bg-elevated)" : "transparent",
        borderLeft:  isActive ? "2px solid var(--accent)" : "2px solid transparent",
      }}
      onMouseEnter={(e) => {
        if (!isActive) (e.currentTarget as HTMLElement).style.background = "var(--bg-surface)";
      }}
      onMouseLeave={(e) => {
        if (!isActive) (e.currentTarget as HTMLElement).style.background = "transparent";
      }}
    >
      <p
        className="text-xs font-semibold truncate leading-snug"
        style={{ color: isActive ? "var(--text-primary)" : "var(--text-secondary)" }}
      >
        {conv.title}
      </p>
      <p className="text-[10px] mt-0.5" style={{ color: "var(--text-muted)" }}>
        {date}
      </p>
    </button>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ChatPage() {
  const router = useRouter();
  const { user: guardUser, ready } = useAuthGuard();

  const [user,                setUser]                = useState<AuthUser | null>(null);
  const [conversations,       setConversations]       = useState<Conversation[]>([]);
  const [activeId,            setActiveId]            = useState<number | null>(null);
  const [messages,            setMessages]            = useState<ChatMessage[]>([]);
  const [input,               setInput]               = useState("");
  const [loading,             setLoading]             = useState(false);   // AI thinking
  const [loadingHistory,      setLoadingHistory]      = useState(false);   // fetching past msgs
  const [loadingConversations,setLoadingConversations]= useState(true);
  const [error,               setError]               = useState<string | null>(null);

  const bottomRef  = useRef<HTMLDivElement>(null);
  const inputRef   = useRef<HTMLTextAreaElement>(null);
  const activeConv = conversations.find((c) => c.id === activeId) ?? null;

  // ── Auth guard ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (ready) setUser(guardUser);
  }, [ready, guardUser]);

  // ── Auto-scroll ────────────────────────────────────────────────────────────
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ── Fetch sidebar list ─────────────────────────────────────────────────────
  const fetchConversations = useCallback(async () => {
    setLoadingConversations(true);
    try {
      const data = await listConversations();
      setConversations(data);
    } catch {
      // silent — sidebar just stays empty
    } finally {
      setLoadingConversations(false);
    }
  }, []);

  useEffect(() => {
    if (ready) fetchConversations();
  }, [fetchConversations, ready]);

  // ── Select a conversation ──────────────────────────────────────────────────
  async function selectConversation(id: number) {
    setActiveId(id);
    setMessages([]);
    setError(null);
    setLoadingHistory(true);
    try {
      const msgs: Message[] = await getMessages(id);
      setMessages(
        msgs.map((m) => ({ id: m.id, role: m.role, text: m.content }))
      );
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Gagal memuat pesan.");
    } finally {
      setLoadingHistory(false);
    }
  }

  // ── New conversation ───────────────────────────────────────────────────────
  async function handleNewConversation() {
    try {
      const res = await createConversation();
      const newConv: Conversation = {
        id:         res.conversation_id,
        title:      res.title,
        created_at: new Date().toISOString(),
      };
      setConversations((prev) => [newConv, ...prev]);
      setActiveId(newConv.id);
      setMessages([]);
      setError(null);
      setTimeout(() => inputRef.current?.focus(), 50);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Gagal membuat conversation.");
    }
  }

  // ── Send message ───────────────────────────────────────────────────────────
  async function handleSend() {
    if (!input.trim() || loading || activeId === null) return;

    const content = input.trim();
    setInput("");
    setError(null);

    // Optimistic UI: append user bubble + loading placeholder
    const userBubble: ChatMessage    = { role: "user",      text: content };
    const placeholder: ChatMessage   = { role: "assistant", text: "", loading: true };
    setMessages((prev) => [...prev, userBubble, placeholder]);
    setLoading(true);

    try {
      const res = await sendMessage(activeId, content);

      // Replace placeholder with real answer
      setMessages((prev) => [
        ...prev.slice(0, -1),
        { role: "assistant", text: res.answer },
      ]);

      // If title changed from default, refresh sidebar
      if (res.title !== "New Conversation") {
        setConversations((prev) =>
          prev.map((c) =>
            c.id === activeId ? { ...c, title: res.title } : c
          )
        );
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Terjadi kesalahan.";
      setMessages((prev) => [
        ...prev.slice(0, -1),
        { role: "assistant", text: `⚠️ ${msg}` },
      ]);
    } finally {
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    handleSend();
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  function handleLogout() {
    clearSession();
    router.push("/login");
  }

  // ── Rename conversation ────────────────────────────────────────────────────
  async function handleRename(id: number, currentTitle: string) {
    const newTitle = window.prompt("Nama baru conversation:", currentTitle);
    if (!newTitle || newTitle.trim() === currentTitle) return;
    try {
      await renameConversation(id, newTitle.trim());
      setConversations((prev) =>
        prev.map((c) => (c.id === id ? { ...c, title: newTitle.trim() } : c))
      );
    } catch {
      // silent
    }
  }

  const canSend = input.trim().length > 0 && !loading && activeId !== null;

  if (!ready) return null;

  // ─────────────────────────────────────────────────────────────────────────

  return (
    <>
      <style>{`
        @keyframes typingBounce {
          0%, 60%, 100% { transform: translateY(0);   opacity: 0.4; }
          30%            { transform: translateY(-5px); opacity: 1;   }
        }
        @keyframes msgFadeUp {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0);   }
        }
        .msg-enter { animation: msgFadeUp 0.22s ease both; }
      `}</style>

      <div
        className="flex flex-col h-screen overflow-hidden"
        style={{ background: "var(--bg-base)", color: "var(--text-primary)" }}
      >
        <Navbar user={user} onLogout={handleLogout} />

        {/* ── Main layout ── */}
        <div className="flex flex-1 overflow-hidden">

          {/* ── Sidebar ── */}
          <aside
            className="flex flex-col w-64 shrink-0 border-r overflow-hidden"
            style={{ borderColor: "var(--border)", background: "var(--bg-base)" }}
          >
            {/* Sidebar header */}
            <div
              className="flex items-center justify-between px-4 py-3 border-b shrink-0"
              style={{ borderColor: "var(--border)" }}
            >
              <span
                className="text-xs font-semibold uppercase tracking-widest"
                style={{ color: "var(--text-muted)" }}
              >
                Conversations
              </span>
              <button
                onClick={handleNewConversation}
                title="New conversation"
                className="flex items-center justify-center h-6 w-6 rounded-lg transition-opacity hover:opacity-75"
                style={{ background: "var(--accent-dim)", color: "var(--accent)" }}
              >
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                  <path d="M6 1v10M1 6h10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                </svg>
              </button>
            </div>

            {/* Conversation list */}
            <div className="flex-1 overflow-y-auto px-2 py-2 flex flex-col gap-0.5">
              {loadingConversations ? (
                <div className="flex flex-col gap-1.5 px-1 py-2">
                  {[...Array(4)].map((_, i) => (
                    <div
                      key={i}
                      className="h-10 rounded-xl animate-pulse"
                      style={{ background: "var(--bg-elevated)" }}
                    />
                  ))}
                </div>
              ) : conversations.length === 0 ? (
                <p
                  className="text-xs text-center mt-6 px-3 leading-relaxed"
                  style={{ color: "var(--text-muted)" }}
                >
                  Belum ada conversation.
                  <br />
                  Tekan{" "}
                  <span style={{ color: "var(--accent)" }}>+</span> untuk mulai.
                </p>
              ) : (
                conversations.map((conv) => (
                  <div key={conv.id} className="group relative">
                    <ConversationItem
                      conv={conv}
                      isActive={conv.id === activeId}
                      onClick={() => selectConversation(conv.id)}
                    />
                    {/* Rename button — appears on hover */}
                    <button
                      onClick={() => handleRename(conv.id, conv.title)}
                      title="Rename"
                      className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100
                                 transition-opacity p-1 rounded-lg"
                      style={{ color: "var(--text-muted)" }}
                      onMouseEnter={(e) => (e.currentTarget.style.color = "var(--text-secondary)")}
                      onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-muted)")}
                    >
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                      </svg>
                    </button>
                  </div>
                ))
              )}
            </div>
          </aside>

          {/* ── Chat area ── */}
          <main className="flex flex-col flex-1 overflow-hidden">
            {activeId === null ? (
              /* Empty state — no conversation selected */
              <div className="flex-1 flex flex-col items-center justify-center gap-6 px-8 text-center">
                <div
                  className="h-14 w-14 rounded-2xl flex items-center justify-center text-2xl"
                  style={{ background: "var(--accent-dim)", border: "1px solid var(--accent-glow)" }}
                >
                  ✦
                </div>
                <div>
                  <h1 className="text-xl font-bold tracking-tight mb-1">
                    Chat dengan <span style={{ color: "var(--accent)" }}>KelanaAI</span>
                  </h1>
                  <p className="text-sm max-w-xs" style={{ color: "var(--text-secondary)" }}>
                    Pilih conversation di sidebar atau buat yang baru untuk mulai berdialog.
                  </p>
                </div>
                <button
                  onClick={handleNewConversation}
                  className="text-xs font-semibold uppercase tracking-widest px-5 py-2.5 rounded-full transition-opacity hover:opacity-80"
                  style={{ background: "var(--accent)", color: "#0c0f0d" }}
                >
                  + New Conversation
                </button>
              </div>
            ) : (
              <>
                {/* Chat header */}
                <div
                  className="flex items-center gap-3 px-5 py-3 border-b shrink-0"
                  style={{ borderColor: "var(--border)" }}
                >
                  <span
                    className="h-2 w-2 rounded-full shrink-0"
                    style={{ background: "var(--accent)" }}
                  />
                  <span
                    className="text-sm font-semibold truncate"
                    style={{ color: "var(--text-primary)" }}
                  >
                    {activeConv?.title ?? "Conversation"}
                  </span>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto px-5 py-5">
                  {loadingHistory ? (
                    <div className="flex flex-col gap-3">
                      {[...Array(3)].map((_, i) => (
                        <div
                          key={i}
                          className={`flex ${i % 2 === 0 ? "justify-end" : "justify-start"}`}
                        >
                          <div
                            className="h-10 rounded-2xl animate-pulse"
                            style={{
                              width:      `${Math.random() * 20 + 40}%`,
                              background: "var(--bg-elevated)",
                            }}
                          />
                        </div>
                      ))}
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full gap-3 text-center">
                      <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                        Belum ada pesan. Ketik sesuatu untuk memulai.
                      </p>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-3">
                      {messages.map((msg, i) => (
                        <MessageBubble key={msg.id ?? `msg-${i}`} msg={msg} />
                      ))}
                    </div>
                  )}

                  {/* Inline error */}
                  {error && (
                    <p
                      className="mt-3 text-xs rounded-xl px-4 py-3"
                      style={{
                        color:      "#f87171",
                        background: "rgba(127,29,29,0.2)",
                        border:     "1px solid rgba(127,29,29,0.4)",
                      }}
                    >
                      {error}
                    </p>
                  )}

                  <div ref={bottomRef} />
                </div>

                {/* Input form */}
                <div
                  className="shrink-0 px-5 py-4 border-t"
                  style={{ borderColor: "var(--border)" }}
                >
                  <form
                    onSubmit={handleSubmit}
                    className="flex items-end gap-2 rounded-2xl border px-4 py-3"
                    style={{
                      background:  "var(--bg-surface)",
                      borderColor: "var(--border)",
                    }}
                    onFocusCapture={(e) => {
                      (e.currentTarget as HTMLElement).style.borderColor = "var(--accent-glow)";
                    }}
                    onBlurCapture={(e) => {
                      (e.currentTarget as HTMLElement).style.borderColor = "var(--border)";
                    }}
                  >
                    <textarea
                      ref={inputRef}
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="Ketik pesan… (Enter kirim, Shift+Enter baris baru)"
                      disabled={loading}
                      rows={1}
                      className="flex-1 resize-none bg-transparent outline-none text-sm leading-relaxed"
                      style={{
                        color:           "var(--text-primary)",
                        maxHeight:       "120px",
                        overflowY:       "auto",
                      }}
                      onInput={(e) => {
                        const el = e.currentTarget;
                        el.style.height = "auto";
                        el.style.height = `${el.scrollHeight}px`;
                      }}
                    />
                    <button
                      type="submit"
                      disabled={!canSend}
                      className="shrink-0 flex items-center justify-center h-8 w-8 rounded-xl
                                 transition-opacity disabled:opacity-30"
                      style={{ background: "var(--accent)", color: "#0c0f0d" }}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M12 5l7 7-7 7" />
                      </svg>
                    </button>
                  </form>
                  <p className="text-[10px] mt-1.5 text-center" style={{ color: "var(--text-muted)" }}>
                    KelanaAI dapat membuat kesalahan. Verifikasi informasi penting.
                  </p>
                </div>
              </>
            )}
          </main>
        </div>
      </div>
    </>
  );
}
