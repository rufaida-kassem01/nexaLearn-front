import type { ChatMessage } from "../types";

const BASE_URL: string = import.meta.env.VITE_API_URL || "";

export async function* sendTranscriptMessage(
  lessonId: string,
  message: string,
  history: ChatMessage[],
  accessToken: string | null,
): AsyncGenerator<string, void, unknown> {
  const url = `${BASE_URL}/lessons/${lessonId}/chat`;

  const body: {
    lessonId: string;
    message: string;
    conversationHistory: ChatMessage[];
  } = {
    lessonId,
    message,
    conversationHistory: history,
  };

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = new Error("Chat request failed") as Error & { status?: number };
    err.status = res.status;
    if (res.status === 429) {
      const text = await res.text().catch(() => "");
      err.message = text || "Rate limit exceeded. Please wait.";
    }
    throw err;
  }

  const contentType = res.headers.get("content-type") || "";

  if (contentType.includes("text/event-stream")) {
    const reader = res.body?.getReader();
    if (!reader) return;

    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        if (line.startsWith("data: ")) {
          const dataStr = line.slice(6).trim();
          if (dataStr === "[DONE]") return;
          try {
            const parsed = JSON.parse(dataStr) as Record<string, unknown>;
            const token = parsed.token || parsed.text || parsed.content || dataStr;
            yield token as string;
          } catch {
            yield dataStr;
          }
        }
      }
    }
  } else {
    const text = await res.text();
    try {
      const json = JSON.parse(text) as Record<string, unknown>;
      const reply =
        (json.data as Record<string, unknown>)?.reply ||
        (json.data as Record<string, unknown>)?.message ||
        (json.data as Record<string, unknown>)?.text ||
        json.reply ||
        json.message ||
        json.text ||
        text;
      yield reply as string;
    } catch {
      yield text;
    }
  }
}
