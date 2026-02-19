import { apiFetch } from './api';

const apiUrl = 'https://api.gbcode.com.br';

// TODO: Import interfaces properly or define them
interface ConversationSummaryResponse {
    // Define properties based on usage
    [key: string]: any;
}

export const ChatService = {
    getConversationSummary: async (conversationId: number): Promise<ConversationSummaryResponse> => {
        try {
            const response = await apiFetch(`${apiUrl}/api/Conversa/Resumo/${conversationId}`, {
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

    enviarMidia: async (conversationId: number, file: any, tipoMidia: string): Promise<any> => {
        try {
            const formData = new FormData();

            // React Native FormData expects an object with uri, name, type
            formData.append('Arquivo', {
                uri: file.uri,
                name: file.name,
                type: file.type || 'application/octet-stream',
            } as any);

            // Append query parameters to the URL
            // URL object might not be fully polyfilled in RN same as Web, but string concat works safely here
            const url = `${apiUrl}/api/Chat/Conversa/${conversationId}/EnviarMidia?TipoMidia=${tipoMidia}`;

            const response = await apiFetch(url, {
                method: 'POST',
                headers: {
                    // Content-Type must NOT be set manually for FormData, fetch does it
                    'Accept': 'application/json',
                },
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
