import { useState, useRef, useEffect, type FC } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useGlobalNotification } from '../contexts/GlobalNotificationContext';
import { getUserPermissions, hasPermission } from '../config/permissions';
import {
    FaTachometerAlt,
    FaStream,
    FaRegAddressBook as FaAddressBook,
    FaRegComments as FaComments,
    FaUsersCog,
    FaUsers,
    FaBox,
    FaRegCalendarAlt as FaCalendarAlt,
    FaRocket,
    FaPlug,
    FaBullhorn,
    FaRegPaperPlane as FaPaperPlane,
    FaRegCreditCard as FaCreditCard,
    FaUserFriends,
    FaBullseye,
    FaRobot,
    FaRegBuilding as FaBuilding,
    FaChevronRight,
    FaUserCog,
    FaRegFileAlt as FaFileAlt,
    FaRegListAlt as FaListAlt,
    FaRegIdBadge as FaIdBadge,
    FaCogs,
    FaRegQuestionCircle as FaQuestionCircle
} from 'react-icons/fa';
import './Sidebar.css';


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
    const [isGestaoUsuariosOpen, setIsGestaoUsuariosOpen] = useState(false);
    const [isAdministracaoOpen, setIsAdministracaoOpen] = useState(false);
    const [isChatbotOpen, setIsChatbotOpen] = useState(false);
    const [isEmpresaOpen, setIsEmpresaOpen] = useState(false);

    const settingsRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (location.pathname === '/chat') {
            clearUnreadCount();
        }
    }, [location.pathname, clearUnreadCount]);

    useEffect(() => {
        setIsMarketingOpen(['/campanhas', '/campaign-templates'].includes(location.pathname));
        setIsReportsOpen(location.pathname.startsWith('/relatorios'));
        setIsGestaoUsuariosOpen(['/users', '/equipes', '/tipos-usuario'].includes(location.pathname));
        setIsAdministracaoOpen(['/metas', '/campos-personalizados'].includes(location.pathname));
        setIsChatbotOpen(['/chat-rules', '/products'].includes(location.pathname));
        setIsEmpresaOpen(['/gerenciar-empresa', '/empresas', '/gerenciar-planos', '/connections', '/admin/help'].includes(location.pathname));
    }, [location.pathname]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (settingsRef.current && !settingsRef.current.contains(event.target as Node)) {
                setIsMarketingOpen(false);
                setIsReportsOpen(false);
                setIsGestaoUsuariosOpen(false);
                setIsAdministracaoOpen(false);
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
    const can = (perm: string) => {
        if (perm === 'gestao_campos_personalizados') {
            return hasPermission(permissions, ['gestao_campos_personalizados', 'gestão_campos_personalizados']);
        }
        return hasPermission(permissions, [perm]);
    };

    let userEmpresaId: number | null = null;
    try {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        userEmpresaId = user?.empresaId || null;
    } catch (e) {
        // ignore
    }
    const isEmpresa4Or8 = userEmpresaId === 4 || userEmpresaId === 8;

    // Active Checks
    const isMarketingActive = ['/campanhas', '/campaign-templates'].includes(location.pathname);
    const isReportsActive = location.pathname.startsWith('/relatorios');
    const isGestaoUsuariosActive = ['/users', '/equipes', '/tipos-usuario'].includes(location.pathname);
    const isAdministracaoActive = ['/metas', '/campos-personalizados'].includes(location.pathname);
    const isChatbotActive = ['/chat-rules', '/products'].includes(location.pathname);
    const isEmpresaActive = ['/gerenciar-empresa', '/empresas', '/gerenciar-planos', '/connections', '/admin/help'].includes(location.pathname);

    // Toggles
    const toggleMarketing = () => { setIsMarketingOpen(!isMarketingOpen); setIsReportsOpen(false); setIsGestaoUsuariosOpen(false); setIsAdministracaoOpen(false); setIsChatbotOpen(false); setIsEmpresaOpen(false); };
    const toggleReports = () => { setIsReportsOpen(!isReportsOpen); setIsMarketingOpen(false); setIsGestaoUsuariosOpen(false); setIsAdministracaoOpen(false); setIsChatbotOpen(false); setIsEmpresaOpen(false); };
    const toggleGestaoUsuarios = () => { setIsGestaoUsuariosOpen(!isGestaoUsuariosOpen); setIsMarketingOpen(false); setIsReportsOpen(false); setIsAdministracaoOpen(false); setIsChatbotOpen(false); setIsEmpresaOpen(false); };
    const toggleAdministracao = () => { setIsAdministracaoOpen(!isAdministracaoOpen); setIsMarketingOpen(false); setIsReportsOpen(false); setIsGestaoUsuariosOpen(false); setIsChatbotOpen(false); setIsEmpresaOpen(false); };
    const toggleChatbot = () => { setIsChatbotOpen(!isChatbotOpen); setIsMarketingOpen(false); setIsReportsOpen(false); setIsGestaoUsuariosOpen(false); setIsAdministracaoOpen(false); setIsEmpresaOpen(false); };
    const toggleEmpresa = () => { setIsEmpresaOpen(!isEmpresaOpen); setIsMarketingOpen(false); setIsReportsOpen(false); setIsGestaoUsuariosOpen(false); setIsAdministracaoOpen(false); setIsChatbotOpen(false); };

    const closeSettings = () => {
        setIsMarketingOpen(false);
        setIsReportsOpen(false);
        setIsGestaoUsuariosOpen(false);
        setIsAdministracaoOpen(false);
        setIsChatbotOpen(false);
        setIsEmpresaOpen(false);
    };

    return (
        <aside className="sidebar" ref={settingsRef}>

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
                                        <Link to="/campanhas" className={`sidebar-sub-link ${location.pathname === '/campanhas' ? 'active' : ''}`}>
                                            <FaPaperPlane />
                                            <span>Disparador</span>
                                        </Link>
                                    )}
                                    {can('marketing_templates') && (
                                        <Link to="/campaign-templates" className={`sidebar-sub-link ${location.pathname === '/campaign-templates' ? 'active' : ''}`}>
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
                                        <Link to="/relatorios/vendas" className={`sidebar-sub-link ${location.pathname === '/relatorios/vendas' ? 'active' : ''}`}>
                                            <FaFileAlt />
                                            <span>Vendas</span>
                                        </Link>
                                    )}
                                    {can('relatorio_campanhas') && (
                                        <Link to="/relatorios/campanhas" className={`sidebar-sub-link ${location.pathname === '/relatorios/campanhas' ? 'active' : ''}`}>
                                            <FaFileAlt />
                                            <span>Campanhas</span>
                                        </Link>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {(can('gestao_usuarios') || can('gestao_equipes') || can('gestao_metas') || can('gestao_campos_personalizados') || can('gestao_tipos_usuario') || can('regras_chatbot') || can('gestao_produtos') || can('gestao_conexoes') || can('dias_funcionamento') || can('gestao_empresas') || (can('gerenciar_planos') && !isEmpresa4Or8)) && (
                    <div className="sidebar-group">
                        <div className="sidebar-group-title">Administração</div>

                        {/* Gestão de usuários */}
                        {(can('gestao_usuarios') || can('gestao_equipes') || can('gestao_tipos_usuario')) && (
                            <div className="sidebar-item-wrapper">
                                <button
                                    id="sidebar-gestao-usuarios-admin"
                                    className={`sidebar-btn ${isGestaoUsuariosActive || isGestaoUsuariosOpen ? 'active' : ''} ${isGestaoUsuariosOpen ? 'open' : ''}`}
                                    onClick={toggleGestaoUsuarios}
                                >
                                    <FaUsersCog />
                                    <span>Gestão de usuários</span>
                                    <FaChevronRight className="chevron-icon" />
                                </button>
                                <div className={`sidebar-accordion ${isGestaoUsuariosOpen ? 'open' : ''}`}>
                                    <div className="sidebar-accordion-content">
                                        {can('gestao_usuarios') && (
                                            <Link id="sidebar-users" to="/users" className={`sidebar-sub-link ${location.pathname === '/users' ? 'active' : ''}`}>
                                                <FaUsers />
                                                <span>Usuários</span>
                                            </Link>
                                        )}
                                        {can('gestao_tipos_usuario') && (
                                            <Link to="/tipos-usuario" className={`sidebar-sub-link ${location.pathname === '/tipos-usuario' ? 'active' : ''}`}>
                                                <FaIdBadge />
                                                <span>Perfis</span>
                                            </Link>
                                        )}
                                        {can('gestao_equipes') && (
                                            <Link to="/equipes" className={`sidebar-sub-link ${location.pathname === '/equipes' ? 'active' : ''}`}>
                                                <FaUsers />
                                                <span>Equipes</span>
                                            </Link>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Administração */}
                        {(can('gestao_metas') || can('gestao_campos_personalizados')) && (
                            <div className="sidebar-item-wrapper">
                                <button
                                    id="sidebar-administracao-admin"
                                    className={`sidebar-btn ${isAdministracaoActive || isAdministracaoOpen ? 'active' : ''} ${isAdministracaoOpen ? 'open' : ''}`}
                                    onClick={toggleAdministracao}
                                >
                                    <FaCogs />
                                    <span>Administração</span>
                                    <FaChevronRight className="chevron-icon" />
                                </button>
                                <div className={`sidebar-accordion ${isAdministracaoOpen ? 'open' : ''}`}>
                                    <div className="sidebar-accordion-content">
                                        {can('gestao_metas') && (
                                            <Link to="/metas" className={`sidebar-sub-link ${location.pathname === '/metas' ? 'active' : ''}`}>
                                                <FaBullseye />
                                                <span>Metas</span>
                                            </Link>
                                        )}
                                        {can('gestao_campos_personalizados') && (
                                            <Link to="/campos-personalizados" className={`sidebar-sub-link ${location.pathname === '/campos-personalizados' ? 'active' : ''}`}>
                                                <FaListAlt />
                                                <span>Campos Personalizados</span>
                                            </Link>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Chatbot */}
                        {(can('regras_chatbot') || can('gestao_produtos')) && (
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
                                            <Link to="/chat-rules" className={`sidebar-sub-link ${location.pathname === '/chat-rules' ? 'active' : ''}`}>
                                                <FaComments />
                                                <span>Regras do Chat</span>
                                            </Link>
                                        )}
                                        {can('gestao_produtos') && (
                                            <Link to="/products" className={`sidebar-sub-link ${location.pathname === '/products' ? 'active' : ''}`}>
                                                <FaBox />
                                                <span>Produtos</span>
                                            </Link>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Empresa */}
                        {(can('dias_funcionamento') || can('gestao_empresas') || (can('gerenciar_planos') && !isEmpresa4Or8) || can('gestao_conexoes') || can('gbcode_admin_sistema')) && (
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
                                            <Link to="/gerenciar-empresa" className={`sidebar-sub-link ${location.pathname === '/gerenciar-empresa' ? 'active' : ''}`}>
                                                <FaUserCog />
                                                <span>Gerenciar Empresa</span>
                                            </Link>
                                        )}
                                        {can('gestao_empresas') && (
                                            <Link to="/empresas" className={`sidebar-sub-link ${location.pathname === '/empresas' ? 'active' : ''}`}>
                                                <FaBuilding />
                                                <span>Empresas</span>
                                            </Link>
                                        )}
                                        {can('gestao_conexoes') && (
                                            <Link to="/connections" className={`sidebar-sub-link ${location.pathname === '/connections' ? 'active' : ''}`}>
                                                <FaPlug />
                                                <span>Conexões</span>
                                            </Link>
                                        )}
                                        {can('gerenciar_planos') && !isEmpresa4Or8 && (
                                            <Link to="/gerenciar-planos" className={`sidebar-sub-link ${location.pathname === '/gerenciar-planos' ? 'active' : ''}`}>
                                                <FaCreditCard />
                                                <span>Gerenciar Planos</span>
                                            </Link>
                                        )}
                                        {can('gbcode_admin_sistema') && (
                                            <Link to="/admin/help" className={`sidebar-sub-link ${location.pathname === '/admin/help' ? 'active' : ''}`}>
                                                <FaQuestionCircle />
                                                <span>Central de Ajuda</span>
                                            </Link>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                    </div>
                )}
            </nav>

            <div className="sidebar-footer">
                <Link
                    to="/help"
                    className={`sidebar-footer-link ${location.pathname === '/help' ? 'active' : ''}`}
                    title="Ajuda"
                >
                    <FaQuestionCircle />
                    <span>Ajuda</span>
                </Link>
                {!isEmpresa4Or8 && (
                    <>
                        <div className="sidebar-footer-divider" />
                        <Link
                            to="/plano"
                            className={`sidebar-footer-link ${location.pathname === '/plano' ? 'active' : ''}`}
                            title="Meu Plano"
                        >
                            <FaCreditCard />
                            <span>Meu Plano</span>
                        </Link>
                    </>
                )}
            </div>
        </aside>
    );
};

export default Sidebar;
