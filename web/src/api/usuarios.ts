import { apiRequest } from "./client";

export type PerfilUsuario = "ADMIN" | "OPERADOR";

export type Usuario = {
  id: string;
  login: string;
  nome: string;
  email: string | null;
  perfil: PerfilUsuario;
  ativo: boolean;
  createdAt: string;
  updatedAt: string;
};

export type CriarUsuarioInput = {
  nome: string;
  login: string;
  email?: string | null;
  senha: string;
  perfil: PerfilUsuario;
  ativo?: boolean;
};

export type EditarUsuarioInput = {
  nome?: string;
  login?: string;
  email?: string | null;
  perfil?: PerfilUsuario;
  ativo?: boolean;
};

export async function listarUsuarios() {
  return apiRequest<Usuario[]>("/usuarios");
}

export async function criarUsuario(input: CriarUsuarioInput) {
  return apiRequest<Usuario>("/usuarios", {
    method: "POST",
    body: JSON.stringify(input)
  });
}

export async function editarUsuario(id: string, input: EditarUsuarioInput) {
  return apiRequest<Usuario>(`/usuarios/${id}`, {
    method: "PATCH",
    body: JSON.stringify(input)
  });
}

export async function alterarSenhaUsuario(id: string, senha: string) {
  return apiRequest<Usuario>(`/usuarios/${id}/alterar-senha`, {
    method: "POST",
    body: JSON.stringify({ senha })
  });
}

export async function ativarUsuario(id: string) {
  return apiRequest<Usuario>(`/usuarios/${id}/ativar`, {
    method: "POST"
  });
}

export async function desativarUsuario(id: string) {
  return apiRequest<Usuario>(`/usuarios/${id}/desativar`, {
    method: "POST"
  });
}
