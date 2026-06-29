export interface HelpCategory {
    id: number;
    nome: string;
    descricao?: string;
    icone?: string; // Nome do ícone do react-icons (ex: "FaRocket")
}

export interface HelpArticle {
    id: number;
    titulo: string;
    conteudo: string; // Markdown ou HTML salvo
    categoriaId: number;
    tags?: string; // Tags separadas por vírgula
    dataCriacao: string;
    dataAtualizacao?: string;
    isRascunho?: boolean;
}

export interface HelpArticleCreateDTO {
    titulo: string;
    conteudo: string;
    categoriaId: number;
    tags?: string;
}

export interface HelpArticleUpdateDTO extends HelpArticleCreateDTO {
    id: number;
}

export interface HelpVideo {
    id: number;
    titulo: string;
    descricao?: string;
    youtubeUrl: string;
    duracao?: string;
    ordem: number;
    ativo: boolean;
    thumbnailUrl: string;
    dataCriacao: string;
    dataAtualizacao?: string;
}
