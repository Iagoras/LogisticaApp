/**
 * Validação e formatação de CNPJ.
 *
 * O banco guarda só os 14 dígitos, sem máscara — a formatação é aplicada
 * apenas na exibição.
 */

/** Remove tudo que não for dígito. */
export function apenasDigitos(valor: string): string {
  return valor.replace(/\D/g, '');
}

/**
 * Valida um CNPJ pelos dois dígitos verificadores.
 *
 * Aceita com ou sem máscara. Rejeita sequências repetidas (11111111111111),
 * que passam no cálculo do DV mas não são CNPJs válidos.
 */
export function validarCnpj(entrada: string): boolean {
  const cnpj = apenasDigitos(entrada);

  if (cnpj.length !== 14) return false;
  if (/^(\d)\1{13}$/.test(cnpj)) return false;

  const calcularDigito = (base: string): number => {
    // Pesos vão de 2 a 9, da direita para a esquerda.
    let peso = 2;
    let soma = 0;

    for (let i = base.length - 1; i >= 0; i--) {
      soma += Number(base[i]) * peso;
      peso = peso === 9 ? 2 : peso + 1;
    }

    const resto = soma % 11;
    return resto < 2 ? 0 : 11 - resto;
  };

  const primeiro = calcularDigito(cnpj.slice(0, 12));
  if (primeiro !== Number(cnpj[12])) return false;

  const segundo = calcularDigito(cnpj.slice(0, 13));
  return segundo === Number(cnpj[13]);
}

/** Aplica a máscara 00.000.000/0000-00 para exibição. */
export function formatarCnpj(entrada: string): string {
  const cnpj = apenasDigitos(entrada);
  if (cnpj.length !== 14) return entrada;

  return cnpj.replace(
    /^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/,
    '$1.$2.$3/$4-$5',
  );
}

/** Aplica a máscara 00000-000 no CEP. */
export function formatarCep(entrada: string): string {
  const cep = apenasDigitos(entrada);
  if (cep.length !== 8) return entrada;
  return cep.replace(/^(\d{5})(\d{3})$/, '$1-$2');
}
