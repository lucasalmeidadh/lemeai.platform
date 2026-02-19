import AsyncStorage from '@react-native-async-storage/async-storage';

// Hardcoded for now based on .env.development
const API_URL = 'https://api.gbcode.com.br';

/**
 * Interface estendida para incluir propriedade de controle de retry
 */
interface RequestInitRetry extends RequestInit {
    _retry?: boolean;
}

/**
 * Wrapper personalizado do fetch para lidar com:
 * 1. Interceptação de respostas 401 (Não Autorizado)
 * 2. Tentativa de refresh token automotática
 * 3. Retry da requisição original
 */
export const apiFetch = async (input: RequestInfo | URL, init?: RequestInitRetry): Promise<Response> => {

    // Configuração inicial
    const config: RequestInitRetry = {
        ...init,
        credentials: 'include',
    };

    // Adicionar token se existir (opcional, dependendo de como o backend espera)
    // Se o backend usa cookie, credentials: 'include' resolve.
    // Se usa Bearer, precisamos adicionar. O código original WEB não adicionava Bearer explicitamente,
    // o que sugere Cookie. Manteremos comportamento da web.

    // Tratamento para URL relativa (caso input seja string e comece com /)
    let url = input;
    if (typeof input === 'string' && input.startsWith('/')) {
        url = `${API_URL}${input}`;
    } else if (typeof input === 'string' && !input.startsWith('http')) {
        // Se não começa com / nem http, assume que é relativo tb? O original usava API_URL concatenado fora.
        // Mas aqui vamos garantir.
    }

    try {
        // Tenta a requisição original
        const response = await fetch(url, config);

        // Se a resposta for 401 e ainda não for uma retentativa
        if (response.status === 401 && !config._retry) {
            config._retry = true;

            try {
                // Tenta renovar o token
                const refreshResponse = await fetch(`${API_URL}/api/Auth/RefreshToken`, {
                    method: 'POST',
                    credentials: 'include',
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });

                if (refreshResponse.ok) {
                    // Se renovou com sucesso, repete a requisição original
                    return await fetch(url, config);
                } else {
                    // Se falhou ao renovar, lança erro para cair no catch abaixo
                    throw new Error('Sessão expirada');
                }
            } catch (refreshError) {
                console.error('Falha na renovação de token:', refreshError);
                // Limpar dados locais
                await AsyncStorage.removeItem('user');

                // Em mobile não podemos fazer window.location.href.
                // O ideal é que o App.tsx ou um Contexto de Auth reaja a mudança no storage ou ao erro.
                return Promise.reject(refreshError);
            }
        }

        return response;
    } catch (error) {
        return Promise.reject(error);
    }
};
