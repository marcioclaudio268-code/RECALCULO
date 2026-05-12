# Checklist de producao local

Use antes de liberar o sistema para uso real no escritorio.

- [ ] PostgreSQL instalado.
- [ ] Banco `recalculo_guias` criado.
- [ ] `.env` real configurado.
- [ ] `JWT_SECRET` trocado por valor unico e forte.
- [ ] `web/.env.production` configurado com IP local do servidor.
- [ ] `npm install` executado na raiz.
- [ ] `npm install` executado em `web/`, se necessario.
- [ ] Prisma Client gerado com `npm run prisma:generate`.
- [ ] Migrations aplicadas.
- [ ] Seed avaliado; nao rodar seed em banco real sem necessidade.
- [ ] Build da API passou com `npm run build`.
- [ ] Build do frontend passou com `npm run build --prefix web`.
- [ ] Pasta `storage/evidencias-solicitacao` criada ou validada.
- [ ] Backup do banco testado.
- [ ] Backup do storage testado.
- [ ] API inicia com `npm run start`.
- [ ] Frontend inicia com `npm --prefix web run preview`.
- [ ] `/health` responde.
- [ ] Outro computador da rede acessa `http://IP_DO_SERVIDOR:5173`.
- [ ] Login funciona.
- [ ] Listar empresas funciona.
- [ ] Criar recalculo de teste funciona.
- [ ] Anexar print de teste funciona.
- [ ] Exportar relatorio Excel funciona.
- [ ] Backup gerado depois do teste.
- [ ] Dados de teste removidos ou cancelados.
- [ ] Senha admin trocada antes de uso real.
- [ ] Firewall liberado somente para rede privada/local.
- [ ] Sistema nao exposto para internet publica.
