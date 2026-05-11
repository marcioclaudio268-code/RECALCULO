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
