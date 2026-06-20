import { useState, useRef, useEffect, type FC } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useGlobalNotification } from '../contexts/GlobalNotificationContext';
import { getUserPermissions, hasPermission } from '../config/permissions';
import {
    FaTachometerAlt,
    FaStream,
    FaAddressBook,
    FaComments,
    FaUsersCog,
    FaUsers,
    FaBox,
    FaCalendarAlt,
    FaRocket,
    FaPlug,
    FaBullhorn,
    FaPaperPlane,
    FaCreditCard,
    FaUserFriends,
    FaBullseye,
    FaRobot,
    FaBuilding,
    FaChevronRight,
    FaCalendarCheck,
    FaFileAlt,
    FaListAlt
} from 'react-icons/fa';
import './Sidebar.css';

import logoCrm from '../assets/logocrm.png';

interface SidebarProps {
    onViewProfile: () => void;
    onLogout: () => void;
}

const Sidebar: FC<SidebarProps> = () => {
    const location = useLocation();
    const { unreadCount, clearUnreadCount } = useGlobalNotification();

    // Accordion States
    const [isMarketingOpen, setIsMarketingOpen] = useState(false);
    const [isReportsOpen, setIsReportsOpen] = useState(false);
    const [isGestaoOpen, setIsGestaoOpen] = useState(false);
    const [isChatbotOpen, setIsChatbotOpen] = useState(false);
    const [isEmpresaOpen, setIsEmpresaOpen] = useState(false);

    const settingsRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (location.pathname === '/chat') {
            clearUnreadCount();
        }
    }, [location.pathname, clearUnreadCount]);

    useEffect(() => {
        setIsMarketingOpen(false);
        setIsReportsOpen(false);
        setIsGestaoOpen(false);
        setIsChatbotOpen(false);
        setIsEmpresaOpen(false);
    }, [location.pathname]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (settingsRef.current && !settingsRef.current.contains(event.target as Node)) {
                setIsMarketingOpen(false);
                setIsReportsOpen(false);
                setIsGestaoOpen(false);
                setIsChatbotOpen(false);
                setIsEmpresaOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const permissions = getUserPermissions();
    const can = (perm: string) => hasPermission(permissions, [perm]);

    // Active Checks
    const isMarketingActive = ['/campanhas', '/campaign-templates'].includes(location.pathname);
    const isReportsActive = location.pathname.startsWith('/relatorios');
    const isGestaoActive = ['/users', '/equipes', '/metas', '/profiles', '/campos-personalizados'].includes(location.pathname);
    const isChatbotActive = ['/chat-rules', '/products', '/connections'].includes(location.pathname);
    const isEmpresaActive = ['/dias-uteis', '/empresas', '/gerenciar-planos'].includes(location.pathname);

    // Toggles
    const toggleMarketing = () => { setIsMarketingOpen(!isMarketingOpen); setIsReportsOpen(false); setIsGestaoOpen(false); setIsChatbotOpen(false); setIsEmpresaOpen(false); };
    const toggleReports = () => { setIsReportsOpen(!isReportsOpen); setIsMarketingOpen(false); setIsGestaoOpen(false); setIsChatbotOpen(false); setIsEmpresaOpen(false); };
    const toggleGestao = () => { setIsGestaoOpen(!isGestaoOpen); setIsMarketingOpen(false); setIsReportsOpen(false); setIsChatbotOpen(false); setIsEmpresaOpen(false); };
    const toggleChatbot = () => { setIsChatbotOpen(!isChatbotOpen); setIsMarketingOpen(false); setIsReportsOpen(false); setIsGestaoOpen(false); setIsEmpresaOpen(false); };
    const toggleEmpresa = () => { setIsEmpresaOpen(!isEmpresaOpen); setIsMarketingOpen(false); setIsReportsOpen(false); setIsGestaoOpen(false); setIsChatbotOpen(false); };

    const closeSettings = () => {
        setIsMarketingOpen(false);
        setIsReportsOpen(false);
        setIsGestaoOpen(false);
        setIsChatbotOpen(false);
        setIsEmpresaOpen(false);
    };

    return (
        <aside className="sidebar" ref={settingsRef}>
            <div className="sidebar-logo">
                <img src={logoCrm} alt="Brik CRM" />
            </div>

            <nav className="sidebar-nav">
                <Link to="/primeiros-passos" className={`sidebar-link ${location.pathname === '/primeiros-passos' ? 'active' : ''}`} style={{ marginBottom: '1rem' }}>
                    <FaRocket />
                    <span>Primeiros passos</span>
                </Link>

                {(can('gestao_vendas') || can('gestao_vendas_vendedor') || can('painel_operacional')) && (
                    <div className="sidebar-group">
                        <div className="sidebar-group-title">Gestão</div>
                        {(can('gestao_vendas') || can('gestao_vendas_vendedor')) && (
                            <Link to="/monitoramento" className={`sidebar-link ${location.pathname === '/monitoramento' ? 'active' : ''}`}>
                                <FaUserFriends />
                                <span>Gestão de vendas</span>
                            </Link>
                        )}
                        {can('painel_operacional') && (
                            <Link to="/dashboard" className={`sidebar-link ${location.pathname === '/dashboard' ? 'active' : ''}`}>
                                <FaTachometerAlt />
                                <span>Painel Operacional</span>
                            </Link>
                        )}
                    </div>
                )}

                {(can('agenda') || can('chat') || can('fluxo_vendas') || can('contatos')) && (
                    <div className="sidebar-group">
                        <div className="sidebar-group-title">Trabalho</div>
                        {can('agenda') && (
                            <Link to="/agenda" className={`sidebar-link ${location.pathname === '/agenda' ? 'active' : ''}`}>
                                <FaCalendarAlt />
                                <span>Agenda</span>
                            </Link>
                        )}
                        {can('chat') && (
                            <Link id="sidebar-chat" to="/chat" className={`sidebar-link ${location.pathname === '/chat' ? 'active' : ''}`}>
                                <FaComments />
                                <span>Chat</span>
                                {unreadCount > 0 && <span className="sidebar-badge">{unreadCount > 99 ? '99+' : unreadCount}</span>}
                            </Link>
                        )}
                        {can('fluxo_vendas') && (
                            <Link id="sidebar-pipeline" to="/pipeline" className={`sidebar-link ${location.pathname === '/pipeline' ? 'active' : ''}`}>
                                <FaStream />
                                <span>Fluxo de Vendas</span>
                            </Link>
                        )}
                        {can('contatos') && (
                            <Link id="sidebar-contacts" to="/contacts" className={`sidebar-link ${location.pathname === '/contacts' ? 'active' : ''}`}>
                                <FaAddressBook />
                                <span>Contatos</span>
                            </Link>
                        )}
                    </div>
                )}

                {(can('marketing_disparador') || can('marketing_templates')) && (
                    <div className="sidebar-group">
                        <div className="sidebar-group-title">Expansão</div>
                        <div className="sidebar-item-wrapper">
                            <button
                                id="sidebar-marketing"
                                className={`sidebar-btn ${isMarketingActive || isMarketingOpen ? 'active' : ''} ${isMarketingOpen ? 'open' : ''}`}
                                onClick={toggleMarketing}
                            >
                                <FaBullhorn />
                                <span>Marketing</span>
                                <FaChevronRight className="chevron-icon" />
                            </button>
                            <div className={`sidebar-accordion ${isMarketingOpen ? 'open' : ''}`}>
                                <div className="sidebar-accordion-content">
                                    {can('marketing_disparador') && (
                                        <Link to="/campanhas" className={`sidebar-sub-link ${location.pathname === '/campanhas' ? 'active' : ''}`} onClick={closeSettings}>
                                            <FaPaperPlane />
                                            <span>Disparador</span>
                                        </Link>
                                    )}
                                    {can('marketing_templates') && (
                                        <Link to="/campaign-templates" className={`sidebar-sub-link ${location.pathname === '/campaign-templates' ? 'active' : ''}`} onClick={closeSettings}>
                                            <FaBullhorn />
                                            <span>Templates</span>
                                        </Link>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {(can('relatorio_vendas') || can('relatorio_campanhas')) && (
                    <div className="sidebar-group">
                        <div className="sidebar-group-title">Analytics</div>
                        <div className="sidebar-item-wrapper">
                            <button
                                id="sidebar-reports"
                                className={`sidebar-btn ${isReportsActive || isReportsOpen ? 'active' : ''} ${isReportsOpen ? 'open' : ''}`}
                                onClick={toggleReports}
                            >
                                <FaFileAlt />
                                <span>Relatórios</span>
                                <FaChevronRight className="chevron-icon" />
                            </button>
                            <div className={`sidebar-accordion ${isReportsOpen ? 'open' : ''}`}>
                                <div className="sidebar-accordion-content">
                                    {can('relatorio_vendas') && (
                                        <Link to="/relatorios/vendas" className={`sidebar-sub-link ${location.pathname === '/relatorios/vendas' ? 'active' : ''}`} onClick={closeSettings}>
                                            <FaFileAlt />
                                            <span>Vendas</span>
                                        </Link>
                                    )}
                                    {can('relatorio_campanhas') && (
                                        <Link to="/relatorios/campanhas" className={`sidebar-sub-link ${location.pathname === '/relatorios/campanhas' ? 'active' : ''}`} onClick={closeSettings}>
                                            <FaFileAlt />
                                            <span>Campanhas</span>
                                        </Link>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {(can('gestao_usuarios') || can('gestao_perfis') || can('gestao_equipes') || can('gestao_metas') || can('gestao_campos_personalizados') || can('regras_chatbot') || can('gestao_produtos') || can('gestao_conexoes') || can('dias_funcionamento') || can('gestao_empresas') || can('gerenciar_planos')) && (
                    <div className="sidebar-group">
                        <div className="sidebar-group-title">Administração</div>

                        {/* Gestão */}
                        {(can('gestao_usuarios') || can('gestao_perfis') || can('gestao_equipes') || can('gestao_metas') || can('gestao_campos_personalizados')) && (
                            <div className="sidebar-item-wrapper">
                                <button
                                    id="sidebar-gestao-admin"
                                    className={`sidebar-btn ${isGestaoActive || isGestaoOpen ? 'active' : ''} ${isGestaoOpen ? 'open' : ''}`}
                                    onClick={toggleGestao}
                                >
                                    <FaUsersCog />
                                    <span>Gestão</span>
                                    <FaChevronRight className="chevron-icon" />
                                </button>
                                <div className={`sidebar-accordion ${isGestaoOpen ? 'open' : ''}`}>
                                    <div className="sidebar-accordion-content">
                                        {can('gestao_usuarios') && (
                                            <Link id="sidebar-users" to="/users" className={`sidebar-sub-link ${location.pathname === '/users' ? 'active' : ''}`} onClick={closeSettings}>
                                                <FaUsers />
                                                <span>Usuários</span>
                                            </Link>
                                        )}
                                        {can('gestao_perfis') && (
                                            <Link id="sidebar-profiles" to="/profiles" className={`sidebar-sub-link ${location.pathname === '/profiles' ? 'active' : ''}`} onClick={closeSettings}>
                                                <FaUsersCog />
                                                <span>Perfis e Permissões</span>
                                            </Link>
                                        )}
                                        {can('gestao_equipes') && (
                                            <Link to="/equipes" className={`sidebar-sub-link ${location.pathname === '/equipes' ? 'active' : ''}`} onClick={closeSettings}>
                                                <FaUsers />
                                                <span>Equipes</span>
                                            </Link>
                                        )}
                                        {can('gestao_metas') && (
                                            <Link to="/metas" className={`sidebar-sub-link ${location.pathname === '/metas' ? 'active' : ''}`} onClick={closeSettings}>
                                                <FaBullseye />
                                                <span>Metas</span>
                                            </Link>
                                        )}
                                        {can('gestao_campos_personalizados') && (
                                            <Link to="/campos-personalizados" className={`sidebar-sub-link ${location.pathname === '/campos-personalizados' ? 'active' : ''}`} onClick={closeSettings}>
                                                <FaListAlt />
                                                <span>Campos Personalizados</span>
                                            </Link>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Chatbot */}
                        {(can('regras_chatbot') || can('gestao_produtos') || can('gestao_conexoes')) && (
                            <div className="sidebar-item-wrapper">
                                <button
                                    id="sidebar-chatbot-admin"
                                    className={`sidebar-btn ${isChatbotActive || isChatbotOpen ? 'active' : ''} ${isChatbotOpen ? 'open' : ''}`}
                                    onClick={toggleChatbot}
                                >
                                    <FaRobot />
                                    <span>Chatbot</span>
                                    <FaChevronRight className="chevron-icon" />
                                </button>
                                <div className={`sidebar-accordion ${isChatbotOpen ? 'open' : ''}`}>
                                    <div className="sidebar-accordion-content">
                                        {can('regras_chatbot') && (
                                            <Link to="/chat-rules" className={`sidebar-sub-link ${location.pathname === '/chat-rules' ? 'active' : ''}`} onClick={closeSettings}>
                                                <FaComments />
                                                <span>Regras do Chat</span>
                                            </Link>
                                        )}
                                        {can('gestao_produtos') && (
                                            <Link to="/products" className={`sidebar-sub-link ${location.pathname === '/products' ? 'active' : ''}`} onClick={closeSettings}>
                                                <FaBox />
                                                <span>Produtos</span>
                                            </Link>
                                        )}
                                        {can('gestao_conexoes') && (
                                            <Link to="/connections" className={`sidebar-sub-link ${location.pathname === '/connections' ? 'active' : ''}`} onClick={closeSettings}>
                                                <FaPlug />
                                                <span>Conexões</span>
                                            </Link>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Empresa */}
                        {(can('dias_funcionamento') || can('gestao_empresas') || can('gerenciar_planos')) && (
                            <div className="sidebar-item-wrapper">
                                <button
                                    id="sidebar-empresa-admin"
                                    className={`sidebar-btn ${isEmpresaActive || isEmpresaOpen ? 'active' : ''} ${isEmpresaOpen ? 'open' : ''}`}
                                    onClick={toggleEmpresa}
                                >
                                    <FaBuilding />
                                    <span>Empresa</span>
                                    <FaChevronRight className="chevron-icon" />
                                </button>
                                <div className={`sidebar-accordion ${isEmpresaOpen ? 'open' : ''}`}>
                                    <div className="sidebar-accordion-content">
                                        {can('dias_funcionamento') && (
                                            <Link to="/dias-uteis" className={`sidebar-sub-link ${location.pathname === '/dias-uteis' ? 'active' : ''}`} onClick={closeSettings}>
                                                <FaCalendarCheck />
                                                <span>Dias de func.</span>
                                            </Link>
                                        )}
                                        {can('gestao_empresas') && (
                                            <Link to="/empresas" className={`sidebar-sub-link ${location.pathname === '/empresas' ? 'active' : ''}`} onClick={closeSettings}>
                                                <FaBuilding />
                                                <span>Empresas</span>
                                            </Link>
                                        )}
                                        {can('gerenciar_planos') && (
                                            <Link to="/gerenciar-planos" className={`sidebar-sub-link ${location.pathname === '/gerenciar-planos' ? 'active' : ''}`} onClick={closeSettings}>
                                                <FaCreditCard />
                                                <span>Gerenciar Planos</span>
                                            </Link>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                    </div>
                )}
            </nav>
        </aside>
    );
};

export default Sidebar;
