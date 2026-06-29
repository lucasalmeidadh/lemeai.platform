import toast from 'react-hot-toast';

const API_URL = import.meta.env.VITE_API_URL || '';

/**
 * Interface estendida para incluir propriedade de controle de retry
 */
interface RequestInitRetry extends RequestInit {
    _retry?: boolean;
}

// Endpoints que precisam continuar funcionando mesmo com assinatura vencida
// (o usuário precisa conseguir renovar o plano)
const SUBSCRIPTION_ENDPOINT_PATTERNS = ['/api/assinatura', '/api/auth'];

const isSubscriptionExemptEndpoint = (input: RequestInfo | URL): boolean => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
    return SUBSCRIPTION_ENDPOINT_PATTERNS.some(pattern => url.includes(pattern));
};

const isMutatingRequest = (init?: RequestInitRetry): boolean => {
    const method = (init?.method || 'GET').toUpperCase();
    return ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method);
};

const isAssinaturaVencida = (): boolean => {
    try {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        return user?.assinaturaVencida === true;
    } catch {
        return false;
    }
};

// Disparado para que o MainLayout abra a modal de assinatura vencida de qualquer lugar do app
export const ASSINATURA_VENCIDA_EVENT = 'lemeia:assinatura-vencida-bloqueio';

/**
 * Wrapper personalizado do fetch para lidar com:
 * 1. Interceptação de respostas 401 (Não Autorizado)
 * 2. Tentativa de refresh token automotática
 * 3. Retry da requisição original
 * 4. Bloqueio de ações de criação/edição quando a assinatura está vencida
 */
export const apiFetch = async (input: RequestInfo | URL, init?: RequestInitRetry): Promise<Response> => {
    if (isMutatingRequest(init) && !isSubscriptionExemptEndpoint(input) && isAssinaturaVencida()) {
        window.dispatchEvent(new CustomEvent(ASSINATURA_VENCIDA_EVENT));
        // Limpa qualquer toast genérico de erro que a página de origem dispare
        // ao capturar a rejeição abaixo, já que o aviso real é mostrado na modal.
        setTimeout(() => toast.dismiss(), 50);
        return Promise.reject(new Error('Assinatura vencida'));
    }

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
                const refreshResponse = await fetch(`${API_URL}/api/Auth/refresh-token`, {
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
