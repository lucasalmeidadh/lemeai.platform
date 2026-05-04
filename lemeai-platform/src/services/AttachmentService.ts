import { apiFetch } from './api';
import type { ContatoAnexoResponseDTO, GenericResponseDTO, TipoAnexo } from '../types/Attachment';

const API_URL = import.meta.env.VITE_API_URL;

export const AttachmentService = {
    /**
     * Adiciona um anexo a um contato através de uma conversa.
     */
    addAttachmentByConversation: async (idConversa: number, file: File, tipoAnexo: TipoAnexo): Promise<GenericResponseDTO<{ id: number; caminho: string }>> => {
        const formData = new FormData();
        formData.append('Arquivo', file);
        formData.append('TipoAnexo', tipoAnexo);

        const response = await apiFetch(`${API_URL}/api/Chat/Conversas/${idConversa}/AdicionarAnexoContato`, {
            method: 'POST',
            body: formData,
        });

        if (!response.ok) {
            let errorMessage = 'Erro ao adicionar anexo via conversa';
            try {
                const errorData = await response.json();
                errorMessage = errorData.mensagem || errorMessage;
            } catch (e) {}
            throw new Error(errorMessage);
        }

        return response.json();
    },

    /**
     * Adiciona um anexo diretamente a um contato (sem precisar de conversa).
     */
    addAttachmentByContact: async (contatoId: number, file: File, tipoAnexo: TipoAnexo): Promise<GenericResponseDTO<ContatoAnexoResponseDTO>> => {
        const formData = new FormData();
        formData.append('Arquivo', file);
        formData.append('TipoAnexo', tipoAnexo);

        const response = await apiFetch(`${API_URL}/api/Contato/${contatoId}/Anexos/Adicionar`, {
            method: 'POST',
            body: formData,
        });

        if (!response.ok) {
            let errorMessage = 'Erro ao adicionar anexo ao contato';
            try {
                const errorData = await response.json();
                errorMessage = errorData.mensagem || errorMessage;
            } catch (e) {}
            throw new Error(errorMessage);
        }

        return response.json();
    },

    /**
     * Lista anexos por conversa (retorna todos os anexos do contato daquela conversa).
     */
    getAttachmentsByConversation: async (idConversa: number): Promise<ContatoAnexoResponseDTO[]> => {
        const response = await apiFetch(`${API_URL}/api/Chat/Conversas/${idConversa}/AnexosContato`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            if (response.status === 404 || response.status === 400) return [];
            throw new Error('Erro ao buscar anexos');
        }

        const result: GenericResponseDTO<ContatoAnexoResponseDTO[]> = await response.json();
        return result.dados || [];
    },

    /**
     * Lista anexos por contato.
     */
    getAttachmentsByContact: async (contatoId: number): Promise<ContatoAnexoResponseDTO[]> => {
        const response = await apiFetch(`${API_URL}/api/Contato/${contatoId}/Anexos`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            if (response.status === 404 || response.status === 400) return [];
            throw new Error('Erro ao buscar anexos');
        }

        const result: GenericResponseDTO<ContatoAnexoResponseDTO[]> = await response.json();
        return result.dados || [];
    },

    /**
     * Obtém a URL do arquivo bruto. 
     * Tenta primeiro via endpoint de contato, depois via chat (fallback).
     */
    getAttachmentFileUrl: async (idAnexo: number): Promise<string> => {
        // Tenta o endpoint direto de contato primeiro (conforme contato-documentos.md)
        let response = await apiFetch(`${API_URL}/api/Contato/Anexos/${idAnexo}/Arquivo`, {
            method: 'GET',
        });

        // Se falhar (ex: 404), tenta o endpoint de chat (fallback para compatibilidade)
        if (!response.ok) {
            response = await apiFetch(`${API_URL}/api/Chat/Anexos/${idAnexo}/Arquivo`, {
                method: 'GET',
            });
        }

        if (!response.ok) {
            throw new Error('Erro ao obter arquivo');
        }

        const blob = await response.blob();
        return URL.createObjectURL(blob);
    },

    /**
     * Remove um anexo.
     */
    removeAttachment: async (idAnexo: number): Promise<void> => {
        // Tenta remover via endpoint de contato
        let response = await apiFetch(`${API_URL}/api/Contato/Anexos/${idAnexo}/Remover`, {
            method: 'DELETE',
        });

        // Fallback para chat se necessário
        if (!response.ok) {
            response = await apiFetch(`${API_URL}/api/Chat/Anexos/${idAnexo}/Remover`, {
                method: 'DELETE',
            });
        }

        if (!response.ok) {
            throw new Error('Erro ao remover anexo');
        }
    }
};
