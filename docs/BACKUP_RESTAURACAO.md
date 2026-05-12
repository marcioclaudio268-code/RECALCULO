# Backup e restauracao

## O que precisa de backup

- Banco PostgreSQL.
- Pasta `storage/evidencias-solicitacao`.
- Arquivo `.env` real.
- Logs, se forem criados futuramente.

Backup sem banco perde registros. Backup sem `storage` perde prints. Backup sem `.env` dificulta recuperar a instalacao.

## Frequencia recomendada

- Backup diario.
- Retencao minima de 30 dias.
- Copia em outro disco, pasta de rede ou midia externa controlada.
- Teste periodico de restauracao.

## Backup do banco

Use `pg_dump`.

Exemplo:

```powershell
pg_dump -U postgres -d recalculo_guias -F c -f backups\db\recalculo_guias_YYYYMMDD_HHMM.dump
```

Script auxiliar:

```powershell
scripts\windows\backup-db.ps1
```

O script nao guarda senha. Se necessario, configure `PGPASSWORD` temporariamente na sessao do PowerShell ou use mecanismo seguro equivalente administrado pelo responsavel tecnico.

## Backup dos prints

Copiar:

```text
storage\evidencias-solicitacao
```

Para:

```text
backups\storage\YYYYMMDD_HHMM\
```

Script auxiliar:

```powershell
scripts\windows\backup-storage.ps1
```

## Backup completo

Para banco + storage:

```powershell
scripts\windows\backup-all.ps1
```

## Restauracao do banco

Restauracao pode apagar dados atuais. Antes de restaurar, confirme que esta usando o banco e arquivo corretos.

Exemplo:

```powershell
pg_restore -U postgres -d recalculo_guias --clean --if-exists backups\db\arquivo.dump
```

Nao ha script automatico de restauracao nesta etapa por seguranca.

## Restauracao dos prints

Copie os arquivos do backup de volta para:

```text
storage\evidencias-solicitacao
```

Preserve os nomes dos arquivos. O banco guarda o caminho relativo dos prints.

## Riscos

- Restaurar o banco errado pode apagar dados atuais.
- Restaurar banco sem restaurar storage pode deixar evidencias quebradas.
- Restaurar storage sem o banco correspondente pode deixar arquivos sem referencia.
- Backup salvo apenas no mesmo disco do servidor nao protege contra falha fisica do disco.
- Senhas nao devem ser colocadas dentro dos scripts.
