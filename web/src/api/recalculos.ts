import { apiRequest } from "./client";

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
  caminhoArquivo: string;
  tipoArquivo: string;
  tamanhoArquivo: number;
  enviadoPorId: string;
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
