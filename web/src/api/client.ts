const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3001";

type RequestOptions = RequestInit & {
  userId?: string;
};

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export async function apiRequest<T>(
  path: string,
  options: RequestOptions = {}
): Promise<T> {
  const headers = new Headers(options.headers);

  if (options.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  if (options.userId) {
    headers.set("x-user-id", options.userId);
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers
  });

  if (!response.ok) {
    let message = "Não foi possível concluir a operação.";

    try {
      const data = (await response.json()) as { erro?: string; message?: string };
      message = data.erro ?? data.message ?? message;
    } catch {
      // Mantém mensagem genérica quando a API não retorna JSON.
    }

    throw new ApiError(message, response.status);
  }

  return response.json() as Promise<T>;
}
