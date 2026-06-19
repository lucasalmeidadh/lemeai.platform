export const ROUTE_PERMISSIONS: Record<string, string[]> = {
  '/monitoramento': ['gestao_vendas', 'gestao_vendas_vendedor'],
  '/dashboard': ['painel_operacional'],
  '/agenda': ['agenda'],
  '/chat': ['chat'],
  '/pipeline': ['fluxo_vendas'],
  '/contacts': ['contatos'],
  '/campanhas': ['marketing_disparador'],
  '/campaign-templates': ['marketing_templates'],
  '/relatorios/vendas': ['relatorio_vendas'],
  '/relatorios/campanhas': ['relatorio_campanhas'],
  '/users': ['gestao_usuarios'],
  '/profiles': ['gestao_perfis'],
  '/equipes': ['gestao_equipes'],
  '/metas': ['gestao_metas'],
  '/chat-rules': ['regras_chatbot'],
  '/products': ['gestao_produtos'],
  '/connections': ['gestao_conexoes'],
  '/dias-uteis': ['dias_funcionamento'],
  '/empresas': ['gestao_empresas'],
  '/gerenciar-planos': ['gerenciar_planos'],
};

export const PUBLIC_ROUTES = [
  '/primeiros-passos',
  '/help',
  '/novidades',
  '/plano',
];

export function hasPermission(userPermissions: string[], required: string[]): boolean {
  return required.some(p => userPermissions.includes(p));
}

export function getUserPermissions(): string[] {
  try {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    return user?.permissoes ?? [];
  } catch {
    return [];
  }
}

export function canAccessRoute(path: string, userPermissions: string[]): boolean {
  if (PUBLIC_ROUTES.some(r => path.startsWith(r))) return true;
  const required = ROUTE_PERMISSIONS[path];
  if (!required) return true;
  return hasPermission(userPermissions, required);
}

export function getFirstAccessibleRoute(userPermissions: string[]): string {
  const orderedRoutes = [
    '/monitoramento',
    '/dashboard',
    '/chat',
    '/pipeline',
    '/contacts',
    '/agenda',
    '/campanhas',
    '/users',
    '/primeiros-passos',
  ];
  for (const route of orderedRoutes) {
    if (canAccessRoute(route, userPermissions)) return route;
  }
  return '/primeiros-passos';
}
