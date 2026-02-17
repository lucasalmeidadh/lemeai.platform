const API_URL = import.meta.env.VITE_API_URL || '';

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
    // Garante que credentials: 'include' esteja presente para enviar cookies
    const config: RequestInitRetry = {
        ...init,
        credentials: 'include',
    };

    try {
        // Tenta a requisição original
        const response = await fetch(input, config);

        // Se a resposta for 401 e ainda não for uma retentativa
        if (response.status === 401 && !config._retry) {
            config._retry = true;

            try {
                // Tenta renovar o token
                // Assumindo endpoint padrão. Ajuste conforme necessário.
                const refreshResponse = await fetch(`${API_URL}/api/Auth/RefreshToken`, {
                    method: 'POST',
                    credentials: 'include',
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });

                if (refreshResponse.ok) {
                    // Se renovou com sucesso, repete a requisição original
                    return await fetch(input, config);
                } else {
                    // Se falhou ao renovar, lança erro para cair no catch abaixo
                    throw new Error('Sessão expirada');
                }
            } catch (refreshError) {
                console.error('Falha na renovação de token:', refreshError);
                // Opcional: Limpar dados locais se necessário
                localStorage.removeItem('user');

                // Redireciona para login
                window.location.href = '/login';
                return Promise.reject(refreshError);
            }
        }

        return response;
    } catch (error) {
        return Promise.reject(error);
    }
};
