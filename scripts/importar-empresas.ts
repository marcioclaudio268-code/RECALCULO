import "dotenv/config";
import { importarEmpresasCsv } from "../src/modules/importacoes/importacoes.service.js";
import { prisma } from "../src/lib/prisma.js";

type CliArgs = {
  caminhoArquivo?: string;
  preview: boolean;
  usuarioId?: string;
};

function parseArgs(args: string[]): CliArgs {
  const resultado: CliArgs = {
    preview: false
  };

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];

    if (arg === "--preview") {
      resultado.preview = true;
      continue;
    }

    if (arg.startsWith("--usuario-id=")) {
      resultado.usuarioId = arg.replace("--usuario-id=", "").trim();
      continue;
    }

    if (arg === "--usuario-id") {
      resultado.usuarioId = args[index + 1]?.trim();
      index += 1;
      continue;
    }

    if (!arg.startsWith("--") && !resultado.caminhoArquivo) {
      resultado.caminhoArquivo = arg;
    }
  }

  return resultado;
}

function imprimirResumo(resultado: Awaited<ReturnType<typeof importarEmpresasCsv>>) {
  console.log(resultado.preview ? "Preview da importacao concluido." : "Importacao concluida.");
  console.table([
    { item: "Arquivo", valor: resultado.nomeArquivo },
    { item: "Linhas lidas", valor: resultado.totalLinhas },
    { item: "Empresas validas", valor: resultado.empresasValidas },
    { item: "Contatos validos", valor: resultado.contatosValidos },
    { item: "Empresas criadas", valor: resultado.empresasCriadas },
    { item: "Empresas atualizadas", valor: resultado.empresasAtualizadas },
    { item: "Contatos criados", valor: resultado.contatosCriados },
    { item: "Linhas ignoradas", valor: resultado.linhasIgnoradas },
    { item: "Erros", valor: resultado.erros.length },
    { item: "Importacao ID", valor: resultado.importacaoId ?? "-" },
    { item: "Auditoria ID", valor: resultado.auditoriaId ?? "-" }
  ]);

  if (resultado.erros.length > 0) {
    console.log("Erros encontrados:");
    console.table(resultado.erros.slice(0, 30));

    if (resultado.erros.length > 30) {
      console.log(`Exibindo 30 de ${resultado.erros.length} erros.`);
    }
  }
}

const args = parseArgs(process.argv.slice(2));

if (!args.caminhoArquivo) {
  console.error(
    'Informe o caminho do CSV. Exemplo: npm run importar:empresas:preview -- "C:\\caminho\\arquivo.csv"'
  );
  process.exit(1);
}

try {
  const resultado = await importarEmpresasCsv({
    caminhoArquivo: args.caminhoArquivo,
    preview: args.preview,
    usuarioId: args.usuarioId
  });

  imprimirResumo(resultado);
} catch (error) {
  console.error("Erro ao importar empresas e contatos.");
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}
