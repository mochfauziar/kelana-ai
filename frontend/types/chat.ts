// ─── Domain types for chat conversation feature ──────────────────────────────

export interface Conversation {
  id:         number;
  title:      string;
  created_at: string;
}

export interface Message {
  id:              number;
  conversation_id: number;
  role:            "user" | "assistant";
  content:         string;
  created_at:      string;
}

export interface CreateConversationResponse {
  conversation_id: number;
  title:           string;
}

export interface SendMessageResponse {
  answer:          string;
  conversation_id: number;
  title:           string;
}
