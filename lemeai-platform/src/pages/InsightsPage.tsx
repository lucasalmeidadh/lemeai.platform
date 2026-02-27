import { FaRobot, FaFire, FaSnowflake, FaChartPie, FaLightbulb, FaBullhorn, FaCheckCircle, FaPlus } from 'react-icons/fa';
import './InsightsPage.css';

const InsightsPage = () => {
    return (
        <div className="page-container">
            <div className="page-header">
                <div>
                    <h1><FaRobot style={{ marginRight: '12px', color: 'var(--petroleum-blue)' }} /> Assistente de IA</h1>
                    <p style={{ color: 'var(--text-secondary)', marginTop: '4px' }}>Seu resumo diário e análises preditivas baseadas nos atendimentos.</p>
                </div>
            </div>

            <div className="dashboard-charts-area">
                {/* Resumo Diário */}
                <div className="dashboard-card ai-summary-card">
                    <div className="card-header-simple">
                        <FaLightbulb className="icon-highlight yellow" />
                        <h3>Resumo Diário</h3>
                    </div>
                    <p className="summary-text">
                        <strong>Bom dia, Lucas!</strong> Nas últimas 24h, você teve 15 novos leads. Pelo histórico de conversas recentes, a campanha de "Verão" está trazendo clientes muito interessados no "Produto X".
                        <br /><br />
                        <strong>Ação Recomendada:</strong> Sugiro focar em fechar os 3 negócios quentes que estão parados na etapa de "Proposta".
                    </p>
                    <button className="base-button primary">Ver Negócios em Proposta</button>
                </div>
            </div>

            <div className="insights-grid">
                {/* Temperatura dos Leads */}
                <div className="dashboard-card">
                    <div className="card-header-simple">
                        <FaFire className="icon-highlight red" />
                        <h3>Leads Quentes vs Esfriando</h3>
                    </div>
                    <div className="leads-list">
                        <div className="lead-item hot">
                            <div className="lead-info">
                                <span className="lead-name">Maria Silva</span>
                                <span className="lead-score">95% propensão de compra</span>
                            </div>
                            <button className="base-button small">Falar Agora</button>
                        </div>
                        <div className="lead-item hot">
                            <div className="lead-info">
                                <span className="lead-name">João Pedro</span>
                                <span className="lead-score">88% propensão de compra</span>
                            </div>
                            <button className="base-button small">Falar Agora</button>
                        </div>
                        <div className="divider"></div>
                        <div className="lead-item cold">
                            <div className="lead-info">
                                <span className="lead-name">Empresa XYZ</span>
                                <span className="lead-score">Não responde há 3 dias</span>
                            </div>
                            <button className="base-button outline small"><FaSnowflake style={{ marginRight: '6px' }} /> Reativar (10% OFF)</button>
                        </div>
                    </div>
                </div>

                {/* Análise de Objeções */}
                <div className="dashboard-card">
                    <div className="card-header-simple">
                        <FaChartPie className="icon-highlight blue" />
                        <h3>Análise de Objeções (Últimos 7 dias)</h3>
                    </div>
                    <div className="objections-content">
                        <ul className="objection-list">
                            <li>
                                <div className="progress-bar-container">
                                    <div className="progress-label"><span>Preço muito alto</span><span>40%</span></div>
                                    <div className="progress-bg"><div className="progress-fill" style={{ width: '40%' }}></div></div>
                                </div>
                            </li>
                            <li>
                                <div className="progress-bar-container">
                                    <div className="progress-label"><span>Frete demorado</span><span>30%</span></div>
                                    <div className="progress-bg"><div className="progress-fill" style={{ width: '30%' }}></div></div>
                                </div>
                            </li>
                            <li>
                                <div className="progress-bar-container">
                                    <div className="progress-label"><span>Falta de integração</span><span>15%</span></div>
                                    <div className="progress-bg"><div className="progress-fill" style={{ width: '15%' }}></div></div>
                                </div>
                            </li>
                        </ul>
                        <div className="ai-suggestion-box">
                            <strong>Sugestão da IA:</strong> Crie uma Resposta Rápida (Atalho) para justificar o valor do seu produto ou ofereça um cupom focado apenas no frete.
                        </div>
                    </div>
                </div>
            </div>

            <div className="insights-grid">
                {/* Sugestão de Campanhas */}
                <div className="dashboard-card campaign-opportunity-card">
                    <div className="card-header-simple">
                        <FaBullhorn className="icon-highlight purple" />
                        <h3>Oportunidades Ocultas</h3>
                    </div>
                    <div className="campaign-suggestion">
                        <h4>45 leads interessados no Produto X</h4>
                        <p>A IA detectou 45 clientes que perguntaram sobre o Lançamento X no último mês, mas não finalizaram a compra.</p>
                        <button className="base-button purple-btn">Criar Campanha <FaPlus style={{ marginLeft: '8px' }} /></button>
                    </div>
                </div>

                {/* Benchmark de Atendimento */}
                <div className="dashboard-card">
                    <div className="card-header-simple">
                        <FaCheckCircle className="icon-highlight green" />
                        <h3>Monitoramento de Eficiência</h3>
                    </div>
                    <p className="summary-text" style={{ fontSize: '0.95rem' }}>
                        A vendedora <strong>Ana</strong> possui a maior taxa de conversão desta semana.
                        <br /><br />
                        <strong>Padrões detectados:</strong>
                    </p>
                    <ul style={{ marginLeft: '20px', marginTop: '10px', color: 'var(--text-secondary)' }}>
                        <li>Tempo de resposta inferior a 5 minutos.</li>
                        <li>Uso frequente de áudios curtos (humanização).</li>
                    </ul>
                </div>
            </div>
        </div>
    );
};

export default InsightsPage;
