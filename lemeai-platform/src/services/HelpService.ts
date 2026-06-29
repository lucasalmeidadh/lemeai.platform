import { apiFetch } from './api';
import type { HelpArticle, HelpArticleCreateDTO, HelpArticleUpdateDTO, HelpCategory, HelpVideo } from '../types/Help';
import type { GenericResponseDTO } from '../types/Attachment'; // Reuse generic response type

const API_URL = import.meta.env.VITE_API_URL;

export const HelpService = {
    /**
     * Lista todas as categorias de ajuda.
     */
    getCategories: async (): Promise<HelpCategory[]> => {
        try {
            const response = await apiFetch(`${API_URL}/api/Help/Categorias`, {
                method: 'GET',
            });
            if (!response.ok) return [];
            const data: GenericResponseDTO<HelpCategory[]> = await response.json();
            
            return data.dados || [];
        } catch (error) {
            console.error('Erro ao buscar categorias:', error);
            return [];
        }
    },

    /**
     * Cria uma nova categoria de ajuda (Apenas Admin).
     */
    createCategory: async (data: { nome: string; descricao: string; icone?: string }): Promise<HelpCategory> => {
        const response = await apiFetch(`${API_URL}/api/Help/Categorias`, {
            method: 'POST',
            body: JSON.stringify(data),
            headers: { 'Content-Type': 'application/json' }
        });
        
        if (!response.ok) {
            throw new Error('Erro ao criar categoria');
        }
        const result: GenericResponseDTO<HelpCategory> = await response.json();
        return result.dados!;
    },

    /**
     * Lista todos os artigos de ajuda, opcionalmente filtrando por busca ou categoria.
     */
    getArticles: async (searchTerm?: string, categoryId?: number): Promise<HelpArticle[]> => {
        try {
            let url = `${API_URL}/api/Help/Artigos`;
            const params = new URLSearchParams();
            if (searchTerm) params.append('q', searchTerm);
            if (categoryId) params.append('categoriaId', categoryId.toString());
            
            if (params.toString()) {
                url += `?${params.toString()}`;
            }

            const response = await apiFetch(url, { method: 'GET' });
            if (!response.ok) return [];
            const data: GenericResponseDTO<HelpArticle[]> = await response.json();
            return data.dados || [];
        } catch (error) {
            console.error('Erro ao buscar artigos:', error);
            return [];
        }
    },

    /**
     * Busca um artigo específico pelo ID.
     */
    getArticleById: async (id: number): Promise<HelpArticle | null> => {
        try {
            const response = await apiFetch(`${API_URL}/api/Help/Artigos/${id}`, {
                method: 'GET',
            });
            if (!response.ok) return null;
            const data: GenericResponseDTO<HelpArticle> = await response.json();
            return data.dados || null;
        } catch (error) {
            console.error('Erro ao buscar artigo:', error);
            return null;
        }
    },

    /**
     * Cria um novo artigo (Apenas Admin).
     */
    createArticle: async (data: HelpArticleCreateDTO): Promise<HelpArticle> => {
        const response = await apiFetch(`${API_URL}/api/Help/Artigos`, {
            method: 'POST',
            body: JSON.stringify(data),
            headers: { 'Content-Type': 'application/json' }
        });
        
        if (!response.ok) {
            throw new Error('Erro ao criar artigo de ajuda');
        }
        const result: GenericResponseDTO<HelpArticle> = await response.json();
        return result.dados!;
    },

    /**
     * Atualiza um artigo existente (Apenas Admin).
     */
    updateArticle: async (data: HelpArticleUpdateDTO): Promise<HelpArticle> => {
        const response = await apiFetch(`${API_URL}/api/Help/Artigos/${data.id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
            headers: { 'Content-Type': 'application/json' }
        });
        
        if (!response.ok) {
            throw new Error('Erro ao atualizar artigo de ajuda');
        }
        const result: GenericResponseDTO<HelpArticle> = await response.json();
        return result.dados!;
    },

    /**
     * Exclui um artigo (Apenas Admin).
     */
    deleteArticle: async (id: number): Promise<void> => {
        const response = await apiFetch(`${API_URL}/api/Help/Artigos/${id}`, {
            method: 'DELETE',
        });
        
        if (!response.ok) {
            throw new Error('Erro ao deletar artigo');
        }
    },

    /**
     * Faz upload de uma imagem para ser usada no corpo de um artigo.
     * Retorna a URL da imagem upada (ex: para inserir no markdown).
     * Utiliza o padrão FormData para ser compatível com a forma como arquivos são salvos na LemeAI.
     */
    getVideos: async (apenasAtivos: boolean = false): Promise<HelpVideo[]> => {
        try {
            const url = `${API_URL}/api/Help/Videos${apenasAtivos ? '?apenasAtivos=true' : ''}`;
            const response = await apiFetch(url, { method: 'GET' });
            if (!response.ok) return [];
            const data: GenericResponseDTO<HelpVideo[]> = await response.json();
            return data.dados || [];
        } catch (error) {
            console.error('Erro ao buscar vídeos:', error);
            return [];
        }
    },

    createVideo: async (data: Omit<HelpVideo, 'id' | 'thumbnailUrl' | 'dataCriacao' | 'dataAtualizacao'>): Promise<HelpVideo> => {
        const response = await apiFetch(`${API_URL}/api/Help/Videos`, {
            method: 'POST',
            body: JSON.stringify(data),
            headers: { 'Content-Type': 'application/json' }
        });
        if (!response.ok) throw new Error('Erro ao criar vídeo');
        const result: GenericResponseDTO<HelpVideo> = await response.json();
        return result.dados!;
    },

    updateVideo: async (id: number, data: Omit<HelpVideo, 'id' | 'thumbnailUrl' | 'dataCriacao' | 'dataAtualizacao'>): Promise<void> => {
        const response = await apiFetch(`${API_URL}/api/Help/Videos/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
            headers: { 'Content-Type': 'application/json' }
        });
        if (!response.ok) throw new Error('Erro ao atualizar vídeo');
    },

    deleteVideo: async (id: number): Promise<void> => {
        const response = await apiFetch(`${API_URL}/api/Help/Videos/${id}`, {
            method: 'DELETE',
        });
        if (!response.ok) throw new Error('Erro ao deletar vídeo');
    },

    uploadImage: async (file: File): Promise<string> => {
        const formData = new FormData();
        formData.append('Arquivo', file);
        formData.append('Tipo', 'HelpImage'); // Tipo customizado se necessário

        const response = await apiFetch(`${API_URL}/api/Help/UploadImagem`, {
            method: 'POST',
            body: formData,
            // Content-Type é gerado automaticamente pelo browser para FormData
        });

        if (!response.ok) {
            let errorMessage = 'Erro ao fazer upload da imagem';
            try {
                const errorData = await response.json();
                errorMessage = errorData.mensagem || errorMessage;
            } catch (e) {}
            throw new Error(errorMessage);
        }

        const result = await response.json();
        // Espera-se que o backend retorne { sucesso: true, dados: { url: 'https://...' } }
        return result.dados?.url || '';
    }
};
