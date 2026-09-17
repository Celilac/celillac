// frontend/web-app/src/services/viaCep.ts

export interface ViaCepAddress {
  cep: string;
  logradouro: string;
  complemento: string;
  bairro: string;
  localidade: string; // Cidade
  uf: string;         // Estado (sigla)
  ddd?: string;
}

/**
 * Consulta informações de endereço completas através da API gratuita do ViaCEP.
 * Não requer chave de API, autenticação ou limites restritivos de requisição.
 */
export async function fetchAddressByCep(cep: string): Promise<ViaCepAddress | null> {
  const cleanCep = cep.replace(/\D/g, '');
  if (cleanCep.length !== 8) {
    return null;
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000); // 6s timeout

    const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      return null;
    }

    const data = await response.json();

    if (data.erro === true || data.erro === 'true') {
      return null;
    }

    return {
      cep: data.cep || cleanCep,
      logradouro: data.logradouro || '',
      complemento: data.complemento || '',
      bairro: data.bairro || '',
      localidade: data.localidade || '',
      uf: data.uf || '',
      ddd: data.ddd || '',
    };
  } catch {
    // Falha de rede ou timeout (deve permitir preenchimento manual sem travar o usuário)
    return null;
  }
}
