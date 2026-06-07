import { useState, useEffect, useMemo } from 'react';
import { apiFetch } from '../services/api';
import { OpportunityService, type Opportunity } from '../services/OpportunityService';
import { ProductService, type Product } from '../services/ProductService';
import { ContactService } from '../services/ContactService';
import { FaFileExcel, FaSearch, FaCalendarAlt, FaDollarSign, FaShoppingCart, FaPercentage } from 'react-icons/fa';
import './ReportsPage.css';

const apiUrl = import.meta.env.VITE_API_URL || '';

type PresetType = 'hoje' | 'ontem' | '7dias' | '30dias' | 'mesAtual' | 'personalizado';

export default function ReportsPage() {
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [contactsMap, setContactsMap] = useState<Record<number, string>>({}); // contatoId -> email
  const [conversationsMap, setConversationsMap] = useState<Record<number, { idCampanha: number | null; nomeCampanha: string; campanha: boolean }>>({});
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [preset, setPreset] = useState<PresetType>('hoje');
  const [startDateStr, setStartDateStr] = useState('');
  const [endDateStr, setEndDateStr] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Initial Load
  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [oppsData, prodResponse, contactsRes, chatRes] = await Promise.all([
          OpportunityService.getAllOpportunities(),
          ProductService.getAll().catch(() => ({ sucesso: true, dados: [] })),
          ContactService.getAll().catch(() => ({ sucesso: true, dados: [] })),
          apiFetch(`${apiUrl}/api/Chat/ConversasPorVendedor`).then(r => r.json()).catch(() => ({ sucesso: true, dados: [] }))
        ]);
        
        setOpportunities(oppsData || []);
        if (prodResponse?.sucesso && Array.isArray(prodResponse?.dados)) {
          setProducts(prodResponse.dados);
        }

        // Map contacts email
        const cMap: Record<number, string> = {};
        if (contactsRes?.sucesso && Array.isArray(contactsRes?.dados)) {
          contactsRes.dados.forEach((contact: any) => {
            if (contact.email) {
              cMap[contact.contatoId] = contact.email;
            }
          });
        }
        setContactsMap(cMap);

        // Map conversations campaign data
        const convMap: Record<number, { idCampanha: number | null; nomeCampanha: string; campanha: boolean }> = {};
        if (chatRes?.sucesso && Array.isArray(chatRes?.dados)) {
          chatRes.dados.forEach((c: any) => {
            convMap[c.idConversa] = {
              idCampanha: c.idCampanha || null,
              nomeCampanha: c.nomeCampanha || '',
              campanha: !!c.campanha
            };
          });
        }
        setConversationsMap(convMap);
      } catch (error) {
        console.error("Erro ao carregar dados do relatório:", error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Update dates when preset changes
  useEffect(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const getFormattedDate = (date: Date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    if (preset === 'hoje') {
      const d = getFormattedDate(today);
      setStartDateStr(d);
      setEndDateStr(d);
    } else if (preset === 'ontem') {
      const yesterday = new Date(today);
      yesterday.setDate(today.getDate() - 1);
      const d = getFormattedDate(yesterday);
      setStartDateStr(d);
      setEndDateStr(d);
    } else if (preset === '7dias') {
      const past = new Date(today);
      past.setDate(today.getDate() - 7);
      setStartDateStr(getFormattedDate(past));
      setEndDateStr(getFormattedDate(today));
    } else if (preset === '30dias') {
      const past = new Date(today);
      past.setDate(today.getDate() - 30);
      setStartDateStr(getFormattedDate(past));
      setEndDateStr(getFormattedDate(today));
    } else if (preset === 'mesAtual') {
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      setStartDateStr(getFormattedDate(startOfMonth));
      setEndDateStr(getFormattedDate(today));
    }
  }, [preset]);

  // Fallback product list when database has no products
  const fallbackProducts = useMemo(() => [
    'Licença LemeAI Pro',
    'API WhatsApp Premium',
    'Consultoria & Setup',
    'Treinamento Corporativo',
    'Suporte Dedicado VIP'
  ], []);

  // Process Sales Data (Filter statusId = 3 which means Ganho/Won)
  const salesData = useMemo(() => {
    const start = startDateStr ? new Date(startDateStr + 'T00:00:00') : null;
    const end = endDateStr ? new Date(endDateStr + 'T23:59:59') : null;

    return opportunities
      .filter(opp => {
        // Status 3 is "Ganho"
        if (opp.idStauts !== 3) return false;

        // Date filter
        const saleDate = new Date(opp.dataFechamentoVenda || opp.dataConversaCriada);
        if (start && saleDate < start) return false;
        if (end && saleDate > end) return false;

        // Search term filter (Client, Seller, Phone or Email)
        if (searchTerm) {
          const term = searchTerm.toLowerCase();
          const clientMatch = opp.nomeContato?.toLowerCase().includes(term);
          const sellerMatch = opp.nomeUsuarioResponsavel?.toLowerCase().includes(term);
          const phoneMatch = opp.numeroWhatsapp?.includes(term);
          const emailMatch = (contactsMap[opp.idContato] || '').toLowerCase().includes(term);
          
          if (!clientMatch && !sellerMatch && !phoneMatch && !emailMatch) return false;
        }

        return true;
      })
      .map(opp => {
        // Deterministic mock product association using idConversa
        let productName = '';
        if (products.length > 0) {
          productName = products[opp.idConversa % products.length].nome;
        } else {
          productName = fallbackProducts[opp.idConversa % fallbackProducts.length];
        }

        // Email lookup
        const email = contactsMap[opp.idContato] || '-';

        // Origin lookup
        const convInfo = conversationsMap[opp.idConversa];
        const isCampanha = opp.campanha !== undefined ? opp.campanha : (convInfo && convInfo.campanha);
        const campName = opp.nomeCampanha || (convInfo && convInfo.nomeCampanha) || '';
        const origin = isCampanha 
          ? `Campanha: ${campName || 'Marketing'}` 
          : 'Orgânico';

        return {
          ...opp,
          productName,
          email,
          origin,
          dateFormatted: new Date(opp.dataFechamentoVenda || opp.dataConversaCriada).toLocaleDateString('pt-BR')
        };
      });
  }, [opportunities, products, fallbackProducts, contactsMap, conversationsMap, startDateStr, endDateStr, searchTerm]);

  // Summary Metrics
  const metrics = useMemo(() => {
    const totalRevenue = salesData.reduce((acc, sale) => acc + (sale.valor || 0), 0);
    const totalSales = salesData.length;
    const averageTicket = totalSales > 0 ? totalRevenue / totalSales : 0;

    return {
      totalRevenue,
      totalSales,
      averageTicket
    };
  }, [salesData]);

  // Export to Excel-compatible CSV file (semi-colon separated and UTF-8 BOM)
  const handleExportCSV = () => {
    const headers = ['Cliente', 'Telefone', 'E-mail', 'Origem', 'Vendedor', 'Data da Venda', 'Produto Vinculado (Mock)', 'Valor'];
    const rows = salesData.map(sale => [
      sale.nomeContato || '-',
      sale.numeroWhatsapp || '-',
      sale.email,
      sale.origin,
      sale.nomeUsuarioResponsavel || 'Sistema',
      sale.dateFormatted,
      sale.productName,
      sale.valor.toFixed(2).replace('.', ',')
    ]);

    const csvContent = [
      headers.join(';'),
      ...rows.map(e => e.join(';'))
    ].join('\n');

    // Prepend UTF-8 BOM so Excel opens it correctly in Portuguese Windows environments
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    
    const filename = `relatorio_vendas_${startDateStr}_a_${endDateStr}.csv`;
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  return (
    <div className="page-container reports-page-wrapper">
      <div className="page-header">
        <h1>Relatório Operacional de Vendas</h1>
        <button 
          onClick={handleExportCSV} 
          className="export-btn"
          disabled={salesData.length === 0}
          title="Exportar dados atuais para Excel"
        >
          <FaFileExcel />
          <span>Exportar para Excel</span>
        </button>
      </div>

      {/* Filters Section */}
      <div className="reports-filters-card">
        <div className="filter-presets">
          <button 
            className={`preset-tab-btn ${preset === 'hoje' ? 'active' : ''}`}
            onClick={() => setPreset('hoje')}
          >
            Hoje
          </button>
          <button 
            className={`preset-tab-btn ${preset === 'ontem' ? 'active' : ''}`}
            onClick={() => setPreset('ontem')}
          >
            Ontem
          </button>
          <button 
            className={`preset-tab-btn ${preset === '7dias' ? 'active' : ''}`}
            onClick={() => setPreset('7dias')}
          >
            Últimos 7 dias
          </button>
          <button 
            className={`preset-tab-btn ${preset === '30dias' ? 'active' : ''}`}
            onClick={() => setPreset('30dias')}
          >
            Últimos 30 dias
          </button>
          <button 
            className={`preset-tab-btn ${preset === 'mesAtual' ? 'active' : ''}`}
            onClick={() => setPreset('mesAtual')}
          >
            Mês Atual
          </button>
          <button 
            className={`preset-tab-btn ${preset === 'personalizado' ? 'active' : ''}`}
            onClick={() => setPreset('personalizado')}
          >
            Personalizado
          </button>
        </div>

        <div className="filter-controls-row">
          <div className="date-inputs-group">
            <div className="input-with-label">
              <label>Data Início</label>
              <div className="date-input-wrapper">
                <FaCalendarAlt className="input-icon" />
                <input 
                  type="date" 
                  value={startDateStr} 
                  onChange={(e) => {
                    setPreset('personalizado');
                    setStartDateStr(e.target.value);
                  }}
                />
              </div>
            </div>

            <div className="input-with-label">
              <label>Data Fim</label>
              <div className="date-input-wrapper">
                <FaCalendarAlt className="input-icon" />
                <input 
                  type="date" 
                  value={endDateStr} 
                  onChange={(e) => {
                    setPreset('personalizado');
                    setEndDateStr(e.target.value);
                  }}
                />
              </div>
            </div>
          </div>

          <div className="search-input-group">
            <label>Buscar cliente, vendedor, telefone ou e-mail</label>
            <div className="search-input-wrapper">
              <FaSearch className="input-icon" />
              <input 
                type="text" 
                placeholder="Ex: Lucas Almeida, (41)..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>

      {/* KPI Indicators */}
      <div className="reports-kpi-grid">
        <div className="kpi-card">
          <div className="kpi-icon-wrapper revenue">
            <FaDollarSign />
          </div>
          <div className="kpi-info">
            <span className="kpi-label">Faturamento Total</span>
            <strong className="kpi-value">{formatCurrency(metrics.totalRevenue)}</strong>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon-wrapper sales">
            <FaShoppingCart />
          </div>
          <div className="kpi-info">
            <span className="kpi-label">Total de Vendas</span>
            <strong className="kpi-value">{metrics.totalSales}</strong>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon-wrapper ticket">
            <FaPercentage />
          </div>
          <div className="kpi-info">
            <span className="kpi-label">Ticket Médio</span>
            <strong className="kpi-value">{formatCurrency(metrics.averageTicket)}</strong>
          </div>
        </div>
      </div>

      {/* Data Table */}
      <div className="reports-table-card">
        {loading ? (
          <div className="reports-loading">
            <div className="spinner"></div>
            <span>Carregando dados das vendas...</span>
          </div>
        ) : salesData.length > 0 ? (
          <div className="table-responsive">
            <table className="reports-data-table">
              <thead>
                <tr>
                  <th>Cliente</th>
                  <th>Telefone</th>
                  <th>E-mail</th>
                  <th>Origem</th>
                  <th>Vendedor</th>
                  <th>Data da Venda</th>
                  <th>Produto Vinculado (Mock)</th>
                  <th className="text-right">Valor</th>
                </tr>
              </thead>
              <tbody>
                {salesData.map((sale) => (
                  <tr key={sale.idConversa}>
                    <td className="font-semibold">{sale.nomeContato || '-'}</td>
                    <td>{sale.numeroWhatsapp || '-'}</td>
                    <td>{sale.email}</td>
                    <td>
                      <span className={`badge ${sale.origin.startsWith('Campanha') ? 'badge-ai' : 'badge-neutral'}`}>
                        {sale.origin}
                      </span>
                    </td>
                    <td>
                      <div className="seller-cell">
                        <div className="seller-avatar">
                          {(sale.nomeUsuarioResponsavel || 'S').substring(0, 2).toUpperCase()}
                        </div>
                        <span>{sale.nomeUsuarioResponsavel || 'Sistema'}</span>
                      </div>
                    </td>
                    <td>{sale.dateFormatted}</td>
                    <td className="text-muted font-italic">{sale.productName}</td>
                    <td className="text-right font-semibold text-success">
                      {formatCurrency(sale.valor)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="reports-empty-state">
            <FaShoppingCart className="empty-icon" />
            <h3>Nenhuma venda encontrada</h3>
            <p>Tente alterar o período selecionado ou termo de busca para localizar as vendas ganhas.</p>
          </div>
        )}
      </div>
    </div>
  );
}
