import { apiFetch } from './api';
import type { Detail, AddDetailPayload } from '../types/Details';

const API_URL = 'https://api.gbcode.com.br';

export const DetailsService = {
    getDetailsByConversationId: async (conversationId: number): Promise<Detail[]> => {
        const response = await apiFetch(`${API_URL}/api/Detalhes/PorConversa/${conversationId}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            throw new Error(`Error fetching details: ${response.statusText}`);
        }

        const result = await response.json();
        if (result.sucesso) {
            return result.dados;
        } else {
            throw new Error(result.mensagem || 'Failed to fetch details.');
        }
    },

    addDetail: async (payload: AddDetailPayload): Promise<void> => {
        const response = await apiFetch(`${API_URL}/api/Detalhes/Adicionar`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            throw new Error(`Error adding detail: ${response.statusText}`);
        }

        const result = await response.json();
        if (!result.sucesso && result.mensagem) {
            throw new Error(result.mensagem);
        }
    }
};
