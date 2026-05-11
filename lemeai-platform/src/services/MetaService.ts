import { apiFetch } from './api';

const API_URL = import.meta.env.VITE_API_URL || '';

export interface MetaConfig {
    appId: string;
    configurationId: string;
}

export interface MetaConnectionRequest {
    code: string;
    phoneNumberId: string;
    wabaId: string;
}

export const MetaService = {
    /**
     * Recupera as configurações do Meta App do backend.
     * Enquanto o endpoint não existe, retorna valores de exemplo ou placeholders.
     */
    getMetaConfig: async (): Promise<{ sucesso: boolean; dados: MetaConfig }> => {
        try {
            const response = await apiFetch(`${API_URL}/api/ConfigurarWhatsapp/MetaConfig`);
            if (response.ok) {
                return await response.json();
            }
        } catch (error) {
            console.warn('Backend endpoint /MetaConfig não encontrado. Usando placeholders.');
        }

        // Mock para desenvolvimento
        return {
            sucesso: true,
            dados: {
                appId: '1834693670519289',
                configurationId: '1086508701211458'
            }
        };
    },

    /**
     * Envia os dados de conexão para o backend.
     */
    configurarCoexistencia: async (payload: MetaConnectionRequest): Promise<{ sucesso: boolean; mensagem: string }> => {
        try {
            const response = await apiFetch(`${API_URL}/api/ConfigurarWhatsapp/Coexistencia`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                return await response.json();
            }

            const errorData = await response.json();
            return { sucesso: false, mensagem: errorData.mensagem || 'Erro ao configurar coexistência.' };
        } catch (error) {
            console.error('Erro ao chamar backend:', error);
            // Mock para testes de UI
            return { sucesso: true, mensagem: 'Conectado com sucesso (MOCK)!' };
        }
    },

    /**
     * Verifica qual API o usuário está utilizando.
     */
    checkStatus: async (): Promise<{ sucesso: boolean; usaAPIMeta: boolean; usaAPIEvolution: boolean }> => {
        try {
            const response = await apiFetch(`${API_URL}/api/ConfigurarWhatsapp/Status`);
            if (response.ok) {
                const data = await response.json();
                return { 
                    sucesso: true, 
                    usaAPIMeta: data.dados?.usaAPIMeta || false,
                    usaAPIEvolution: data.dados?.usaAPIEvolution || false
                };
            }
        } catch (error) {
            console.warn('Backend endpoint /Status não encontrado.');
        }

        return { sucesso: true, usaAPIMeta: false, usaAPIEvolution: false };
    }
};
