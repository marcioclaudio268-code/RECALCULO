export type TipoDocumentoImportado = "CPF" | "CNPJ";

export function normalizarDocumento(documento: string) {
  return documento.replace(/[.\-/\s]/g, "");
}

function todosDigitosIguais(valor: string) {
  return /^(\d)\1+$/.test(valor);
}

export function validarCpf(cpf: string) {
  if (!/^\d{11}$/.test(cpf) || todosDigitosIguais(cpf)) {
    return false;
  }

  const digitos = cpf.split("").map(Number);

  const primeiroDigito = calcularDigitoCpf(digitos.slice(0, 9), 10);
  const segundoDigito = calcularDigitoCpf(digitos.slice(0, 10), 11);

  return primeiroDigito === digitos[9] && segundoDigito === digitos[10];
}

function calcularDigitoCpf(digitos: number[], pesoInicial: number) {
  const soma = digitos.reduce(
    (total, digito, indice) => total + digito * (pesoInicial - indice),
    0
  );
  const resto = (soma * 10) % 11;

  return resto === 10 ? 0 : resto;
}

export function validarCnpj(cnpj: string) {
  if (!/^\d{14}$/.test(cnpj) || todosDigitosIguais(cnpj)) {
    return false;
  }

  const digitos = cnpj.split("").map(Number);
  const primeiroDigito = calcularDigitoCnpj(digitos.slice(0, 12), [
    5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2
  ]);
  const segundoDigito = calcularDigitoCnpj(digitos.slice(0, 13), [
    6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2
  ]);

  return primeiroDigito === digitos[12] && segundoDigito === digitos[13];
}

function calcularDigitoCnpj(digitos: number[], pesos: number[]) {
  const soma = digitos.reduce(
    (total, digito, indice) => total + digito * pesos[indice],
    0
  );
  const resto = soma % 11;

  return resto < 2 ? 0 : 11 - resto;
}

export function identificarTipoDocumento(
  documento: string
): TipoDocumentoImportado | null {
  if (validarCpf(documento)) {
    return "CPF";
  }

  if (validarCnpj(documento)) {
    return "CNPJ";
  }

  return null;
}
