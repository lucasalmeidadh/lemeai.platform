export interface Novidade {
  id: number;
  title: string;
  summary: string;
  description: string;
  date: string; // formato DD/MM/AAAA
  category: 'recurso' | 'melhoria' | 'correcao';
}

export const novidadesData: Novidade[] = [
  {
    id: 1,
    title: 'Gestão de Comissões e Relatórios Avançados',
    summary: 'Novo módulo completo para calcular comissões de vendedores e exportar relatórios customizados.',
    description: 'Agora você pode configurar regras personalizadas de comissão por produto, vendedor ou equipe. O novo painel de gestão operacional consolida todas as vendas do período e calcula automaticamente as taxas correspondentes, permitindo exportações rápidas em arquivos CSV e PDF para facilitar o fechamento de folha.',
    date: '07/06/2026',
    category: 'recurso'
  },
  {
    id: 2,
    title: 'Melhorias de Performance no Chat em Tempo Real',
    summary: 'Otimização na renderização das mensagens e conexão de canais mais estável via WebSocket.',
    description: 'Focamos em melhorar a velocidade de carregamento de conversas longas e otimizar a conexão de múltiplos canais de atendimento. A redução do uso de memória no navegador garante uma navegação muito mais fluida mesmo com centenas de chats simultâneos abertos.',
    date: '04/06/2026',
    category: 'melhoria'
  },
  {
    id: 3,
    title: 'Correção no Agendamento de Tarefas e Fuso Horário',
    summary: 'Corrigido bug que alterava a data de agendamentos dependendo da configuração local da máquina.',
    description: 'Detectamos que alguns agendamentos na agenda integrada sofriam um deslocamento de fuso horário em determinadas localidades. Corrigimos o tratamento de datas UTC para garantir que os compromissos permaneçam nos horários estritamente marcados.',
    date: '01/06/2026',
    category: 'correcao'
  },
  {
    id: 4,
    title: 'Customização de Templates de Campanhas de Marketing',
    summary: 'Editor visual atualizado para permitir formatação rica e inclusão de variáveis dinâmicas.',
    description: 'O disparador de campanhas agora permite maior personalização das mensagens enviadas. Você pode incluir variáveis personalizadas do contato (como primeiro nome, empresa, produto de interesse) no assunto e corpo da mensagem utilizando tags simples, aumentando a taxa de conversão das campanhas.',
    date: '25/05/2026',
    category: 'recurso'
  },
  {
    id: 5,
    title: 'Integração de Filtros Rápidos no Fluxo de Vendas',
    summary: 'Filtre negociações por responsável, valor mínimo e data de criação diretamente no funil.',
    description: 'Adicionamos uma barra de filtros dinâmicos no topo do pipeline de vendas. Ficou muito mais prático visualizar apenas os cards de determinado vendedor ou focar em negociações acima de um determinado valor em aberto.',
    date: '18/05/2026',
    category: 'melhoria'
  }
];
