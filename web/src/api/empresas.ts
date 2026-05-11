import { apiRequest } from "./client";

export type Empresa = {
  id: string;
  codigoEmpresa: string;
  documento: string;
  tipoDocumento: "CPF" | "CNPJ";
  nome: string;
  nomeFantasia: string | null;
  ativa: boolean;
};

export type ListarEmpresasParams = {
  busca?: string;
  limit?: number;
};

export async function listarEmpresas(params: ListarEmpresasParams = {}) {
  const searchParams = new URLSearchParams();

  searchParams.set("limit", String(params.limit ?? 20));

  if (params.busca?.trim()) {
    searchParams.set("busca", params.busca.trim());
  }

  return apiRequest<Empresa[]>(`/empresas?${searchParams.toString()}`);
}
