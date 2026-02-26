import { apiFetch } from './api';

const apiUrl = import.meta.env.VITE_API_URL;

// ... (interfaces)

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

    enviarMidia: async (conversationId: number, file: File, tipoMidia: string): Promise<any> => {
        try {
            const formData = new FormData();
            formData.append('Arquivo', file);

            // Append query parameters to the URL
            const url = new URL(`${apiUrl}/api/Chat/Conversa/${conversationId}/EnviarMidia`);
            url.searchParams.append('TipoMidia', tipoMidia);

            const response = await apiFetch(url.toString(), {
                method: 'POST',
                // Content-Type is automatically set by browser for FormData with boundary
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

            // Return response if needed, or just void
            return true;
        } catch (error) {
            console.error('Erro no ChatService.enviarMidia:', error);
            throw error;
        }
    },

    atualizarTipoLead: async (idConversa: number, tipoLeadId: number): Promise<any> => {
        try {
            const body = { tipoLeadId };
            const response = await apiFetch(`${apiUrl}/api/Chat/Conversa/${idConversa}/TipoLead`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(body),
            });

            if (!response.ok) {
                let errorMessage = `Erro ao atualizar tipo de lead: ${response.statusText}`;
                try {
                    const errorData = await response.json();
                    if (errorData?.mensagem) {
                        errorMessage = errorData.mensagem;
                    }
                } catch (e) {
                    // Ignore
                }
                throw new Error(errorMessage);
            }

            return true;
        } catch (error) {
            console.error('Erro no ChatService.atualizarTipoLead:', error);
            throw error;
        }
    },
};
