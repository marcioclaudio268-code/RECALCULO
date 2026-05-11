import { FormEvent, useEffect, useState } from "react";
import { Empresa } from "../api/empresas";
import { criarRecalculo, TipoGuia, tiposGuia } from "../api/recalculos";

type RecalculoFormProps = {
  empresa: Empresa | null;
  userId: string;
};

type FormState = {
  tipoGuia: TipoGuia;
  competencia: string;
  descricao: string;
  dataRecalculo: string;
  motivo: string;
  solicitante: string;
  dataSolicitacao: string;
  observacoes: string;
};

const initialForm: FormState = {
  tipoGuia: "DAS",
  competencia: "",
  descricao: "",
  dataRecalculo: "",
  motivo: "",
  solicitante: "",
  dataSolicitacao: "",
  observacoes: ""
};

export function RecalculoForm({ empresa, userId }: RecalculoFormProps) {
  const [form, setForm] = useState<FormState>(initialForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState<string | null>(null);
  const [duplicidade, setDuplicidade] = useState(false);

  useEffect(() => {
    setErro(null);
    setSucesso(null);
    setDuplicidade(false);
  }, [empresa?.id]);

  function updateField<K extends keyof FormState>(field: K, value: FormState[K]) {
    setForm((current) => ({
      ...current,
      [field]: value
    }));
  }

  function validar() {
    if (!empresa) {
      return "Selecione uma empresa para lançar o recálculo.";
    }

    if (!userId) {
      return "Informe o ID temporário do usuário.";
    }

    if (!form.tipoGuia) {
      return "Informe o tipo de guia.";
    }

    if (!form.competencia) {
      return "Informe a competência.";
    }

    if (!form.descricao.trim()) {
      return "Informe a descrição.";
    }

    if (!form.dataRecalculo) {
      return "Informe a data do recálculo.";
    }

    return null;
  }

  function toIsoDate(value: string) {
    return new Date(`${value}T12:00:00`).toISOString();
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const erroValidacao = validar();
    setErro(null);
    setSucesso(null);
    setDuplicidade(false);

    if (erroValidacao || !empresa) {
      setErro(erroValidacao);
      return;
    }

    setIsSubmitting(true);

    try {
      const resultado = await criarRecalculo(userId, {
        empresaId: empresa.id,
        tipoGuia: form.tipoGuia,
        competencia: form.competencia,
        descricao: form.descricao.trim(),
        dataRecalculo: toIsoDate(form.dataRecalculo),
        responsavelId: userId,
        motivo: form.motivo.trim() || undefined,
        solicitante: form.solicitante.trim() || undefined,
        dataSolicitacao: form.dataSolicitacao
          ? toIsoDate(form.dataSolicitacao)
          : undefined,
        observacoes: form.observacoes.trim() || undefined
      });

      setSucesso("Recálculo lançado com sucesso.");
      setDuplicidade(resultado.alertaDuplicidade);
      setForm((current) => ({
        ...initialForm,
        tipoGuia: current.tipoGuia,
        competencia: current.competencia
      }));
    } catch (error) {
      setErro(error instanceof Error ? error.message : "Erro ao criar recálculo.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="recalculo-panel">
      <div className="section-heading compact">
        <div>
          <h2>Lançar recálculo</h2>
          <p>Responsável e criador usam o ID temporário informado.</p>
        </div>
      </div>

      {!empresa ? (
        <div className="placeholder">
          Selecione uma empresa na tabela para habilitar o lançamento.
        </div>
      ) : (
        <>
          <div className="selected-company">
            <span>{empresa.codigoEmpresa}</span>
            <strong>{empresa.nome}</strong>
            <small>{empresa.documento}</small>
          </div>

          <form className="recalculo-form" onSubmit={handleSubmit}>
            <label>
              Tipo de guia
              <select
                value={form.tipoGuia}
                onChange={(event) =>
                  updateField("tipoGuia", event.target.value as TipoGuia)
                }
              >
                {tiposGuia.map((tipo) => (
                  <option key={tipo} value={tipo}>
                    {tipo}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Competência
              <input
                type="month"
                value={form.competencia}
                onChange={(event) => updateField("competencia", event.target.value)}
              />
            </label>

            <label>
              Data do recálculo
              <input
                type="date"
                value={form.dataRecalculo}
                onChange={(event) =>
                  updateField("dataRecalculo", event.target.value)
                }
              />
            </label>

            <label>
              Descrição
              <textarea
                value={form.descricao}
                onChange={(event) => updateField("descricao", event.target.value)}
                rows={4}
                placeholder="Ex.: Recálculo de DAS solicitado pelo cliente"
              />
            </label>

            <label>
              Motivo
              <input
                value={form.motivo}
                onChange={(event) => updateField("motivo", event.target.value)}
              />
            </label>

            <label>
              Solicitante
              <input
                value={form.solicitante}
                onChange={(event) => updateField("solicitante", event.target.value)}
              />
            </label>

            <label>
              Data da solicitação
              <input
                type="date"
                value={form.dataSolicitacao}
                onChange={(event) =>
                  updateField("dataSolicitacao", event.target.value)
                }
              />
            </label>

            <label>
              Observações
              <textarea
                value={form.observacoes}
                onChange={(event) => updateField("observacoes", event.target.value)}
                rows={3}
              />
            </label>

            {erro && <div className="message error">{erro}</div>}
            {sucesso && <div className="message success">{sucesso}</div>}
            {duplicidade && (
              <div className="message warning">
                Atenção: já existe recálculo parecido para esta empresa, competência,
                tipo de guia e descrição.
              </div>
            )}

            <button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Lançando..." : "Lançar recálculo"}
            </button>
          </form>
        </>
      )}
    </div>
  );
}
