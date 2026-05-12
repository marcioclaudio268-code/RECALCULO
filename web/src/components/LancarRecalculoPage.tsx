import { ChangeEvent, FormEvent, useState } from "react";
import { Empresa } from "../api/empresas";
import {
  TipoGuia,
  criarRecalculo,
  enviarEvidenciaRecalculo,
  tiposGuia
} from "../api/recalculos";

type LancarRecalculoPageProps = {
  empresa: Empresa;
  onVoltar: () => void;
  onVerDetalhe: (recalculoId: string) => void;
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

const tiposEvidenciaPermitidos = new Set([
  "image/png",
  "image/jpeg",
  "image/webp"
]);
const tamanhoMaximoEvidencia = 5 * 1024 * 1024;

function toIsoDate(value: string) {
  return new Date(`${value}T12:00:00`).toISOString();
}

function validarEvidencia(file: File | null) {
  if (!file) {
    return null;
  }

  if (!tiposEvidenciaPermitidos.has(file.type)) {
    return "Anexe uma imagem PNG, JPG, JPEG ou WEBP.";
  }

  if (file.size > tamanhoMaximoEvidencia) {
    return "A evidencia deve ter no maximo 5 MB.";
  }

  return null;
}

export function LancarRecalculoPage({
  empresa,
  onVoltar,
  onVerDetalhe
}: LancarRecalculoPageProps) {
  const [form, setForm] = useState<FormState>(initialForm);
  const [arquivoEvidencia, setArquivoEvidencia] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const [duplicidade, setDuplicidade] = useState(false);
  const [recalculoCriadoId, setRecalculoCriadoId] = useState<string | null>(null);

  function updateField<K extends keyof FormState>(field: K, value: FormState[K]) {
    setForm((current) => ({
      ...current,
      [field]: value
    }));
  }

  function validar() {
    if (!form.tipoGuia) {
      return "Informe o tipo de guia.";
    }

    if (!form.competencia) {
      return "Informe a competencia.";
    }

    if (!form.dataRecalculo) {
      return "Informe a data do recalculo.";
    }

    if (!form.descricao.trim()) {
      return "Informe a descricao.";
    }

    return validarEvidencia(arquivoEvidencia);
  }

  function handleArquivoChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;
    const erroArquivo = validarEvidencia(file);

    setArquivoEvidencia(file);
    setErro(erroArquivo);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const erroValidacao = validar();
    setErro(null);
    setSucesso(null);
    setAviso(null);
    setDuplicidade(false);

    if (erroValidacao) {
      setErro(erroValidacao);
      return;
    }

    setIsSubmitting(true);

    try {
      const resultado = await criarRecalculo({
        empresaId: empresa.id,
        tipoGuia: form.tipoGuia,
        competencia: form.competencia,
        descricao: form.descricao.trim(),
        dataRecalculo: toIsoDate(form.dataRecalculo),
        motivo: form.motivo.trim() || undefined,
        solicitante: form.solicitante.trim() || undefined,
        dataSolicitacao: form.dataSolicitacao
          ? toIsoDate(form.dataSolicitacao)
          : undefined,
        observacoes: form.observacoes.trim() || undefined
      });

      const recalculoId = resultado.recalculo.id;
      setRecalculoCriadoId(recalculoId);
      setDuplicidade(resultado.alertaDuplicidade);

      if (arquivoEvidencia) {
        try {
          await enviarEvidenciaRecalculo(recalculoId, arquivoEvidencia);
          setSucesso("Recalculo lancado com sucesso. Evidencia anexada.");
        } catch (error) {
          const mensagem =
            error instanceof Error ? error.message : "Erro ao anexar evidencia.";
          setSucesso("Recalculo lancado com sucesso.");
          setAviso(`Recalculo criado, mas a evidencia nao foi anexada: ${mensagem}`);
        }
      } else {
        setSucesso("Recalculo lancado com sucesso.");
      }
    } catch (error) {
      setErro(error instanceof Error ? error.message : "Erro ao criar recalculo.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="page-layout launch-page">
      <div className="section-heading">
        <div>
          <h2>Lancar recalculo</h2>
          <p>Preencha o lancamento e anexe o print da solicitacao se houver.</p>
        </div>
        <button type="button" className="button-secondary" onClick={onVoltar}>
          Voltar para empresas
        </button>
      </div>

      <div className="recalculo-panel form-page-panel">
        <div className="selected-company">
          <span>{empresa.codigoEmpresa}</span>
          <strong>{empresa.nome}</strong>
          <small>
            {empresa.tipoDocumento} {empresa.documento}
          </small>
        </div>

        <form className="launch-form" onSubmit={handleSubmit}>
          <div className="launch-form-grid">
            <label>
              <span>Tipo de guia</span>
              <select
                value={form.tipoGuia}
                disabled={Boolean(recalculoCriadoId)}
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
              <span>Competencia</span>
              <input
                type="month"
                value={form.competencia}
                disabled={Boolean(recalculoCriadoId)}
                onChange={(event) => updateField("competencia", event.target.value)}
              />
            </label>

            <label>
              <span>Data do recalculo</span>
              <input
                type="date"
                value={form.dataRecalculo}
                disabled={Boolean(recalculoCriadoId)}
                onChange={(event) =>
                  updateField("dataRecalculo", event.target.value)
                }
              />
            </label>

            <label className="launch-form-wide">
              <span>Descricao</span>
              <textarea
                value={form.descricao}
                disabled={Boolean(recalculoCriadoId)}
                onChange={(event) => updateField("descricao", event.target.value)}
                rows={4}
                placeholder="Ex.: Recalculo de DAS solicitado pelo cliente"
              />
            </label>

            <label>
              <span>Motivo</span>
              <input
                value={form.motivo}
                disabled={Boolean(recalculoCriadoId)}
                onChange={(event) => updateField("motivo", event.target.value)}
              />
            </label>

            <label>
              <span>Solicitante</span>
              <input
                value={form.solicitante}
                disabled={Boolean(recalculoCriadoId)}
                onChange={(event) => updateField("solicitante", event.target.value)}
              />
            </label>

            <label>
              <span>Data da solicitacao</span>
              <input
                type="date"
                value={form.dataSolicitacao}
                disabled={Boolean(recalculoCriadoId)}
                onChange={(event) =>
                  updateField("dataSolicitacao", event.target.value)
                }
              />
            </label>

            <label className="launch-form-wide">
              <span>Observacoes</span>
              <textarea
                value={form.observacoes}
                disabled={Boolean(recalculoCriadoId)}
                onChange={(event) => updateField("observacoes", event.target.value)}
                rows={3}
              />
            </label>

            <label className="launch-form-wide">
              <span>Evidencia/print opcional</span>
              <input
                type="file"
                accept=".png,.jpg,.jpeg,.webp,image/png,image/jpeg,image/webp"
                disabled={Boolean(recalculoCriadoId)}
                onChange={handleArquivoChange}
              />
              <small>
                Anexe apenas print da solicitacao. Nao anexe a guia recalculada.
              </small>
            </label>
          </div>

          {erro && <div className="message error">{erro}</div>}
          {sucesso && <div className="message success">{sucesso}</div>}
          {aviso && <div className="message warning">{aviso}</div>}
          {duplicidade && (
            <div className="message warning">
              Atencao: ja existe recalculo parecido para esta empresa,
              competencia, tipo de guia e descricao.
            </div>
          )}

          {recalculoCriadoId ? (
            <div className="post-submit-actions">
              <button type="button" className="button-secondary" onClick={onVoltar}>
                Voltar para empresas
              </button>
              <button
                type="button"
                onClick={() => onVerDetalhe(recalculoCriadoId)}
              >
                Ver detalhe
              </button>
            </div>
          ) : (
            <button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Lancando..." : "Lancar recalculo"}
            </button>
          )}
        </form>
      </div>
    </section>
  );
}
