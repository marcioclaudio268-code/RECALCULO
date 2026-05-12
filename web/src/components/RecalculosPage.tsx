import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  ListarRecalculosParams,
  RecalculoListItem,
  StatusRecalculo,
  TipoGuia,
  listarRecalculos,
  statusRecalculo,
  tiposGuia
} from "../api/recalculos";

type FiltrosRecalculos = {
  busca: string;
  competencia: string;
  tipoGuia: TipoGuia | "";
  status: StatusRecalculo | "";
  dataInicio: string;
  dataFim: string;
  limit: number;
};

type RecalculosPageProps = {
  onVerDetalhe: (recalculoId: string) => void;
};

const filtrosIniciais: FiltrosRecalculos = {
  busca: "",
  competencia: "",
  tipoGuia: "",
  status: "",
  dataInicio: "",
  dataFim: "",
  limit: 20
};

const statusLabels: Record<StatusRecalculo, string> = {
  LANCADO: "Lancado",
  EM_REVISAO: "Em revisao",
  FINALIZADO: "Finalizado",
  CANCELADO: "Cancelado"
};

function formatarData(value?: string | null) {
  if (!value) {
    return "-";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("pt-BR").format(date);
}

function formatarDocumento(documento?: string | null) {
  if (!documento) {
    return "-";
  }

  const digits = documento.replace(/\D/g, "");

  if (digits.length === 14) {
    return digits.replace(
      /^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/,
      "$1.$2.$3/$4-$5"
    );
  }

  if (digits.length === 11) {
    return digits.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, "$1.$2.$3-$4");
  }

  return documento;
}

function evidenciaTexto(recalculo: RecalculoListItem) {
  if (!recalculo.temEvidencia) {
    return "Sem evidencia";
  }

  if (recalculo.quantidadeEvidencias > 0) {
    return `Com evidencia (${recalculo.quantidadeEvidencias})`;
  }

  return "Com evidencia";
}

function montarParams(filtros: FiltrosRecalculos): ListarRecalculosParams {
  return {
    busca: filtros.busca.trim(),
    competencia: filtros.competencia,
    tipoGuia: filtros.tipoGuia,
    status: filtros.status,
    dataInicio: filtros.dataInicio,
    dataFim: filtros.dataFim,
    limit: filtros.limit
  };
}

export function RecalculosPage({ onVerDetalhe }: RecalculosPageProps) {
  const [filtros, setFiltros] = useState<FiltrosRecalculos>(filtrosIniciais);
  const [filtrosAplicados, setFiltrosAplicados] =
    useState<FiltrosRecalculos>(filtrosIniciais);
  const [recalculos, setRecalculos] = useState<RecalculoListItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    carregarRecalculos(filtrosAplicados);
  }, [filtrosAplicados]);

  async function carregarRecalculos(filtrosParaBusca: FiltrosRecalculos) {
    setIsLoading(true);
    setErro(null);

    try {
      const data = await listarRecalculos(montarParams(filtrosParaBusca));
      setRecalculos(data);
    } catch (error) {
      setErro(error instanceof Error ? error.message : "Erro ao carregar recalculos.");
    } finally {
      setIsLoading(false);
    }
  }

  function handleBuscar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFiltrosAplicados({ ...filtros });
  }

  function handleLimpar() {
    setFiltros(filtrosIniciais);
    setFiltrosAplicados(filtrosIniciais);
  }

  const quantidadeTexto = useMemo(() => {
    if (isLoading) {
      return "Carregando recalculos...";
    }

    return `${recalculos.length} recalculo${
      recalculos.length === 1 ? "" : "s"
    } exibido${recalculos.length === 1 ? "" : "s"}`;
  }, [isLoading, recalculos.length]);

  return (
    <section className="recalculos-layout">
      <div className="recalculos-area">
        <div className="section-heading">
          <div>
            <h2>Recalculos</h2>
            <p>Consulte lancamentos e abra o detalhe de cada registro.</p>
          </div>
          <span className="counter">{quantidadeTexto}</span>
        </div>

        <form className="recalculos-filter-row" onSubmit={handleBuscar}>
          <div className="filters-primary">
            <label className="filter-search">
              <span>Buscar</span>
              <input
                value={filtros.busca}
                placeholder="Empresa, codigo, CNPJ ou descricao"
                onChange={(event) =>
                  setFiltros((current) => ({
                    ...current,
                    busca: event.target.value
                  }))
                }
              />
            </label>
            <label className="filter-limit">
              <span>Limite</span>
              <select
                value={filtros.limit}
                onChange={(event) =>
                  setFiltros((current) => ({
                    ...current,
                    limit: Number(event.target.value)
                  }))
                }
              >
                <option value={20}>20</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </label>
            <div className="filter-actions">
              <button type="submit">Buscar</button>
              <button
                type="button"
                className="button-secondary"
                onClick={handleLimpar}
              >
                Limpar filtros
              </button>
            </div>
          </div>

          <div className="filters-secondary">
            <label>
              <span>Competencia</span>
              <input
                type="month"
                value={filtros.competencia}
                onChange={(event) =>
                  setFiltros((current) => ({
                    ...current,
                    competencia: event.target.value
                  }))
                }
              />
            </label>
            <label>
              <span>Tipo de guia</span>
              <select
                value={filtros.tipoGuia}
                onChange={(event) =>
                  setFiltros((current) => ({
                    ...current,
                    tipoGuia: event.target.value as TipoGuia | ""
                  }))
                }
              >
                <option value="">Todos</option>
                {tiposGuia.map((tipo) => (
                  <option key={tipo} value={tipo}>
                    {tipo}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span>Status</span>
              <select
                value={filtros.status}
                onChange={(event) =>
                  setFiltros((current) => ({
                    ...current,
                    status: event.target.value as StatusRecalculo | ""
                  }))
                }
              >
                <option value="">Todos</option>
                {statusRecalculo.map((status) => (
                  <option key={status} value={status}>
                    {statusLabels[status]}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span>Data inicial</span>
              <input
                type="date"
                value={filtros.dataInicio}
                onChange={(event) =>
                  setFiltros((current) => ({
                    ...current,
                    dataInicio: event.target.value
                  }))
                }
              />
            </label>
            <label>
              <span>Data final</span>
              <input
                type="date"
                value={filtros.dataFim}
                onChange={(event) =>
                  setFiltros((current) => ({
                    ...current,
                    dataFim: event.target.value
                  }))
                }
              />
            </label>
          </div>
        </form>

        {erro && <div className="message error">{erro}</div>}

        <div className="table-wrap">
          <table className="recalculos-table">
            <thead>
              <tr>
                <th>Empresa</th>
                <th>Codigo</th>
                <th>Documento</th>
                <th>Guia</th>
                <th>Competencia</th>
                <th>Descricao</th>
                <th>Data do recalculo</th>
                <th>Responsavel</th>
                <th>Status</th>
                <th>Evidencia</th>
                <th>Acao</th>
              </tr>
            </thead>
            <tbody>
              {recalculos.map((recalculo) => (
                <tr key={recalculo.id}>
                  <td>{recalculo.empresa.nome}</td>
                  <td>{recalculo.empresa.codigoEmpresa}</td>
                  <td>{formatarDocumento(recalculo.empresa.documento)}</td>
                  <td>{recalculo.tipoGuia}</td>
                  <td>{recalculo.competencia}</td>
                  <td>{recalculo.descricao}</td>
                  <td>{formatarData(recalculo.dataRecalculo)}</td>
                  <td>{recalculo.responsavel?.nome ?? "-"}</td>
                  <td>
                    <span className="status-pill">
                      {statusLabels[recalculo.status] ?? recalculo.status}
                    </span>
                  </td>
                  <td>{evidenciaTexto(recalculo)}</td>
                  <td>
                    <button
                      type="button"
                      className="button-compact"
                      onClick={() => onVerDetalhe(recalculo.id)}
                    >
                      Ver detalhe
                    </button>
                  </td>
                </tr>
              ))}
              {!isLoading && recalculos.length === 0 && (
                <tr>
                  <td colSpan={11} className="empty-cell">
                    Nenhum recalculo encontrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
