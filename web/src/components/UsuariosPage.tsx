import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  PerfilUsuario,
  Usuario,
  alterarSenhaUsuario,
  ativarUsuario,
  criarUsuario,
  desativarUsuario,
  editarUsuario,
  listarUsuarios
} from "../api/usuarios";

type UsuariosPageProps = {
  usuarioAtualId: string;
};

type NovoUsuarioForm = {
  nome: string;
  login: string;
  email: string;
  senha: string;
  perfil: PerfilUsuario;
};

const novoUsuarioInicial: NovoUsuarioForm = {
  nome: "",
  login: "",
  email: "",
  senha: "",
  perfil: "OPERADOR"
};

function formatarData(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return new Intl.DateTimeFormat("pt-BR").format(date);
}

export function UsuariosPage({ usuarioAtualId }: UsuariosPageProps) {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [novoUsuario, setNovoUsuario] =
    useState<NovoUsuarioForm>(novoUsuarioInicial);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [edicao, setEdicao] = useState<{
    nome: string;
    login: string;
    email: string;
    perfil: PerfilUsuario;
  }>({
    nome: "",
    login: "",
    email: "",
    perfil: "OPERADOR"
  });
  const [senhaPorUsuario, setSenhaPorUsuario] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState<string | null>(null);

  useEffect(() => {
    carregarUsuarios();
  }, []);

  async function carregarUsuarios() {
    setIsLoading(true);
    setErro(null);

    try {
      setUsuarios(await listarUsuarios());
    } catch (error) {
      setErro(error instanceof Error ? error.message : "Erro ao carregar usuarios.");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleCriarUsuario(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErro(null);
    setSucesso(null);

    if (!novoUsuario.nome.trim() || !novoUsuario.login.trim() || !novoUsuario.senha) {
      setErro("Informe nome, login e senha.");
      return;
    }

    setIsSubmitting(true);

    try {
      await criarUsuario({
        nome: novoUsuario.nome.trim(),
        login: novoUsuario.login.trim(),
        email: novoUsuario.email.trim() || null,
        senha: novoUsuario.senha,
        perfil: novoUsuario.perfil
      });
      setNovoUsuario(novoUsuarioInicial);
      setSucesso("Usuario criado com sucesso.");
      await carregarUsuarios();
    } catch (error) {
      setErro(error instanceof Error ? error.message : "Erro ao criar usuario.");
    } finally {
      setIsSubmitting(false);
    }
  }

  function iniciarEdicao(usuario: Usuario) {
    setEditandoId(usuario.id);
    setEdicao({
      nome: usuario.nome,
      login: usuario.login,
      email: usuario.email ?? "",
      perfil: usuario.perfil
    });
    setErro(null);
    setSucesso(null);
  }

  async function salvarEdicao(usuario: Usuario) {
    setErro(null);
    setSucesso(null);
    setIsSubmitting(true);

    try {
      await editarUsuario(usuario.id, {
        nome: edicao.nome.trim(),
        login: edicao.login.trim(),
        email: edicao.email.trim() || null,
        perfil: edicao.perfil
      });
      setEditandoId(null);
      setSucesso("Usuario atualizado com sucesso.");
      await carregarUsuarios();
    } catch (error) {
      setErro(error instanceof Error ? error.message : "Erro ao atualizar usuario.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleAlterarSenha(usuario: Usuario) {
    const senha = senhaPorUsuario[usuario.id] ?? "";
    setErro(null);
    setSucesso(null);

    if (senha.length < 6) {
      setErro("Senha deve ter pelo menos 6 caracteres.");
      return;
    }

    setIsSubmitting(true);

    try {
      await alterarSenhaUsuario(usuario.id, senha);
      setSenhaPorUsuario((current) => ({
        ...current,
        [usuario.id]: ""
      }));
      setSucesso("Senha alterada com sucesso.");
    } catch (error) {
      setErro(error instanceof Error ? error.message : "Erro ao alterar senha.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function alternarStatus(usuario: Usuario) {
    setErro(null);
    setSucesso(null);
    setIsSubmitting(true);

    try {
      if (usuario.ativo) {
        await desativarUsuario(usuario.id);
        setSucesso("Usuario desativado com sucesso.");
      } else {
        await ativarUsuario(usuario.id);
        setSucesso("Usuario ativado com sucesso.");
      }

      await carregarUsuarios();
    } catch (error) {
      setErro(error instanceof Error ? error.message : "Erro ao alterar status.");
    } finally {
      setIsSubmitting(false);
    }
  }

  const quantidadeTexto = useMemo(() => {
    if (isLoading) {
      return "Carregando usuarios...";
    }

    return `${usuarios.length} usuario${usuarios.length === 1 ? "" : "s"}`;
  }, [isLoading, usuarios.length]);

  return (
    <section className="page-layout usuarios-layout">
      <div className="section-heading">
        <div>
          <h2>Usuarios</h2>
          <p>Gerencie contas locais e perfil de acesso.</p>
        </div>
        <span className="counter">{quantidadeTexto}</span>
      </div>

      <form className="usuario-create-form" onSubmit={handleCriarUsuario}>
        <label>
          <span>Nome</span>
          <input
            value={novoUsuario.nome}
            onChange={(event) =>
              setNovoUsuario((current) => ({
                ...current,
                nome: event.target.value
              }))
            }
          />
        </label>
        <label>
          <span>Login</span>
          <input
            value={novoUsuario.login}
            autoCapitalize="none"
            onChange={(event) =>
              setNovoUsuario((current) => ({
                ...current,
                login: event.target.value
              }))
            }
          />
        </label>
        <label>
          <span>E-mail</span>
          <input
            type="email"
            value={novoUsuario.email}
            onChange={(event) =>
              setNovoUsuario((current) => ({
                ...current,
                email: event.target.value
              }))
            }
          />
        </label>
        <label>
          <span>Senha inicial</span>
          <input
            type="password"
            value={novoUsuario.senha}
            onChange={(event) =>
              setNovoUsuario((current) => ({
                ...current,
                senha: event.target.value
              }))
            }
          />
        </label>
        <label>
          <span>Perfil</span>
          <select
            value={novoUsuario.perfil}
            onChange={(event) =>
              setNovoUsuario((current) => ({
                ...current,
                perfil: event.target.value as PerfilUsuario
              }))
            }
          >
            <option value="OPERADOR">OPERADOR</option>
            <option value="ADMIN">ADMIN</option>
          </select>
        </label>
        <button type="submit" disabled={isSubmitting}>
          Criar usuario
        </button>
      </form>

      {erro && <div className="message error">{erro}</div>}
      {sucesso && <div className="message success">{sucesso}</div>}

      <div className="table-wrap">
        <table className="usuarios-table">
          <thead>
            <tr>
              <th>Nome</th>
              <th>Login</th>
              <th>E-mail</th>
              <th>Perfil</th>
              <th>Status</th>
              <th>Criado em</th>
              <th>Senha</th>
              <th>Acoes</th>
            </tr>
          </thead>
          <tbody>
            {usuarios.map((usuario) => {
              const editando = editandoId === usuario.id;
              const isUsuarioAtual = usuario.id === usuarioAtualId;

              return (
                <tr key={usuario.id}>
                  <td>
                    {editando ? (
                      <input
                        value={edicao.nome}
                        onChange={(event) =>
                          setEdicao((current) => ({
                            ...current,
                            nome: event.target.value
                          }))
                        }
                      />
                    ) : (
                      usuario.nome
                    )}
                  </td>
                  <td>
                    {editando ? (
                      <input
                        value={edicao.login}
                        autoCapitalize="none"
                        onChange={(event) =>
                          setEdicao((current) => ({
                            ...current,
                            login: event.target.value
                          }))
                        }
                      />
                    ) : (
                      usuario.login
                    )}
                  </td>
                  <td>
                    {editando ? (
                      <input
                        type="email"
                        value={edicao.email}
                        onChange={(event) =>
                          setEdicao((current) => ({
                            ...current,
                            email: event.target.value
                          }))
                        }
                      />
                    ) : (
                      usuario.email ?? "-"
                    )}
                  </td>
                  <td>
                    {editando ? (
                      <select
                        value={edicao.perfil}
                        onChange={(event) =>
                          setEdicao((current) => ({
                            ...current,
                            perfil: event.target.value as PerfilUsuario
                          }))
                        }
                      >
                        <option value="OPERADOR">OPERADOR</option>
                        <option value="ADMIN">ADMIN</option>
                      </select>
                    ) : (
                      usuario.perfil
                    )}
                  </td>
                  <td>
                    <span className={usuario.ativo ? "status-on" : "status-off"}>
                      {usuario.ativo ? "Ativo" : "Inativo"}
                    </span>
                  </td>
                  <td>{formatarData(usuario.createdAt)}</td>
                  <td>
                    <div className="password-action">
                      <input
                        type="password"
                        value={senhaPorUsuario[usuario.id] ?? ""}
                        placeholder="Nova senha"
                        onChange={(event) =>
                          setSenhaPorUsuario((current) => ({
                            ...current,
                            [usuario.id]: event.target.value
                          }))
                        }
                      />
                      <button
                        type="button"
                        className="button-compact"
                        disabled={isSubmitting}
                        onClick={() => handleAlterarSenha(usuario)}
                      >
                        Alterar
                      </button>
                    </div>
                  </td>
                  <td>
                    <div className="table-actions">
                      {editando ? (
                        <>
                          <button
                            type="button"
                            className="button-compact"
                            disabled={isSubmitting}
                            onClick={() => salvarEdicao(usuario)}
                          >
                            Salvar
                          </button>
                          <button
                            type="button"
                            className="button-secondary button-compact"
                            onClick={() => setEditandoId(null)}
                          >
                            Cancelar
                          </button>
                        </>
                      ) : (
                        <button
                          type="button"
                          className="button-compact"
                          onClick={() => iniciarEdicao(usuario)}
                        >
                          Editar
                        </button>
                      )}
                      <button
                        type="button"
                        className={
                          usuario.ativo
                            ? "button-danger button-compact"
                            : "button-secondary button-compact"
                        }
                        disabled={isSubmitting || (isUsuarioAtual && usuario.ativo)}
                        onClick={() => alternarStatus(usuario)}
                      >
                        {usuario.ativo ? "Desativar" : "Ativar"}
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {!isLoading && usuarios.length === 0 && (
              <tr>
                <td colSpan={8} className="empty-cell">
                  Nenhum usuario encontrado.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
