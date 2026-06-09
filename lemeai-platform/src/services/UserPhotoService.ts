import { apiFetch } from './api';

const API_URL = import.meta.env.VITE_API_URL;

interface ApiResponse<T> {
    sucesso: boolean;
    mensagem: string;
    dados: T;
}

export const UserPhotoService = {
    upload: async (arquivo: File): Promise<ApiResponse<{ photoUrl: string }>> => {
        const formData = new FormData();
        formData.append('foto', arquivo);

        const response = await apiFetch(`${API_URL}/api/usuario/FotoPerfil`, {
            method: 'PUT',
            body: formData,
        });

        if (!response.ok) {
            const err = await response.json().catch(() => ({ mensagem: 'Erro ao fazer upload da foto.' }));
            throw new Error(err.mensagem || 'Erro ao fazer upload da foto.');
        }

        return response.json();
    },

    remover: async (): Promise<ApiResponse<null>> => {
        const response = await apiFetch(`${API_URL}/api/usuario/FotoPerfil`, {
            method: 'DELETE',
        });

        if (!response.ok) {
            const err = await response.json().catch(() => ({ mensagem: 'Erro ao remover a foto.' }));
            throw new Error(err.mensagem || 'Erro ao remover a foto.');
        }

        return response.json();
    },
};
