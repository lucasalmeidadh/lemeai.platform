export interface CommissionRule {
  id: number;
  nome: string;
  tipoComissao: 'percentual' | 'fixo' | 'escalonado';
  valorPercentual?: number;
  valorFixo?: number;
  faixasEscalonadas?: Array<{
    percentualMetaMinimo: number;
    percentualMetaMaximo: number;
    valorAplicado: number;
    tipoValor: 'percentual' | 'fixo';
  }>;
  produtoId?: number;
  produtoNome?: string;
  usuarioId?: number;
  usuarioNome?: string;
  ativo: boolean;
  criadoEm: string;
}

export interface CommissionStatement {
  id: number;
  vendaId: number;
  vendedorId: number;
  vendedorNome: string;
  valorVenda: number;
  dataVenda: string;
  descricaoVenda: string;
  regraAplicadaId: number;
  regraAplicadaNome: string;
  valorCalculado: number;
  status: 'pendente' | 'em_revisao' | 'aprovado' | 'rejeitado' | 'pago';
  motivoRevisao?: string;
  relatorioPagamentoId?: number;
  dataCalculo: string;
  atualizadoEm: string;
}

export interface CommissionPaymentReport {
  id: number;
  vendedorId: number;
  vendedorNome: string;
  periodo: string; // YYYY-MM
  quantidadeVendas: number;
  valorTotalVendas: number;
  valorTotalComissao: number;
  status: 'pendente_aprovacao' | 'pronto_para_pagamento' | 'pago';
  comprovanteUrl?: string;
  pagoEm?: string;
  pagoPorNome?: string;
}

const STORAGE_KEYS = {
  RULES: 'lemeai_commission_rules',
  STATEMENTS: 'lemeai_commission_statements',
  PAYMENTS: 'lemeai_commission_payments',
};

// Dados mock iniciais padrão
const DEFAULT_RULES: CommissionRule[] = [
  {
    id: 1,
    nome: 'Regra Geral de Vendas (5%)',
    tipoComissao: 'percentual',
    valorPercentual: 5,
    ativo: true,
    criadoEm: new Date(2026, 4, 1).toISOString(),
  },
  {
    id: 2,
    nome: 'Comissão Fixa - Plano Premium',
    tipoComissao: 'fixo',
    valorFixo: 250,
    produtoId: 1,
    produtoNome: 'Plano Premium',
    ativo: true,
    criadoEm: new Date(2026, 4, 2).toISOString(),
  },
  {
    id: 3,
    nome: 'Bônus Escalonado por Metas',
    tipoComissao: 'escalonado',
    faixasEscalonadas: [
      { percentualMetaMinimo: 0, percentualMetaMaximo: 79, valorAplicado: 2, tipoValor: 'percentual' },
      { percentualMetaMinimo: 80, percentualMetaMaximo: 99, valorAplicado: 4, tipoValor: 'percentual' },
      { percentualMetaMinimo: 100, percentualMetaMaximo: 999, valorAplicado: 6, tipoValor: 'percentual' },
    ],
    ativo: true,
    criadoEm: new Date(2026, 4, 3).toISOString(),
  }
];

const getInitialStatements = (): CommissionStatement[] => {
  const now = new Date();
  const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  
  return [
    {
      id: 101,
      vendaId: 501,
      vendedorId: 5,
      vendedorNome: 'Ana Lima',
      valorVenda: 12000,
      dataVenda: `${currentMonthStr}-02T14:30:00Z`,
      descricaoVenda: 'Cliente TechCorp - Plano Premium',
      regraAplicadaId: 2,
      regraAplicadaNome: 'Comissão Fixa - Plano Premium',
      valorCalculado: 250,
      status: 'aprovado',
      dataCalculo: `${currentMonthStr}-02T14:35:00Z`,
      atualizadoEm: `${currentMonthStr}-02T18:00:00Z`,
    },
    {
      id: 102,
      vendaId: 502,
      vendedorId: 5,
      vendedorNome: 'Ana Lima',
      valorVenda: 8000,
      dataVenda: `${currentMonthStr}-04T10:15:00Z`,
      descricaoVenda: 'Cliente Soluções Integradas',
      regraAplicadaId: 1,
      regraAplicadaNome: 'Regra Geral de Vendas (5%)',
      valorCalculado: 400,
      status: 'pendente',
      dataCalculo: `${currentMonthStr}-04T10:20:00Z`,
      atualizadoEm: `${currentMonthStr}-04T10:20:00Z`,
    },
    {
      id: 103,
      vendaId: 503,
      vendedorId: 7,
      vendedorNome: 'Pedro Rocha',
      valorVenda: 15000,
      dataVenda: `${currentMonthStr}-05T16:45:00Z`,
      descricaoVenda: 'Grupo Alfa - Consultoria Empresarial',
      regraAplicadaId: 3,
      regraAplicadaNome: 'Bônus Escalonado por Metas',
      valorCalculado: 600, // Simulado em 4%
      status: 'em_revisao',
      motivoRevisao: 'Desconto extra de 10% foi aplicado na venda. Revisar base.',
      dataCalculo: `${currentMonthStr}-05T16:50:00Z`,
      atualizadoEm: `${currentMonthStr}-06T09:00:00Z`,
    },
    {
      id: 104,
      vendaId: 504,
      vendedorId: 7,
      vendedorNome: 'Pedro Rocha',
      valorVenda: 5000,
      dataVenda: `${currentMonthStr}-06T11:00:00Z`,
      descricaoVenda: 'Cliente Loja Moderna',
      regraAplicadaId: 1,
      regraAplicadaNome: 'Regra Geral de Vendas (5%)',
      valorCalculado: 250,
      status: 'aprovado',
      dataCalculo: `${currentMonthStr}-06T11:05:00Z`,
      atualizadoEm: `${currentMonthStr}-06T12:00:00Z`,
    }
  ];
};

const getFromStorage = <T>(key: string, defaultVal: T): T => {
  const data = localStorage.getItem(key);
  if (!data) {
    localStorage.setItem(key, JSON.stringify(defaultVal));
    return defaultVal;
  }
  return JSON.parse(data);
};

const saveToStorage = <T>(key: string, value: T): void => {
  localStorage.setItem(key, JSON.stringify(value));
};

export const CommissionService = {
  // --- REGRAS ---
  getRules: async (): Promise<CommissionRule[]> => {
    return getFromStorage<CommissionRule[]>(STORAGE_KEYS.RULES, DEFAULT_RULES);
  },

  saveRule: async (rule: Omit<CommissionRule, 'id' | 'criadoEm'> & { id?: number }): Promise<CommissionRule> => {
    const rules = getFromStorage<CommissionRule[]>(STORAGE_KEYS.RULES, DEFAULT_RULES);
    let savedRule: CommissionRule;

    if (rule.id) {
      // Editar
      rules.forEach((r, idx) => {
        if (r.id === rule.id) {
          rules[idx] = { ...r, ...rule } as CommissionRule;
          savedRule = rules[idx];
        }
      });
    } else {
      // Criar
      const newId = rules.reduce((max, r) => r.id > max ? r.id : max, 0) + 1;
      savedRule = {
        ...rule,
        id: newId,
        criadoEm: new Date().toISOString(),
      } as CommissionRule;
      rules.push(savedRule);
    }

    saveToStorage(STORAGE_KEYS.RULES, rules);
    return savedRule!;
  },

  deleteRule: async (id: number): Promise<void> => {
    const rules = getFromStorage<CommissionRule[]>(STORAGE_KEYS.RULES, DEFAULT_RULES);
    const updated = rules.filter(r => r.id !== id);
    saveToStorage(STORAGE_KEYS.RULES, updated);
  },

  // --- EXTRATOS ---
  getStatements: async (vendedorId?: number, period?: string): Promise<CommissionStatement[]> => {
    let statements = getFromStorage<CommissionStatement[]>(STORAGE_KEYS.STATEMENTS, getInitialStatements());
    
    if (vendedorId) {
      statements = statements.filter(s => s.vendedorId === vendedorId);
    }
    if (period) {
      statements = statements.filter(s => s.dataVenda.startsWith(period));
    }
    
    return statements;
  },

  addMockStatement: async (statement: Omit<CommissionStatement, 'id' | 'dataCalculo' | 'atualizadoEm'>): Promise<CommissionStatement> => {
    const statements = getFromStorage<CommissionStatement[]>(STORAGE_KEYS.STATEMENTS, getInitialStatements());
    const newId = statements.reduce((max, s) => s.id > max ? s.id : max, 0) + 1;
    const newStatement: CommissionStatement = {
      ...statement,
      id: newId,
      dataCalculo: new Date().toISOString(),
      atualizadoEm: new Date().toISOString(),
    };
    statements.push(newStatement);
    saveToStorage(STORAGE_KEYS.STATEMENTS, statements);
    return newStatement;
  },

  updateStatementStatus: async (
    id: number,
    status: CommissionStatement['status'],
    motivoRevisao?: string
  ): Promise<CommissionStatement> => {
    const statements = getFromStorage<CommissionStatement[]>(STORAGE_KEYS.STATEMENTS, getInitialStatements());
    let updated: CommissionStatement | null = null;

    statements.forEach((s, idx) => {
      if (s.id === id) {
        statements[idx] = {
          ...s,
          status,
          motivoRevisao: status === 'em_revisao' ? motivoRevisao : s.motivoRevisao,
          atualizadoEm: new Date().toISOString(),
        };
        updated = statements[idx];
      }
    });

    if (!updated) throw new Error('Extrato não encontrado');
    saveToStorage(STORAGE_KEYS.STATEMENTS, statements);
    return updated;
  },

  // --- PAGAMENTOS ---
  getPaymentReports: async (period?: string): Promise<CommissionPaymentReport[]> => {
    let reports = getFromStorage<CommissionPaymentReport[]>(STORAGE_KEYS.PAYMENTS, []);
    if (period) {
      reports = reports.filter(r => r.periodo === period);
    }
    return reports;
  },

  consolidatePeriod: async (period: string): Promise<CommissionPaymentReport[]> => {
    const statements = await CommissionService.getStatements(undefined, period);
    const approvedStatements = statements.filter(s => s.status === 'aprovado');

    if (approvedStatements.length === 0) {
      throw new Error('Não há extratos aprovados para consolidar neste período.');
    }

    const reports = getFromStorage<CommissionPaymentReport[]>(STORAGE_KEYS.PAYMENTS, []);
    
    // Agrupa por vendedor
    const groupings: Record<number, {
      vendedorNome: string;
      vendedorId: number;
      quantidadeVendas: number;
      valorTotalVendas: number;
      valorTotalComissao: number;
    }> = {};

    approvedStatements.forEach(s => {
      if (!groupings[s.vendedorId]) {
        groupings[s.vendedorId] = {
          vendedorId: s.vendedorId,
          vendedorNome: s.vendedorNome,
          quantidadeVendas: 0,
          valorTotalVendas: 0,
          valorTotalComissao: 0,
        };
      }
      groupings[s.vendedorId].quantidadeVendas += 1;
      groupings[s.vendedorId].valorTotalVendas += s.valorVenda;
      groupings[s.vendedorId].valorTotalComissao += s.valorCalculado;
    });

    const newReports: CommissionPaymentReport[] = [];
    Object.values(groupings).forEach(group => {
      // Remove consolidação existente para esse vendedor e período se houver
      const existingIdx = reports.findIndex(r => r.vendedorId === group.vendedorId && r.periodo === period);
      
      const newReport: CommissionPaymentReport = {
        id: existingIdx >= 0 ? reports[existingIdx].id : reports.reduce((max, r) => r.id > max ? r.id : max, 0) + 1 + newReports.length,
        vendedorId: group.vendedorId,
        vendedorNome: group.vendedorNome,
        periodo: period,
        quantidadeVendas: group.quantidadeVendas,
        valorTotalVendas: group.valorTotalVendas,
        valorTotalComissao: group.valorTotalComissao,
        status: 'pronto_para_pagamento',
      };

      if (existingIdx >= 0) {
        // Preserva o status caso já estivesse pago
        if (reports[existingIdx].status === 'pago') {
          newReport.status = 'pago';
          newReport.comprovanteUrl = reports[existingIdx].comprovanteUrl;
          newReport.pagoEm = reports[existingIdx].pagoEm;
          newReport.pagoPorNome = reports[existingIdx].pagoPorNome;
        }
        reports[existingIdx] = newReport;
      } else {
        reports.push(newReport);
      }
      newReports.push(newReport);
    });

    // Atualiza o status dos extratos aprovados consolidados para 'aprovado' mas guardando o ID do relatório
    const allStatements = getFromStorage<CommissionStatement[]>(STORAGE_KEYS.STATEMENTS, getInitialStatements());
    newReports.forEach(rep => {
      allStatements.forEach((s, idx) => {
        if (s.vendedorId === rep.vendedorId && s.dataVenda.startsWith(period) && s.status === 'aprovado') {
          allStatements[idx].relatorioPagamentoId = rep.id;
        }
      });
    });

    saveToStorage(STORAGE_KEYS.PAYMENTS, reports);
    saveToStorage(STORAGE_KEYS.STATEMENTS, allStatements);
    
    return newReports;
  },

  confirmPayment: async (id: number, comprovanteUrl?: string): Promise<CommissionPaymentReport> => {
    const reports = getFromStorage<CommissionPaymentReport[]>(STORAGE_KEYS.PAYMENTS, []);
    let updatedReport: CommissionPaymentReport | null = null;

    reports.forEach((r, idx) => {
      if (r.id === id) {
        reports[idx] = {
          ...r,
          status: 'pago',
          comprovanteUrl: comprovanteUrl || 'https://via.placeholder.com/150?text=Comprovante+PIX',
          pagoEm: new Date().toISOString(),
          pagoPorNome: 'Gestor Administrativo',
        };
        updatedReport = reports[idx];
      }
    });

    if (!updatedReport) throw new Error('Relatório de pagamento não encontrado.');
    saveToStorage(STORAGE_KEYS.PAYMENTS, reports);

    // Atualiza status de todos os extratos vinculados para 'pago'
    const statements = getFromStorage<CommissionStatement[]>(STORAGE_KEYS.STATEMENTS, getInitialStatements());
    statements.forEach((s, idx) => {
      if (s.relatorioPagamentoId === id) {
        statements[idx].status = 'pago';
      }
    });
    saveToStorage(STORAGE_KEYS.STATEMENTS, statements);

    return updatedReport;
  }
};
