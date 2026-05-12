import { useEffect, useState } from "react";
import {
  logout as logoutApi,
  me,
  type UsuarioAutenticado
} from "./api/auth";
import {
  clearAuthToken,
  getAuthToken,
  setAuthToken,
  setUnauthorizedHandler
} from "./api/client";
import { type Empresa } from "./api/empresas";
import { EmpresasPage } from "./components/EmpresasPage";
import { LancarRecalculoPage } from "./components/LancarRecalculoPage";
import { LoginPage } from "./components/LoginPage";
import { RecalculoDetalhePage } from "./components/RecalculoDetalhePage";
import { RecalculosPage } from "./components/RecalculosPage";
import { RelatoriosPage } from "./components/RelatoriosPage";

type AbaAtual = "empresas" | "recalculos" | "relatorios";
type TelaAtual =
  | { tipo: "empresas" }
  | { tipo: "recalculos" }
  | { tipo: "relatorios" }
  | { tipo: "lancar-recalculo"; empresa: Empresa }
  | {
      tipo: "detalhe-recalculo";
      recalculoId: string;
      origem?: "empresas" | "recalculos";
    };

const AUTH_USER_STORAGE_KEY = "recalculo_guias_auth_user";

function carregarUsuarioSalvo() {
  const raw = localStorage.getItem(AUTH_USER_STORAGE_KEY);

  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as UsuarioAutenticado;
  } catch {
    localStorage.removeItem(AUTH_USER_STORAGE_KEY);
    return null;
  }
}

function obterAbaAtiva(tela: TelaAtual): AbaAtual {
  if (tela.tipo === "lancar-recalculo") {
    return "empresas";
  }

  if (tela.tipo === "detalhe-recalculo") {
    return tela.origem ?? "recalculos";
  }

  return tela.tipo;
}

export default function App() {
  const [telaAtual, setTelaAtual] = useState<TelaAtual>({ tipo: "empresas" });
  const [usuario, setUsuario] = useState<UsuarioAutenticado | null>(
    carregarUsuarioSalvo
  );
  const [isVerificandoSessao, setIsVerificandoSessao] = useState(() =>
    Boolean(getAuthToken())
  );
  const [mensagemLogin, setMensagemLogin] = useState<string | null>(null);

  useEffect(() => {
    let ativo = true;

    setUnauthorizedHandler(() => {
      if (!ativo) {
        return;
      }

      clearAuthToken();
      localStorage.removeItem(AUTH_USER_STORAGE_KEY);
      setUsuario(null);
      setTelaAtual({ tipo: "empresas" });
      setMensagemLogin("Sua sess\u00e3o expirou. Fa\u00e7a login novamente.");
    });

    return () => {
      ativo = false;
      setUnauthorizedHandler(null);
    };
  }, []);

  useEffect(() => {
    const token = getAuthToken();

    if (!token) {
      setUsuario(null);
      setIsVerificandoSessao(false);
      return;
    }

    let ativo = true;

    async function validarSessao() {
      try {
        const resultado = await me();

        if (ativo) {
          setUsuario(resultado.usuario);
          localStorage.setItem(
            AUTH_USER_STORAGE_KEY,
            JSON.stringify(resultado.usuario)
          );
        }
      } catch {
        clearAuthToken();
        localStorage.removeItem(AUTH_USER_STORAGE_KEY);

        if (ativo) {
          setUsuario(null);
        }
      } finally {
        if (ativo) {
          setIsVerificandoSessao(false);
        }
      }
    }

    validarSessao();

    return () => {
      ativo = false;
    };
  }, []);

  function handleLogin(token: string, usuarioAutenticado: UsuarioAutenticado) {
    setAuthToken(token);
    localStorage.setItem(AUTH_USER_STORAGE_KEY, JSON.stringify(usuarioAutenticado));
    setUsuario(usuarioAutenticado);
    setTelaAtual({ tipo: "empresas" });
    setMensagemLogin(null);
  }

  async function handleLogout() {
    try {
      await logoutApi();
    } catch {
      clearAuthToken();
    } finally {
      clearAuthToken();
      localStorage.removeItem(AUTH_USER_STORAGE_KEY);
      setUsuario(null);
      setTelaAtual({ tipo: "empresas" });
      setMensagemLogin(null);
    }
  }

  if (isVerificandoSessao) {
    return (
      <main className="login-shell">
        <div className="placeholder">Validando sessao...</div>
      </main>
    );
  }

  if (!usuario) {
    return <LoginPage mensagem={mensagemLogin} onLogin={handleLogin} />;
  }

  const abaAtual = obterAbaAtiva(telaAtual);

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
              onClick={() => setTelaAtual({ tipo: "empresas" })}
            >
              Empresas
            </button>
            <button
              type="button"
              className={
                abaAtual === "recalculos" ? "tab-button active" : "tab-button"
              }
              onClick={() => setTelaAtual({ tipo: "recalculos" })}
            >
              {"Rec\u00e1lculos"}
            </button>
            <button
              type="button"
              className={
                abaAtual === "relatorios" ? "tab-button active" : "tab-button"
              }
              onClick={() => setTelaAtual({ tipo: "relatorios" })}
            >
              {"Relat\u00f3rios"}
            </button>
          </nav>
        </div>
        <div className="session-user">
          <span>Usuario: {usuario.nome}</span>
          <small>{usuario.email}</small>
          <button type="button" className="button-secondary" onClick={handleLogout}>
            Sair
          </button>
        </div>
      </header>

      {telaAtual.tipo === "empresas" ? (
        <EmpresasPage
          onLancarRecalculo={(empresa) =>
            setTelaAtual({ tipo: "lancar-recalculo", empresa })
          }
        />
      ) : telaAtual.tipo === "lancar-recalculo" ? (
        <LancarRecalculoPage
          empresa={telaAtual.empresa}
          onVoltar={() => setTelaAtual({ tipo: "empresas" })}
          onVerDetalhe={(recalculoId) =>
            setTelaAtual({
              tipo: "detalhe-recalculo",
              recalculoId,
              origem: "empresas"
            })
          }
        />
      ) : telaAtual.tipo === "recalculos" ? (
        <RecalculosPage
          onVerDetalhe={(recalculoId) =>
            setTelaAtual({
              tipo: "detalhe-recalculo",
              recalculoId,
              origem: "recalculos"
            })
          }
        />
      ) : telaAtual.tipo === "detalhe-recalculo" ? (
        <RecalculoDetalhePage
          recalculoId={telaAtual.recalculoId}
          onVoltar={() =>
            setTelaAtual({
              tipo: telaAtual.origem === "empresas" ? "empresas" : "recalculos"
            })
          }
          onRecalculoAtualizado={() => undefined}
        />
      ) : (
        <RelatoriosPage />
      )}
    </main>
  );
}
