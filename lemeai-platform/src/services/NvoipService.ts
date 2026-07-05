import { apiFetch } from './api';

const BASE_URL = import.meta.env.VITE_API_URL || '';

export const NvoipService = {
    realizarChamada: async (caller: string, called: string) => {
        try {
            const response = await apiFetch(`${BASE_URL}/api/Ligacao/RealizarChamadaNvoip`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ caller, called })
            });

            const data = await response.json();
            
            if (!response.ok || !data.sucesso) {
                throw new Error(data.mensagem || 'Falha ao realizar chamada');
            }

            return data;
        } catch (error: any) {
            console.error('Erro na chamada Nvoip:', error);
            throw error;
        }
    }
};
