import {
  FaLock,
  FaUsers,
  FaTachometerAlt,
  FaComments,
  FaBox,
  FaChartLine,
  FaPlug,
  FaBullhorn,
  FaCalendarAlt,
  FaBuilding,
  FaCreditCard,
  FaKey,
} from 'react-icons/fa';

export const PERMISSION_LABELS: Record<string, string> = {
  gbcode_admin_sistema: 'Administrador do Sistema',
  gestao_vendas: 'Gestão de Vendas - Admin',
  painel_operacional: 'Painel Operacional',
  agenda: 'Agenda',
  chat: 'Chat',
  fluxo_vendas: 'Fluxo de Vendas',
  contatos: 'Contatos',
  marketing_disparador: 'Marketing Disparador',
  marketing_templates: 'Marketing Templates',
  relatorio_vendas: 'Relatórios Vendas',
  relatorio_campanhas: 'Relatório Campanhas',
  gestao_usuarios: 'Gestão de Usuários',
  gestao_perfis: 'Gestão de Perfis',
  gestao_equipes: 'Gestão de Equipes',
  gestao_metas: 'Gestão de Metas',
  regras_chatbot: 'Gestão de Regras',
  gestao_produtos: 'Gestão de Produtos',
  gestao_conexoes: 'Gestão de Conexões',
  dias_funcionamento: 'Dias de Funcionamento',
  gestao_empresas: 'Gestão de Empresas',
  gerenciar_planos: 'Gerenciar Planos',
  gestao_vendas_vendedor: 'Gestão de Vendas - Vendedor',
  gestão_campos_personalizados: 'Campos Personalizados',
  gestao_tipos_usuario: 'Gestão de Tipos de Usuário',
};

export const getPermissionIcon = (name: string) => {
  const lowerName = name.toLowerCase();
  if (lowerName.includes('painel') || lowerName.includes('dashboard')) return <FaTachometerAlt />;
  if (lowerName.includes('chat') || lowerName.includes('conversa')) return <FaComments />;
  if (lowerName.includes('usuario') || lowerName.includes('user')) return <FaUsers />;
  if (lowerName.includes('produto') || lowerName.includes('product')) return <FaBox />;
  if (lowerName.includes('permiss') || lowerName.includes('acesso')) return <FaLock />;
  if (lowerName.includes('relatorio') || lowerName.includes('report') || lowerName.includes('analytics')) return <FaChartLine />;
  if (lowerName.includes('conex') || lowerName.includes('connection')) return <FaPlug />;
  if (lowerName.includes('campanha') || lowerName.includes('marketing')) return <FaBullhorn />;
  if (lowerName.includes('agenda') || lowerName.includes('calendario') || lowerName.includes('dia')) return <FaCalendarAlt />;
  if (lowerName.includes('empresa') || lowerName.includes('filial')) return <FaBuilding />;
  if (lowerName.includes('plano') || lowerName.includes('pagamento') || lowerName.includes('fatura')) return <FaCreditCard />;
  return <FaKey />;
};
