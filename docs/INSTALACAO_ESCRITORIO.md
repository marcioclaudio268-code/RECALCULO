# Instalacao no escritorio

## Objetivo

Este guia prepara o sistema Automacao de Recalculo de Guias para rodar em um computador-servidor dentro da rede local do escritorio. O sistema nao deve ser exposto diretamente para a internet nesta etapa.

## Pre-requisitos

- Windows no computador-servidor.
- Node.js LTS instalado.
- PostgreSQL instalado.
- Git instalado.
- Acesso ao repositorio do projeto.
- Computador-servidor ligado durante o expediente ou 24h, conforme a rotina do escritorio.
- IP fixo local ou reserva DHCP no roteador, recomendado.

## Estrutura esperada

Use uma pasta simples e estavel, por exemplo:

```text
C:\Sistemas\RECALCULO
```

Evite rodar o sistema dentro de pastas temporarias ou sincronizadas automaticamente sem controle.

## Banco PostgreSQL

Passos manuais:

1. Instalar PostgreSQL no computador-servidor.
2. Definir senha forte para `postgres` ou criar um usuario dedicado para a aplicacao.
3. Criar o banco `recalculo_guias`.
4. Montar a `DATABASE_URL`.
5. Rodar migrations.
6. Rodar seed apenas se necessario.

Exemplo SQL:

```sql
CREATE DATABASE recalculo_guias;
```

Comandos iniciais no projeto:

```powershell
npm install
Copy-Item .env.production.example .env
npm run prisma:generate
npm run prisma:migrate -- --name init
npm run db:seed
```

Se ja houver banco com dados reais, nao rode seed sem avaliar. O seed cria/ajusta o usuario `admin@recalculo.local` e dados de desenvolvimento.

## Configuracao do .env

Copie:

```powershell
Copy-Item .env.production.example .env
```

Variaveis:

- `DATABASE_URL`: conexao do PostgreSQL local, incluindo usuario, senha, host, porta, banco e schema.
- `PORT`: porta da API. Padrao: `3001`.
- `JWT_SECRET`: chave longa e unica usada para assinar tokens JWT.
- `JWT_EXPIRES_IN`: expiracao do token, por exemplo `8h`.
- `NODE_ENV`: use `production` no computador do escritorio.
- `FRONTEND_ORIGIN`: origem do frontend permitida no CORS da API. Em rede local, use `http://IP_DO_SERVIDOR:5173`. Se precisar aceitar mais de uma origem local, separe por virgula, por exemplo `http://localhost:5173,http://192.168.0.50:5173`.

Exemplo para gerar `JWT_SECRET` no PowerShell:

```powershell
[guid]::NewGuid().ToString() + [guid]::NewGuid().ToString()
```

Nao use o valor de exemplo em uso real.

## Frontend e VITE_API_URL

Quando outro computador da rede acessa o frontend, `localhost` aponta para o proprio computador do funcionario, nao para o servidor. Por isso, antes do build do frontend, configure a URL da API com o IP local do servidor.

Copie:

```powershell
Copy-Item web\.env.production.example web\.env.production
```

Edite `web\.env.production`:

```env
VITE_API_URL="http://192.168.0.50:3001"
```

Troque `192.168.0.50` pelo IP fixo local do computador-servidor.

## Build

Na raiz:

```powershell
npm run build
npm run build --prefix web
```

## Execucao manual

API:

```powershell
npm run start
```

Frontend:

```powershell
npm --prefix web run preview
```

## Acesso na rede local

Descubra o IP local do servidor:

```powershell
ipconfig
```

Exemplos:

- Frontend: `http://192.168.0.50:5173`
- API: `http://192.168.0.50:3001`

## Firewall

Liberar apenas na rede privada/local:

- Porta `3001` para API.
- Porta `5173` para frontend.

Nao liberar essas portas para internet publica.

## IP fixo local

Configure reserva DHCP no roteador ou IP fixo no Windows. Esta configuracao deve ser feita manualmente pelo responsavel de TI ou pela pessoa que administra a rede.

## Primeiro acesso

1. Acesse `http://IP_DO_SERVIDOR:5173`.
2. Entre com o usuario inicial do seed, se ele foi usado:
   - e-mail: `admin@recalculo.local`
   - senha: `admin123`
3. Troque a senha antes do uso real. Enquanto nao houver tela de troca, a alteracao deve ser feita diretamente no banco ou por script futuro controlado.

## Observacoes fora de escopo

- Nao ha Docker nesta etapa.
- Nao ha HTTPS nesta etapa.
- Nao ha servico do Windows criado automaticamente nesta etapa.
- Nao expor o sistema a internet sem uma etapa especifica de seguranca.
