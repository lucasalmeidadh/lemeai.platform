import { apiFetch } from './api';

const API_URL = import.meta.env.VITE_API_URL || '';

export interface InstagramAccount {
    paginaId: string;
    paginaNome: string;
    instagramPageId?: string;
    instagramUsername?: string;
    webhooksAtivos: boolean;
}

export interface InstagramStatusResponse {
    sucesso: boolean;
    mensagem?: string;
    dados: {
        conectado: boolean;
        contas: InstagramAccount[];
    };
}

export const InstagramService = {
    /**
     * Envia o token de curta duração para o backend trocar por um de longa duração
     * e realizar a subscrição dos webhooks.
     */
    conectar: async (tokenCurtaDuracao: string): Promise<{ sucesso: boolean; mensagem?: string; dados?: InstagramAccount[] }> => {
        try {
            const response = await apiFetch(`${API_URL}/api/instagram/conectar`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ tokenCurtaDuracao })
            });

            if (response.ok) {
                return await response.json();
            }

            const errorData = await response.json();
            return { sucesso: false, mensagem: errorData.mensagem || 'Erro ao conectar Instagram.' };
        } catch (error) {
            console.error('Erro ao conectar Instagram:', error);
            return { sucesso: false, mensagem: 'Erro de conexão com o servidor.' };
        }
    },

    /**
     * Recupera o status atual da conexão com o Instagram.
     */
    getStatus: async (): Promise<InstagramStatusResponse> => {
        try {
            const response = await apiFetch(`${API_URL}/api/instagram/status`);
            if (response.ok) {
                return await response.json();
            }
        } catch (error) {
            console.error('Erro ao obter status do Instagram:', error);
        }

        return {
            sucesso: false,
            dados: { conectado: false, contas: [] }
        };
    },

    /**
     * Desconecta uma página/conta específica.
     */
    desconectar: async (paginaId: string): Promise<{ sucesso: boolean; mensagem?: string }> => {
        try {
            const response = await apiFetch(`${API_URL}/api/instagram/desconectar/${paginaId}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                return await response.json();
            }

            const errorData = await response.json();
            return { sucesso: false, mensagem: errorData.mensagem || 'Erro ao desconectar.' };
        } catch (error) {
            console.error('Erro ao desconectar Instagram:', error);
            return { sucesso: false, mensagem: 'Erro de conexão com o servidor.' };
        }
    }
};
