import { randomUUID } from "node:crypto";
import { constants } from "node:fs";
import { access, mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { HttpError } from "./http-error.js";

export const MAX_EVIDENCIA_BYTES = 5 * 1024 * 1024;

const EVIDENCIAS_STORAGE_RELATIVE_DIR = "storage/evidencias-solicitacao";
const EVIDENCIAS_STORAGE_DIR = path.resolve(
  process.cwd(),
  EVIDENCIAS_STORAGE_RELATIVE_DIR
);

const extensoesPorMime: Record<string, string[]> = {
  "image/png": [".png"],
  "image/jpeg": [".jpg", ".jpeg"],
  "image/jpg": [".jpg", ".jpeg"],
  "image/webp": [".webp"]
};

export type ArquivoEvidenciaValidavel = {
  nomeArquivo: string;
  tipoArquivo: string;
  tamanhoArquivo: number;
};

export type ArquivoEvidenciaSalvavel = {
  recalculoId: string;
  nomeArquivo: string;
  tipoArquivo: string;
  buffer: Buffer;
};

export function validarArquivoEvidencia(arquivo: ArquivoEvidenciaValidavel) {
  const extensao = path.extname(arquivo.nomeArquivo).toLowerCase();
  const extensoesPermitidas = extensoesPorMime[arquivo.tipoArquivo.toLowerCase()];

  if (!extensoesPermitidas || !extensoesPermitidas.includes(extensao)) {
    throw new HttpError(
      400,
      "Arquivo invalido. Envie apenas imagens PNG, JPG, JPEG ou WEBP."
    );
  }

  if (arquivo.tamanhoArquivo > MAX_EVIDENCIA_BYTES) {
    throw new HttpError(400, "Arquivo excede o limite de 5 MB.");
  }

  return extensao;
}

export async function salvarArquivoEvidencia(arquivo: ArquivoEvidenciaSalvavel) {
  const extensao = validarArquivoEvidencia({
    nomeArquivo: arquivo.nomeArquivo,
    tipoArquivo: arquivo.tipoArquivo,
    tamanhoArquivo: arquivo.buffer.length
  });

  await mkdir(EVIDENCIAS_STORAGE_DIR, { recursive: true });

  const nomeFisico = `${arquivo.recalculoId}_${Date.now()}_${randomUUID()}${extensao}`;
  const caminhoRelativo = `${EVIDENCIAS_STORAGE_RELATIVE_DIR}/${nomeFisico}`;
  const caminhoAbsoluto = resolverCaminhoEvidencia(caminhoRelativo);

  await writeFile(caminhoAbsoluto, arquivo.buffer);

  return {
    caminhoRelativo,
    caminhoAbsoluto
  };
}

export function resolverCaminhoEvidencia(caminhoRelativo: string) {
  const caminhoAbsoluto = path.resolve(process.cwd(), caminhoRelativo);
  const dentroDaPasta =
    caminhoAbsoluto === EVIDENCIAS_STORAGE_DIR ||
    caminhoAbsoluto.startsWith(`${EVIDENCIAS_STORAGE_DIR}${path.sep}`);

  if (!dentroDaPasta) {
    throw new HttpError(404, "Arquivo da evidencia nao encontrado.");
  }

  return caminhoAbsoluto;
}

export async function garantirArquivoEvidenciaExiste(caminhoAbsoluto: string) {
  try {
    await access(caminhoAbsoluto, constants.R_OK);
  } catch {
    throw new HttpError(404, "Arquivo da evidencia nao encontrado.");
  }
}

export async function removerArquivoEvidencia(caminhoRelativo: string) {
  const caminhoAbsoluto = resolverCaminhoEvidencia(caminhoRelativo);
  await rm(caminhoAbsoluto, { force: true });
}
