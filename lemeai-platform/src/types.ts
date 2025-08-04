// ARQUIVO: src/types.ts

/**
 * Interface para os dados de um Usuário, como visto no frontend.
 */
export interface User {
  id: number | null;
  name: string;
  email: string;
  profileId: number; // Agora usamos o ID do perfil
  status: 'Ativo' | 'Inativo'; // O status pode ser mais complexo vindo da API
}

/**
 * Interface para os dados de um Perfil de Acesso (Tipo de Usuário).
 */
export interface Profile {
  id: number;
  nome: string;
  codigo: string;
}