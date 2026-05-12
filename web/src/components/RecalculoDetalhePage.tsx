import { RecalculoDetalhe } from "./RecalculoDetalhe";

type RecalculoDetalhePageProps = {
  recalculoId: string;
  onVoltar: () => void;
  onRecalculoAtualizado: () => void;
};

export function RecalculoDetalhePage({
  recalculoId,
  onVoltar,
  onRecalculoAtualizado
}: RecalculoDetalhePageProps) {
  return (
    <section className="detail-page-layout">
      <div className="section-heading">
        <div>
          <h2>Detalhe do recalculo</h2>
          <p>Edite, cancele, anexe evidencias e consulte a auditoria.</p>
        </div>
        <button type="button" className="button-secondary" onClick={onVoltar}>
          Voltar
        </button>
      </div>

      <RecalculoDetalhe
        recalculoId={recalculoId}
        onRecalculoAtualizado={onRecalculoAtualizado}
      />
    </section>
  );
}
