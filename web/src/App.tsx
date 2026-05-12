import { useEffect, useState } from "react";
import { EmpresasPage } from "./components/EmpresasPage";
import { RecalculosPage } from "./components/RecalculosPage";

type AbaAtual = "empresas" | "recalculos";

const USER_ID_STORAGE_KEY = "recalculo_guias_user_id";

export default function App() {
  const [abaAtual, setAbaAtual] = useState<AbaAtual>("empresas");
  const [userId, setUserId] = useState(() =>
    localStorage.getItem(USER_ID_STORAGE_KEY) ?? ""
  );

  useEffect(() => {
    localStorage.setItem(USER_ID_STORAGE_KEY, userId);
  }, [userId]);

  return (
    <main className="app-shell">
      <header className="topbar">
        <div className="title-group">
          <span className="eyebrow">Rede local</span>
          <h1>Recálculo de Guias</h1>
          <nav className="tabs" aria-label="Navegação principal">
            <button
              type="button"
              className={abaAtual === "empresas" ? "tab-button active" : "tab-button"}
              onClick={() => setAbaAtual("empresas")}
            >
              Empresas
            </button>
            <button
              type="button"
              className={
                abaAtual === "recalculos" ? "tab-button active" : "tab-button"
              }
              onClick={() => setAbaAtual("recalculos")}
            >
              Recálculos
            </button>
          </nav>
        </div>
        <label className="temporary-user">
          <span>ID do usuário temporário</span>
          <input
            value={userId}
            onChange={(event) => setUserId(event.target.value)}
            placeholder="Cole o ID do Admin Local"
          />
          <small>Será substituído pelo login real.</small>
        </label>
      </header>

      {abaAtual === "empresas" ? (
        <EmpresasPage userId={userId.trim()} />
      ) : (
        <RecalculosPage userId={userId.trim()} />
      )}
    </main>
  );
}
