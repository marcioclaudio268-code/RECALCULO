# AutomaÃ§Ã£o de RecÃ¡lculo de Guias

Base tÃ©cnica inicial para um sistema interno de escritÃ³rio contÃ¡bil usado em rede local. O objetivo do projeto Ã© registrar solicitaÃ§Ãµes de recÃ¡lculo de guias vinculadas a empresas cadastradas, manter evidÃªncias opcionais e preservar trilha de auditoria. O recÃ¡lculo da guia acontece fora do sistema; esta aplicaÃ§Ã£o registra e organiza o fluxo.

## Stack

- Node.js
- TypeScript
- Fastify
- PostgreSQL
- Prisma
- Zod
- dotenv

Fastify foi escolhido por ser simples, leve e adequado para uma API interna sem exigir uma estrutura grande neste inÃ­cio. Ele permite crescer para rotas, plugins e validaÃ§Ãµes sem acoplar o projeto a um framework mais pesado.

## InstalaÃ§Ã£o

```bash
npm install
```

## ConfiguraÃ§Ã£o do ambiente

Crie um arquivo `.env` a partir do exemplo:

```bash
cp .env.example .env
```

No Windows PowerShell:

```powershell
Copy-Item .env.example .env
```

Valor inicial esperado:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/recalculo_guias?schema=public"
PORT=3001
```

## Prisma

Gere o Prisma Client:

```bash
npm run prisma:generate
```

Crie a primeira migration depois que o PostgreSQL local estiver rodando e o banco `recalculo_guias` existir:

```bash
npm run prisma:migrate -- --name init
```

Abra o Prisma Studio, se precisar inspecionar o banco:

```bash
npm run prisma:studio
```

ObservaÃ§Ã£o: este projeto usa Prisma 7. A URL do banco fica em `prisma.config.ts`, carregada de `DATABASE_URL`, e o acesso runtime usa `@prisma/adapter-pg`.

## Seed de desenvolvimento

Depois de criar o banco e aplicar as migrations, rode o seed mÃ­nimo:

```bash
npm run db:seed
```

TambÃ©m Ã© possÃ­vel rodar pelo Prisma:

```bash
npx prisma db seed
```

UsuÃ¡rio fictÃ­cio de desenvolvimento:

```text
email: admin@recalculo.local
senha: admin123
```

Esse usuÃ¡rio existe apenas para ambiente local/dev. A senha Ã© fictÃ­cia, armazenada como hash no banco, e nÃ£o deve ser usada em ambiente real.

## ImportaÃ§Ã£o local de empresas e contatos

O projeto possui um script local para importar empresas e contatos de um CSV separado por ponto e vÃ­rgula. O arquivo deve ter as colunas exportadas pelo sistema atual, incluindo `ID`, `CNPJ`, `RazÃ£o social`, `Nome fantasia`, `Nome do Contato`, `Telefone do Contato`, `Email do Contato`, `Cargo do Contato` e `Departamentos do Contato`.

Rodar prÃ©via sem gravar no banco:

```bash
npm run importar:empresas:preview -- "C:\caminho\arquivo.csv"
```

Rodar importaÃ§Ã£o real:

```bash
npm run importar:empresas -- "C:\caminho\arquivo.csv" --usuario-id=<id>
```

Se `--usuario-id` nÃ£o for informado, o script tenta usar o usuÃ¡rio ativo `admin@recalculo.local`. Em modo real, a importaÃ§Ã£o grava um resumo em `importacoes_empresas` e cria auditoria com `acao=IMPORTACAO`.

Regras principais:

- o documento Ã© normalizado removendo ponto, barra, hÃ­fen e espaÃ§os
- CPF e CNPJ sÃ£o validados antes da gravaÃ§Ã£o
- empresa existente com mesmo `codigoEmpresa` e `documento` Ã© atualizada
- conflito grave entre cÃ³digo e documento Ã© registrado como erro e nÃ£o Ã© sobrescrito
- contatos sÃ£o criados separados da empresa
- contato duplicado na mesma empresa Ã© evitado por email; sem email, por nome e telefone
- a linha final de filtros do CSV Ã© ignorada
- nÃ£o use dados reais em ambientes de teste fora da rede local autorizada

## Desenvolvimento

Instale as dependÃªncias do backend:

```bash
npm install
```

Rode a API em desenvolvimento:

```bash
npm run dev
```

Ou:

```bash
npm run dev:api
```

Endpoint mÃ­nimo disponÃ­vel:

```text
GET /health
```

Valide TypeScript:

```bash
npm run typecheck
```

Gere build:

```bash
npm run build
```

Rode o build:

```bash
npm start
```

## Frontend web

O primeiro frontend fica na pasta `web/` e consome a API em `http://localhost:3001`.

Instale as dependÃªncias do frontend:

```bash
cd web
npm install
```

Rode o frontend:

```bash
npm run dev
```

TambÃ©m Ã© possÃ­vel iniciar pela raiz:

```bash
npm run dev:web
```

URLs locais:

- backend/API: `http://localhost:3001`
- frontend: `http://localhost:5173`

A tela inicial lista empresas, permite busca por nome, cÃ³digo ou documento, e abre o formulÃ¡rio de lanÃ§amento manual de recÃ¡lculo. Enquanto o login real nÃ£o existe, informe no topo da tela o ID temporÃ¡rio do usuÃ¡rio `Admin Local`; esse valor Ã© salvo apenas no `localStorage` do navegador e enviado como `x-user-id`. O mesmo ID Ã© usado como `responsavelId` nesta primeira versÃ£o.

## Rotas iniciais da API

Healthcheck:

```http
GET /health
```

Listar empresas:

```http
GET /empresas
GET /empresas?busca=exemplo
```

Detalhar empresa:

```http
GET /empresas/:id
```

Listar recalculos:

```http
GET /recalculos
GET /recalculos?competencia=2026-05&status=LANCADO
```

Detalhar recalculo:

```http
GET /recalculos/:id
```

Criar recalculo:

```http
POST /recalculos
x-user-id: <id do usuario do seed>
Content-Type: application/json

{
  "empresaId": "<id da empresa>",
  "tipoGuia": "DAS",
  "competencia": "2026-06",
  "descricao": "Recalculo de guia DAS solicitado para validacao da API",
  "dataRecalculo": "2026-06-15T10:00:00.000-03:00",
  "responsavelId": "<id do usuario responsavel>",
  "motivo": "Teste de desenvolvimento",
  "solicitante": "Contato Exemplo",
  "dataSolicitacao": "2026-06-14T09:00:00.000-03:00",
  "observacoes": "Registro ficticio para teste local"
}
```

O header `x-user-id` e temporario para desenvolvimento, ate a implementacao do login real. Ele nao e autenticacao; apenas identifica o usuario ativo que sera usado como criador do registro e da auditoria.

## Modelo inicial

O schema inicial contÃ©m:

- `usuarios`
- `empresas`
- `contatos_empresa`
- `importacoes_empresas`
- `recalculos_guias`
- `evidencias_solicitacao`
- `auditorias`

Regras contempladas na modelagem:

- empresa Ãºnica por `codigo_empresa` e `documento`
- contatos separados da empresa
- recÃ¡lculo sempre vinculado a uma empresa
- evidÃªncia opcional por ser uma relaÃ§Ã£o separada
- ausÃªncia de campos de valores monetÃ¡rios para suportar relatÃ³rio mensal sem valores
- uso de `ativo=false` e `status=CANCELADO` em vez de exclusÃ£o definitiva
- relacionamentos e Ã­ndices iniciais para busca, relatÃ³rio e auditoria

## Ainda nÃ£o implementado

- login/autenticaÃ§Ã£o completa
- upload/importaÃ§Ã£o de planilhas CSV/Excel via tela
- upload e armazenamento fÃ­sico de prints/evidÃªncias
- exportaÃ§Ã£o de relatÃ³rio Excel
- auditoria automatica completa para todas as acoes do sistema
- backups automatizados
