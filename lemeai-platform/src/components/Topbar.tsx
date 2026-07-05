import { useState, useEffect, type FC, useRef, useCallback } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { useGlobalNotification } from '../contexts/GlobalNotificationContext';
import { useTheme } from '../contexts/ThemeContext'; // Assuming ThemeContext provides the theme
import {
    FaUser,
    FaSignOutAlt,
    FaBars,
    FaMoon,
    FaSun,
    FaCreditCard,
    FaBell,
    FaBullhorn,
    FaUserClock,
    FaTasks,
    FaExternalLinkAlt,
    FaSearch,
    FaTimes,
    FaBuilding
} from 'react-icons/fa';
import ThemeToggle from './ThemeToggle';
import { novidadesData } from '../data/novidadesMock';
import { OpportunityService, type Opportunity } from '../services/OpportunityService';
import { AgendaService, type AgendaEvent } from '../services/AgendaService';
import { TarefaService, type Tarefa } from '../services/TarefaService';
import { ContactService } from '../services/ContactService';
import './Topbar.css';
import logoCrm from '../assets/logo_novo.png';
import logoCrmDark from '../assets/logo_novo_dark.png';

interface TopbarProps {
    onToggleMobileMenu: () => void;
    onViewProfile: () => void;
    onLogout: () => void;
}

const Topbar: FC<TopbarProps> = ({ onToggleMobileMenu, onViewProfile, onLogout }) => {
    const location = useLocation();
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const isEmpresa4Or8 = user?.empresaId === 4 || user?.empresaId === 8;
    const [photoUrl, setPhotoUrl] = useState<string | null>(user?.photoUrl ?? null);

    const empresaEmTrial = user?.empresaEmTrial === true;
    const trialDiasRestantes = (() => {
        if (!empresaEmTrial || !user?.dataExpiracaoPlano) return null;
        const expira = new Date(user.dataExpiracaoPlano);
        expira.setHours(0, 0, 0, 0);
        const hoje = new Date();
        hoje.setHours(0, 0, 0, 0);
        return Math.ceil((expira.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));
    })();

    useEffect(() => {
        const handlePhotoUpdate = (e: Event) => {
            const detail = (e as CustomEvent<{ photoUrl: string | null }>).detail;
            setPhotoUrl(detail.photoUrl);
        };
        window.addEventListener('userPhotoUpdated', handlePhotoUpdate);
        return () => window.removeEventListener('userPhotoUpdated', handlePhotoUpdate);
    }, []);

    const [isNovidadesOpen, setIsNovidadesOpen] = useState(false);
    const novidadesRef = useRef<HTMLDivElement>(null);

    // Search states
    const [searchTerm, setSearchTerm] = useState('');
    const [allDeals, setAllDeals] = useState<Opportunity[]>([]);
    const [contactsDetailsMap, setContactsDetailsMap] = useState<Record<number, any>>({});
    const [searchResults, setSearchResults] = useState<Opportunity[]>([]);
    const [isSearchFocused, setIsSearchFocused] = useState(false);
    const searchContainerRef = useRef<HTMLDivElement>(null);

    const loadSearchData = useCallback(async () => {
        try {
            const [opps, contactsData] = await Promise.all([
                OpportunityService.getAllOpportunities().catch(() => []),
                ContactService.getAll().catch(() => ({ sucesso: false, dados: [] }))
            ]);

            setAllDeals(opps);

            const cMap: Record<number, any> = {};
            if (contactsData.sucesso && Array.isArray(contactsData.dados)) {
                contactsData.dados.forEach((c: any) => {
                    cMap[c.contatoId] = c;
                });
                setContactsDetailsMap(cMap);
            }
        } catch (err) {
            console.error("Erro ao carregar dados para pesquisa:", err);
        }
    }, []);

    useEffect(() => {
        loadSearchData();
    }, [loadSearchData]);

    const handleSearchFocus = () => {
        setIsSearchFocused(true);
        loadSearchData();
    };

    useEffect(() => {
        if (!searchTerm.trim()) {
            setSearchResults([]);
            return;
        }

        const term = searchTerm.toLowerCase().trim();
        const cleanTerm = term.replace(/\D/g, '');

        const filtered = allDeals.filter(opp => {
            const contact = contactsDetailsMap[opp.idContato];

            const matchName = opp.nomeContato?.toLowerCase().includes(term);
            const matchWhatsapp = opp.numeroWhatsapp?.toLowerCase().includes(term);
            const matchEmail = contact?.email?.toLowerCase().includes(term);

            const cleanWhatsapp = opp.numeroWhatsapp?.replace(/\D/g, '') || '';
            const cleanContactPhone = contact?.telefone?.replace(/\D/g, '') || '';

            const matchPhone = !!(cleanTerm && (cleanWhatsapp.includes(cleanTerm) || cleanContactPhone.includes(cleanTerm)));

            return matchName || matchWhatsapp || matchEmail || matchPhone;
        });

        setSearchResults(filtered);
    }, [searchTerm, allDeals, contactsDetailsMap]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (novidadesRef.current && !novidadesRef.current.contains(event.target as Node)) {
                setIsNovidadesOpen(false);
            }
            if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
                setIsSearchFocused(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    useEffect(() => {
        setIsNovidadesOpen(false);
        setIsSearchFocused(false);
        setSearchTerm('');
    }, [location.pathname]);

    interface UnifiedTask {
        id: string;
        title: string;
        time: string;
        contactName?: string | null;
        details?: string | null;
        type: 'agenda' | 'deal';
        conversaId?: number | null;
    }

    const [isNotificacoesOpen, setIsNotificacoesOpen] = useState(false);
    const [leadsHoje, setLeadsHoje] = useState<Opportunity[]>([]);
    const [tarefasHoje, setTarefasHoje] = useState<UnifiedTask[]>([]);
    const [contactsMap, setContactsMap] = useState<Record<number, string>>({});
    const [notifCount, setNotifCount] = useState(0);
    const [isLoadingNotif, setIsLoadingNotif] = useState(false);
    const notificacoesRef = useRef<HTMLDivElement>(null);

    const isSameDay = (dateString: string | null | undefined, targetDate: Date) => {
        if (!dateString) return false;
        const date = new Date(dateString);
        return date.getDate() === targetDate.getDate() &&
            date.getMonth() === targetDate.getMonth() &&
            date.getFullYear() === targetDate.getFullYear();
    };

    const updateNotificationCount = useCallback(async () => {
        try {
            const today = new Date();
            const [opps, agendaEvents, dealTasks] = await Promise.all([
                OpportunityService.getAllOpportunities().catch(() => []),
                AgendaService.getAll().catch(() => []),
                TarefaService.getAll().catch(() => [])
            ]);

            const activeLeadsToday = opps.filter(opp => opp.idStauts === 1 && isSameDay(opp.dataConversaCriada, today));
            const activeAgendaToday = agendaEvents.filter(task => isSameDay(task.dataInicio, today));
            const activeDealTasksToday = dealTasks.filter(task => !task.estaConcluida && isSameDay(task.dataRetorno, today));

            setNotifCount(activeLeadsToday.length + activeAgendaToday.length + activeDealTasksToday.length);
        } catch (err) {
            console.error("Erro ao buscar contagem de notificações:", err);
        }
    }, []);

    useEffect(() => {
        updateNotificationCount();
        const interval = setInterval(updateNotificationCount, 60000);
        return () => clearInterval(interval);
    }, [updateNotificationCount]);

    const handleOpenNotificacoes = async () => {
        const nextState = !isNotificacoesOpen;
        setIsNotificacoesOpen(nextState);
        setIsNovidadesOpen(false);

        if (nextState) {
            setIsLoadingNotif(true);
            try {
                const today = new Date();
                const [opps, agendaEvents, dealTasks, contactsData] = await Promise.all([
                    OpportunityService.getAllOpportunities().catch(() => []),
                    AgendaService.getAll().catch(() => []),
                    TarefaService.getAll().catch(() => []),
                    ContactService.getAll().catch(() => ({ sucesso: false, dados: [] }))
                ]);

                // Map contactId -> Contact Name
                const cMap: Record<number, string> = {};
                if (contactsData.sucesso && Array.isArray(contactsData.dados)) {
                    contactsData.dados.forEach((c: any) => {
                        cMap[c.contatoId] = c.nome;
                    });
                    setContactsMap(cMap);
                }

                // Map idConversa -> Client Name
                const conversaToContactMap: Record<number, string> = {};
                opps.forEach(opp => {
                    conversaToContactMap[opp.idConversa] = opp.nomeContato || opp.numeroWhatsapp;
                });

                // Filter and Map Agenda Events
                const activeAgendaToday = agendaEvents.filter(task => isSameDay(task.dataInicio, today));
                const mappedAgenda: UnifiedTask[] = activeAgendaToday.map(event => {
                    const contactName = event.contatoId ? cMap[event.contatoId] : null;
                    return {
                        id: `agenda-${event.agendaId}`,
                        title: event.descricao,
                        time: new Date(event.dataInicio).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
                        contactName,
                        details: event.detalhes,
                        type: 'agenda'
                    };
                });

                // Filter and Map Deal Tasks
                const activeDealTasksToday = dealTasks.filter(task => !task.estaConcluida && isSameDay(task.dataRetorno, today));
                const mappedDealTasks: UnifiedTask[] = activeDealTasksToday.map(task => {
                    const contactName = task.conversaId ? conversaToContactMap[task.conversaId] : null;
                    return {
                        id: `deal-${task.tarefaId}`,
                        title: task.descricao,
                        time: task.dataRetorno ? new Date(task.dataRetorno).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '--:--',
                        contactName,
                        details: 'Tarefa do Funil',
                        type: 'deal',
                        conversaId: task.conversaId
                    };
                });

                const combinedTasks = [...mappedAgenda, ...mappedDealTasks];

                const activeLeadsToday = opps.filter(opp => opp.idStauts === 1 && isSameDay(opp.dataConversaCriada, today));

                setLeadsHoje(activeLeadsToday);
                setTarefasHoje(combinedTasks);
                setNotifCount(activeLeadsToday.length + combinedTasks.length);
            } catch (err) {
                console.error("Erro ao carregar detalhes de notificações:", err);
            } finally {
                setIsLoadingNotif(false);
            }
        }
    };

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (notificacoesRef.current && !notificacoesRef.current.contains(event.target as Node)) {
                setIsNotificacoesOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    useEffect(() => {
        setIsNotificacoesOpen(false);
    }, [location.pathname]);

    return (
        <header className="topbar">
            <div className="topbar-left">
                <button className="topbar-menu-btn mobile-only" onClick={onToggleMobileMenu} title="Menu">
                    <FaBars />
                </button>
                <Link to="/dashboard" className="topbar-logo-link">
                    <img src={logoCrm} alt="Brik CRM" className="topbar-system-logo light-logo" />
                    <img src={logoCrmDark} alt="Brik CRM" className="topbar-system-logo dark-logo" />
                </Link>
            </div>

            {/* Campo de Pesquisa de Deals */}
            <div className="topbar-search-container" ref={searchContainerRef}>
                <div className="topbar-search-input-wrapper">
                    <input
                        type="text"
                        placeholder="Buscar oportunidades"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        onFocus={handleSearchFocus}
                        className="topbar-search-input"
                        autoComplete="off"
                    />
                    <FaSearch className="topbar-search-icon" />
                    {searchTerm && (
                        <button className="topbar-search-clear-btn" onClick={() => setSearchTerm('')} title="Limpar pesquisa">
                            <FaTimes />
                        </button>
                    )}
                </div>

                {isSearchFocused && searchTerm.trim() !== '' && (
                    <div className="topbar-search-results-dropdown">
                        {searchResults.length === 0 ? (
                            <div className="topbar-search-no-results">
                                Nenhum negócio encontrado
                            </div>
                        ) : (
                            searchResults.map(opp => {
                                const contact = contactsDetailsMap[opp.idContato];
                                return (
                                    <Link
                                        key={opp.idConversa}
                                        to={`/pipeline/deal/${opp.idConversa}`}
                                        onClick={() => {
                                            setSearchTerm('');
                                            setIsSearchFocused(false);
                                        }}
                                        className="topbar-search-result-item"
                                    >
                                        <div className="topbar-search-result-main">
                                            <span className="topbar-search-result-name">{opp.nomeContato}</span>
                                            <div className="topbar-search-result-meta">
                                                <span>{opp.numeroWhatsapp}</span>
                                                {contact?.email && (
                                                    <>
                                                        <span>•</span>
                                                        <span>{contact.email}</span>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                        <div className="topbar-search-result-side">
                                            <span className="topbar-search-result-status">
                                                {opp.descricaoStatus}
                                            </span>
                                            {opp.valor > 0 && (
                                                <span className="topbar-search-result-value">
                                                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(opp.valor)}
                                                </span>
                                            )}
                                        </div>
                                    </Link>
                                );
                            })
                        )}
                    </div>
                )}
            </div>

            <div className="topbar-right">
                <div className="topbar-nav-items">
                    {empresaEmTrial && (
                        <Link to="/plano" className="topbar-trial-badge" title="Ver planos disponíveis">
                            <FaCreditCard />
                            <span>
                                Plano Gratuito - {trialDiasRestantes !== null && trialDiasRestantes >= 0
                                    ? `Expira em ${trialDiasRestantes} dia${trialDiasRestantes === 1 ? '' : 's'}`
                                    : 'Expirado'}
                            </span>
                        </Link>
                    )}
                    <div className="topbar-notificacoes-container" ref={notificacoesRef}>
                        <button
                            className={`topbar-item ${isNotificacoesOpen ? 'active' : ''}`}
                            title="Notificações"
                            onClick={handleOpenNotificacoes}
                            style={{ position: 'relative' }}
                        >
                            <FaBell />
                            {notifCount > 0 && (
                                <span className="topbar-notif-badge">
                                    {notifCount}
                                </span>
                            )}
                        </button>

                        {isNotificacoesOpen && (
                            <div className="topbar-notificacoes-popover">
                                <div className="notif-popover-header">
                                    <h3>Notificações de Hoje</h3>
                                </div>
                                <div className="notif-popover-body">
                                    {isLoadingNotif ? (
                                        <div className="notif-loading">
                                            <div className="notif-spinner"></div>
                                            <span>Carregando...</span>
                                        </div>
                                    ) : (
                                        <>
                                            {/* Section 1: Leads IA */}
                                            <div className="notif-section">
                                                <h4 className="notif-section-title">
                                                    <FaUserClock /> Leads em Atendimento IA ({leadsHoje.length})
                                                </h4>
                                                {leadsHoje.length === 0 ? (
                                                    <p className="notif-empty-msg">Nenhum lead novo na IA hoje.</p>
                                                ) : (
                                                    <div className="notif-list">
                                                        {leadsHoje.map(lead => (
                                                            <Link
                                                                key={lead.idConversa}
                                                                to={`/pipeline/deal/${lead.idConversa}`}
                                                                className="notif-item lead-item"
                                                            >
                                                                <div className="notif-item-info">
                                                                    <span className="notif-item-name">{lead.nomeContato || lead.numeroWhatsapp}</span>
                                                                    <span className="notif-item-details">
                                                                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(lead.valor || 0)}
                                                                    </span>
                                                                </div>
                                                                <div className="notif-item-right">
                                                                    <span className="notif-item-time">
                                                                        {new Date(lead.dataConversaCriada).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                                                    </span>
                                                                    <FaExternalLinkAlt className="notif-external-icon" />
                                                                </div>
                                                            </Link>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>

                                            {/* Section 2: Tarefas */}
                                            <div className="notif-section">
                                                <h4 className="notif-section-title">
                                                    <FaTasks /> Tarefas de Hoje ({tarefasHoje.length})
                                                </h4>
                                                {tarefasHoje.length === 0 ? (
                                                    <p className="notif-empty-msg">Nenhuma tarefa pendente para hoje.</p>
                                                ) : (
                                                    <div className="notif-list">
                                                        {tarefasHoje.map(task => {
                                                            const linkTarget = task.type === 'deal' && task.conversaId
                                                                ? `/pipeline/deal/${task.conversaId}`
                                                                : '/agenda';
                                                            return (
                                                                <Link
                                                                    key={task.id}
                                                                    to={linkTarget}
                                                                    className="notif-item task-item"
                                                                >
                                                                    <div className="notif-item-info">
                                                                        <span className="notif-item-name">{task.title}</span>
                                                                        {task.contactName && (
                                                                            <span className="notif-item-details">
                                                                                Contato: {task.contactName}
                                                                            </span>
                                                                        )}
                                                                        {task.details && (
                                                                            <span className="notif-item-details" style={{ opacity: 0.8, marginTop: '2px' }}>
                                                                                {task.details}
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                    <div className="notif-item-right">
                                                                        <span className="notif-item-time">{task.time}</span>
                                                                        <FaExternalLinkAlt className="notif-external-icon" />
                                                                    </div>
                                                                </Link>
                                                            );
                                                        })}
                                                    </div>
                                                )}
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/*
                    <div className="topbar-divider"></div>

                    <div className="topbar-novidades-container" ref={novidadesRef}>
                        <button
                            className={`topbar-item ${isNovidadesOpen ? 'active' : ''}`}
                            title="Novidades"
                            onClick={() => setIsNovidadesOpen(!isNovidadesOpen)}
                        >
                            <FaBullhorn />
                        </button>

                        {isNovidadesOpen && (
                            <div className="topbar-novidades-popover">
                                <div className="novidades-popover-header">
                                    <h3>Últimas Novidades</h3>
                                </div>
                                <div className="novidades-popover-body">
                                    {novidadesData.slice(0, 3).map((item) => (
                                        <div key={item.id} className="novidades-popover-item">
                                            <div className="novidades-item-header">
                                                <span className={`novidades-tag tag-${item.category}`}>
                                                    {item.category === 'recurso' ? 'Novo Recurso' : item.category === 'melhoria' ? 'Melhoria' : 'Correção'}
                                                </span>
                                                <span className="novidades-item-date">{item.date}</span>
                                            </div>
                                            <h4 className="novidades-item-title">{item.title}</h4>
                                            <p className="novidades-item-summary">{item.summary}</p>
                                        </div>
                                    ))}
                                </div>
                                <div className="novidades-popover-footer">
                                    <Link to="/novidades" className="novidades-view-all">
                                        Ver todas as novidades
                                    </Link>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="topbar-divider"></div>

                    <Link
                        id="topbar-billing"
                        to="/plano"
                        className={`topbar-item ${location.pathname === '/plano' ? 'active' : ''}`}
                        style={{ textDecoration: 'none' }}
                    >
                        <FaCreditCard />
                        <span>Meu Plano</span>
                    </Link>

                    <div className="topbar-divider"></div>
                    */}

                    <div className="topbar-divider"></div>

                    <button id="topbar-user-profile" className="topbar-item" onClick={onViewProfile}>
                        {photoUrl ? (
                            <img src={photoUrl} className="topbar-avatar-img" alt="Avatar" />
                        ) : (
                            <FaUser />
                        )}
                        <span>Minha conta</span>
                    </button>

                    <div className="topbar-divider"></div>

                    <ThemeToggle collapsed={true} />

                    <div className="topbar-divider"></div>

                    <button className="topbar-item" onClick={onLogout}>
                        <FaSignOutAlt className="logout-icon" />
                        <span>Sair</span>
                    </button>
                </div>
            </div>
        </header>
    );
};

export default Topbar;
