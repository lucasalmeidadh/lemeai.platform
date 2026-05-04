export type TipoAnexo = 'image' | 'audio' | 'video' | 'document' | 'documento' | 'outros';

export interface ContatoAnexoResponseDTO {
    id: number;
    conversaId: number;
    caminhoAnexo: string;
    tipoAnexo: TipoAnexo;
}

export interface GenericResponseDTO<T> {
    sucesso: boolean;
    mensagem: string;
    dados: T;
}
