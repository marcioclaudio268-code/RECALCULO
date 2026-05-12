export const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3001";

const AUTH_TOKEN_STORAGE_KEY = "recalculo_guias_auth_token";

type UnauthorizedHandler = () => void;

type ApiRequestOptions = RequestInit & {
  skipUnauthorizedHandler?: boolean;
};

let unauthorizedHandler: UnauthorizedHandler | null = null;

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export function setUnauthorizedHandler(handler: UnauthorizedHandler | null) {
  unauthorizedHandler = handler;
}

function notificarUnauthorized() {
  unauthorizedHandler?.();
}

export function getAuthToken() {
  return localStorage.getItem(AUTH_TOKEN_STORAGE_KEY);
}

export function setAuthToken(token: string) {
  localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, token);
}

export function clearAuthToken() {
  localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
}

export function getAuthHeaders() {
  const headers = new Headers();
  const token = getAuthToken();

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  return headers;
}

export async function tratarErroResponse(
  response: Response,
  fallback: string,
  options: { skipUnauthorizedHandler?: boolean } = {}
) {
  if (response.status === 401 && options.skipUnauthorizedHandler !== true) {
    notificarUnauthorized();
  }

  let message = fallback;

  try {
    const data = (await response.json()) as { erro?: string; message?: string };
    message = data.erro ?? data.message ?? message;
  } catch {
    // Mantem mensagem generica quando a API nao retorna JSON.
  }

  return new ApiError(message, response.status);
}

export async function apiRequest<T>(
  path: string,
  options: ApiRequestOptions = {}
): Promise<T> {
  const { skipUnauthorizedHandler, ...requestOptions } = options;
  const headers = new Headers(options.headers);
  const token = getAuthToken();

  if (options.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...requestOptions,
    headers
  });

  if (!response.ok) {
    throw await tratarErroResponse(
      response,
      "Nao foi possivel concluir a operacao.",
      { skipUnauthorizedHandler }
    );
  }

  return response.json() as Promise<T>;
}
