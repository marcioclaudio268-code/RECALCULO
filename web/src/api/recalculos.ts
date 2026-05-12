import { API_URL, ApiError, apiRequest } from "./client";

export type TipoGuia =
  | "DAS"
  | "DARF"
  | "GPS"
  | "FGTS"
  | "ICMS"
  | "ISS"
  | "DAE"
  | "GARE"
  | "PARCELAMENTO"
  | "OUTROS";

export type StatusRecalculo =
  | "LANCADO"
  | "EM_REVISAO"
  | "FINALIZADO"
  | "CANCELADO";

export const tiposGuia: TipoGuia[] = [
  "DAS",
  "DARF",
  "GPS",
  "FGTS",
  "ICMS",
  "ISS",
  "DAE",
  "GARE",
  "PARCELAMENTO",
  "OUTROS"
];

export const statusRecalculo: StatusRecalculo[] = [
  "LANCADO",
  "EM_REVISAO",
  "FINALIZADO",
  "CANCELADO"
];

export type UsuarioResumo = {
  id: string;
  nome: string;
  email?: string;
};

export type EmpresaResumo = {
  id: string;
  codigoEmpresa: string;
  documento: string;
  tipoDocumento?: string;
  nome: string;
  nomeFantasia?: string | null;
};

export type RecalculoListItem = {
  id: string;
  empresa: EmpresaResumo;
  tipoGuia: TipoGuia;
  competencia: string;
  descricao: string;
  dataRecalculo: string;
  responsavel: UsuarioResumo | null;
  status: StatusRecalculo;
  temEvidencia: boolean;
  quantidadeEvidencias: number;
  createdAt: string;
  updatedAt: string;
};

export type EvidenciaDetalhe = {
  id: string;
  nomeArquivo: string;
  tipoArquivo: string;
  tamanhoArquivo: number;
  enviadoPorId: string;
  enviadoPor?: UsuarioResumo | null;
  createdAt: string;
};

export type AuditoriaDetalhe = {
  id: string;
  usuarioId: string | null;
  usuario?: UsuarioResumo | null;
  entidade: string;
  entidadeId: string;
  acao: string;
  campoAlterado: string | null;
  valorAnterior: string | null;
  valorNovo: string | null;
  createdAt: string;
};

export type RecalculoDetalhe = {
  id: string;
  empresaId: string;
  empresa: EmpresaResumo;
  tipoGuia: TipoGuia;
  competencia: string;
  descricao: string;
  motivo: string | null;
  solicitante: string | null;
  dataSolicitacao: string | null;
  dataRecalculo: string;
  responsavelId: string;
  responsavel: UsuarioResumo | null;
  status: StatusRecalculo;
  observacoes: string | null;
  criadoPorId: string;
  criadoPor: UsuarioResumo | null;
  atualizadoPorId: string;
  atualizadoPor: UsuarioResumo | null;
  createdAt: string;
  updatedAt: string;
  evidencias: EvidenciaDetalhe[];
  auditorias: AuditoriaDetalhe[];
};

export type ListarRecalculosParams = {
  competencia?: string;
  tipoGuia?: TipoGuia | "";
  status?: StatusRecalculo | "";
  dataInicio?: string;
  dataFim?: string;
  limit?: number;
};

export type CriarRecalculoInput = {
  empresaId: string;
  tipoGuia: TipoGuia;
  competencia: string;
  descricao: string;
  dataRecalculo: string;
  responsavelId: string;
  motivo?: string;
  solicitante?: string;
  dataSolicitacao?: string;
  observacoes?: string;
};

export type EditarRecalculoInput = {
  tipoGuia?: TipoGuia;
  competencia?: string;
  descricao?: string;
  motivo?: string | null;
  solicitante?: string | null;
  dataSolicitacao?: string | null;
  dataRecalculo?: string;
  responsavelId?: string;
  observacoes?: string | null;
};

export type CriarRecalculoResponse = {
  recalculo: {
    id: string;
    tipoGuia: TipoGuia;
    competencia: string;
    descricao: string;
    dataRecalculo: string;
    status: string;
    temEvidencia: boolean;
    quantidadeEvidencias: number;
  };
  alertaDuplicidade: boolean;
  recalculosSimilares: Array<{
    id: string;
    tipoGuia: TipoGuia;
    competencia: string;
    descricao: string;
    dataRecalculo: string;
    status: string;
  }>;
};

function appendParam(params: URLSearchParams, key: string, value?: string | number) {
  if (value !== undefined && value !== "") {
    params.set(key, String(value));
  }
}

async function extrairErroResponse(response: Response) {
  let message = "Não foi possível concluir a operação.";

  try {
    const data = (await response.json()) as { erro?: string; message?: string };
    message = data.erro ?? data.message ?? message;
  } catch {
    // Mantem mensagem generica quando a API nao retorna JSON.
  }

  return new ApiError(message, response.status);
}

export async function listarRecalculos(params: ListarRecalculosParams = {}) {
  const searchParams = new URLSearchParams();

  appendParam(searchParams, "competencia", params.competencia);
  appendParam(searchParams, "tipoGuia", params.tipoGuia);
  appendParam(searchParams, "status", params.status);
  appendParam(searchParams, "dataInicio", params.dataInicio);
  appendParam(searchParams, "dataFim", params.dataFim);
  appendParam(searchParams, "limit", params.limit ?? 20);

  const query = searchParams.toString();
  return apiRequest<RecalculoListItem[]>(`/recalculos${query ? `?${query}` : ""}`);
}

export async function detalharRecalculo(id: string) {
  return apiRequest<RecalculoDetalhe>(`/recalculos/${id}`);
}

export async function editarRecalculo(
  userId: string,
  id: string,
  input: EditarRecalculoInput
) {
  return apiRequest<RecalculoDetalhe>(`/recalculos/${id}`, {
    method: "PATCH",
    userId,
    body: JSON.stringify(input)
  });
}

export async function cancelarRecalculo(
  userId: string,
  id: string,
  motivoCancelamento: string
) {
  return apiRequest<RecalculoDetalhe>(`/recalculos/${id}/cancelar`, {
    method: "POST",
    userId,
    body: JSON.stringify({ motivoCancelamento })
  });
}

export async function enviarEvidenciaRecalculo(
  userId: string,
  recalculoId: string,
  file: File
) {
  const formData = new FormData();
  formData.append("arquivo", file);

  const response = await fetch(`${API_URL}/recalculos/${recalculoId}/evidencias`, {
    method: "POST",
    headers: {
      "x-user-id": userId
    },
    body: formData
  });

  if (!response.ok) {
    throw await extrairErroResponse(response);
  }

  return response.json() as Promise<EvidenciaDetalhe>;
}

export async function baixarArquivoEvidencia(userId: string, evidenciaId: string) {
  const response = await fetch(`${API_URL}/evidencias/${evidenciaId}/arquivo`, {
    headers: {
      "x-user-id": userId
    }
  });

  if (!response.ok) {
    throw await extrairErroResponse(response);
  }

  return response.blob();
}

export async function criarRecalculo(
  userId: string,
  input: CriarRecalculoInput
) {
  return apiRequest<CriarRecalculoResponse>("/recalculos", {
    method: "POST",
    userId,
    body: JSON.stringify(input)
  });
}
