import { useEffect, useState } from "react";
import {
  AuditoriaDetalhe,
  RecalculoDetalhe as RecalculoDetalheType,
  detalharRecalculo
} from "../api/recalculos";

type RecalculoDetalheProps = {
  recalculoId: string | null;
};

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

export function RecalculoDetalhe({ recalculoId }: RecalculoDetalheProps) {
  const [recalculo, setRecalculo] = useState<RecalculoDetalheType | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    if (!recalculoId) {
      setRecalculo(null);
      setErro(null);
      return;
    }

    const id = recalculoId;
    let ativo = true;

    async function carregarDetalhe() {
      setIsLoading(true);
      setErro(null);

      try {
        const data = await detalharRecalculo(id);
        if (ativo) {
          setRecalculo(data);
        }
      } catch (error) {
        if (ativo) {
          setErro(
            error instanceof Error ? error.message : "Erro ao carregar detalhe."
          );
          setRecalculo(null);
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

  return (
    <section className="detail-panel">
      <div className="section-heading compact">
        <div>
          <h2>Detalhe do recálculo</h2>
          <p>{recalculo.empresa.nome}</p>
        </div>
        <span className="status-on">{statusLabels[recalculo.status] ?? recalculo.status}</span>
      </div>

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

      <section className="detail-section">
        <h3>Evidências</h3>
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
                </tr>
              </thead>
              <tbody>
                {recalculo.evidencias.map((evidencia) => (
                  <tr key={evidencia.id}>
                    <td>{evidencia.nomeArquivo}</td>
                    <td>{evidencia.tipoArquivo}</td>
                    <td>{formatarTamanhoArquivo(evidencia.tamanhoArquivo)}</td>
                    <td>{formatarDataHora(evidencia.createdAt)}</td>
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
