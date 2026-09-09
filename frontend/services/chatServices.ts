import type {
  Conversation,
  Message,
  CreateConversationResponse,
  SendMessageResponse,
} from "@/types/chat";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function authHeaders(): Record<string, string> {
  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("kelana_token")
      : null;
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    if (res.status === 401 && typeof window !== "undefined") {
      localStorage.removeItem("kelana_token");
      localStorage.removeItem("kelana_user");
      window.location.href = "/login";
    }
    const err = await res.json().catch(() => ({}));
    throw new Error(
      (err as { detail?: string })?.detail ?? `Server error ${res.status}`
    );
  }
  return res.json() as Promise<T>;
}

// ─── API Functions ────────────────────────────────────────────────────────────

/**
 * POST /api/v1/conversations
 * Buat conversation baru. Title opsional, default "New Conversation".
 */
export async function createConversation(
  title = "New Conversation"
): Promise<CreateConversationResponse> {
  const res = await fetch(`${BASE_URL}/api/v1/conversations`, {
    method:  "POST",
    headers: authHeaders(),
    body:    JSON.stringify({ title }),
  });
  return handleResponse<CreateConversationResponse>(res);
}

/**
 * GET /api/v1/conversations
 * List semua conversation milik user yang sedang login, urut terbaru.
 */
export async function listConversations(): Promise<Conversation[]> {
  const res = await fetch(`${BASE_URL}/api/v1/conversations`, {
    headers: authHeaders(),
  });
  return handleResponse<Conversation[]>(res);
}

/**
 * POST /api/v1/conversations/{id}/messages
 * Kirim pesan user dan dapatkan jawaban AI.
 */
export async function sendMessage(
  conversationId: number,
  content: string
): Promise<SendMessageResponse> {
  const res = await fetch(
    `${BASE_URL}/api/v1/conversations/${conversationId}/messages`,
    {
      method:  "POST",
      headers: authHeaders(),
      body:    JSON.stringify({ content }),
    }
  );
  return handleResponse<SendMessageResponse>(res);
}

/**
 * GET /api/v1/conversations/{id}/messages
 * Ambil seluruh history messages dalam sebuah conversation.
 */
export async function getMessages(conversationId: number): Promise<Message[]> {
  const res = await fetch(
    `${BASE_URL}/api/v1/conversations/${conversationId}/messages`,
    { headers: authHeaders() }
  );
  return handleResponse<Message[]>(res);
}

/**
 * PATCH /api/v1/conversations/{id}
 * Rename title conversation secara manual.
 */
export async function renameConversation(
  conversationId: number,
  title: string
): Promise<CreateConversationResponse> {
  const res = await fetch(
    `${BASE_URL}/api/v1/conversations/${conversationId}`,
    {
      method:  "PATCH",
      headers: authHeaders(),
      body:    JSON.stringify({ title }),
    }
  );
  return handleResponse<CreateConversationResponse>(res);
}
