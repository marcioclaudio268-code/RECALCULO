# Operacao diaria

## Iniciar a API

No computador-servidor, na raiz do projeto:

```powershell
npm run start
```

Ou use o script auxiliar:

```powershell
scripts\windows\start-api.ps1
```

## Iniciar o frontend

Em outro terminal, na raiz do projeto:

```powershell
npm --prefix web run preview
```

Ou use o script auxiliar:

```powershell
scripts\windows\start-web.ps1
```

## Verificar se a API esta online

No navegador ou PowerShell:

```powershell
Invoke-RestMethod http://localhost:3001/health
```

Ou:

```powershell
scripts\windows\check-health.ps1
```

Resposta esperada:

```json
{ "status": "ok" }
```

## Acessar pelo navegador

No servidor:

```text
http://localhost:5173
```

Em outro computador da rede:

```text
http://IP_DO_SERVIDOR:5173
```

## Confirmar que o banco responde

Sinais de banco funcionando:

- Login funciona.
- Aba Empresas lista dados.
- Aba Recalculos lista dados.
- API nao mostra erro de conexao com PostgreSQL no terminal.

Se necessario, use Prisma Studio apenas para inspecao tecnica:

```powershell
npm run prisma:studio
```

## Onde ficam os prints

Os prints/evidencias ficam em:

```text
storage\evidencias-solicitacao
```

Nao apague essa pasta manualmente. Ela precisa entrar no backup.

## Conferir relatorio Excel

1. Entrar no sistema.
2. Abrir a aba `Relatorios`.
3. Selecionar data inicial e data final.
4. Clicar em `Exportar Excel`.
5. Confirmar que o arquivo `.xlsx` abre no Excel/LibreOffice.

## Sessao expirada

Se aparecer `Sua sessao expirou. Faca login novamente.`, entre novamente com e-mail e senha. Isso pode acontecer quando o token expira ou quando o computador ficou muito tempo sem uso.

## Sistema nao abre

Verifique:

1. O computador-servidor esta ligado.
2. A API foi iniciada com `npm run start`.
3. O frontend foi iniciado com `npm --prefix web run preview`.
4. `http://localhost:3001/health` responde no servidor.
5. O IP usado pelos computadores da rede esta correto.
6. Firewall esta liberado para rede privada/local nas portas `3001` e `5173`.
7. PostgreSQL esta em execucao.

## Se o computador reiniciar

1. Abrir terminal na pasta do projeto.
2. Iniciar API.
3. Abrir outro terminal.
4. Iniciar frontend.
5. Verificar `/health`.
6. Testar login e listagem de empresas.

Nesta etapa, os scripts nao instalam servico do Windows automaticamente.
