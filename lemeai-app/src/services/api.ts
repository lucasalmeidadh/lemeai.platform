import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = 'https://api.gbcode.com.br';

interface RequestInitRetry extends RequestInit {
    _retry?: boolean;
}

export const apiFetch = async (input: RequestInfo | URL, init?: RequestInitRetry): Promise<Response> => {

    // In React Native we don't have natural cookies working the same way as web
    // But since the web implementation uses credentials: 'include', we'll try to emulate that
    // or rely on headers if the backend sends a token. For now, we will add credentials if possible,
    // though fetch in RN might handle cookies differently.
    const config: RequestInitRetry = {
        ...init,
        credentials: 'omit', // We change from 'include' to 'omit' or handle token manually if necessary. Let's keep 'include' first to see if cookies are managed. Actually, best is 'include' to match web.
    };
    config.credentials = 'include';

    try {
        const response = await fetch(input, config);

        if (response.status === 401 && !config._retry) {
            config._retry = true;

            try {
                const refreshResponse = await fetch(`${API_URL}/api/Auth/RefreshToken`, {
                    method: 'POST',
                    credentials: 'include',
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });

                if (refreshResponse.ok) {
                    return await fetch(input, config);
                } else {
                    throw new Error('Sessão expirada');
                }
            } catch (refreshError) {
                console.error('Falha na renovação de token:', refreshError);
                await AsyncStorage.removeItem('user');
                // Could emit an event here to trigger logout
                return Promise.reject(refreshError);
            }
        }

        return response;
    } catch (error) {
        return Promise.reject(error);
    }
};
