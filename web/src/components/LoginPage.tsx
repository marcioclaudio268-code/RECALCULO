import { FormEvent, useState } from "react";
import {
  login as loginApi,
  type UsuarioAutenticado
} from "../api/auth";

type LoginPageProps = {
  onLogin: (token: string, usuario: UsuarioAutenticado) => void;
};

export function LoginPage({ onLogin }: LoginPageProps) {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [isEntrando, setIsEntrando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErro(null);

    if (!email.trim()) {
      setErro("Informe o e-mail.");
      return;
    }

    if (!senha) {
      setErro("Informe a senha.");
      return;
    }

    setIsEntrando(true);

    try {
      const resultado = await loginApi(email.trim(), senha);
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
          <label>
            <span>E-mail</span>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="username"
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
