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
};
