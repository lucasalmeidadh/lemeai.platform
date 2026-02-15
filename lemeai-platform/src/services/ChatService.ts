const apiUrl = import.meta.env.VITE_API_URL;

export interface ConversationSummaryResponse {
    sucesso: boolean;
    mensagem: string;
    dados: string;
}

export const ChatService = {
    getConversationSummary: async (conversationId: number): Promise<ConversationSummaryResponse> => {
        try {
            const response = await fetch(`${apiUrl}/api/Conversa/Resumo/${conversationId}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
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

            const response = await fetch(url.toString(), {
                method: 'POST',
                // Content-Type is automatically set by browser for FormData with boundary
                credentials: 'include',
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
};
