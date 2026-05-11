# Setup Local

Este sistema foi pensado para uso interno em rede local do escritório contábil. O computador definido como servidor local deve permanecer ligado e executar o PostgreSQL e a API Node.js.

## Rede local

- A API deve ser acessada apenas por computadores autorizados dentro da rede local.
- O backend escuta em `0.0.0.0` para permitir acesso via LAN quando a porta estiver liberada no firewall do computador-servidor.
- A porta configurada em `PORT` deve ser liberada somente para a rede local.
- O banco PostgreSQL não deve ser exposto diretamente à internet.
- Acesso externo, VPN ou publicação em nuvem devem ser tratados como uma etapa separada de segurança.

## PostgreSQL

O PostgreSQL deve rodar no computador-servidor local. Antes de rodar as migrations, crie o banco:

```sql
CREATE DATABASE recalculo_guias;
```

Depois configure o `.env`:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/recalculo_guias?schema=public"
PORT=3001
```

Em produção interna, troque a senha padrão do usuário `postgres` e use credenciais próprias para a aplicação.

## Inicialização

Instale dependências:

```bash
npm install
```

Gere o Prisma Client:

```bash
npm run prisma:generate
```

Crie as tabelas:

```bash
npm run prisma:migrate -- --name init
```

Rode a API:

```bash
npm run dev
```

## Seed de desenvolvimento

O seed de desenvolvimento serve apenas para validar o banco local e os principais relacionamentos entre usuário, empresa, contato, recálculo e auditoria.

Execute depois das migrations:

```bash
npm run db:seed
```

Ou via Prisma:

```bash
npx prisma db seed
```

Não use dados reais de clientes no seed.

## Backups

Backups serão obrigatórios em etapa futura. Antes de uso real, será necessário definir:

- frequência dos backups
- pasta de destino
- retenção mínima
- teste periódico de restauração
- responsável por monitorar falhas

## Prints e evidências

O schema já prevê metadados de evidências, mas o upload ainda não foi implementado. Futuramente, prints e arquivos de evidência devem ser armazenados em uma pasta local protegida no computador-servidor, com permissão restrita e backup incluído na rotina oficial.
