import { useState, useEffect, useCallback, useMemo, type ReactElement } from 'react';
import toast from 'react-hot-toast';
import {
    FaPlus,
    FaTrash,
    FaEdit,
    FaPaperPlane,
    FaBullhorn,
    FaTimes,
    FaCheckCircle,
    FaTimesCircle,
    FaClock,
    FaSpinner,
    FaChevronLeft,
    FaChevronRight,
    FaChevronUp,
    FaUsers,
    FaUserPlus,
    FaClipboardList,
    FaEye,
    FaMapMarkerAlt,
} from 'react-icons/fa';
import {
    CampaignService,
    type Campaign,
    type CampaignMetrics,
    type CampanhaStatus,
    type CampanhaCategoria,
    type Destinatario,
    type Disparo,
} from '../services/CampaignService';
import { ContactService, type Contact } from '../services/ContactService';
import { MetaTemplateService, type MetaTemplate } from '../services/MetaTemplateService';
import CustomSelect from '../components/CustomSelect';
import WhatsAppConnectionGuard from '../components/WhatsAppConnectionGuard';
import { apiFetch } from '../services/api';
import './CampaignPage.css';

// ---- Badges ----

const STATUS_LABEL: Record<CampanhaStatus, string> = {
    Rascunho: 'Rascunho',
    Enviando: 'Enviando',
    Finalizada: 'Finalizada',
};

const CATEGORIA_LABEL: Record<CampanhaCategoria, string> = {
    MARKETING: 'Marketing',
    UTILITY: 'Utilidade',
    AUTHENTICATION: 'Autenticação',
};

const STATUS_FILTER_OPTIONS = [
    { value: 'TODOS', label: 'Todos os status' },
    ...Object.entries(STATUS_LABEL).map(([v, l]) => ({ value: v, label: l }))
];

const CATEGORIA_FILTER_OPTIONS = [
    { value: 'TODOS', label: 'Todas as categorias' },
    ...Object.entries(CATEGORIA_LABEL).map(([v, l]) => ({ value: v, label: l }))
];

const CUSTO_UNITARIO_BRL = 0.31; // R$ 0,31 por envio (equivalente a $0.0625 da Meta)

function StatusBadge({ status }: { status: CampanhaStatus }) {
    const icons: Record<CampanhaStatus, ReactElement> = {
        Rascunho: <FaClock size={10} />,
        Enviando: <FaSpinner size={10} />,
        Finalizada: <FaCheckCircle size={10} />,
    };
    const cls = status.toLowerCase();
    return (
        <span className={`camp-status-badge camp-status-${cls}`}>
            {icons[status]} {STATUS_LABEL[status]}
        </span>
    );
}

function CategoriaBadge({ categoria }: { categoria: CampanhaCategoria }) {
    return (
        <span className={`camp-cat-badge camp-cat-${categoria.toLowerCase()}`}>
            {CATEGORIA_LABEL[categoria]}
        </span>
    );
}

// ---- Create / Edit Modal ----

interface CampaignWizardModalProps {
    campaign: Campaign | null;
    onClose: () => void;
    onSaved: () => void;
}

type VarSource = 'contact_name' | 'contact_phone' | 'fixed';

interface VarMapping {
    source: VarSource;
    fixedValue: string;
}

const VAR_SOURCE_LABEL: Record<VarSource, string> = {
    contact_name: 'Nome do contato',
    contact_phone: 'Telefone do contato',
    fixed: 'Valor fixo (igual para todos)',
};

interface FinalContact {
    nome: string;
    telefone: string;
    destinatarioId?: number;
}

function detectBodyVars(componentesJson: string | null): { count: number; bodyText: string } {
    if (!componentesJson) return { count: 0, bodyText: '' };
    try {
        const comps: any[] = JSON.parse(componentesJson);
        const body = comps.find((c) => c.type === 'BODY');
        if (!body?.text) return { count: 0, bodyText: '' };
        const matches = body.text.match(/\{\{\d+\}\}/g) ?? [];
        const indices = matches.map((m: string) => parseInt(m.replace(/\D/g, ''), 10));
        return {
            count: indices.length > 0 ? Math.max(...indices) : 0,
            bodyText: body.text,
        };
    } catch {
        return { count: 0, bodyText: '' };
    }
}

function resolveVar(contact: { nome: string; telefone: string }, mapping: VarMapping): string {
    if (mapping.source === 'contact_name') return contact.nome;
    if (mapping.source === 'contact_phone') return contact.telefone;
    return mapping.fixedValue;
}

function CampaignWizardModal({ campaign, onClose, onSaved }: CampaignWizardModalProps) {
    const isEdit = campaign !== null;
    const [step, setStep] = useState(campaign ? 2 : 1);

    const [nome, setNome] = useState(campaign?.campanhaNome ?? '');
    const [agendadaEm] = useState(campaign?.campanhaAgendadaEm ? campaign.campanhaAgendadaEm.substring(0, 16) : '');

    // Passo 2: Público
    const [publicoTipo, setPublicoTipo] = useState<'BASE' | 'MANUAL' | 'COLA'>('BASE');
    const [baseContacts, setBaseContacts] = useState<Contact[]>([]);
    const [selectedBaseContacts, setSelectedBaseContacts] = useState<Set<number>>(new Set());
    const [contactSearch, setContactSearch] = useState('');

    // Contatos Manuais
    const [newManualName, setNewManualName] = useState('');
    const [newManualPhone, setNewManualPhone] = useState('');

    // Contatos Colados
    const [coladosRaw, setColadosRaw] = useState('');

    // Lista acumulada final de contatos
    const [finalContacts, setFinalContacts] = useState<FinalContact[]>([]);
    const [removedDestinatarioIds, setRemovedDestinatarioIds] = useState<number[]>([]);
    const [isSummaryExpanded, setIsSummaryExpanded] = useState(false);
    const [addedSearchTerm, setAddedSearchTerm] = useState('');

    const filteredAddedContacts = finalContacts.filter(c =>
        (c.nome?.toLowerCase() ?? '').includes(addedSearchTerm.toLowerCase()) ||
        (c.telefone ?? '').includes(addedSearchTerm)
    );

    const handleAddBaseSelected = () => {
        const toAdd = baseContacts
            .filter(c => selectedBaseContacts.has(c.contatoId))
            .map(c => ({ nome: c.nome, telefone: c.telefone }));
        
        setFinalContacts(prev => {
            const existingPhones = new Set(prev.map(p => p.telefone));
            const filteredToAdd = toAdd.filter(c => !existingPhones.has(c.telefone));
            return [...prev, ...filteredToAdd];
        });
        setSelectedBaseContacts(new Set());
        toast.success(`${toAdd.length} contatos adicionados da base!`);
    };

    const handleAddManual = () => {
        const cleanPhone = newManualPhone.replace(/\D/g, '');
        if (!newManualName.trim() || cleanPhone.length < 8) {
            toast.error('Informe nome e telefone válidos.');
            return;
        }
        if (finalContacts.some(c => c.telefone === cleanPhone)) {
            toast.error('Este contato já foi adicionado.');
            return;
        }
        setFinalContacts(prev => [...prev, { nome: newManualName.trim(), telefone: cleanPhone }]);
        setNewManualName('');
        setNewManualPhone('');
        toast.success('Contato manual adicionado!');
    };

    const handleAddColados = () => {
        const parsed = coladosRaw.split('\n')
            .map(line => {
                if (!line.trim()) return null;
                const parts = line.split(/[,;\t]/);
                if (parts.length >= 2) {
                    return { nome: parts[0].trim(), telefone: parts[1].replace(/\D/g, '').trim() };
                }
                const tel = line.replace(/\D/g, '').trim();
                return { nome: `Contato ${tel}`, telefone: tel };
            })
            .filter((c): c is FinalContact => c !== null && c.telefone.length >= 8);

        if (parsed.length === 0) {
             toast.error('Nenhum contato válido detectado.');
             return;
        }

        setFinalContacts(prev => {
            const existingPhones = new Set(prev.map(p => p.telefone));
            const filteredToAdd = parsed.filter(c => !existingPhones.has(c.telefone));
            return [...prev, ...filteredToAdd];
        });
        setColadosRaw('');
        toast.success(`${parsed.length} contatos colados adicionados!`);
    };

    // Contatos filtrados na busca do Passo 2 (Público da Base)
    const filteredBaseContacts = baseContacts.filter((c) => {
        const term = contactSearch.toLowerCase();
        return (c.nome?.toLowerCase() ?? '').includes(term) || (c.telefone ?? '').includes(contactSearch);
    });

    const isAllBaseSelected = filteredBaseContacts.length > 0 && filteredBaseContacts.every(c => selectedBaseContacts.has(c.contatoId));

    const toggleBaseContact = (id: number) => {
        setSelectedBaseContacts(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const toggleAllBase = () => {
        setSelectedBaseContacts(prev => {
            const next = new Set(prev);
            if (isAllBaseSelected) {
                filteredBaseContacts.forEach(c => next.delete(c.contatoId));
            } else {
                filteredBaseContacts.forEach(c => next.add(c.contatoId));
            }
            return next;
        });
    };

    // Passo 3: Conteúdo (Template)
    const [templates, setTemplates] = useState<MetaTemplate[]>([]);
    const [isLoadingTemplates, setIsLoadingTemplates] = useState(true);
    const [selectedTemplateName, setSelectedTemplateName] = useState(campaign?.campanhaTemplateNome ?? '');
    const [selectedTemplateIdioma, setSelectedTemplateIdioma] = useState(campaign?.campanhaTemplateIdioma ?? 'pt_BR');
    const [selectedTemplateCategoria, setSelectedTemplateCategoria] = useState<CampanhaCategoria>((campaign?.campanhaCategoria ?? 'MARKETING') as CampanhaCategoria);
    const [bodyText, setBodyText] = useState('');
    const [varMappings, setVarMappings] = useState<VarMapping[]>([]);
    const [couponCode, setCouponCode] = useState('');
    const [urlVariable, setUrlVariable] = useState('');

    const [locationName, setLocationName] = useState('');
    const [locationAddress, setLocationAddress] = useState('');
    const [locationLatitude, setLocationLatitude] = useState('');
    const [locationLongitude, setLocationLongitude] = useState('');
    const [isSearchingCoords, setIsSearchingCoords] = useState(false);

    // Passo 4: Submissão e Resultados
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [result, setResult] = useState<{ totalEnviados: number; totalFalhas: number } | null>(null);

    // Carregar dados iniciais
    useEffect(() => {
        const loadInitialData = async () => {
            setIsLoadingTemplates(true);
            try {
                const promises: Promise<any>[] = [
                    MetaTemplateService.getAll(),
                    ContactService.getAll(),
                ];
                if (isEdit && campaign?.campanhaId && campaign.campanhaStatus === 'Rascunho') {
                    promises.push(CampaignService.getDestinatarios(campaign.campanhaId));
                }

                const [templatesRes, contactsRes, destRes] = await Promise.all(promises);

                if (templatesRes.sucesso) {
                    const approved = (templatesRes.dados || []).filter((t) => t.status === 'APPROVED');
                    setTemplates(approved);

                    const currentTemplate = approved.find(t => t.nome === selectedTemplateName);
                    if (currentTemplate) {
                        const { count, bodyText: bt } = detectBodyVars(currentTemplate.componentesJson);
                        setBodyText(bt);
                        setVarMappings(Array.from({ length: count }, () => ({ source: 'fixed', fixedValue: '' })));
                    }
                }
                if (contactsRes.sucesso) {
                    setBaseContacts(contactsRes.dados || []);
                }
                if (destRes?.sucesso && destRes.dados) {
                    const loaded: FinalContact[] = (destRes.dados as Destinatario[]).map((d: Destinatario) => ({
                        nome: d.numero || d.bsuid || `Destinatário ${d.destinatarioId}`,
                        telefone: d.numero || d.bsuid || '',
                        destinatarioId: d.destinatarioId,
                    }));
                    setFinalContacts(loaded);
                }
            } catch {
                toast.error('Erro ao carregar dados do wizard.');
            } finally {
                setIsLoadingTemplates(false);
            }
        };
        loadInitialData();
    }, []);

    // Atualiza mapeamento ao selecionar um template
    const handleTemplateChange = (templateName: string) => {
        const selected = templates.find((t) => t.nome === templateName);
        if (selected) {
            setSelectedTemplateName(selected.nome);
            setSelectedTemplateIdioma(selected.idioma);
            setSelectedTemplateCategoria(selected.categoria);
            const { count, bodyText: bt } = detectBodyVars(selected.componentesJson);
            setBodyText(bt);
            setVarMappings(Array.from({ length: count }, () => ({ source: 'fixed', fixedValue: '' })));
        } else {
            setSelectedTemplateName('');
            setBodyText('');
            setVarMappings([]);
        }
    };

    const updateMapping = (index: number, patch: Partial<VarMapping>) => {
        setVarMappings((prev) => prev.map((m, i) => (i === index ? { ...m, ...patch } : m)));
    };

    const selectedTemplate = templates.find((t) => t.nome === selectedTemplateName);
    let templateButtons: any[] = [];
    let isLocationHeader = false;
    if (selectedTemplate?.componentesJson) {
        try {
            const comps = JSON.parse(selectedTemplate.componentesJson);
            const buttonsComp = comps.find((c: any) => c.type === 'BUTTONS');
            if (buttonsComp && Array.isArray(buttonsComp.buttons)) {
                templateButtons = buttonsComp.buttons;
            }
            const headerComp = comps.find((c: any) => c.type === 'HEADER');
            if (headerComp && headerComp.format === 'LOCATION') {
                isLocationHeader = true;
            }
        } catch (e) {
            console.error('Erro ao analisar componentesJson do template:', e);
        }
    }
    const copyCodeButtonIndex = templateButtons.findIndex(btn => btn.type === 'COPY_CODE');
    const urlVarButtonIndex = templateButtons.findIndex(btn => btn.type === 'URL' && btn.url && btn.url.includes('{{1}}'));

    const handleSearchCoordinates = async () => {
        if (!locationAddress.trim()) {
            toast.error('Digite um endereço para buscar as coordenadas.');
            return;
        }
        setIsSearchingCoords(true);
        try {
            // Tenta primeiro o ArcGIS Geocoding (altamente confiável no Brasil, sem problemas de CORS/User-Agent no localhost)
            const queryArcGIS = async (queryStr: string) => {
                try {
                    const response = await fetch(
                        `https://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer/findAddressCandidates?f=json&singleLine=${encodeURIComponent(queryStr)}&maxLocations=1`
                    );
                    if (!response.ok) return null;
                    const data = await response.json();
                    if (data?.candidates && data.candidates.length > 0) {
                        return {
                            lat: data.candidates[0].location.y.toString(),
                            lon: data.candidates[0].location.x.toString()
                        };
                    }
                } catch (e) {
                    console.error('Erro na requisição do ArcGIS:', e);
                }
                return null;
            };

            // Tenta o Nominatim (OpenStreetMap) como fallback
            const queryNominatim = async (queryStr: string) => {
                try {
                    const response = await fetch(
                        `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(queryStr)}`
                    );
                    if (!response.ok) return null;
                    const data = await response.json();
                    if (Array.isArray(data) && data.length > 0) {
                        return {
                            lat: data[0].lat,
                            lon: data[0].lon
                        };
                    }
                } catch (e) {
                    console.error('Erro na requisição do Nominatim:', e);
                }
                return null;
            };

            // 1. Tentar buscar endereço completo no ArcGIS
            let result = await queryArcGIS(locationAddress);

            // 2. Se falhar, tentar buscar no Nominatim
            if (!result) {
                result = await queryNominatim(locationAddress);
            }

            // 3. Se falhar, tentar simplificar o endereço (remover número)
            if (!result && locationAddress.includes(',')) {
                const parts = locationAddress.split(',');
                const cleanAddress = parts.filter((_, idx) => idx !== 1).join(',').trim();
                result = await queryArcGIS(cleanAddress) || await queryNominatim(cleanAddress);
            }

            // 4. Se ainda falhar, tentar buscar apenas pela primeira parte
            if (!result) {
                const firstPart = locationAddress.split(',')[0].trim();
                if (firstPart && firstPart !== locationAddress.trim()) {
                    result = await queryArcGIS(firstPart) || await queryNominatim(firstPart);
                }
            }

            if (result) {
                setLocationLatitude(result.lat);
                setLocationLongitude(result.lon);
                toast.success('Coordenadas encontradas e preenchidas!');
            } else {
                toast.error('Nenhuma coordenada encontrada para o endereço informado. Tente simplificar ou digite manualmente.');
            }
        } catch (error) {
            console.error('Erro geral ao buscar coordenadas:', error);
            toast.error('Erro ao conectar com os serviços de busca. Tente digitar manualmente.');
        } finally {
            setIsSearchingCoords(false);
        }
    };

    // Pré-visualização do conteúdo usando o primeiro contato da lista final
    const previewContact = finalContacts[0] ?? { nome: '[Nome Exemplo]', telefone: '5511999999999' };
    const previewText = bodyText
        ? varMappings.reduce((text, mapping, i) => {
            const val = mapping.source === 'fixed'
                ? mapping.fixedValue || `{{${i + 1}}}`
                : mapping.source === 'contact_name'
                    ? previewContact.nome
                    : previewContact.telefone;
            return text.replace(`{{${i + 1}}}`, val);
        }, bodyText)
        : '';

    // Salvar Campanha como Rascunho
    const handleSaveAsDraft = async () => {
        setIsSubmitting(true);
        try {
            const finalAgendadaEm = agendadaEm ? new Date(agendadaEm).toISOString() : undefined;
            let currentCampaignId = campaign?.campanhaId;

            if (!isEdit) {
                const res = await CampaignService.create({
                    nome: nome.trim(),
                    templateNome: selectedTemplateName,
                    templateIdioma: selectedTemplateIdioma,
                    categoria: selectedTemplateCategoria,
                    agendadaEm: finalAgendadaEm
                });
                if (!res.sucesso || !res.dados) {
                    toast.error(res.mensagem || 'Erro ao salvar rascunho.');
                    return;
                }
                currentCampaignId = res.dados.campanhaId;
            } else {
                const res = await CampaignService.update({
                    campanhaId: campaign.campanhaId,
                    nome: nome.trim(),
                    templateNome: selectedTemplateName,
                    templateIdioma: selectedTemplateIdioma,
                    categoria: selectedTemplateCategoria,
                    status: 'Rascunho',
                    agendadaEm: finalAgendadaEm
                });
                if (!res.sucesso) {
                    toast.error(res.mensagem || 'Erro ao atualizar rascunho.');
                    return;
                }
            }

            if (!currentCampaignId) return;

            // Remover destinatários excluídos nesta sessão
            for (const destId of removedDestinatarioIds) {
                await CampaignService.removeDestinatario(currentCampaignId, destId);
            }

            // Adicionar novos destinatários (sem destinatarioId = ainda não salvos)
            const newContacts = finalContacts.filter(c => !c.destinatarioId);
            if (newContacts.length > 0) {
                await CampaignService.addDestinatarios(currentCampaignId, newContacts.map(c => ({
                    numero: c.telefone,
                    variaveis: varMappings.map(m => resolveVar(c, m))
                })));
            }

            toast.success(isEdit ? 'Campanha atualizada como rascunho!' : 'Campanha salva como rascunho!');
            onSaved();
            onClose();
        } catch {
            toast.error('Erro ao conectar com o servidor.');
        } finally {
            setIsSubmitting(false);
        }
    };

    // Ação Final de Criar + Disparar
    const handleConfirmAndDispatch = async () => {
        const newContacts = finalContacts.filter(c => !c.destinatarioId);

        if (finalContacts.length === 0) {
            toast.error('Nenhum contato selecionado.');
            return;
        }
        const fixedEmpty = newContacts.length > 0 && varMappings.some((m) => m.source === 'fixed' && !m.fixedValue.trim());
        if (fixedEmpty) {
            toast.error('Preencha o valor fixo de todas as variáveis antes de disparar.');
            return;
        }
        if (isLocationHeader) {
            if (!locationName.trim() || !locationAddress.trim() || !locationLatitude.trim() || !locationLongitude.trim()) {
                toast.error('Preencha todas as informações de localização no passo 3 antes de disparar.');
                return;
            }
        }

        setIsSubmitting(true);
        try {
            const finalAgendadaEm = agendadaEm ? new Date(agendadaEm).toISOString() : undefined;
            let currentCampaignId = campaign?.campanhaId;

            if (!isEdit) {
                const createRes = await CampaignService.create({
                    nome: nome.trim(),
                    templateNome: selectedTemplateName,
                    templateIdioma: selectedTemplateIdioma,
                    categoria: selectedTemplateCategoria,
                    agendadaEm: finalAgendadaEm
                });
                if (!createRes.sucesso || !createRes.dados) {
                    toast.error(createRes.mensagem || 'Erro ao registrar a campanha.');
                    return;
                }
                currentCampaignId = createRes.dados.campanhaId;
            } else {
                // Mantém 'Rascunho' — o endpoint disparar cuida da transição de status
                const updateRes = await CampaignService.update({
                    campanhaId: campaign.campanhaId,
                    nome: nome.trim(),
                    templateNome: selectedTemplateName,
                    templateIdioma: selectedTemplateIdioma,
                    categoria: selectedTemplateCategoria,
                    status: 'Rascunho',
                    agendadaEm: finalAgendadaEm
                });
                if (!updateRes.sucesso) {
                    toast.error(updateRes.mensagem || 'Erro ao atualizar a campanha.');
                    return;
                }
            }

            if (!currentCampaignId) return;

            // Remover destinatários excluídos nesta sessão
            for (const destId of removedDestinatarioIds) {
                await CampaignService.removeDestinatario(currentCampaignId, destId);
            }

            // Adicionar novos destinatários ao rascunho
            if (newContacts.length > 0) {
                const addRes = await CampaignService.addDestinatarios(currentCampaignId, newContacts.map(c => ({
                    numero: c.telefone,
                    variaveis: varMappings.map(m => resolveVar(c, m))
                })));
                if (!addRes.sucesso) {
                    toast.error(addRes.mensagem || 'Erro ao adicionar destinatários.');
                    return;
                }
            }

            // Construir componentes com base nos botões especiais do template
            const componentesPayload: any[] = [];
            if (isLocationHeader) {
                componentesPayload.push({
                    tipo: 'HEADER',
                    parametros: [
                        {
                            tipo: 'location',
                            localizacao: {
                                latitude: locationLatitude.trim(),
                                longitude: locationLongitude.trim(),
                                nome: locationName.trim(),
                                endereco: locationAddress.trim()
                            }
                        }
                    ]
                });
            }
            if (copyCodeButtonIndex !== -1) {
                componentesPayload.push({
                    tipo: 'BUTTON',
                    subTipo: 'COPY_CODE',
                    indicesBotao: copyCodeButtonIndex,
                    parametros: [
                        {
                            tipo: 'coupon_code',
                            codigoCupom: couponCode.trim()
                        }
                    ]
                });
            }
            if (urlVarButtonIndex !== -1) {
                componentesPayload.push({
                    tipo: 'BUTTON',
                    subTipo: 'URL',
                    indicesBotao: urlVarButtonIndex,
                    parametros: [
                        {
                            tipo: 'text',
                            texto: urlVariable.trim()
                        }
                    ]
                });
            }

            // Disparar usando o rascunho salvo (Forma 1 — recomendada)
            const dispatchRes = await CampaignService.disparar(currentCampaignId, { componentes: componentesPayload });

            if (dispatchRes.sucesso && dispatchRes.dados) {
                const { totalEnviados, totalFalhas } = dispatchRes.dados;
                
                // Se todos os envios falharam e houve tentativas de envio (ou simplesmente totalEnviados === 0 e totalFalhas > 0)
                if (totalEnviados === 0 && totalFalhas > 0) {
                    await CampaignService.update({
                        campanhaId: currentCampaignId,
                        nome: nome.trim(),
                        templateNome: selectedTemplateName,
                        templateIdioma: selectedTemplateIdioma,
                        categoria: selectedTemplateCategoria,
                        status: 'Rascunho',
                        agendadaEm: finalAgendadaEm
                    });
                    toast.error('Todos os envios falharam. A campanha retornou para o status de Rascunho.');
                } else {
                    toast.success('Processamento do disparo concluído!');
                }

                setResult({
                    totalEnviados,
                    totalFalhas
                });
                onSaved();
            } else {
                toast.error(dispatchRes.mensagem || 'Erro ao realizar o disparo.');
            }
        } catch {
            toast.error('Erro ao conectar com o servidor.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && !isSubmitting && onClose()}>
            <div className={`camp-modal ${step === 2 ? 'camp-modal-xl' : 'camp-modal-lg'}`}>
                <div className="camp-modal-header">
                    <h2>{isEdit ? 'Editar e Enviar Campanha' : 'Criar Nova Campanha'}</h2>
                    <button className="close-modal-button" onClick={onClose} disabled={isSubmitting}>
                        <FaTimes />
                    </button>
                </div>

                {/* Barra de Progresso do Wizard */}
                {!result && (
                    <div className="camp-wizard-steps">
                        <div className={`camp-wizard-step ${step >= 1 ? 'active' : ''} ${step === 1 ? 'current' : ''}`}>
                            <span className="step-num">1</span>
                            <span className="step-label">Identificação</span>
                        </div>
                        <div className="step-line" />
                        <div className={`camp-wizard-step ${step >= 2 ? 'active' : ''} ${step === 2 ? 'current' : ''}`}>
                            <span className="step-num">2</span>
                            <span className="step-label">Público</span>
                        </div>
                        <div className="step-line" />
                        <div className={`camp-wizard-step ${step >= 3 ? 'active' : ''} ${step === 3 ? 'current' : ''}`}>
                            <span className="step-num">3</span>
                            <span className="step-label">Conteúdo</span>
                        </div>
                        <div className="step-line" />
                        <div className={`camp-wizard-step ${step >= 4 ? 'active' : ''} ${step === 4 ? 'current' : ''}`}>
                            <span className="step-num">4</span>
                            <span className="step-label">Revisão</span>
                        </div>
                    </div>
                )}

                <div className="camp-modal-body" style={{ minHeight: '500px' }}>
                    {result ? (
                        /* Resultados do Envio */
                        <div className="camp-dispatch-result" style={{ textAlign: 'center', padding: '40px 20px' }}>
                            <div style={{ fontSize: '3rem', color: '#15803d', marginBottom: '16px' }}><FaCheckCircle /></div>
                            <h3>Campanha Disparada!</h3>
                            <p style={{ fontSize: '1.1rem', color: 'var(--text-secondary)', marginTop: '8px' }}>
                                A campanha <strong>{nome}</strong> foi processada com os seguintes resultados:
                            </p>
                            <div style={{ display: 'flex', justifyContent: 'center', gap: '40px', marginTop: '24px' }}>
                                <div style={{ background: '#f0fdf4', padding: '16px 24px', borderRadius: '12px', border: '1px solid #bbf7d0' }}>
                                    <span style={{ display: 'block', fontSize: '0.8125rem', color: '#15803d', fontWeight: 'bold' }}>Sucessos</span>
                                    <span style={{ fontSize: '2rem', fontWeight: 'bold', color: '#16a34a' }}>{result.totalEnviados}</span>
                                </div>
                                <div style={{ background: result.totalFalhas > 0 ? '#fef2f2' : '#f8f9fa', padding: '16px 24px', borderRadius: '12px', border: result.totalFalhas > 0 ? '1px solid #fecaca' : '1px solid #e2e8f0' }}>
                                    <span style={{ display: 'block', fontSize: '0.8125rem', color: result.totalFalhas > 0 ? '#b91c1c' : '#64748b', fontWeight: 'bold' }}>Falhas</span>
                                    <span style={{ fontSize: '2rem', fontWeight: 'bold', color: result.totalFalhas > 0 ? '#dc2626' : '#475569' }}>{result.totalFalhas}</span>
                                </div>
                            </div>
                        </div>
                    ) : (
                        /* Passos do Wizard */
                        <>
                            {step === 1 && (
                                <div className="wizard-step-content animate-fade-in">
                                    <h3 className="step-title">Passo 1: Como você quer chamar a campanha?</h3>
                                    <div className="camp-form-grid" style={{ marginTop: '20px' }}>
                                        <div className="camp-form-group camp-span-2">
                                            <label>Nome da campanha <span className="camp-required">*</span></label>
                                            <input
                                                type="text"
                                                value={nome}
                                                onChange={(e) => setNome(e.target.value)}
                                                placeholder="ex: Campanha Black Friday 2026"
                                                required
                                            />
                                        </div>
                                        {/* 
                                        <div className="camp-form-group camp-span-2">
                                            <label>Data de agendamento (Informativo)</label>
                                            <input
                                                type="datetime-local"
                                                value={agendadaEm}
                                                onChange={(e) => setAgendadaEm(e.target.value)}
                                            />
                                            <span className="camp-hint">Nota: Atualmente os disparos são processados imediatamente após a confirmação.</span>
                                        </div>
                                        */}
                                    </div>
                                </div>
                            )}

                            {step === 2 && (
                                <div className="wizard-step-content animate-fade-in" style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '24px', alignItems: 'stretch' }}>
                                    
                                    {/* Lado Esquerdo: Abas de Seleção */}
                                    <div className="publico-selector-left" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                        <h3 className="step-title" style={{ margin: 0 }}>Passo 2: Selecione o Público</h3>
                                        
                                        <div className="publico-tabs" style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
                                            <button
                                                type="button"
                                                className={`publico-tab-btn ${publicoTipo === 'BASE' ? 'active' : ''}`}
                                                onClick={() => setPublicoTipo('BASE')}
                                                style={{ flex: 1, padding: '8px 12px', fontSize: '0.8125rem' }}
                                            >
                                                <FaUsers /> Base
                                            </button>
                                            <button
                                                type="button"
                                                className={`publico-tab-btn ${publicoTipo === 'MANUAL' ? 'active' : ''}`}
                                                onClick={() => setPublicoTipo('MANUAL')}
                                                style={{ flex: 1, padding: '8px 12px', fontSize: '0.8125rem' }}
                                            >
                                                <FaUserPlus /> Manual
                                            </button>
                                            <button
                                                type="button"
                                                className={`publico-tab-btn ${publicoTipo === 'COLA' ? 'active' : ''}`}
                                                onClick={() => setPublicoTipo('COLA')}
                                                style={{ flex: 1, padding: '8px 12px', fontSize: '0.8125rem' }}
                                            >
                                                <FaClipboardList /> Colar
                                            </button>
                                        </div>

                                        {/* Conteúdo da Aba Ativa */}
                                        <div className="tab-content-wrapper" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                                            {/* Opção A: Contatos da Base */}
                                            {publicoTipo === 'BASE' && (
                                                <div className="publico-base-wrap" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                                    <input
                                                        type="text"
                                                        className="camp-contact-search"
                                                        placeholder="Buscar contatos..."
                                                        value={contactSearch}
                                                        onChange={(e) => setContactSearch(e.target.value)}
                                                        style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-color)' }}
                                                    />
                                                    
                                                    <div className="camp-contact-list-header" style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                                                        <label className="camp-select-all-label">
                                                            <input
                                                                type="checkbox"
                                                                checked={isAllBaseSelected}
                                                                onChange={toggleAllBase}
                                                            />
                                                            Selecionar todos filtrados ({filteredBaseContacts.length})
                                                        </label>
                                                    </div>
                                                    
                                                    <div className="camp-contact-scroll" style={{ maxHeight: '180px', overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
                                                        {filteredBaseContacts.length === 0 ? (
                                                            <div style={{ padding: '15px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.8125rem' }}>Nenhum contato encontrado.</div>
                                                        ) : (
                                                            filteredBaseContacts.map((c) => (
                                                                <div
                                                                    key={c.contatoId}
                                                                    className={`camp-contact-item ${selectedBaseContacts.has(c.contatoId) ? 'selected' : ''}`}
                                                                    onClick={() => toggleBaseContact(c.contatoId)}
                                                                    style={{ display: 'flex', alignItems: 'center', padding: '8px 12px', borderBottom: '1px solid #f1f5f9', cursor: 'pointer' }}
                                                                >
                                                                    <input
                                                                        type="checkbox"
                                                                        checked={selectedBaseContacts.has(c.contatoId)}
                                                                        onChange={() => toggleBaseContact(c.contatoId)}
                                                                        onClick={(e) => e.stopPropagation()}
                                                                        style={{ marginRight: '10px' }}
                                                                    />
                                                                    <div style={{ minWidth: 0 }}>
                                                                        <div style={{ fontWeight: '600', fontSize: '13px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.nome}</div>
                                                                        <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{c.telefone}</div>
                                                                    </div>
                                                                </div>
                                                            ))
                                                        )}
                                                    </div>

                                                    <button
                                                        type="button"
                                                        className="camp-btn-primary"
                                                        onClick={handleAddBaseSelected}
                                                        disabled={selectedBaseContacts.size === 0}
                                                        style={{ marginTop: '8px', padding: '8px 16px', fontSize: '0.8125rem', width: '100%', justifyContent: 'center' }}
                                                    >
                                                        Adicionar Selecionados ({selectedBaseContacts.size})
                                                    </button>
                                                </div>
                                            )}

                                            {/* Opção B: Digitação Manual */}
                                            {publicoTipo === 'MANUAL' && (
                                                <div className="publico-manual-wrap" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                                    <div className="camp-form-group">
                                                        <label style={{ fontSize: '0.75rem' }}>Nome do contato</label>
                                                        <input
                                                            type="text"
                                                            placeholder="Nome..."
                                                            value={newManualName}
                                                            onChange={e => setNewManualName(e.target.value)}
                                                            style={{ padding: '8px 12px' }}
                                                        />
                                                    </div>
                                                    <div className="camp-form-group">
                                                        <label style={{ fontSize: '0.75rem' }}>Telefone</label>
                                                        <input
                                                            type="text"
                                                            placeholder="ex: 5511999999999"
                                                            value={newManualPhone}
                                                            onChange={e => setNewManualPhone(e.target.value)}
                                                            style={{ padding: '8px 12px' }}
                                                        />
                                                    </div>
                                                    <button
                                                        type="button"
                                                        className="camp-btn-primary"
                                                        onClick={handleAddManual}
                                                        style={{ marginTop: '4px', padding: '8px 16px', fontSize: '0.8125rem', justifyContent: 'center' }}
                                                    >
                                                        Adicionar Contato
                                                    </button>
                                                </div>
                                            )}

                                            {/* Opção C: Colar Lista */}
                                            {publicoTipo === 'COLA' && (
                                                <div className="publico-cola-wrap" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                                    <textarea
                                                        rows={5}
                                                        placeholder="Exemplo:&#10;Lucas, 5511999999999&#10;Maria, 5511888888888&#10;Ou cole apenas números (um por linha)"
                                                        value={coladosRaw}
                                                        onChange={e => setColadosRaw(e.target.value)}
                                                        style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', fontFamily: 'monospace', fontSize: '12px', resize: 'vertical' }}
                                                    />
                                                    
                                                    {(() => {
                                                        const countColados = coladosRaw.split('\n')
                                                            .map(line => {
                                                                if (!line.trim()) return null;
                                                                const parts = line.split(/[,;\t]/);
                                                                if (parts.length >= 2) return parts[1].replace(/\D/g, '').trim();
                                                                return line.replace(/\D/g, '').trim();
                                                            })
                                                            .filter(tel => tel && tel.length >= 8).length;
                                                        
                                                        return (
                                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
                                                                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                                                    Detectados: <strong>{countColados}</strong>
                                                                </span>
                                                                <button
                                                                    type="button"
                                                                    className="camp-btn-primary"
                                                                    onClick={handleAddColados}
                                                                    disabled={countColados === 0}
                                                                    style={{ padding: '6px 12px', fontSize: '0.8125rem' }}
                                                                >
                                                                    Adicionar Lista
                                                                </button>
                                                            </div>
                                                        );
                                                    })()}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Lado Direito: Resumo do Público Adicionado */}
                                    <div className="publico-summary-right" style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <h4 style={{ margin: 0, fontSize: '0.875rem', fontWeight: '700', color: 'var(--text-primary)' }}>
                                                Contatos Adicionados ({finalContacts.length})
                                            </h4>
                                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                                {finalContacts.length > 0 && (
                                                    <button
                                                        type="button"
                                                        onClick={() => setIsSummaryExpanded(prev => !prev)}
                                                        style={{ background: 'transparent', border: 'none', color: 'var(--petroleum-blue)', fontSize: '0.75rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', padding: 0 }}
                                                    >
                                                        {isSummaryExpanded ? (
                                                            <><FaChevronUp size={10} /> Ocultar</>
                                                        ) : (
                                                            <><FaChevronRight size={10} /> Ver lista</>
                                                        )}
                                                    </button>
                                                )}
                                                {finalContacts.length > 0 && (
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            const idsToRemove = finalContacts
                                                                .filter(c => c.destinatarioId)
                                                                .map(c => c.destinatarioId!);
                                                            if (idsToRemove.length > 0) {
                                                                setRemovedDestinatarioIds(prev => [...prev, ...idsToRemove]);
                                                            }
                                                            setFinalContacts([]);
                                                            setIsSummaryExpanded(false);
                                                        }}
                                                        style={{ background: 'transparent', border: 'none', color: '#dc2626', fontSize: '0.75rem', cursor: 'pointer', padding: 0 }}
                                                    >
                                                        Limpar todos
                                                    </button>
                                                )}
                                            </div>
                                        </div>

                                        {isSummaryExpanded && finalContacts.length > 0 ? (
                                            <div className="summary-expanded-view animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '10px', flex: 1 }}>
                                                {/* Filtro de Busca de Contatos Adicionados */}
                                                <input
                                                    type="text"
                                                    placeholder="Filtrar por nome ou telefone..."
                                                    value={addedSearchTerm}
                                                    onChange={e => setAddedSearchTerm(e.target.value)}
                                                    style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '0.8125rem', width: '100%', outline: 'none' }}
                                                />
                                                
                                                <div style={{ flex: 1, maxHeight: '200px', overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: '8px', background: '#fff' }}>
                                                    {filteredAddedContacts.length === 0 ? (
                                                        <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.8125rem' }}>
                                                            Nenhum contato encontrado.
                                                        </div>
                                                    ) : (
                                                        filteredAddedContacts.map((c) => {
                                                            // Encontrar o índice no array original
                                                            const originalIdx = finalContacts.findIndex(fc => fc.telefone === c.telefone);
                                                            return (
                                                                <div key={c.telefone} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', borderBottom: '1px solid #f1f5f9' }}>
                                                                    <div style={{ minWidth: 0, marginRight: '8px' }}>
                                                                        <div style={{ fontWeight: '600', fontSize: '13px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.nome}</div>
                                                                        <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{c.telefone}</div>
                                                                    </div>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => {
                                                                            const contact = finalContacts[originalIdx];
                                                                            if (contact?.destinatarioId) {
                                                                                setRemovedDestinatarioIds(prev => [...prev, contact.destinatarioId!]);
                                                                            }
                                                                            setFinalContacts(prev => prev.filter((_, i) => i !== originalIdx));
                                                                        }}
                                                                        style={{ background: 'transparent', border: 'none', color: '#dc2626', cursor: 'pointer', padding: '4px' }}
                                                                        title="Remover contato"
                                                                    >
                                                                        <FaTrash size={12} />
                                                                    </button>
                                                                </div>
                                                            );
                                                        })
                                                    )}
                                                </div>
                                            </div>
                                        ) : (
                                            /* Mensagem exibida quando não está expandido ou não tem contatos */
                                            finalContacts.length > 0 && (
                                                <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.8125rem', background: '#fff', border: '1px dashed #cbd5e1', borderRadius: '8px' }}>
                                                    Clique em "Ver lista" para visualizar e filtrar os contatos selecionados.
                                                </div>
                                            )
                                        )}

                                        {finalContacts.length === 0 && (
                                            <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.8125rem', background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
                                                Nenhum contato adicionado ainda. Escolha ao lado e adicione.
                                            </div>
                                        )}

                                        {/* Informações Financeiras */}
                                        <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', padding: '10px 12px', marginTop: 'auto' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8125rem' }}>
                                                <span style={{ color: '#166534', fontWeight: '500' }}>Gasto aproximado previsto:</span>
                                                <span style={{ color: '#15803d', fontWeight: '700', fontSize: '0.9375rem' }}>
                                                    {(finalContacts.length * CUSTO_UNITARIO_BRL).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                                </span>
                                            </div>
                                            <span style={{ display: 'block', fontSize: '9px', color: '#166534', marginTop: '2px', opacity: 0.8 }}>
                                                Com base em {CUSTO_UNITARIO_BRL.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} por envio.
                                            </span>
                                        </div>
                                    </div>
                                    
                                </div>
                            )}

                            {step === 3 && (
                                <div className="wizard-step-content animate-fade-in">
                                    <h3 className="step-title">Passo 3: Conteúdo da Mensagem</h3>

                                    <div className="camp-form-group" style={{ marginTop: '16px', marginBottom: '16px' }}>
                                        <label>Selecione o template <span className="camp-required">*</span></label>
                                        {isLoadingTemplates ? (
                                            <CustomSelect
                                                disabled
                                                options={[]}
                                                value=""
                                                onChange={() => { }}
                                                placeholder="Carregando templates..."
                                            />
                                        ) : (
                                            <CustomSelect
                                                options={[
                                                    { value: '', label: 'Selecione um template aprovado' },
                                                    ...templates.map(t => ({
                                                        value: t.nome,
                                                        label: `${t.nome} (${t.idioma})`
                                                    }))
                                                ]}
                                                value={selectedTemplateName}
                                                onChange={handleTemplateChange}
                                                placeholder="Selecione um template aprovado"
                                            />
                                        )}
                                    </div>

                                    {selectedTemplateName && (
                                        <div className="content-template-grid" style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '20px' }}>
                                            {/* Configurações de Variáveis */}
                                            <div className="template-vars-setup">
                                                <span className="setup-title" style={{ fontWeight: 'bold', fontSize: '13.5px', display: 'block', marginBottom: '12px' }}>
                                                    Mapeamento de Variáveis
                                                </span>
                                                {varMappings.length === 0 ? (
                                                    <div style={{ color: 'var(--text-secondary)', padding: '12px', background: '#f8f9fa', borderRadius: '8px' }}>
                                                        Este template não contém variáveis dinâmicas.
                                                    </div>
                                                ) : (
                                                    varMappings.map((mapping, idx) => (
                                                        <div key={idx} className="camp-var-row" style={{ marginBottom: '10px', display: 'flex', gap: '8px', alignItems: 'center' }}>
                                                            <span style={{ fontWeight: 'bold', minWidth: '45px' }}><code>{`{{${idx + 1}}}`}</code></span>
                                                            <CustomSelect
                                                                options={Object.entries(VAR_SOURCE_LABEL).map(([val, lbl]) => ({
                                                                    value: val,
                                                                    label: lbl
                                                                }))}
                                                                value={mapping.source}
                                                                onChange={val => updateMapping(idx, { source: val as VarSource, fixedValue: '' })}
                                                            />
                                                            {mapping.source === 'fixed' && (
                                                                <input
                                                                    type="text"
                                                                    placeholder="Valor fixo..."
                                                                    value={mapping.fixedValue}
                                                                    onChange={e => updateMapping(idx, { fixedValue: e.target.value })}
                                                                    style={{ padding: '8px', borderRadius: '6px', fontSize: '13px', flex: 1 }}
                                                                />
                                                            )}
                                                        </div>
                                                    ))
                                                )}
                                                {(copyCodeButtonIndex !== -1 || urlVarButtonIndex !== -1) && (
                                                    <div className="template-buttons-setup" style={{ marginTop: '20px', borderTop: '1px solid #e2e8f0', paddingTop: '16px' }}>
                                                        <span className="setup-title" style={{ fontWeight: 'bold', fontSize: '13.5px', display: 'block', marginBottom: '12px' }}>
                                                            Configurações dos Botões
                                                        </span>
                                                        {copyCodeButtonIndex !== -1 && (
                                                            <div className="camp-var-row" style={{ marginBottom: '10px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                                                <label style={{ fontSize: '12px', fontWeight: '600' }}>Código do Cupom (Botão Copiar Código) <span className="camp-required">*</span></label>
                                                                <input
                                                                    type="text"
                                                                    placeholder="Ex: BLACK30"
                                                                    value={couponCode}
                                                                    onChange={e => setCouponCode(e.target.value)}
                                                                    style={{ padding: '8px', borderRadius: '6px', fontSize: '13px', width: '100%', border: '1px solid #cbd5e1' }}
                                                                />
                                                            </div>
                                                        )}
                                                        {urlVarButtonIndex !== -1 && (
                                                            <div className="camp-var-row" style={{ marginBottom: '10px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                                                <label style={{ fontSize: '12px', fontWeight: '600' }}>Variável do Link/URL ({"{{1}}"}) <span className="camp-required">*</span></label>
                                                                <input
                                                                    type="text"
                                                                    placeholder="Ex: cupom-natal"
                                                                    value={urlVariable}
                                                                    onChange={e => setUrlVariable(e.target.value)}
                                                                    style={{ padding: '8px', borderRadius: '6px', fontSize: '13px', width: '100%', border: '1px solid #cbd5e1' }}
                                                                />
                                                            </div>
                                                        )}
                                                    </div>
                                                )}

                                                {isLocationHeader && (
                                                    <div className="template-location-setup" style={{ marginTop: '20px', borderTop: '1px solid #e2e8f0', paddingTop: '16px' }}>
                                                        <span className="setup-title" style={{ fontWeight: 'bold', fontSize: '13.5px', display: 'block', marginBottom: '12px' }}>
                                                            Configurações de Localização <span className="camp-required">*</span>
                                                        </span>
                                                        <div className="camp-var-row" style={{ marginBottom: '10px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                                            <label style={{ fontSize: '12px', fontWeight: '600' }}>Nome do Local</label>
                                                            <input
                                                                type="text"
                                                                placeholder="Ex: Loja Centro SP"
                                                                value={locationName}
                                                                onChange={e => setLocationName(e.target.value)}
                                                                style={{ padding: '8px', borderRadius: '6px', fontSize: '13px', width: '100%', border: '1px solid #cbd5e1' }}
                                                            />
                                                        </div>
                                                        <div className="camp-var-row" style={{ marginBottom: '10px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                                            <label style={{ fontSize: '12px', fontWeight: '600' }}>Endereço</label>
                                                            <div style={{ display: 'flex', gap: '8px' }}>
                                                                <input
                                                                    type="text"
                                                                    placeholder="Ex: Av. Paulista, 1000, São Paulo - SP"
                                                                    value={locationAddress}
                                                                    onChange={e => setLocationAddress(e.target.value)}
                                                                    style={{ padding: '8px', borderRadius: '6px', fontSize: '13px', flex: 1, border: '1px solid #cbd5e1' }}
                                                                />
                                                                <button
                                                                    type="button"
                                                                    onClick={handleSearchCoordinates}
                                                                    disabled={isSearchingCoords}
                                                                    style={{
                                                                        padding: '8px 12px',
                                                                        borderRadius: '6px',
                                                                        fontSize: '13px',
                                                                        background: 'var(--petroleum-blue)',
                                                                        color: '#fff',
                                                                        border: 'none',
                                                                        cursor: 'pointer',
                                                                        fontWeight: '600'
                                                                    }}
                                                                >
                                                                    {isSearchingCoords ? 'Buscando...' : 'Buscar Coordenadas'}
                                                                </button>
                                                            </div>
                                                        </div>
                                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                                                            <div className="camp-var-row" style={{ marginBottom: '10px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                                                <label style={{ fontSize: '12px', fontWeight: '600' }}>Latitude</label>
                                                                <input
                                                                    type="text"
                                                                    placeholder="Ex: -23.5505"
                                                                    value={locationLatitude}
                                                                    onChange={e => setLocationLatitude(e.target.value)}
                                                                    style={{ padding: '8px', borderRadius: '6px', fontSize: '13px', width: '100%', border: '1px solid #cbd5e1' }}
                                                                />
                                                            </div>
                                                            <div className="camp-var-row" style={{ marginBottom: '10px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                                                <label style={{ fontSize: '12px', fontWeight: '600' }}>Longitude</label>
                                                                <input
                                                                    type="text"
                                                                    placeholder="Ex: -46.6333"
                                                                    value={locationLongitude}
                                                                    onChange={e => setLocationLongitude(e.target.value)}
                                                                    style={{ padding: '8px', borderRadius: '6px', fontSize: '13px', width: '100%', border: '1px solid #cbd5e1' }}
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>

                                            {/* WhatsApp Bubble Preview */}
                                            <div className="template-preview-bubble">
                                                <span style={{ fontWeight: 'bold', fontSize: '13.5px', display: 'block', marginBottom: '8px' }}>
                                                    Prévia (Visualização)
                                                </span>
                                                <div className="ct-preview-chat-bg" style={{ minHeight: '180px', borderRadius: '12px', padding: '12px' }}>
                                                    <div className="ct-preview-bubble-wrap">
                                                        <div className="ct-preview-bubble" style={{ maxWidth: '240px' }}>
                                                            {isLocationHeader && (
                                                                <div className="ct-preview-header" style={{ borderBottom: '1px solid #f1f5f9', paddingBottom: '8px', marginBottom: '8px' }}>
                                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#f8fafc', padding: '8px', borderRadius: '6px' }}>
                                                                        <FaMapMarkerAlt style={{ color: 'var(--petroleum-blue)' }} />
                                                                        <div style={{ minWidth: 0, textAlign: 'left' }}>
                                                                            <strong style={{ display: 'block', fontSize: '11px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                                                {locationName || 'Nome do Local'}
                                                                            </strong>
                                                                            <span style={{ display: 'block', fontSize: '9px', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                                                {locationAddress || 'Endereço'}
                                                                            </span>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            )}
                                                            <div className="ct-preview-body" style={{ fontSize: '12.5px', lineHeight: '1.4' }}>
                                                                {previewText.split('\n').map((line, i) => <span key={i}>{line}<br /></span>)}
                                                            </div>
                                                            <div className="ct-preview-time" style={{ fontSize: '9px' }}>
                                                                {new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {step === 4 && (
                                <div className="wizard-step-content animate-fade-in">
                                    <h3 className="step-title">Passo 4: Revisar e Confirmar Disparo</h3>

                                    <div className="review-box" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginTop: '20px' }}>
                                        <div className="review-details" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                                            <div style={{ background: '#f8f9fa', padding: '14px', borderRadius: '10px' }}>
                                                <span style={{ display: 'block', fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 'bold' }}>Nome da Campanha</span>
                                                <span style={{ fontSize: '1.1rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>{nome}</span>
                                                {agendadaEm && (
                                                    <span style={{ display: 'block', fontSize: '12px', marginTop: '4px', color: '#15803d' }}>
                                                        Agendada: {new Date(agendadaEm).toLocaleString()}
                                                    </span>
                                                )}
                                            </div>

                                            <div style={{ background: '#f8f9fa', padding: '14px', borderRadius: '10px' }}>
                                                <span style={{ display: 'block', fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 'bold' }}>Destinatários</span>
                                                <span style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--petroleum-blue)' }}>
                                                    {finalContacts.length} contato{finalContacts.length !== 1 ? 's' : ''}
                                                </span>
                                                <span style={{ display: 'block', fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                                                    Origem: {publicoTipo === 'BASE' ? 'Contatos da Base' : publicoTipo === 'MANUAL' ? 'Inserção Manual' : 'Lista Colada'}
                                                </span>
                                            </div>

                                            <div style={{ background: '#f8f9fa', padding: '14px', borderRadius: '10px' }}>
                                                <span style={{ display: 'block', fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 'bold' }}>Template Homologado</span>
                                                <span style={{ fontWeight: '600' }}>{selectedTemplateName}</span>
                                                <span style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)' }}>Categoria: {selectedTemplateCategoria} · Idioma: {selectedTemplateIdioma}</span>
                                                {copyCodeButtonIndex !== -1 && (
                                                    <span style={{ display: 'block', fontSize: '12px', marginTop: '6px', color: '#166534' }}>
                                                        <strong>Código Cupom:</strong> {couponCode}
                                                    </span>
                                                )}
                                                {urlVarButtonIndex !== -1 && (
                                                    <span style={{ display: 'block', fontSize: '12px', marginTop: '4px', color: '#166534' }}>
                                                        <strong>Variável do Link:</strong> {urlVariable}
                                                    </span>
                                                )}
                                            </div>

                                            {isLocationHeader && (
                                                <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '10px', border: '1px solid #cbd5e1' }}>
                                                    <span style={{ display: 'block', fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 'bold' }}>Localização Configurada</span>
                                                    <span style={{ fontWeight: '600', display: 'block', fontSize: '13px', marginTop: '4px' }}>{locationName}</span>
                                                    <span style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)' }}>{locationAddress}</span>
                                                    <span style={{ display: 'block', fontSize: '11px', color: 'var(--text-secondary)', fontFamily: 'monospace', marginTop: '4px' }}>Lat: {locationLatitude} / Long: {locationLongitude}</span>
                                                </div>
                                            )}

                                            <div style={{ background: '#fef3c7', padding: '14px', borderRadius: '10px', border: '1px solid #fde68a' }}>
                                                <span style={{ display: 'block', fontSize: '11px', color: '#b45309', textTransform: 'uppercase', fontWeight: 'bold' }}>Custo Estimado (R$ 0,31 / envio)</span>
                                                <span style={{ fontSize: '1.4rem', fontWeight: 'bold', color: '#d97706' }}>
                                                    {(finalContacts.length * CUSTO_UNITARIO_BRL).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                                </span>
                                                <span style={{ display: 'block', fontSize: '11px', color: '#b45309', marginTop: '2px' }}>
                                                    Cobrado pela Meta na API Cloud e impostos podem estar inclusos.
                                                </span>
                                            </div>
                                        </div>

                                        <div className="review-preview">
                                            <span style={{ display: 'block', fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 'bold', marginBottom: '8px' }}>Prévia Final da Mensagem</span>
                                            <div className="ct-preview-chat-bg" style={{ minHeight: '220px', borderRadius: '12px', padding: '14px' }}>
                                                <div className="ct-preview-bubble-wrap">
                                                    <div className="ct-preview-bubble" style={{ maxWidth: '250px' }}>
                                                        {isLocationHeader && (
                                                            <div className="ct-preview-header" style={{ borderBottom: '1px solid #f1f5f9', paddingBottom: '8px', marginBottom: '8px' }}>
                                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#f8fafc', padding: '8px', borderRadius: '6px' }}>
                                                                    <FaMapMarkerAlt style={{ color: 'var(--petroleum-blue)' }} />
                                                                    <div style={{ minWidth: 0, textAlign: 'left' }}>
                                                                        <strong style={{ display: 'block', fontSize: '11px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                                            {locationName || 'Nome do Local'}
                                                                        </strong>
                                                                        <span style={{ display: 'block', fontSize: '9px', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                                            {locationAddress || 'Endereço'}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        )}
                                                        <div className="ct-preview-body" style={{ fontSize: '12.5px', lineHeight: '1.4' }}>
                                                            {previewText.split('\n').map((line, i) => <span key={i}>{line}<br /></span>)}
                                                        </div>
                                                        <div className="ct-preview-time" style={{ fontSize: '9px' }}>
                                                            {new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>

                <div className="camp-modal-footer">
                    {result ? (
                        /* Botão de Fechar após Disparo */
                        <button type="button" className="camp-btn-primary" onClick={onClose}>
                            Fechar
                        </button>
                    ) : (
                        /* Controles de Navegação do Wizard */
                        <>
                            <button
                                type="button"
                                className="camp-btn-secondary"
                                onClick={onClose}
                                disabled={isSubmitting}
                            >
                                Cancelar
                            </button>

                            <div style={{ display: 'flex', gap: '10px', marginLeft: 'auto' }}>
                                {step > 1 && (
                                    <button
                                        type="button"
                                        className="camp-btn-secondary"
                                        onClick={() => setStep(prev => prev - 1)}
                                        disabled={isSubmitting}
                                    >
                                        <FaChevronLeft /> Voltar
                                    </button>
                                )}

                                {step < 4 ? (
                                    <button
                                        type="button"
                                        className="camp-btn-primary"
                                        onClick={() => setStep(prev => prev + 1)}
                                        disabled={
                                            (step === 1 && !nome.trim()) ||
                                            (step === 2 && finalContacts.length === 0) ||
                                            (step === 3 && (
                                                !selectedTemplateName ||
                                                (copyCodeButtonIndex !== -1 && !couponCode.trim()) ||
                                                (urlVarButtonIndex !== -1 && !urlVariable.trim())
                                            ))
                                        }
                                    >
                                        Avançar <FaChevronRight />
                                    </button>
                                ) : (
                                    <>
                                        <button
                                            type="button"
                                            className="camp-btn-secondary"
                                            onClick={handleSaveAsDraft}
                                            disabled={isSubmitting}
                                            style={{ borderColor: 'var(--petroleum-blue)', color: 'var(--petroleum-blue)' }}
                                        >
                                            {isSubmitting ? (
                                                <><FaSpinner className="ct-spin" /> Salvando...</>
                                            ) : (
                                                'Salvar como Rascunho'
                                            )}
                                        </button>
                                        <button
                                            type="button"
                                            className="camp-btn-primary"
                                            onClick={handleConfirmAndDispatch}
                                            disabled={isSubmitting || finalContacts.length === 0}
                                            style={{ background: '#16a34a' }}
                                        >
                                            {isSubmitting ? (
                                                <><FaSpinner className="ct-spin" /> Disparando...</>
                                            ) : (
                                                <><FaPaperPlane /> Confirmar e Disparar</>
                                            )}
                                        </button>
                                    </>
                                )}
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

// ---- Delete Confirm Modal ----

function DeleteConfirmModal({
    nome,
    onConfirm,
    onCancel,
    isDeleting,
}: {
    nome: string;
    onConfirm: () => void;
    onCancel: () => void;
    isDeleting: boolean;
}) {
    return (
        <div className="modal-overlay">
            <div className="camp-confirm-modal">
                <div className="camp-confirm-icon"><FaTrash /></div>
                <h3>Remover campanha</h3>
                <p>Tem certeza que deseja remover <strong>{nome}</strong>? Esta ação não pode ser desfeita.</p>
                <div className="camp-confirm-actions">
                    <button className="camp-btn-secondary" onClick={onCancel} disabled={isDeleting}>Cancelar</button>
                    <button className="camp-btn-danger" onClick={onConfirm} disabled={isDeleting}>
                        {isDeleting ? 'Removendo...' : 'Remover'}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ---- Conversas Modal ----

const DISPARO_STATUS: Record<string, { label: string; cls: string }> = {
    enviado:  { label: 'Enviado',  cls: 'enviado'  },
    entregue: { label: 'Entregue', cls: 'entregue' },
    lido:     { label: 'Lido',     cls: 'lido'     },
    falha:    { label: 'Falha',    cls: 'falha'    },
};

function ConversasModal({ campanhaId, campanhaNome, onClose }: {
    campanhaId: number;
    campanhaNome: string;
    onClose: () => void;
}) {
    const [conversas, setConversas] = useState<Disparo[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [pagina, setPagina] = useState(1);
    const [total, setTotal] = useState(0);
    const POR_PAGINA = 20;

    useEffect(() => {
        const load = async () => {
            setIsLoading(true);
            try {
                const res = await CampaignService.getConversas(campanhaId, pagina, POR_PAGINA);
                if (res.sucesso && res.dados) {
                    setConversas(res.dados.itens);
                    setTotal(res.dados.total);
                } else {
                    toast.error(res.mensagem || 'Erro ao carregar disparos.');
                }
            } catch {
                toast.error('Erro ao conectar com o servidor.');
            } finally {
                setIsLoading(false);
            }
        };
        load();
    }, [campanhaId, pagina]);

    const totalPaginas = Math.ceil(total / POR_PAGINA);
    const fmt = (dt: string | null) =>
        dt ? new Date(dt).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }) : '—';

    return (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
            <div className="camp-modal camp-modal-xl">
                <div className="camp-modal-header">
                    <div>
                        <h2>Disparos — {campanhaNome}</h2>
                        {total > 0 && (
                            <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', display: 'block', marginTop: '2px' }}>
                                {total} disparo{total !== 1 ? 's' : ''} no total
                            </span>
                        )}
                    </div>
                    <button className="close-modal-button" onClick={onClose}><FaTimes /></button>
                </div>

                <div className="camp-modal-body" style={{ padding: 0, gap: 0 }}>
                    {isLoading ? (
                        <div style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {[1, 2, 3, 4, 5].map(i => (
                                <div key={i} className="camp-skeleton-row">
                                    <div className="camp-skeleton-box" style={{ width: '22%' }} />
                                    <div className="camp-skeleton-box" style={{ width: '12%' }} />
                                    <div className="camp-skeleton-box" style={{ width: '10%' }} />
                                    <div className="camp-skeleton-box" style={{ width: '18%' }} />
                                    <div className="camp-skeleton-box" style={{ width: '18%' }} />
                                </div>
                            ))}
                        </div>
                    ) : conversas.length === 0 ? (
                        <div className="camp-empty">
                            <FaBullhorn className="camp-empty-icon" />
                            <h3>Nenhum disparo encontrado</h3>
                            <p>Esta campanha ainda não possui disparos registrados.</p>
                        </div>
                    ) : (
                        <div style={{ overflowX: 'auto' }}>
                            <table className="camp-table">
                                <thead>
                                    <tr>
                                        <th>Número</th>
                                        <th>Status</th>
                                        <th style={{ textAlign: 'center' }}>Interação</th>
                                        <th>Enviado em</th>
                                        <th>Entregue em</th>
                                        <th>Lido em</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {conversas.map(d => {
                                        const s = DISPARO_STATUS[d.disparoStatus] ?? { label: d.disparoStatus, cls: 'enviado' };
                                        return (
                                            <tr key={d.disparoId}>
                                                <td style={{ fontFamily: 'monospace', fontSize: '0.8125rem' }}>{d.disparoNumero}</td>
                                                <td>
                                                    <span className={`camp-disparo-badge camp-disparo-${s.cls}`}>{s.label}</span>
                                                </td>
                                                <td style={{ textAlign: 'center' }}>
                                                    {d.teveInteracao
                                                        ? <FaCheckCircle size={14} color="#16a34a" title="Respondeu" />
                                                        : <FaTimesCircle size={14} color="#94a3b8" title="Sem resposta" />
                                                    }
                                                </td>
                                                <td style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>{fmt(d.disparoEnviadoEm)}</td>
                                                <td style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>{fmt(d.disparoEntregueEm)}</td>
                                                <td style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>{fmt(d.disparoLidoEm)}</td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {totalPaginas > 1 && (
                    <div className="camp-modal-footer" style={{ justifyContent: 'center', alignItems: 'center', gap: '16px' }}>
                        <button
                            className="camp-btn-secondary"
                            style={{ padding: '8px 16px' }}
                            disabled={pagina === 1}
                            onClick={() => setPagina(p => p - 1)}
                        >
                            <FaChevronLeft /> Anterior
                        </button>
                        <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                            Página {pagina} de {totalPaginas}
                        </span>
                        <button
                            className="camp-btn-secondary"
                            style={{ padding: '8px 16px' }}
                            disabled={pagina >= totalPaginas}
                            onClick={() => setPagina(p => p + 1)}
                        >
                            Próxima <FaChevronRight />
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

// ---- Main Page ----

const CampaignPage = () => {
    const [metrics, setMetrics] = useState<CampaignMetrics[]>([]);
    const [conversations, setConversations] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState<CampanhaStatus | 'TODOS'>('TODOS');
    const [filterCategoria, setFilterCategoria] = useState<CampanhaCategoria | 'TODOS'>('TODOS');

    const [isFormOpen, setIsFormOpen] = useState(false);
    const [campaignToEdit, setCampaignToEdit] = useState<Campaign | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<{ id: number; nome: string } | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [conversasTarget, setConversasTarget] = useState<{ id: number; nome: string } | null>(null);

    const loadMetrics = useCallback(async () => {
        setIsLoading(true);
        try {
            const [metricsRes, chatRes] = await Promise.all([
                CampaignService.getMetrics(),
                apiFetch(`${import.meta.env.VITE_API_URL || ''}/api/Chat/ConversasPorVendedor`)
                    .then(r => r.json())
                    .catch(err => {
                        console.error("Erro ao carregar conversas para métricas:", err);
                        return { sucesso: false, dados: [] };
                    })
            ]);

            if (metricsRes.sucesso) {
                setMetrics(metricsRes.dados || []);
            } else {
                toast.error(metricsRes.mensagem || 'Erro ao carregar campanhas.');
            }

            if (chatRes && chatRes.sucesso && Array.isArray(chatRes.dados)) {
                setConversations(chatRes.dados);
            }
        } catch {
            toast.error('Erro ao conectar com o servidor.');
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        loadMetrics();
    }, [loadMetrics]);

    const handleEditCampaign = (c: CampaignMetrics) => {
        setCampaignToEdit(c);
        setIsFormOpen(true);
    };

    const handleNewCampaign = () => {
        setCampaignToEdit(null);
        setIsFormOpen(true);
    };

    const handleDeleteConfirm = async () => {
        if (!deleteTarget) return;
        setIsDeleting(true);
        try {
            const res = await CampaignService.remove(deleteTarget.id);
            if (res.sucesso) {
                toast.success('Campanha removida.');
                setMetrics((prev) => prev.filter((c) => c.campanhaId !== deleteTarget.id));
                setDeleteTarget(null);
            } else {
                toast.error(res.mensagem || 'Erro ao remover campanha.');
            }
        } catch {
            toast.error('Erro ao conectar com o servidor.');
        } finally {
            setIsDeleting(false);
        }
    };

    const filtered = metrics.filter((c) => {
        const matchStatus = filterStatus === 'TODOS' || c.campanhaStatus === filterStatus;
        const matchCat = filterCategoria === 'TODOS' || c.campanhaCategoria === filterCategoria;
        const matchSearch = !searchTerm || (c.campanhaNome?.toLowerCase() ?? '').includes(searchTerm.toLowerCase());
        return matchStatus && matchCat && matchSearch;
    });

    const totalDisparado = metrics.reduce((sum, m) => sum + m.totalDisparado, 0);
    const totalLeads = useMemo(() => {
        return conversations.filter(c => c.campanha === true || c.idCampanha != null).length;
    }, [conversations]);
    const totalVendas = useMemo(() => {
        return conversations.filter(c => (c.campanha === true || c.idCampanha != null) && c.statusId === 3).length;
    }, [conversations]);
    const conversionRate = totalLeads > 0 ? (totalVendas / totalLeads) * 100 : 0;

    const leadsByCampaign = useMemo(() => {
        const map: Record<number, number> = {};
        conversations.forEach(c => {
            if (c.idCampanha) {
                map[c.idCampanha] = (map[c.idCampanha] || 0) + 1;
            }
        });
        return map;
    }, [conversations]);

    const vendasByCampaign = useMemo(() => {
        const map: Record<number, number> = {};
        conversations.forEach(c => {
            if (c.idCampanha && c.statusId === 3) {
                map[c.idCampanha] = (map[c.idCampanha] || 0) + 1;
            }
        });
        return map;
    }, [conversations]);

    const totalRascunho = metrics.filter((m) => m.campanhaStatus === 'Rascunho').length;
    const totalFinalizada = metrics.filter((m) => m.campanhaStatus === 'Finalizada').length;

    return (
        <WhatsAppConnectionGuard>
        <div className="page-container">
            <div className="page-header">
                <div className="camp-header-left">
                    <div>
                        <h1>Campanhas</h1>
                        <p className="camp-page-subtitle">Gerencie e dispare campanhas de mensagens em massa via WhatsApp</p>
                    </div>
                </div>
                <button className="camp-btn-primary" onClick={handleNewCampaign}>
                    <FaPlus /> Nova campanha
                </button>
            </div>

            {/* Stats */}
            {!isLoading && metrics.length > 0 && (
                <div className="camp-stats-row">
                    <div className="camp-stat-card">
                        <span className="camp-stat-label">Total de campanhas</span>
                        <span className="camp-stat-value">{metrics.length}</span>
                    </div>
                    <div className="camp-stat-card">
                        <span className="camp-stat-label">Mensagens disparadas</span>
                        <span className="camp-stat-value accent">{totalDisparado.toLocaleString('pt-BR')}</span>
                    </div>
                    <div className="camp-stat-card">
                        <span className="camp-stat-label">Conversão (Vendas)</span>
                        <span className="camp-stat-value accent">
                            {totalVendas.toLocaleString('pt-BR')} ({conversionRate.toFixed(1)}%)
                        </span>
                    </div>
                    <div className="camp-stat-card">
                        <span className="camp-stat-label">Rascunhos / Finalizadas</span>
                        <span className="camp-stat-value">{totalRascunho} / {totalFinalizada}</span>
                    </div>
                    <div className="camp-stat-card">
                        <span className="camp-stat-label">Investimento Estimado</span>
                        <span className="camp-stat-value accent">
                            {(totalDisparado * CUSTO_UNITARIO_BRL).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        </span>
                    </div>
                </div>
            )}

            {/* Filters */}
            <div className="camp-filters">
                <input
                    type="text"
                    className="filter-input camp-search"
                    placeholder="Buscar por nome..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
                <CustomSelect
                    options={STATUS_FILTER_OPTIONS}
                    value={filterStatus}
                    onChange={(val) => setFilterStatus(val as CampanhaStatus | 'TODOS')}
                />
                <CustomSelect
                    options={CATEGORIA_FILTER_OPTIONS}
                    value={filterCategoria}
                    onChange={(val) => setFilterCategoria(val as CampanhaCategoria | 'TODOS')}
                />
            </div>

            {/* Table */}
            <div className="camp-table-wrap">
                {isLoading ? (
                    <>
                        {[1, 2, 3, 4].map((i) => (
                            <div key={i} className="camp-skeleton-row">
                                <div className="camp-skeleton-box" style={{ width: '30%' }} />
                                <div className="camp-skeleton-box" style={{ width: '15%' }} />
                                <div className="camp-skeleton-box" style={{ width: '15%' }} />
                                <div className="camp-skeleton-box" style={{ width: '20%' }} />
                                <div className="camp-skeleton-box" style={{ width: '10%', marginLeft: 'auto' }} />
                            </div>
                        ))}
                    </>
                ) : filtered.length === 0 ? (
                    <div className="camp-empty">
                        <FaBullhorn className="camp-empty-icon" />
                        <h3>{metrics.length === 0 ? 'Nenhuma campanha criada' : 'Nenhuma campanha encontrada'}</h3>
                        <p>
                            {metrics.length === 0
                                ? 'Crie sua primeira campanha e comece a disparar mensagens em massa.'
                                : 'Tente ajustar os filtros de busca.'}
                        </p>
                        {metrics.length === 0 && (
                            <button className="camp-btn-primary" onClick={handleNewCampaign} style={{ marginTop: 8 }}>
                                <FaPlus /> Criar campanha
                            </button>
                        )}
                    </div>
                ) : (
                    <table className="camp-table">
                        <thead>
                            <tr>
                                <th>Campanha</th>
                                <th>Categoria</th>
                                <th>Status</th>
                                <th>Conversão (Leads)</th>
                                <th>Custo (Est.)</th>
                                <th>Criada em</th>
                                <th style={{ textAlign: 'right', paddingRight: '20px' }}>Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map((c) => (
                                <tr key={c.campanhaId}>
                                    <td>
                                        <div className="camp-name-cell">
                                            <span className="camp-name-text">{c.campanhaNome}</span>
                                            <span className="camp-template-text">{c.campanhaTemplateNome} · {c.campanhaTemplateIdioma}</span>
                                        </div>
                                    </td>
                                    <td>
                                        <CategoriaBadge categoria={c.campanhaCategoria} />
                                    </td>
                                    <td>
                                        <StatusBadge status={c.campanhaStatus} />
                                    </td>
                                    <td>
                                        {c.totalDisparado > 0 ? (
                                            (() => {
                                                const campaignLeadsCount = leadsByCampaign[c.campanhaId] || 0;
                                                const campaignVendasCount = vendasByCampaign[c.campanhaId] || 0;
                                                const campaignConversionRate = campaignLeadsCount > 0 ? (campaignVendasCount / campaignLeadsCount) * 100 : 0;
                                                return (
                                                    <div className="camp-metrics-cell">
                                                        <span className="camp-metrics-text" title={`${campaignLeadsCount} Leads`}>
                                                            {campaignVendasCount}/{campaignLeadsCount} ({campaignConversionRate.toFixed(1)}%)
                                                        </span>
                                                        <div className="camp-metrics-bar-bg">
                                                            <div
                                                                className="camp-metrics-bar-fill"
                                                                style={{ width: `${Math.min(campaignConversionRate, 100)}%` }}
                                                            />
                                                        </div>
                                                    </div>
                                                );
                                            })()
                                        ) : (
                                            <span style={{ color: 'var(--text-secondary)', fontSize: '0.8125rem' }}>—</span>
                                        )}
                                    </td>
                                    <td>
                                        <span style={{ fontWeight: '600', fontSize: '0.875rem', color: 'var(--text-primary)' }}>
                                            {(c.totalDisparado * CUSTO_UNITARIO_BRL).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                        </span>
                                    </td>
                                    <td>
                                        <span style={{ color: 'var(--text-secondary)', fontSize: '0.8125rem' }}>
                                            {new Date(c.campanhaCreatedat).toLocaleDateString('pt-BR')}
                                        </span>
                                    </td>
                                    <td>
                                        <div className="camp-actions-cell">
                                            <button
                                                className="camp-action-btn view"
                                                title={c.totalDisparado === 0 ? 'Nenhum disparo registrado' : 'Ver disparos'}
                                                onClick={() => setConversasTarget({ id: c.campanhaId, nome: c.campanhaNome })}
                                                disabled={c.totalDisparado === 0}
                                            >
                                                <FaEye size={13} />
                                            </button>
                                            <button
                                                className="camp-action-btn dispatch"
                                                title={c.campanhaStatus !== 'Rascunho' ? 'Só é possível disparar campanhas em Rascunho' : 'Disparar campanha'}
                                                onClick={() => {
                                                    setCampaignToEdit(c);
                                                    setIsFormOpen(true);
                                                }}
                                                disabled={c.campanhaStatus !== 'Rascunho'}
                                            >
                                                <FaPaperPlane size={13} />
                                            </button>
                                            <button
                                                className="camp-action-btn edit"
                                                title="Editar"
                                                onClick={() => handleEditCampaign(c)}
                                            >
                                                <FaEdit size={13} />
                                            </button>
                                            <button
                                                className="camp-action-btn delete"
                                                title="Remover"
                                                onClick={() => setDeleteTarget({ id: c.campanhaId, nome: c.campanhaNome })}
                                            >
                                                <FaTrash size={13} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Modals */}
            {isFormOpen && (
                <CampaignWizardModal
                    campaign={campaignToEdit}
                    onClose={() => {
                        setIsFormOpen(false);
                        setCampaignToEdit(null);
                    }}
                    onSaved={loadMetrics}
                />
            )}

            {deleteTarget && (
                <DeleteConfirmModal
                    nome={deleteTarget.nome}
                    onConfirm={handleDeleteConfirm}
                    onCancel={() => setDeleteTarget(null)}
                    isDeleting={isDeleting}
                />
            )}

            {conversasTarget && (
                <ConversasModal
                    campanhaId={conversasTarget.id}
                    campanhaNome={conversasTarget.nome}
                    onClose={() => setConversasTarget(null)}
                />
            )}
        </div>
        </WhatsAppConnectionGuard>
    );
};

export default CampaignPage;
