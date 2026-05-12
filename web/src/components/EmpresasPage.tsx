import { FormEvent, useEffect, useMemo, useState } from "react";
import { Empresa, listarEmpresas } from "../api/empresas";

type EmpresasPageProps = {
  onLancarRecalculo: (empresa: Empresa) => void;
};

export function EmpresasPage({ onLancarRecalculo }: EmpresasPageProps) {
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [busca, setBusca] = useState("");
  const [buscaAplicada, setBuscaAplicada] = useState("");
  const [limit, setLimit] = useState(20);
  const [isLoading, setIsLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    carregarEmpresas(buscaAplicada, limit);
  }, [buscaAplicada, limit]);

  async function carregarEmpresas(termo: string, limite: number) {
    setIsLoading(true);
    setErro(null);

    try {
      const data = await listarEmpresas({
        busca: termo,
        limit: limite
      });
      setEmpresas(data);
    } catch (error) {
      setErro(error instanceof Error ? error.message : "Erro ao carregar empresas.");
    } finally {
      setIsLoading(false);
    }
  }

  function handleBuscar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBuscaAplicada(busca.trim());
  }

  function handleLimpar() {
    setBusca("");
    setBuscaAplicada("");
  }

  const quantidadeTexto = useMemo(() => {
    if (isLoading) {
      return "Carregando empresas...";
    }

    return `${empresas.length} empresa${empresas.length === 1 ? "" : "s"} exibida${
      empresas.length === 1 ? "" : "s"
    }`;
  }, [empresas.length, isLoading]);

  return (
    <section className="page-layout">
      <div className="companies-area">
        <div className="section-heading">
          <div>
            <h2>Empresas</h2>
            <p>Busque por nome, codigo ou documento.</p>
          </div>
          <span className="counter">{quantidadeTexto}</span>
        </div>

        <form className="search-row" onSubmit={handleBuscar}>
          <input
            value={busca}
            onChange={(event) => setBusca(event.target.value)}
            placeholder="Nome, codigo ou documento"
          />
          <select
            value={limit}
            onChange={(event) => setLimit(Number(event.target.value))}
            aria-label="Limite de empresas"
          >
            <option value={20}>20</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
          <button type="submit">Buscar</button>
          <button type="button" className="button-secondary" onClick={handleLimpar}>
            Limpar
          </button>
        </form>

        {erro && <div className="message error">{erro}</div>}

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Codigo</th>
                <th>Nome</th>
                <th>Documento</th>
                <th>Tipo</th>
                <th>Fantasia</th>
                <th>Status</th>
                <th>Acao</th>
              </tr>
            </thead>
            <tbody>
              {empresas.map((empresa) => (
                <tr key={empresa.id}>
                  <td>{empresa.codigoEmpresa}</td>
                  <td>{empresa.nome}</td>
                  <td>{empresa.documento}</td>
                  <td>{empresa.tipoDocumento}</td>
                  <td>{empresa.nomeFantasia ?? "-"}</td>
                  <td>
                    <span className={empresa.ativa ? "status-on" : "status-off"}>
                      {empresa.ativa ? "Ativa" : "Inativa"}
                    </span>
                  </td>
                  <td>
                    <button
                      type="button"
                      className="button-compact"
                      onClick={() => onLancarRecalculo(empresa)}
                    >
                      Lancar recalculo
                    </button>
                  </td>
                </tr>
              ))}
              {!isLoading && empresas.length === 0 && (
                <tr>
                  <td colSpan={7} className="empty-cell">
                    Nenhuma empresa encontrada.
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
