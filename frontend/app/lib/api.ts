const API_BASE = "http://localhost:5000";

interface RequestOptions extends Omit<RequestInit, "method" | "body"> {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
}

class ApiError extends Error {
  status: number;
  data: unknown;

  constructor(status: number, message: string, data?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

async function request<T>(
  endpoint: string,
  options: RequestOptions = {},
): Promise<T> {
  const { method = "GET", body, headers, ...rest } = options;

  const res = await fetch(`${API_BASE}${endpoint}`, {
    method,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
    ...rest,
  });

  const data = await res.json();

  if (!res.ok) {
    throw new ApiError(
      res.status,
      (data as { error?: string })?.error || "Something went wrong",
      data,
    );
  }

  return data as T;
}

export interface SSECallbacks {
  onChunk: (chunk: string) => void;
  onDone: () => void;
  onError: (error: Error) => void;
  onStart?: () => void;
}

export function createSSEConnection(
  endpoint: string,
  callbacks: SSECallbacks,
): () => void {
  const controller = new AbortController();
  let done = false;

  const markDone = () => {
    if (!done) {
      done = true;
      callbacks.onDone();
    }
  };

  fetch(`${API_BASE}${endpoint}`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    signal: controller.signal,
  })
    .then(async (response) => {
      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new ApiError(
          response.status,
          data?.error || "SSE connection failed",
        );
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error("No response body");
      }

      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done: streamDone, value } = await reader.read();
        if (streamDone) break;

        buffer += decoder.decode(value, { stream: true });

        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6));

              if (data.type === "started") {
                callbacks.onStart?.();
              } else if (data.type === "chunk") {
                callbacks.onChunk(data.content);
              } else if (data.type === "done") {
                markDone();
              } else if (data.type === "error") {
                callbacks.onError(new Error(data.message));
              }
            } catch {
              // Ignore parse errors for incomplete JSON
            }
          }
        }
      }

      markDone();
    })
    .catch((error) => {
      if (error.name !== "AbortError") {
        callbacks.onError(error);
      }
    });

  return () => controller.abort();
}

export const api = {
  get: <T>(endpoint: string, opts?: RequestOptions) =>
    request<T>(endpoint, { ...opts, method: "GET" }),

  post: <T>(endpoint: string, body?: unknown, opts?: RequestOptions) =>
    request<T>(endpoint, { ...opts, method: "POST", body }),

  put: <T>(endpoint: string, body?: unknown, opts?: RequestOptions) =>
    request<T>(endpoint, { ...opts, method: "PUT", body }),

  patch: <T>(endpoint: string, body?: unknown, opts?: RequestOptions) =>
    request<T>(endpoint, { ...opts, method: "PATCH", body }),

  delete: <T>(endpoint: string, body?: unknown, opts?: RequestOptions) =>
    request<T>(endpoint, { ...opts, method: "DELETE", body }),
};

export { ApiError };
