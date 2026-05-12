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
import { EmpresasPage } from "./components/EmpresasPage";
import { LoginPage } from "./components/LoginPage";
import { RecalculosPage } from "./components/RecalculosPage";
import { RelatoriosPage } from "./components/RelatoriosPage";

type AbaAtual = "empresas" | "recalculos" | "relatorios";

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

export default function App() {
  const [abaAtual, setAbaAtual] = useState<AbaAtual>("empresas");
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
      setAbaAtual("empresas");
      setMensagemLogin("Sua sessão expirou. Faça login novamente.");
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
    setAbaAtual("empresas");
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
      setAbaAtual("empresas");
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
        <div className="session-user">
          <span>Usuario: {usuario.nome}</span>
          <small>{usuario.email}</small>
          <button type="button" className="button-secondary" onClick={handleLogout}>
            Sair
          </button>
        </div>
      </header>

      {abaAtual === "empresas" ? (
        <EmpresasPage />
      ) : abaAtual === "recalculos" ? (
        <RecalculosPage />
      ) : (
        <RelatoriosPage />
      )}
    </main>
  );
}
