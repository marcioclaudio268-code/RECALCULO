# Automação de Recálculo de Guias

Base técnica inicial para um sistema interno de escritório contábil usado em rede local. O objetivo do projeto é registrar solicitações de recálculo de guias vinculadas a empresas cadastradas, manter evidências opcionais e preservar trilha de auditoria. O recálculo da guia acontece fora do sistema; esta aplicação registra e organiza o fluxo.

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

## Desenvolvimento

Rode a API em desenvolvimento:

```bash
npm run dev
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

- frontend
- login/autenticação completa
- telas
- importação de planilhas CSV/Excel
- upload e armazenamento físico de prints/evidências
- exportação de relatório Excel
- regras de serviço para gravação automática de auditoria
- backups automatizados
