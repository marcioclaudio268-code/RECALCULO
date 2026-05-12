# Automação de Recálculo de Guias

Base técnica inicial para um sistema interno de escritório contábil usado em rede local. O objetivo do projeto é registrar solicitações de recálculo de guias vinculadas a empresas cadastradas, manter evidências opcionais e preservar trilha de auditoria. O recálculo da guia acontece fora do sistema; esta aplicação registra e organiza o fluxo.

## Regua de etapas

- Etapa 1 — Fundação técnica: concluída
- Etapa 2 — Banco e modelagem inicial: concluída
- Etapa 3 — Importação de empresas/contatos: concluída
- Etapa 4 — API operacional de recálculos: concluída
- Etapa 5 — Primeira interface web: concluída
- Etapa 6 — Edição/cancelamento com auditoria: concluída
- Etapa 7 — Evidências/prints opcionais: concluída tecnicamente
- Etapa 8 — Relatório mensal Excel: concluída
- Etapa 9 — Login real e controle de usuários: pendente
- Etapa 10 — Preparação para instalação no escritório: pendente

## Stack

- Node.js
- TypeScript
- Fastify
- PostgreSQL
- Prisma
- Zod
- dotenv

Fastify foi escolhido por ser simples, leve e adequado para uma API interna sem exigir uma estrutura grande neste início. Ele permite crescer para rotas, plugins e validações sem acoplar o projeto a um framework mais pesado.

## Instalação

```bash
npm install
```

## Configuração do ambiente

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

Observação: este projeto usa Prisma 7. A URL do banco fica em `prisma.config.ts`, carregada de `DATABASE_URL`, e o acesso runtime usa `@prisma/adapter-pg`.

## Seed de desenvolvimento

Depois de criar o banco e aplicar as migrations, rode o seed mínimo:

```bash
npm run db:seed
```

Também é possível rodar pelo Prisma:

```bash
npx prisma db seed
```

Usuário fictício de desenvolvimento:

```text
email: admin@recalculo.local
senha: admin123
```

Esse usuário existe apenas para ambiente local/dev. A senha é fictícia, armazenada como hash no banco, e não deve ser usada em ambiente real.

## Importação local de empresas e contatos

O projeto possui um script local para importar empresas e contatos de um CSV separado por ponto e vírgula. O arquivo deve ter as colunas exportadas pelo sistema atual, incluindo `ID`, `CNPJ`, `Razão social`, `Nome fantasia`, `Nome do Contato`, `Telefone do Contato`, `Email do Contato`, `Cargo do Contato` e `Departamentos do Contato`.

Rodar prévia sem gravar no banco:

```bash
npm run importar:empresas:preview -- "C:\caminho\arquivo.csv"
```

Rodar importação real:

```bash
npm run importar:empresas -- "C:\caminho\arquivo.csv" --usuario-id=<id>
```

Se `--usuario-id` não for informado, o script tenta usar o usuário ativo `admin@recalculo.local`. Em modo real, a importação grava um resumo em `importacoes_empresas` e cria auditoria com `acao=IMPORTACAO`.

Regras principais:

- o documento é normalizado removendo ponto, barra, hífen e espaços
- CPF e CNPJ são validados antes da gravação
- empresa existente com mesmo `codigoEmpresa` e `documento` é atualizada
- conflito grave entre código e documento é registrado como erro e não é sobrescrito
- contatos são criados separados da empresa
- contato duplicado na mesma empresa é evitado por email; sem email, por nome e telefone
- a linha final de filtros do CSV é ignorada
- não use dados reais em ambientes de teste fora da rede local autorizada

## Desenvolvimento

Instale as dependências do backend:

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

Endpoint mínimo disponível:

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

Instale as dependências do frontend:

```bash
cd web
npm install
```

Rode o frontend:

```bash
npm run dev
```

Também é possível iniciar pela raiz:

```bash
npm run dev:web
```

URLs locais:

- backend/API: `http://localhost:3001`
- frontend: `http://localhost:5173`

A tela inicial tem abas simples, sem React Router:

- `Empresas`: lista empresas, permite busca por nome, código ou documento, e abre o formulário de lançamento manual de recálculo.
- `Recálculos`: lista recálculos, permite filtrar por competência, tipo de guia, status e período, e exibe o detalhe com evidências e auditoria vinculada, incluindo usuário quando disponível.

Enquanto o login real não existe, informe no topo da tela o ID temporário do usuário `Admin Local`; esse valor é salvo apenas no `localStorage` do navegador e enviado como `x-user-id`. O mesmo ID é usado como `responsavelId` nesta primeira versão.

## Etapa 7 — Evidências/prints opcionais

O detalhe do recálculo permite anexar prints opcionais da solicitação, como WhatsApp, e-mail ou mensagem equivalente. A guia recalculada em si não deve ser anexada nem armazenada no sistema.

Regras atuais:

- evidência é opcional; o recálculo continua válido sem anexo
- somente imagens são aceitas: PNG, JPG, JPEG e WEBP
- PDF, planilhas, documentos e executáveis são bloqueados
- limite máximo de 5 MB por arquivo
- arquivos ficam em `storage/evidencias-solicitacao/`
- a pasta `storage/` não vai para o GitHub
- envio de evidência cria auditoria automaticamente
- `x-user-id` ainda é temporário até o login real

Rotas de evidência:

```http
POST /recalculos/:id/evidencias
x-user-id: <id do usuário>
Content-Type: multipart/form-data

arquivo=<imagem png/jpg/jpeg/webp>
```

```http
GET /evidencias/:id/arquivo
x-user-id: <id do usuário>
```

## Etapa 8 — Relatório mensal Excel

O financeiro pode exportar uma planilha `.xlsx` com os recálculos feitos em um período para apuração e cobrança fora do sistema. O relatório não contém valores financeiros, não inclui caminho físico de evidências e não contém senha/hash ou dados sensíveis desnecessários.

Rota:

```http
GET /relatorios/recalculos.xlsx?dataInicio=2026-05-01&dataFim=2026-05-31
x-user-id: <id do usuário>
```

Parâmetros:

- `dataInicio`: obrigatório, no formato `YYYY-MM-DD`
- `dataFim`: obrigatório, no formato `YYYY-MM-DD`
- `incluirCancelados`: opcional, `true` ou `false`; padrão `false`

Regras:

- o filtro usa `dataRecalculo`
- `dataFim` inclui o dia inteiro, até 23:59:59.999
- por padrão, recálculos com status `CANCELADO` ficam fora
- com `incluirCancelados=true`, cancelados entram no relatório mantendo a coluna `Status`
- o período máximo permitido é de 370 dias
- `x-user-id` ainda é temporário até o login real e deve apontar para um usuário ativo
- o financeiro apura e adiciona valores fora do sistema

No frontend, a aba `Relatórios` permite informar data inicial, data final, marcar `Incluir cancelados` e baixar o Excel.

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

Listar recálculos:

```http
GET /recalculos
GET /recalculos?competencia=2026-05&status=LANCADO
```

Detalhar recálculo:

```http
GET /recalculos/:id
```

Criar recálculo:

```http
POST /recalculos
x-user-id: <id do usuário do seed>
Content-Type: application/json

{
  "empresaId": "<id da empresa>",
  "tipoGuia": "DAS",
  "competencia": "2026-06",
  "descricao": "Recalculo de guia DAS solicitado para validacao da API",
  "dataRecalculo": "2026-06-15T10:00:00.000-03:00",
  "responsavelId": "<id do usuário responsável>",
  "motivo": "Teste de desenvolvimento",
  "solicitante": "Contato Exemplo",
  "dataSolicitacao": "2026-06-14T09:00:00.000-03:00",
  "observacoes": "Registro fictício para teste local"
}
```

Editar recálculo:

```http
PATCH /recalculos/:id
x-user-id: <id do usuário>
Content-Type: application/json

{
  "descricao": "Descrição corrigida",
  "observacoes": "Ajuste manual feito na conferência"
}
```

Cancelar recálculo:

```http
POST /recalculos/:id/cancelar
x-user-id: <id do usuário>
Content-Type: application/json

{
  "motivoCancelamento": "Lançamento feito na empresa errada"
}
```

O cancelamento não apaga o registro; ele altera o status para `CANCELADO`. Edição e cancelamento criam auditorias automaticamente. Na edição, cada campo alterado gera uma auditoria própria com valor anterior e valor novo.

O header `x-user-id` é temporário para desenvolvimento, até a implementação do login real. Ele não é autenticação; apenas identifica o usuário ativo que será usado como criador, atualizador ou cancelador do registro e da auditoria.

## Modelo inicial

O schema inicial contém:

- `usuarios`
- `empresas`
- `contatos_empresa`
- `importacoes_empresas`
- `recalculos_guias`
- `evidencias_solicitacao`
- `auditorias`

Regras contempladas na modelagem:

- empresa única por `codigo_empresa` e `documento`
- contatos separados da empresa
- recálculo sempre vinculado a uma empresa
- evidência opcional por ser uma relação separada
- ausência de campos de valores monetários para suportar relatório mensal sem valores
- uso de `ativo=false` e `status=CANCELADO` em vez de exclusão definitiva
- relacionamentos e índices iniciais para busca, relatório e auditoria

## Ainda não implementado

- login/autenticação completa
- upload/importação de planilhas CSV/Excel via tela
- auditoria automática completa para todas as ações do sistema
- backups automatizados
