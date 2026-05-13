import { FormEvent, useState } from "react";
import {
  login as loginApi,
  type UsuarioAutenticado
} from "../api/auth";

type LoginPageProps = {
  mensagem?: string | null;
  onLogin: (token: string, usuario: UsuarioAutenticado) => void;
};

export function LoginPage({ mensagem, onLogin }: LoginPageProps) {
  const [login, setLogin] = useState("");
  const [senha, setSenha] = useState("");
  const [isEntrando, setIsEntrando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErro(null);

    if (!login.trim()) {
      setErro("Informe o usuario ou e-mail.");
      return;
    }

    if (!senha) {
      setErro("Informe a senha.");
      return;
    }

    setIsEntrando(true);

    try {
      const resultado = await loginApi(login.trim(), senha);
      onLogin(resultado.token, resultado.usuario);
    } catch (error) {
      setErro(error instanceof Error ? error.message : "Erro ao entrar.");
    } finally {
      setIsEntrando(false);
    }
  }

  return (
    <main className="login-shell">
      <section className="login-panel">
        <div className="section-heading compact">
          <div>
            <span className="eyebrow">Rede local</span>
            <h1>{"Rec\u00e1lculo de Guias"}</h1>
            <p>Acesse com o usuario local do escritorio.</p>
          </div>
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          {mensagem && <div className="message warning">{mensagem}</div>}

          <label>
            <span>Usuario ou e-mail</span>
            <input
              type="text"
              value={login}
              onChange={(event) => setLogin(event.target.value)}
              autoComplete="username"
              autoCapitalize="none"
              autoFocus
            />
          </label>
          <label>
            <span>Senha</span>
            <input
              type="password"
              value={senha}
              onChange={(event) => setSenha(event.target.value)}
              autoComplete="current-password"
            />
          </label>

          {erro && <div className="message error">{erro}</div>}

          <button type="submit" disabled={isEntrando}>
            {isEntrando ? "Entrando..." : "Entrar"}
          </button>
        </form>
      </section>
    </main>
  );
}
