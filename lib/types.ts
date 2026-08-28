export type Role = "user" | "assistant";

export interface Message {
  id: string;
  role: Role;
  content: string;
  createdAt: number;
  /** Set when the assistant turn failed, so the UI can render it as an error. */
  error?: boolean;
}

/** Shape sent to POST /api/chat. */
export interface ChatRequestBody {
  messages: Pick<Message, "role" | "content">[];
}

export interface ChatErrorBody {
  error: string;
  code?: string;
}
