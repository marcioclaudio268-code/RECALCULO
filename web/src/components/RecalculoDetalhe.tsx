import { ChangeEvent, FormEvent, useEffect, useRef, useState } from "react";
import {
  AuditoriaDetalhe,
  EditarRecalculoInput,
  EvidenciaDetalhe,
  RecalculoDetalhe as RecalculoDetalheType,
  TipoGuia,
  baixarArquivoEvidencia,
  cancelarRecalculo,
  detalharRecalculo,
  editarRecalculo,
  enviarEvidenciaRecalculo,
  tiposGuia
} from "../api/recalculos";

type RecalculoDetalheProps = {
  recalculoId: string | null;
  userId: string;
  onRecalculoAtualizado: () => void;
};

type EditFormState = {
  tipoGuia: TipoGuia;
  competencia: string;
  descricao: string;
  motivo: string;
  solicitante: string;
  dataSolicitacao: string;
  dataRecalculo: string;
  observacoes: string;
};

type Mensagem = {
  tipo: "success" | "warning" | "error";
  texto: string;
};

const TAMANHO_MAXIMO_EVIDENCIA = 5 * 1024 * 1024;
const tiposEvidenciaAceitos = new Set([
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp"
]);
const extensoesEvidenciaAceitas = [".png", ".jpg", ".jpeg", ".webp"];

const statusLabels: Record<string, string> = {
  LANCADO: "Lançado",
  EM_REVISAO: "Em revisão",
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

function formatarDataHora(value?: string | null) {
  if (!value) {
    return "-";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short"
  }).format(date);
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

function formatarTamanhoArquivo(bytes: number) {
  if (!Number.isFinite(bytes)) {
    return "-";
  }

  if (bytes < 1024) {
    return `${bytes} B`;
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function validarArquivoEvidenciaFrontend(file: File) {
  const nome = file.name.toLowerCase();
  const extensaoValida = extensoesEvidenciaAceitas.some((extensao) =>
    nome.endsWith(extensao)
  );

  if (!tiposEvidenciaAceitos.has(file.type) || !extensaoValida) {
    return "Envie apenas imagens PNG, JPG, JPEG ou WEBP.";
  }

  if (file.size > TAMANHO_MAXIMO_EVIDENCIA) {
    return "Arquivo excede o limite de 5 MB.";
  }

  return null;
}

function formatarValorAuditoria(value: string | null) {
  if (!value) {
    return "-";
  }

  try {
    return JSON.stringify(JSON.parse(value), null, 2);
  } catch {
    return value;
  }
}

function obterUsuarioAuditoria(auditoria: AuditoriaDetalhe) {
  const nome = auditoria.usuario?.nome?.trim();
  const email = auditoria.usuario?.email?.trim();

  if (nome && email) {
    return `${nome} (${email})`;
  }

  return nome || email || auditoria.usuarioId || "-";
}

function obterUsuarioEvidencia(evidencia: EvidenciaDetalhe) {
  const nome = evidencia.enviadoPor?.nome?.trim();
  const email = evidencia.enviadoPor?.email?.trim();

  if (nome && email) {
    return `${nome} (${email})`;
  }

  return nome || email || evidencia.enviadoPorId || "-";
}

function toDateInputValue(value?: string | null) {
  if (!value) {
    return "";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return localDate.toISOString().slice(0, 10);
}

function dateInputToIso(value: string) {
  return new Date(`${value}T12:00:00`).toISOString();
}

function textoOuNull(value: string) {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function montarForm(recalculo: RecalculoDetalheType): EditFormState {
  return {
    tipoGuia: recalculo.tipoGuia,
    competencia: recalculo.competencia,
    descricao: recalculo.descricao,
    motivo: recalculo.motivo ?? "",
    solicitante: recalculo.solicitante ?? "",
    dataSolicitacao: toDateInputValue(recalculo.dataSolicitacao),
    dataRecalculo: toDateInputValue(recalculo.dataRecalculo),
    observacoes: recalculo.observacoes ?? ""
  };
}

function montarInputAlterado(
  recalculo: RecalculoDetalheType,
  form: EditFormState
): EditarRecalculoInput {
  const input: EditarRecalculoInput = {};
  const descricao = form.descricao.trim();
  const motivo = textoOuNull(form.motivo);
  const solicitante = textoOuNull(form.solicitante);
  const observacoes = textoOuNull(form.observacoes);
  const dataSolicitacaoOriginal = toDateInputValue(recalculo.dataSolicitacao);
  const dataRecalculoOriginal = toDateInputValue(recalculo.dataRecalculo);

  if (form.tipoGuia !== recalculo.tipoGuia) {
    input.tipoGuia = form.tipoGuia;
  }

  if (form.competencia !== recalculo.competencia) {
    input.competencia = form.competencia;
  }

  if (descricao !== recalculo.descricao) {
    input.descricao = descricao;
  }

  if (motivo !== (recalculo.motivo ?? null)) {
    input.motivo = motivo;
  }

  if (solicitante !== (recalculo.solicitante ?? null)) {
    input.solicitante = solicitante;
  }

  if (observacoes !== (recalculo.observacoes ?? null)) {
    input.observacoes = observacoes;
  }

  if (form.dataSolicitacao !== dataSolicitacaoOriginal) {
    input.dataSolicitacao = form.dataSolicitacao
      ? dateInputToIso(form.dataSolicitacao)
      : null;
  }

  if (form.dataRecalculo !== dataRecalculoOriginal) {
    input.dataRecalculo = dateInputToIso(form.dataRecalculo);
  }

  return input;
}

export function RecalculoDetalhe({
  recalculoId,
  userId,
  onRecalculoAtualizado
}: RecalculoDetalheProps) {
  const [recalculo, setRecalculo] = useState<RecalculoDetalheType | null>(null);
  const [form, setForm] = useState<EditFormState | null>(null);
  const [modoEdicao, setModoEdicao] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [evidenciaAbrindoId, setEvidenciaAbrindoId] = useState<string | null>(null);
  const [arquivoEvidencia, setArquivoEvidencia] = useState<File | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [mensagem, setMensagem] = useState<Mensagem | null>(null);
  const evidenciaInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!recalculoId) {
      setRecalculo(null);
      setForm(null);
      setModoEdicao(false);
      setErro(null);
      setMensagem(null);
      setArquivoEvidencia(null);
      setEvidenciaAbrindoId(null);
      return;
    }

    const id = recalculoId;
    let ativo = true;

    async function carregarDetalhe() {
      setIsLoading(true);
      setErro(null);
      setMensagem(null);
      setModoEdicao(false);
      setArquivoEvidencia(null);

      try {
        const data = await detalharRecalculo(id);
        if (ativo) {
          setRecalculo(data);
          setForm(montarForm(data));
        }
      } catch (error) {
        if (ativo) {
          setErro(
            error instanceof Error ? error.message : "Erro ao carregar detalhe."
          );
          setRecalculo(null);
          setForm(null);
        }
      } finally {
        if (ativo) {
          setIsLoading(false);
        }
      }
    }

    carregarDetalhe();

    return () => {
      ativo = false;
    };
  }, [recalculoId]);

  function handleIniciarEdicao() {
    if (!recalculo || recalculo.status === "CANCELADO") {
      return;
    }

    setForm(montarForm(recalculo));
    setMensagem(null);
    setModoEdicao(true);
  }

  function handleCancelarEdicao() {
    if (recalculo) {
      setForm(montarForm(recalculo));
    }

    setMensagem(null);
    setModoEdicao(false);
  }

  async function handleSalvarEdicao(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!recalculo || !form) {
      return;
    }

    if (!userId) {
      setMensagem({
        tipo: "error",
        texto: "Informe o ID temporário do usuário antes de salvar."
      });
      return;
    }

    if (!form.descricao.trim()) {
      setMensagem({ tipo: "error", texto: "Descrição não pode ficar vazia." });
      return;
    }

    if (!form.competencia) {
      setMensagem({ tipo: "error", texto: "Competência é obrigatória." });
      return;
    }

    if (!form.dataRecalculo) {
      setMensagem({ tipo: "error", texto: "Data do recálculo é obrigatória." });
      return;
    }

    const input = montarInputAlterado(recalculo, form);

    if (Object.keys(input).length === 0) {
      setMensagem({ tipo: "warning", texto: "Nenhuma alteração detectada." });
      return;
    }

    setIsSaving(true);
    setMensagem(null);

    try {
      const atualizado = await editarRecalculo(userId, recalculo.id, input);
      setRecalculo(atualizado);
      setForm(montarForm(atualizado));
      setModoEdicao(false);
      setMensagem({
        tipo: "success",
        texto: "Recálculo atualizado com sucesso."
      });
      onRecalculoAtualizado();
    } catch (error) {
      setMensagem({
        tipo: "error",
        texto:
          error instanceof Error ? error.message : "Erro ao atualizar recálculo."
      });
    } finally {
      setIsSaving(false);
    }
  }

  async function handleCancelarRecalculo() {
    if (!recalculo || recalculo.status === "CANCELADO") {
      return;
    }

    if (!userId) {
      setMensagem({
        tipo: "error",
        texto: "Informe o ID temporário do usuário antes de cancelar."
      });
      return;
    }

    const confirmou = window.confirm(
      "Cancelar este recálculo? O registro será mantido e a ação será auditada."
    );

    if (!confirmou) {
      return;
    }

    const motivo = window.prompt("Informe o motivo do cancelamento:");
    const motivoCancelamento = motivo?.trim() ?? "";

    if (motivoCancelamento.length < 3) {
      setMensagem({
        tipo: "error",
        texto: "Informe um motivo de cancelamento com pelo menos 3 caracteres."
      });
      return;
    }

    setIsSaving(true);
    setMensagem(null);

    try {
      const atualizado = await cancelarRecalculo(
        userId,
        recalculo.id,
        motivoCancelamento
      );
      setRecalculo(atualizado);
      setForm(montarForm(atualizado));
      setModoEdicao(false);
      setMensagem({
        tipo: "success",
        texto: "Recálculo cancelado com sucesso."
      });
      onRecalculoAtualizado();
    } catch (error) {
      setMensagem({
        tipo: "error",
        texto:
          error instanceof Error ? error.message : "Erro ao cancelar recálculo."
      });
    } finally {
      setIsSaving(false);
    }
  }

  function handleSelecionarEvidencia(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;
    setArquivoEvidencia(file);

    if (file) {
      const erroArquivo = validarArquivoEvidenciaFrontend(file);

      if (erroArquivo) {
        setMensagem({ tipo: "error", texto: erroArquivo });
      } else {
        setMensagem(null);
      }
    }
  }

  async function handleEnviarEvidencia(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!recalculo) {
      return;
    }

    if (estaCancelado) {
      setMensagem({
        tipo: "error",
        texto: "Nao e permitido anexar evidencia em recalculo cancelado."
      });
      return;
    }

    if (!userId) {
      setMensagem({
        tipo: "error",
        texto: "Informe o ID temporario do usuario antes de anexar evidencia."
      });
      return;
    }

    if (!arquivoEvidencia) {
      setMensagem({ tipo: "error", texto: "Selecione um arquivo de evidencia." });
      return;
    }

    const erroArquivo = validarArquivoEvidenciaFrontend(arquivoEvidencia);

    if (erroArquivo) {
      setMensagem({ tipo: "error", texto: erroArquivo });
      return;
    }

    setIsUploading(true);
    setMensagem(null);

    try {
      await enviarEvidenciaRecalculo(userId, recalculo.id, arquivoEvidencia);
      const atualizado = await detalharRecalculo(recalculo.id);

      setRecalculo(atualizado);
      setForm(montarForm(atualizado));
      setArquivoEvidencia(null);

      if (evidenciaInputRef.current) {
        evidenciaInputRef.current.value = "";
      }

      setMensagem({
        tipo: "success",
        texto: "Evidencia anexada com sucesso."
      });
      onRecalculoAtualizado();
    } catch (error) {
      setMensagem({
        tipo: "error",
        texto:
          error instanceof Error ? error.message : "Erro ao anexar evidencia."
      });
    } finally {
      setIsUploading(false);
    }
  }

  async function handleAbrirEvidencia(evidencia: EvidenciaDetalhe) {
    if (!userId) {
      setMensagem({
        tipo: "error",
        texto: "Informe o ID temporario do usuario para abrir a evidencia."
      });
      return;
    }

    const novaJanela = window.open("", "_blank", "noopener,noreferrer");
    setEvidenciaAbrindoId(evidencia.id);
    setMensagem(null);

    try {
      const blob = await baixarArquivoEvidencia(userId, evidencia.id);
      const url = URL.createObjectURL(blob);

      if (novaJanela) {
        novaJanela.location.href = url;
      } else {
        const link = document.createElement("a");
        link.href = url;
        link.download = evidencia.nomeArquivo;
        link.click();
      }

      window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch (error) {
      novaJanela?.close();
      setMensagem({
        tipo: "error",
        texto:
          error instanceof Error ? error.message : "Erro ao abrir evidencia."
      });
    } finally {
      setEvidenciaAbrindoId(null);
    }
  }

  if (!recalculoId) {
    return (
      <section className="detail-panel">
        <div className="placeholder">Selecione um recálculo para ver o detalhe.</div>
      </section>
    );
  }

  if (isLoading) {
    return (
      <section className="detail-panel">
        <div className="placeholder">Carregando detalhe do recálculo...</div>
      </section>
    );
  }

  if (erro) {
    return (
      <section className="detail-panel">
        <div className="message error">{erro}</div>
      </section>
    );
  }

  if (!recalculo) {
    return null;
  }

  const estaCancelado = recalculo.status === "CANCELADO";

  return (
    <section className="detail-panel">
      <div className="section-heading compact">
        <div>
          <h2>Detalhe do recálculo</h2>
          <p>{recalculo.empresa.nome}</p>
        </div>
        <div className="detail-actions">
          <span className={estaCancelado ? "status-off" : "status-on"}>
            {statusLabels[recalculo.status] ?? recalculo.status}
          </span>
          {!estaCancelado && (
            <>
              <button
                type="button"
                className="button-secondary button-compact"
                onClick={handleIniciarEdicao}
                disabled={isSaving || modoEdicao}
              >
                Editar
              </button>
              <button
                type="button"
                className="button-danger button-compact"
                onClick={handleCancelarRecalculo}
                disabled={isSaving}
              >
                Cancelar recálculo
              </button>
            </>
          )}
        </div>
      </div>

      {mensagem && <div className={`message ${mensagem.tipo}`}>{mensagem.texto}</div>}

      {estaCancelado && (
        <div className="message warning">Recálculo cancelado.</div>
      )}

      {modoEdicao && form ? (
        <form className="edit-form" onSubmit={handleSalvarEdicao}>
          <div className="edit-form-grid">
            <label>
              <span>Tipo de guia</span>
              <select
                value={form.tipoGuia}
                onChange={(event) =>
                  setForm((current) =>
                    current
                      ? { ...current, tipoGuia: event.target.value as TipoGuia }
                      : current
                  )
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
              <span>Competência</span>
              <input
                type="month"
                value={form.competencia}
                onChange={(event) =>
                  setForm((current) =>
                    current ? { ...current, competencia: event.target.value } : current
                  )
                }
              />
            </label>
            <label>
              <span>Data do recálculo</span>
              <input
                type="date"
                value={form.dataRecalculo}
                onChange={(event) =>
                  setForm((current) =>
                    current ? { ...current, dataRecalculo: event.target.value } : current
                  )
                }
              />
            </label>
            <label>
              <span>Data da solicitação</span>
              <input
                type="date"
                value={form.dataSolicitacao}
                onChange={(event) =>
                  setForm((current) =>
                    current
                      ? { ...current, dataSolicitacao: event.target.value }
                      : current
                  )
                }
              />
            </label>
            <label className="edit-form-wide">
              <span>Descrição</span>
              <textarea
                rows={3}
                value={form.descricao}
                onChange={(event) =>
                  setForm((current) =>
                    current ? { ...current, descricao: event.target.value } : current
                  )
                }
              />
            </label>
            <label>
              <span>Motivo</span>
              <input
                value={form.motivo}
                onChange={(event) =>
                  setForm((current) =>
                    current ? { ...current, motivo: event.target.value } : current
                  )
                }
              />
            </label>
            <label>
              <span>Solicitante</span>
              <input
                value={form.solicitante}
                onChange={(event) =>
                  setForm((current) =>
                    current ? { ...current, solicitante: event.target.value } : current
                  )
                }
              />
            </label>
            <label className="edit-form-wide">
              <span>Observações</span>
              <textarea
                rows={3}
                value={form.observacoes}
                onChange={(event) =>
                  setForm((current) =>
                    current ? { ...current, observacoes: event.target.value } : current
                  )
                }
              />
            </label>
          </div>
          <div className="edit-form-actions">
            <button type="submit" disabled={isSaving}>
              {isSaving ? "Salvando..." : "Salvar alterações"}
            </button>
            <button
              type="button"
              className="button-secondary"
              onClick={handleCancelarEdicao}
              disabled={isSaving}
            >
              Cancelar edição
            </button>
          </div>
        </form>
      ) : (
        <dl className="detail-grid">
          <div>
            <dt>Empresa</dt>
            <dd>{recalculo.empresa.nome}</dd>
          </div>
          <div>
            <dt>Código</dt>
            <dd>{recalculo.empresa.codigoEmpresa}</dd>
          </div>
          <div>
            <dt>Documento</dt>
            <dd>{formatarDocumento(recalculo.empresa.documento)}</dd>
          </div>
          <div>
            <dt>Tipo de guia</dt>
            <dd>{recalculo.tipoGuia}</dd>
          </div>
          <div>
            <dt>Competência</dt>
            <dd>{recalculo.competencia}</dd>
          </div>
          <div>
            <dt>Data do recálculo</dt>
            <dd>{formatarData(recalculo.dataRecalculo)}</dd>
          </div>
          <div className="detail-grid-wide">
            <dt>Descrição</dt>
            <dd>{recalculo.descricao}</dd>
          </div>
          <div>
            <dt>Motivo</dt>
            <dd>{recalculo.motivo ?? "-"}</dd>
          </div>
          <div>
            <dt>Solicitante</dt>
            <dd>{recalculo.solicitante ?? "-"}</dd>
          </div>
          <div>
            <dt>Data da solicitação</dt>
            <dd>{formatarData(recalculo.dataSolicitacao)}</dd>
          </div>
          <div>
            <dt>Responsável</dt>
            <dd>{recalculo.responsavel?.nome ?? "-"}</dd>
          </div>
          <div>
            <dt>Criado por</dt>
            <dd>{recalculo.criadoPor?.nome ?? "-"}</dd>
          </div>
          <div>
            <dt>Atualizado por</dt>
            <dd>{recalculo.atualizadoPor?.nome ?? "-"}</dd>
          </div>
          <div>
            <dt>Criado em</dt>
            <dd>{formatarDataHora(recalculo.createdAt)}</dd>
          </div>
          <div>
            <dt>Atualizado em</dt>
            <dd>{formatarDataHora(recalculo.updatedAt)}</dd>
          </div>
          <div className="detail-grid-wide">
            <dt>Observações</dt>
            <dd>{recalculo.observacoes ?? "-"}</dd>
          </div>
        </dl>
      )}

      <section className="detail-section">
        <h3>Evidências</h3>
        <p className="section-note">
          Anexe apenas print da solicitação do recálculo. Não anexe a guia
          recalculada.
        </p>
        {estaCancelado ? (
          <div className="message warning">
            Recálculo cancelado não aceita novas evidências.
          </div>
        ) : (
          <form className="evidence-upload" onSubmit={handleEnviarEvidencia}>
            <label>
              <span>Print da solicitação</span>
              <input
                ref={evidenciaInputRef}
                type="file"
                accept=".png,.jpg,.jpeg,.webp,image/png,image/jpeg,image/webp"
                onChange={handleSelecionarEvidencia}
                disabled={isUploading}
              />
            </label>
            <button type="submit" disabled={isUploading || !arquivoEvidencia}>
              {isUploading ? "Anexando..." : "Anexar evidência"}
            </button>
          </form>
        )}
        {recalculo.evidencias.length === 0 ? (
          <p>Nenhuma evidência anexada.</p>
        ) : (
          <div className="table-wrap compact-table">
            <table>
              <thead>
                <tr>
                  <th>Arquivo</th>
                  <th>Tipo</th>
                  <th>Tamanho</th>
                  <th>Enviado em</th>
                  <th>Enviado por</th>
                  <th>Ação</th>
                </tr>
              </thead>
              <tbody>
                {recalculo.evidencias.map((evidencia) => (
                  <tr key={evidencia.id}>
                    <td>{evidencia.nomeArquivo}</td>
                    <td>{evidencia.tipoArquivo}</td>
                    <td>{formatarTamanhoArquivo(evidencia.tamanhoArquivo)}</td>
                    <td>{formatarDataHora(evidencia.createdAt)}</td>
                    <td>{obterUsuarioEvidencia(evidencia)}</td>
                    <td>
                      <button
                        type="button"
                        className="button-secondary button-compact"
                        onClick={() => handleAbrirEvidencia(evidencia)}
                        disabled={evidenciaAbrindoId === evidencia.id}
                      >
                        {evidenciaAbrindoId === evidencia.id
                          ? "Abrindo..."
                          : "Abrir/Baixar"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="detail-section">
        <h3>Auditoria</h3>
        {recalculo.auditorias.length === 0 ? (
          <p>Nenhuma auditoria registrada.</p>
        ) : (
          <div className="table-wrap audit-table">
            <table>
              <thead>
                <tr>
                  <th>Data</th>
                  <th>Usuário</th>
                  <th>Ação</th>
                  <th>Campo</th>
                  <th>Valor anterior</th>
                  <th>Valor novo</th>
                </tr>
              </thead>
              <tbody>
                {recalculo.auditorias.map((auditoria) => (
                  <tr key={auditoria.id}>
                    <td>{formatarDataHora(auditoria.createdAt)}</td>
                    <td>{obterUsuarioAuditoria(auditoria)}</td>
                    <td>{auditoria.acao}</td>
                    <td>{auditoria.campoAlterado ?? "-"}</td>
                    <td>
                      <pre className="audit-value">
                        {formatarValorAuditoria(auditoria.valorAnterior)}
                      </pre>
                    </td>
                    <td>
                      <pre className="audit-value">
                        {formatarValorAuditoria(auditoria.valorNovo)}
                      </pre>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </section>
  );
}
