import { apiFetch } from './api';

const API_URL = 'https://api.gbcode.com.br';

export const ChatService = {
    getConversationSummary: async (conversationId: number): Promise<any> => {
        try {
            const response = await apiFetch(`${API_URL}/api/Conversa/Resumo/${conversationId}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                throw new Error(`Erro ao buscar resumo: ${response.statusText}`);
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Erro no ChatService.getConversationSummary:', error);
            throw error;
        }
    },

    enviarMidia: async (conversationId: number, fileUri: string, fileName: string, mimeType: string, tipoMidia: string): Promise<any> => {
        try {
            const formData = new FormData();

            // In React Native, fetch with FormData and file looks like this
            formData.append('Arquivo', {
                uri: fileUri,
                name: fileName,
                type: mimeType
            } as any);

            const url = new URL(`${API_URL}/api/Chat/Conversa/${conversationId}/EnviarMidia`);
            url.searchParams.append('TipoMidia', tipoMidia);

            const response = await apiFetch(url.toString(), {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                let errorMessage = `Erro ao enviar mídia: ${response.statusText}`;
                try {
                    const errorData = await response.json();
                    if (errorData?.mensagem) {
                        errorMessage = errorData.mensagem;
                    }
                } catch (e) {
                    // Ignore parsing error
                }
                throw new Error(errorMessage);
            }

            return true;
        } catch (error) {
            console.error('Erro no ChatService.enviarMidia:', error);
            throw error;
        }
    },
};
