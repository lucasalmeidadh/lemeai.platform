import { apiFetch } from './api';

const API_URL = import.meta.env.VITE_API_URL || '';

export interface ApiResponse<T> {
    sucesso: boolean;
    mensagem: string;
    dados: T;
}

export interface EvolutionStatus {
    isEvolutionAPI: boolean;
}

export interface InstanceStatus {
    state: string;
    // Adicione outros campos conforme o retorno da API
}

export const EvolutionService = {
    /**
     * Verifica se a empresa do usuário logado usa a Evolution API
     */
    checkEvolution: async (): Promise<ApiResponse<EvolutionStatus>> => {
        const response = await apiFetch(`${API_URL}/api/InstanciaEvolution/EmpresaUsaEvolution`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
        });
        
        const data = await response.json();
        if (!response.ok && !data.mensagem) {
            throw new Error('Erro ao verificar status da Evolution API');
        }
        return data;
    },

    /**
     * Cria uma nova instância da Evolution API para a empresa
     */
    criarInstancia: async (): Promise<ApiResponse<any>> => {
        const response = await apiFetch(`${API_URL}/api/InstanciaEvolution/Criar`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
        });
        
        const data = await response.json();
        if (!response.ok && !data.mensagem) {
            throw new Error('Erro ao criar instância');
        }
        return data;
    },

    /**
     * Obtém o QR Code para conexão com o WhatsApp
     */
    getQRCode: async (): Promise<ApiResponse<any>> => {
        const response = await apiFetch(`${API_URL}/api/InstanciaEvolution/QRCode`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
        });
        
        const data = await response.json();
        if (!response.ok && !data.mensagem) {
            throw new Error('Erro ao obter QR Code');
        }
        return data;
    },

    /**
     * Obtém o status da instância (conectada/desconectada)
     */
    getStatus: async (): Promise<ApiResponse<any>> => {
        const response = await apiFetch(`${API_URL}/api/InstanciaEvolution/StatusIntancia`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
        });
        
        const data = await response.json();
        if (!response.ok && !data.mensagem) {
            throw new Error('Erro ao verificar status da instância');
        }
        return data;
    },

    /**
     * Desconecta a instância (logout do WhatsApp)
     */
    logout: async (): Promise<ApiResponse<any>> => {
        const response = await apiFetch(`${API_URL}/api/InstanciaEvolution/Logout`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
        });
        
        const data = await response.json();
        if (!response.ok && !data.mensagem) {
            throw new Error('Erro ao fazer logout');
        }
        return data;
    },

    /**
     * Remove a instância da Evolution API da empresa
     */
    removerInstancia: async (): Promise<ApiResponse<any>> => {
        const response = await apiFetch(`${API_URL}/api/InstanciaEvolution/Remover`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
        });
        
        const data = await response.json();
        if (!response.ok && !data.mensagem) {
            throw new Error('Erro ao remover instância');
        }
        return data;
    },
};
