import { useState, useEffect, useMemo } from 'react';
import { apiFetch } from '../services/api';
import { CampaignService, type CampaignMetrics } from '../services/CampaignService';
import { OpportunityService, type Opportunity } from '../services/OpportunityService';
import { FaFileExcel, FaSearch, FaCalendarAlt, FaBullhorn, FaDollarSign, FaUserPlus, FaShoppingCart } from 'react-icons/fa';
import './CampaignReportsPage.css';

const apiUrl = import.meta.env.VITE_API_URL || '';

type PresetType = 'hoje' | 'ontem' | '7dias' | '30dias' | 'mesAtual' | 'personalizado';

interface ProcessedCampaign {
  id: number;
  name: string;
  template: string;
  createdAt: string;
  createdDate: Date;
  sent: number;
  leads: number;
  salesCount: number;
  conversionRate: number;
  revenue: number;
}

export default function CampaignReportsPage() {
  const [campaigns, setCampaigns] = useState<CampaignMetrics[]>([]);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [conversationsMap, setConversationsMap] = useState<Record<number, { idCampanha: number | null; campanha: boolean }>>({});
  const [loading, setLoading] = useState(true);

  // Filters
  const [preset, setPreset] = useState<PresetType>('hoje');
  const [startDateStr, setStartDateStr] = useState('');
  const [endDateStr, setEndDateStr] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Load Initial Data
  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [campaignsRes, oppsData, chatRes] = await Promise.all([
          CampaignService.getMetrics(),
          OpportunityService.getAllOpportunities(),
          apiFetch(`${apiUrl}/api/Chat/ConversasPorVendedor`).then(r => r.json()).catch(() => ({ sucesso: true, dados: [] }))
        ]);

        if (campaignsRes?.sucesso && Array.isArray(campaignsRes?.dados)) {
          setCampaigns(campaignsRes.dados);
        }

        setOpportunities(oppsData || []);

        const chatMap: Record<number, { idCampanha: number | null; campanha: boolean }> = {};
        if (chatRes?.sucesso && Array.isArray(chatRes?.dados)) {
          chatRes.dados.forEach((c: any) => {
            chatMap[c.idConversa] = {
              idCampanha: c.idCampanha || null,
              campanha: !!c.campanha
            };
          });
        }
        setConversationsMap(chatMap);
      } catch (error) {
        console.error("Erro ao carregar dados do relatório de campanhas:", error);
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

  // Correlate campaigns with sales
  const processedData = useMemo(() => {
    const start = startDateStr ? new Date(startDateStr + 'T00:00:00') : null;
    const end = endDateStr ? new Date(endDateStr + 'T23:59:59') : null;

    // Calculate won opportunities per campaign
    const campaignSales: Record<number, { count: number; revenue: number }> = {};
    
    opportunities.forEach(opp => {
      // Status 3 is Ganho
      if (opp.idStauts === 3) {
        const campId = opp.idCampanha || conversationsMap[opp.idConversa]?.idCampanha;
        if (campId) {
          if (!campaignSales[campId]) {
            campaignSales[campId] = { count: 0, revenue: 0 };
          }
          campaignSales[campId].count += 1;
          campaignSales[campId].revenue += opp.valor || 0;
        }
      }
    });

    return campaigns
      .map(camp => {
        const salesInfo = campaignSales[camp.campanhaId] || { count: 0, revenue: 0 };
        const conversionRate = camp.totalDisparado > 0 ? (salesInfo.count / camp.totalDisparado) * 100 : 0;
        
        return {
          id: camp.campanhaId,
          name: camp.campanhaNome,
          template: camp.campanhaTemplateNome,
          createdAt: new Date(camp.campanhaCreatedat).toLocaleDateString('pt-BR'),
          createdDate: new Date(camp.campanhaCreatedat),
          sent: camp.totalDisparado || 0,
          leads: camp.totalComInteracao || 0,
          salesCount: salesInfo.count,
          conversionRate,
          revenue: salesInfo.revenue
        };
      })
      .filter(camp => {
        // Date Filter
        if (start && camp.createdDate < start) return false;
        if (end && camp.createdDate > end) return false;

        // Search Term Filter
        if (searchTerm) {
          const term = searchTerm.toLowerCase();
          const nameMatch = camp.name?.toLowerCase().includes(term);
          const templateMatch = camp.template?.toLowerCase().includes(term);
          if (!nameMatch && !templateMatch) return false;
        }

        return true;
      });
  }, [campaigns, opportunities, conversationsMap, startDateStr, endDateStr, searchTerm]);

  // Aggregate Metrics
  const metrics = useMemo(() => {
    let totalSent = 0;
    let totalLeads = 0;
    let totalRevenue = 0;
    let totalSales = 0;

    processedData.forEach(c => {
      totalSent += c.sent;
      totalLeads += c.leads;
      totalRevenue += c.revenue;
      totalSales += c.salesCount;
    });

    const averageConversion = totalSent > 0 ? (totalSales / totalSent) * 100 : 0;

    return {
      totalSent,
      totalLeads,
      totalRevenue,
      totalSales,
      averageConversion
    };
  }, [processedData]);

  // Export to Excel-compatible CSV
  const handleExportCSV = () => {
    const headers = ['Campanha', 'Template', 'Criada Em', 'Disparados', 'Leads (Interações)', 'Vendas', 'Taxa Conversão (%)', 'Faturamento'];
    const rows = processedData.map(c => [
      c.name,
      c.template,
      c.createdAt,
      c.sent,
      c.leads,
      c.salesCount,
      c.conversionRate.toFixed(2).replace('.', ','),
      c.revenue.toFixed(2).replace('.', ',')
    ]);

    const csvContent = [
      headers.join(';'),
      ...rows.map(e => e.join(';'))
    ].join('\n');

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    
    const filename = `relatorio_campanhas_${startDateStr}_a_${endDateStr}.csv`;
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
        <h1>Relatório de Desempenho de Campanhas</h1>
        <button 
          onClick={handleExportCSV} 
          className="export-btn"
          disabled={processedData.length === 0}
          title="Exportar dados atuais para Excel"
        >
          <FaFileExcel />
          <span>Exportar para Excel</span>
        </button>
      </div>

      {/* Filters Card */}
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
            <label>Buscar campanha ou template</label>
            <div className="search-input-wrapper">
              <FaSearch className="input-icon" />
              <input 
                type="text" 
                placeholder="Ex: Campanha Black Friday..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="reports-kpi-grid">
        <div className="kpi-card">
          <div className="kpi-icon-wrapper sales">
            <FaBullhorn />
          </div>
          <div className="kpi-info">
            <span className="kpi-label">Total Disparado</span>
            <strong className="kpi-value">{metrics.totalSent}</strong>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon-wrapper ticket">
            <FaUserPlus />
          </div>
          <div className="kpi-info">
            <span className="kpi-label">Leads Gerados</span>
            <strong className="kpi-value">{metrics.totalLeads}</strong>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon-wrapper revenue">
            <FaDollarSign />
          </div>
          <div className="kpi-info">
            <span className="kpi-label">Receita Convertida</span>
            <strong className="kpi-value">{formatCurrency(metrics.totalRevenue)}</strong>
          </div>
        </div>
      </div>

      {/* Table Card */}
      <div className="reports-table-card">
        {loading ? (
          <div className="reports-loading">
            <div className="spinner"></div>
            <span>Calculando desempenho das campanhas...</span>
          </div>
        ) : processedData.length > 0 ? (
          <div className="table-responsive">
            <table className="reports-data-table">
              <thead>
                <tr>
                  <th>Campanha</th>
                  <th>Template</th>
                  <th>Criada Em</th>
                  <th className="text-right">Disparos</th>
                  <th className="text-right">Leads</th>
                  <th className="text-right">Vendas</th>
                  <th className="text-right">Conversão (%)</th>
                  <th className="text-right">Faturamento</th>
                </tr>
              </thead>
              <tbody>
                {processedData.map((camp) => (
                  <tr key={camp.id}>
                    <td className="font-semibold">{camp.name}</td>
                    <td>{camp.template}</td>
                    <td>{camp.createdAt}</td>
                    <td className="text-right">{camp.sent}</td>
                    <td className="text-right text-info font-semibold">{camp.leads}</td>
                    <td className="text-right">{camp.salesCount}</td>
                    <td className="text-right font-semibold">
                      {camp.conversionRate.toFixed(2)}%
                    </td>
                    <td className="text-right font-semibold text-success">
                      {formatCurrency(camp.revenue)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="reports-empty-state">
            <FaBullhorn className="empty-icon" />
            <h3>Nenhuma campanha encontrada</h3>
            <p>Nenhuma campanha foi criada no período selecionado ou com o filtro especificado.</p>
          </div>
        )}
      </div>
    </div>
  );
}
