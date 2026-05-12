import { useEffect, useState } from "react";
import { EmpresasPage } from "./components/EmpresasPage";
import { RecalculosPage } from "./components/RecalculosPage";
import { RelatoriosPage } from "./components/RelatoriosPage";

type AbaAtual = "empresas" | "recalculos" | "relatorios";

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
          <h1>{"Rec\u00e1lculo de Guias"}</h1>
          <nav className="tabs" aria-label={"Navega\u00e7\u00e3o principal"}>
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
              {"Rec\u00e1lculos"}
            </button>
            <button
              type="button"
              className={
                abaAtual === "relatorios" ? "tab-button active" : "tab-button"
              }
              onClick={() => setAbaAtual("relatorios")}
            >
              {"Relat\u00f3rios"}
            </button>
          </nav>
        </div>
        <label className="temporary-user">
          <span>{"ID do usu\u00e1rio tempor\u00e1rio"}</span>
          <input
            value={userId}
            onChange={(event) => setUserId(event.target.value)}
            placeholder="Cole o ID do Admin Local"
          />
          <small>{"Ser\u00e1 substitu\u00eddo pelo login real."}</small>
        </label>
      </header>

      {abaAtual === "empresas" ? (
        <EmpresasPage userId={userId.trim()} />
      ) : abaAtual === "recalculos" ? (
        <RecalculosPage userId={userId.trim()} />
      ) : (
        <RelatoriosPage userId={userId.trim()} />
      )}
    </main>
  );
}
