import { apiRequest, clearAuthToken } from "./client";

export type UsuarioAutenticado = {
  id: string;
  nome: string;
  email: string;
};

export type LoginResponse = {
  token: string;
  usuario: UsuarioAutenticado;
};

export async function login(email: string, senha: string) {
  return apiRequest<LoginResponse>("/auth/login", {
    method: "POST",
    skipUnauthorizedHandler: true,
    body: JSON.stringify({
      email,
      senha
    })
  });
}

export async function me() {
  return apiRequest<{ usuario: UsuarioAutenticado }>("/auth/me");
}

export async function logout() {
  try {
    return await apiRequest<{ ok: true }>("/auth/logout", {
      method: "POST",
      skipUnauthorizedHandler: true
    });
  } finally {
    clearAuthToken();
  }
}
