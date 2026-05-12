import { API_URL, getAuthHeaders, tratarErroResponse } from "./client";

export type BaixarRelatorioRecalculosParams = {
  dataInicio: string;
  dataFim: string;
  incluirCancelados: boolean;
};

function extrairNomeArquivo(response: Response, fallback: string) {
  const disposition = response.headers.get("Content-Disposition");
  const match = disposition?.match(/filename="?([^"]+)"?/i);

  return match?.[1] ?? fallback;
}

function dispararDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export async function baixarRelatorioRecalculos(
  params: BaixarRelatorioRecalculosParams
) {
  const searchParams = new URLSearchParams({
    dataInicio: params.dataInicio,
    dataFim: params.dataFim
  });

  if (params.incluirCancelados) {
    searchParams.set("incluirCancelados", "true");
  }

  const response = await fetch(
    `${API_URL}/relatorios/recalculos.xlsx?${searchParams.toString()}`,
    {
      headers: getAuthHeaders()
    }
  );

  if (!response.ok) {
    throw await tratarErroResponse(
      response,
      "N\u00e3o foi poss\u00edvel gerar o relat\u00f3rio."
    );
  }

  const filename = extrairNomeArquivo(
    response,
    `relatorio-recalculos-${params.dataInicio}-a-${params.dataFim}.xlsx`
  );
  const blob = await response.blob();
  dispararDownload(blob, filename);

  return filename;
}
