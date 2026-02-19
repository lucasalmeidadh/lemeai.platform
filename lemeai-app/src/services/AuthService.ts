import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = 'https://api.gbcode.com.br';

export const AuthService = {
    login: async (email, password) => {
        try {
            const response = await fetch(`${API_URL}/api/Auth/Login`, {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password })
            });

            if (!response.ok) {
                if (response.status === 401) {
                    throw new Error('Credenciais inválidas');
                }
                throw new Error('Falha na comunicação com o servidor');
            }

            // Get User Info
            // We use raw fetch here too to ensure we send credentials (cookies) received in previous step
            const userResponse = await fetch(`${API_URL}/api/Auth/Me`, {
                method: 'GET',
                credentials: 'include'
            });

            if (!userResponse.ok) {
                throw new Error('Falha ao obter dados do usuário');
            }

            const userData = await userResponse.json();
            await AsyncStorage.setItem('user', JSON.stringify(userData));

            // If the backend returns a token in the body of Login or Me, we should store it too.
            // But based on the web code, it relies on cookies or the 'user' object having what's needed.
            // If 'user' object has a token property, api.ts might need to be updated to use it.
            // For now, mirroring web behavior.

            return userData;
        } catch (error) {
            console.error('Login error:', error);
            throw error;
        }
    },

    logout: async () => {
        await AsyncStorage.removeItem('user');
    },

    getUser: async () => {
        try {
            const user = await AsyncStorage.getItem('user');
            return user ? JSON.parse(user) : null;
        } catch (e) {
            return null;
        }
    }
};
