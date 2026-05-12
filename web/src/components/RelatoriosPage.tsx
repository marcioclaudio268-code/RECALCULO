import { FormEvent, useState } from "react";
import { baixarRelatorioRecalculos } from "../api/relatorios";

type RelatoriosPageProps = {
  userId: string;
};

function dataAtualInput() {
  return new Date().toISOString().slice(0, 10);
}

function primeiroDiaMesAtualInput() {
  const hoje = new Date();
  const primeiroDia = new Date(hoje.getFullYear(), hoje.getMonth(), 1);

  return primeiroDia.toISOString().slice(0, 10);
}

export function RelatoriosPage({ userId }: RelatoriosPageProps) {
  const [dataInicio, setDataInicio] = useState(primeiroDiaMesAtualInput);
  const [dataFim, setDataFim] = useState(dataAtualInput);
  const [incluirCancelados, setIncluirCancelados] = useState(false);
  const [isGerando, setIsGerando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState<string | null>(null);

  function validar() {
    if (!userId) {
      return "Informe o ID tempor\u00e1rio do usu\u00e1rio.";
    }

    if (!dataInicio) {
      return "Informe a data inicial.";
    }

    if (!dataFim) {
      return "Informe a data final.";
    }

    if (dataInicio > dataFim) {
      return "Data inicial n\u00e3o pode ser maior que a data final.";
    }

    return null;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErro(null);
    setSucesso(null);

    const erroValidacao = validar();

    if (erroValidacao) {
      setErro(erroValidacao);
      return;
    }

    setIsGerando(true);

    try {
      const filename = await baixarRelatorioRecalculos(userId, {
        dataInicio,
        dataFim,
        incluirCancelados
      });
      setSucesso(`Relat\u00f3rio gerado: ${filename}`);
    } catch (error) {
      setErro(
        error instanceof Error ? error.message : "Erro ao gerar relat\u00f3rio."
      );
    } finally {
      setIsGerando(false);
    }
  }

  return (
    <section className="relatorios-layout">
      <div className="relatorios-area">
        <div className="section-heading">
          <div>
            <h2>{"Relat\u00f3rio mensal"}</h2>
            <p>
              {
                "Exporte a lista de rec\u00e1lculos feitos no per\u00edodo para o financeiro. O relat\u00f3rio n\u00e3o cont\u00e9m valores."
              }
            </p>
          </div>
        </div>

        <form className="relatorios-form" onSubmit={handleSubmit}>
          <label>
            <span>Data inicial</span>
            <input
              type="date"
              value={dataInicio}
              onChange={(event) => setDataInicio(event.target.value)}
            />
          </label>
          <label>
            <span>Data final</span>
            <input
              type="date"
              value={dataFim}
              onChange={(event) => setDataFim(event.target.value)}
            />
          </label>
          <label className="checkbox-field">
            <input
              type="checkbox"
              checked={incluirCancelados}
              onChange={(event) => setIncluirCancelados(event.target.checked)}
            />
            <span>Incluir cancelados</span>
          </label>
          <div className="relatorios-actions">
            <button type="submit" disabled={isGerando}>
              {isGerando ? "Gerando..." : "Exportar Excel"}
            </button>
          </div>
        </form>

        {erro && <div className="message error">{erro}</div>}
        {sucesso && <div className="message success">{sucesso}</div>}
      </div>
    </section>
  );
}
