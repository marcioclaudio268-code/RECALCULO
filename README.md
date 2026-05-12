# Automacao de Recalculo de Guias

Sistema interno para escritorio contabil em rede local. O objetivo e registrar solicitacoes de recalculo de guias vinculadas a empresas cadastradas, manter evidencias opcionais, preservar auditoria e exportar relatorio mensal para o financeiro. O recalculo da guia e a cobranca acontecem fora do sistema.

## Regua de etapas

- Etapa 1 - Fundacao tecnica: concluida
- Etapa 2 - Banco e modelagem inicial: concluida
- Etapa 3 - Importacao de empresas/contatos: concluida
- Etapa 4 - API operacional de recalculos: concluida
- Etapa 5 - Primeira interface web: concluida
- Etapa 6 - Edicao/cancelamento com auditoria: concluida
- Etapa 7 - Evidencias/prints opcionais: concluida
- Etapa 8 - Relatorio mensal Excel: concluida
- Etapa 9A - Login local e protecao total das rotas: concluida tecnicamente apos validacao
- Etapa 10 - Preparacao para instalacao no escritorio: pendente

## Stack

- Node.js
- TypeScript
- Fastify
- PostgreSQL
- Prisma
- Zod
- React + Vite

## Instalacao

```bash
npm install
```

Instale as dependencias do frontend:

```bash
cd web
npm install
```

## Configuracao do ambiente

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
JWT_SECRET="troque-este-segredo-em-producao"
JWT_EXPIRES_IN="8h"
```

Em ambiente real do escritorio, troque `JWT_SECRET` antes do uso. Em desenvolvimento, se `JWT_SECRET` nao estiver configurado, a API usa fallback local claro. Em `NODE_ENV=production`, a ausencia de `JWT_SECRET` causa falha.

## Prisma

Gere o Prisma Client:

```bash
npm run prisma:generate
```

Crie/aplique migrations com o PostgreSQL local rodando:

```bash
npm run prisma:migrate -- --name init
```

Abra o Prisma Studio, se precisar inspecionar o banco:

```bash
npm run prisma:studio
```

## Seed de desenvolvimento

Depois de criar o banco e aplicar as migrations:

```bash
npm run db:seed
```

Usuario local criado pelo seed:

```text
email: admin@recalculo.local
senha: admin123
```

A senha de desenvolvimento deve ser trocada antes do uso real no escritorio. A senha e salva como hash com `bcryptjs`; senha pura nao deve ser armazenada.

## Desenvolvimento

Rode a API:

```bash
npm run dev:api
```

Rode o frontend:

```bash
npm run dev:web
```

URLs locais:

- backend/API: `http://localhost:3001`
- frontend: `http://localhost:5173`

## Etapa 9A - Login local

O sistema usa login local por e-mail e senha. Ao autenticar, a API gera um JWT que carrega apenas:

```json
{
  "sub": "<id do usuario>"
}
```

O frontend guarda o token JWT no `localStorage` e envia:

```http
Authorization: Bearer <token>
```

O uso normal de `x-user-id` foi removido.

Rotas de autenticacao:

```http
POST /auth/login
Content-Type: application/json

{
  "email": "admin@recalculo.local",
  "senha": "admin123"
}
```

Retorno:

```json
{
  "token": "...",
  "usuario": {
    "id": "...",
    "nome": "Admin Local",
    "email": "admin@recalculo.local"
  }
}
```

```http
GET /auth/me
Authorization: Bearer <token>
```

```http
POST /auth/logout
Authorization: Bearer <token>
```

Todas as rotas do sistema exigem autenticacao, exceto:

- `GET /health`
- `POST /auth/login`

Login com Google, recuperacao de senha e gestao avancada de usuarios nao foram implementados nesta etapa.

## Frontend web

A tela inicial sem sessao mostra apenas o login. Apos login, o painel exibe:

- `Empresas`: busca empresas e permite lancar recalculo.
- `Recalculos`: lista, filtra, abre detalhe, edita, cancela, mostra auditoria e evidencias.
- `Relatorios`: exporta o relatorio mensal Excel.

O topo mostra o usuario logado e o botao `Sair`. O logout remove token e usuario do `localStorage`.

## Etapa 7 - Evidencias/prints opcionais

O detalhe do recalculo permite anexar prints opcionais da solicitacao, como WhatsApp, e-mail ou mensagem equivalente. A guia recalculada em si nao deve ser anexada nem armazenada no sistema.

Regras atuais:

- evidencia e opcional
- somente imagens sao aceitas: PNG, JPG, JPEG e WEBP
- PDF, planilhas, documentos e executaveis sao bloqueados
- limite maximo de 5 MB por arquivo
- arquivos ficam em `storage/evidencias-solicitacao/`
- a pasta `storage/` nao vai para o GitHub
- envio de evidencia cria auditoria com o usuario autenticado

Rotas de evidencia:

```http
POST /recalculos/:id/evidencias
Authorization: Bearer <token>
Content-Type: multipart/form-data

arquivo=<imagem png/jpg/jpeg/webp>
```

```http
GET /evidencias/:id/arquivo
Authorization: Bearer <token>
```

## Etapa 8 - Relatorio mensal Excel

O financeiro pode exportar uma planilha `.xlsx` com os recalculos feitos em um periodo para apuracao e cobranca fora do sistema. O relatorio nao contem valores financeiros, nao inclui caminho fisico de evidencias e nao contem senha/hash ou dados sensiveis desnecessarios.

Rota:

```http
GET /relatorios/recalculos.xlsx?dataInicio=2026-05-01&dataFim=2026-05-31
Authorization: Bearer <token>
```

Parametros:

- `dataInicio`: obrigatorio, formato `YYYY-MM-DD`
- `dataFim`: obrigatorio, formato `YYYY-MM-DD`
- `incluirCancelados`: opcional, `true` ou `false`; padrao `false`

Regras:

- o filtro usa `dataRecalculo`
- `dataFim` inclui o dia inteiro, ate 23:59:59.999
- por padrao, recalculos com status `CANCELADO` ficam fora
- com `incluirCancelados=true`, cancelados entram no relatorio mantendo a coluna `Status`
- o periodo maximo permitido e de 370 dias
- o financeiro apura e adiciona valores fora do sistema

## Rotas principais da API

Healthcheck:

```http
GET /health
```

Listar e detalhar empresas:

```http
GET /empresas
GET /empresas?busca=exemplo
GET /empresas/:id
Authorization: Bearer <token>
```

Listar e detalhar recalculos:

```http
GET /recalculos
GET /recalculos?competencia=2026-05&status=LANCADO
GET /recalculos/:id
Authorization: Bearer <token>
```

Criar recalculo:

```http
POST /recalculos
Authorization: Bearer <token>
Content-Type: application/json

{
  "empresaId": "<id da empresa>",
  "tipoGuia": "DAS",
  "competencia": "2026-06",
  "descricao": "Recalculo de guia DAS solicitado para validacao da API",
  "dataRecalculo": "2026-06-15T10:00:00.000-03:00",
  "motivo": "Teste de desenvolvimento",
  "solicitante": "Contato Exemplo",
  "dataSolicitacao": "2026-06-14T09:00:00.000-03:00",
  "observacoes": "Registro ficticio para teste local"
}
```

Se `responsavelId` nao for enviado, a API usa o usuario autenticado como responsavel.

Editar recalculo:

```http
PATCH /recalculos/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "descricao": "Descricao corrigida",
  "observacoes": "Ajuste manual feito na conferencia"
}
```

Cancelar recalculo:

```http
POST /recalculos/:id/cancelar
Authorization: Bearer <token>
Content-Type: application/json

{
  "motivoCancelamento": "Lancamento feito na empresa errada"
}
```

O cancelamento nao apaga o registro; ele altera o status para `CANCELADO`. Criacao, edicao, cancelamento, anexo de evidencia e login criam auditoria com o usuario autenticado. GET simples nao e auditado nesta etapa.

## Importacao local de empresas e contatos

O projeto possui um script local para importar empresas e contatos de CSV separado por ponto e virgula.

Previa sem gravar no banco:

```bash
npm run importar:empresas:preview -- "C:\caminho\arquivo.csv"
```

Importacao real:

```bash
npm run importar:empresas -- "C:\caminho\arquivo.csv" --usuario-id=<id>
```

Observacao: o script de importacao ainda e uma ferramenta local de manutencao e nao faz parte das rotas web protegidas por JWT.

## Modelo inicial

O schema contem:

- `usuarios`
- `empresas`
- `contatos_empresa`
- `importacoes_empresas`
- `recalculos_guias`
- `evidencias_solicitacao`
- `auditorias`

Regras contempladas:

- empresa unica por `codigo_empresa` e `documento`
- contatos separados da empresa
- recalculo sempre vinculado a uma empresa
- evidencia opcional por relacao separada
- ausencia de campos monetarios para suportar relatorio mensal sem valores
- uso de `ativo=false` e `status=CANCELADO` em vez de exclusao definitiva
- indices iniciais para busca, relatorio e auditoria

## Ainda nao implementado

- upload/importacao de planilhas CSV/Excel via tela
- auditoria automatica completa para todas as acoes do sistema
- backups automatizados
