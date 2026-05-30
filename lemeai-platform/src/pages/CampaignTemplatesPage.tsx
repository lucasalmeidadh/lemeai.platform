import { useState, useEffect, useCallback, useRef } from 'react';
import toast from 'react-hot-toast';
import EmojiPicker, { type EmojiClickData, Theme } from 'emoji-picker-react';
import {
    FaPlus,
    FaTrash,
    FaSync,
    FaBullhorn,
    FaTimes,
    FaCheckCircle,
    FaClock,
    FaTimesCircle,
    FaExclamationTriangle,
    FaPauseCircle,
    FaEye,
    FaChevronUp,
    FaImage,
    FaVideo,
    FaFileAlt,
    FaExternalLinkAlt,
    FaPhone,
    FaPhoneAlt,
    FaReply,
    FaWhatsapp,
    FaUpload,
    FaEdit,
    FaCopy,
    FaStream,
    FaMapMarkerAlt,
    FaSmile,
} from 'react-icons/fa';
import {
    MetaTemplateService,
    type MetaTemplate,
    type CreateTemplateDTO,
    type BotaoTemplate,
    type ObterHandleExemploResult,
} from '../services/MetaTemplateService';
import './CampaignTemplatesPage.css';

type TemplateStatus = MetaTemplate['status'];
type TemplateCategoria = 'MARKETING' | 'UTILITY' | 'AUTHENTICATION';
type FormatoHeader = 'TEXT' | 'IMAGE' | 'VIDEO' | 'DOCUMENT' | 'LOCATION';
type TipoBotao = 'URL' | 'QUICK_REPLY' | 'PHONE_NUMBER' | 'VOICE_CALL' | 'COPY_CODE' | 'FLOW';

const STATUS_LABEL: Record<TemplateStatus, string> = {
    PENDING: 'Pendente',
    IN_REVIEW: 'Em análise',
    APPROVED: 'Aprovado',
    REJECTED: 'Rejeitado',
    FLAGGED: 'Sinalizado',
    DISABLED: 'Desabilitado',
    PAUSED: 'Pausado',
};

const CATEGORIA_LABEL: Record<TemplateCategoria, string> = {
    MARKETING: 'Marketing',
    UTILITY: 'Utilidade',
    AUTHENTICATION: 'Autenticação',
};

const REJEICAO_LABEL: Record<string, string> = {
    ABUSIVE_CONTENT: 'Conteúdo abusivo',
    INCORRECT_CATEGORY: 'Categoria incorreta',
    INVALID_FORMAT: 'Formato inválido',
    SCAM: 'Fraude detectada',
    NONE: 'Sem motivo especificado',
};

const BOTAO_TIPO_LABEL: Record<TipoBotao, string> = {
    URL: 'Link (URL)',
    QUICK_REPLY: 'Resposta rápida',
    PHONE_NUMBER: 'Telefone',
    VOICE_CALL: 'Chamada de voz (WhatsApp)',
    COPY_CODE: 'Copiar código',
    FLOW: 'WhatsApp Flow',
};

function StatusBadge({ status }: { status: TemplateStatus }) {
    const icons: Record<TemplateStatus, JSX.Element> = {
        APPROVED: <FaCheckCircle />,
        PENDING: <FaClock />,
        IN_REVIEW: <FaClock />,
        REJECTED: <FaTimesCircle />,
        FLAGGED: <FaExclamationTriangle />,
        DISABLED: <FaTimesCircle />,
        PAUSED: <FaPauseCircle />,
    };
    return (
        <span className={`ct-status-badge ct-status-${status.toLowerCase()}`}>
            {icons[status]}
            {STATUS_LABEL[status]}
        </span>
    );
}

function CategoriaBadge({ categoria }: { categoria: TemplateCategoria }) {
    return (
        <span className={`ct-categoria-badge ct-cat-${categoria.toLowerCase()}`}>
            {CATEGORIA_LABEL[categoria]}
        </span>
    );
}

interface WhatsAppPreviewProps {
    textoHeader?: string;
    formatoHeader?: FormatoHeader;
    textoBody: string;
    textoFooter?: string;
    botoes: BotaoTemplate[];
    exemplos: string[];
    localPreviewUrl?: string;
}

function resolveVariables(text: string, exemplos: string[]): string {
    return text.replace(/\{\{(\d+)\}\}/g, (_, n) => {
        const val = exemplos[Number(n) - 1];
        return val ? val : `{{${n}}}`;
    });
}

function WhatsAppPreview({ textoHeader, formatoHeader, textoBody, textoFooter, botoes, exemplos, localPreviewUrl }: WhatsAppPreviewProps) {
    const hasContent = textoBody.trim() || textoHeader?.trim() || textoFooter?.trim() || botoes.length > 0
        || (formatoHeader && formatoHeader !== 'TEXT');

    const mediaIcon: Record<string, JSX.Element> = {
        IMAGE:    <FaImage />,
        VIDEO:    <FaVideo />,
        DOCUMENT: <FaFileAlt />,
        LOCATION: <FaMapMarkerAlt />,
    };

    const mediaLabel: Record<string, string> = {
        IMAGE: 'Imagem', VIDEO: 'Vídeo', DOCUMENT: 'Documento', LOCATION: 'Localização',
    };

    const botaoIcon = (tipo: TipoBotao) => {
        if (tipo === 'URL') return <FaExternalLinkAlt />;
        if (tipo === 'PHONE_NUMBER') return <FaPhone />;
        if (tipo === 'VOICE_CALL') return <FaPhoneAlt />;
        if (tipo === 'COPY_CODE') return <FaCopy />;
        if (tipo === 'FLOW') return <FaStream />;
        return <FaReply />;
    };

    return (
        <div className="ct-preview-wrapper">
            <div className="ct-preview-phone">
                <div className="ct-preview-phone-bar">
                    <FaWhatsapp className="ct-preview-phone-wa" />
                    <span>Pré-visualização</span>
                </div>
                <div className="ct-preview-chat-bg">
                    {!hasContent ? (
                        <div className="ct-preview-empty-msg">
                            <FaBullhorn />
                            <span>Preencha o formulário para ver o preview</span>
                        </div>
                    ) : (
                        <div className="ct-preview-bubble-wrap">
                            <div className="ct-preview-bubble">
                                {/* Header */}
                                {(textoHeader?.trim() || (formatoHeader && formatoHeader !== 'TEXT')) && (
                                    <div className="ct-preview-header">
                                        {formatoHeader && formatoHeader !== 'TEXT' ? (
                                            formatoHeader === 'IMAGE' && localPreviewUrl ? (
                                                <img src={localPreviewUrl} alt="preview" className="ct-preview-media-img" />
                                            ) : formatoHeader === 'LOCATION' ? (
                                                <div className="ct-preview-location-placeholder">
                                                    <FaMapMarkerAlt className="ct-preview-location-icon" />
                                                    <span>Localização no mapa</span>
                                                </div>
                                            ) : (
                                                <div className="ct-preview-media-placeholder">
                                                    {mediaIcon[formatoHeader]}
                                                    <span>{mediaLabel[formatoHeader]}</span>
                                                </div>
                                            )
                                        ) : (
                                            <strong>{textoHeader}</strong>
                                        )}
                                    </div>
                                )}

                                {/* Body */}
                                {textoBody.trim() && (
                                    <div className="ct-preview-body">
                                        {resolveVariables(textoBody, exemplos)
                                            .split('\n')
                                            .map((line, i) => <span key={i}>{line}<br /></span>)}
                                    </div>
                                )}

                                {/* Footer */}
                                {textoFooter?.trim() && (
                                    <div className="ct-preview-footer">{textoFooter}</div>
                                )}

                                {/* Timestamp */}
                                <div className="ct-preview-time">
                                    {new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                    <svg viewBox="0 0 16 11" width="14" height="10" fill="none">
                                        <path d="M11.071.653 4.42 7.306 1.837 4.722.5 6.059l3.92 3.919 7.994-7.993L11.071.653Z" fill="#53bdeb"/>
                                        <path d="M15.5.653 8.849 7.306 7.7 6.157l-1.337 1.337 1.486 1.485 7.994-7.993L15.5.653Z" fill="#53bdeb"/>
                                    </svg>
                                </div>
                            </div>

                            {/* Buttons outside bubble */}
                            {botoes.filter(b => b.texto.trim()).length > 0 && (
                                <div className="ct-preview-btns">
                                    {botoes.filter(b => b.texto.trim()).map((btn, i) => (
                                        <div key={i} className="ct-preview-btn">
                                            {botaoIcon(btn.tipo)}
                                            <span>{btn.texto}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
            <p className="ct-preview-note">As variáveis {'{{1}}'}, {'{{2}}'} são substituídas pelos exemplos preenchidos na seção de variáveis.</p>
        </div>
    );
}

const emptyForm: CreateTemplateDTO = {
    nome: '',
    categoria: 'MARKETING',
    idioma: 'pt_BR',
    textoBody: '',
    textoHeader: '',
    formatoHeader: undefined,
    textoFooter: '',
    botoes: [],
    exemplosBody: [],
};

const MEDIA_ACCEPT: Record<string, string> = {
    IMAGE:    'image/jpeg,image/png',
    VIDEO:    'video/mp4,video/3gpp',
    DOCUMENT: 'application/pdf,application/msword,.docx,.pptx,.xlsx',
};

type UploadState = 'idle' | 'uploading' | 'done' | 'error';

function CreateTemplateModal({ templateParaEditar, onClose, onCreated }: { templateParaEditar?: MetaTemplate; onClose: () => void; onCreated: () => void }) {
    const [form, setForm] = useState<CreateTemplateDTO>({ ...emptyForm });
    const [exemplosMap, setExemplosMap] = useState<Record<string, string>>({});
    const [botoes, setBotoes] = useState<BotaoTemplate[]>([]);
    const [isSaving, setIsSaving] = useState(false);
    const [localPreviewUrl, setLocalPreviewUrl] = useState<string | undefined>();
    const [uploadState, setUploadState] = useState<UploadState>('idle');
    const [uploadedFileName, setUploadedFileName] = useState<string>('');
    const [handleResult, setHandleResult] = useState<ObterHandleExemploResult | null>(null);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const emojiPickerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target as Node)) {
                setShowEmojiPicker(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const urlCount = botoes.filter(b => b.tipo === 'URL').length;
    const phoneCount = botoes.filter(b => b.tipo === 'PHONE_NUMBER').length;
    const voiceCallCount = botoes.filter(b => b.tipo === 'VOICE_CALL').length;
    const copyCodeCount = botoes.filter(b => b.tipo === 'COPY_CODE').length;
    const flowCount = botoes.filter(b => b.tipo === 'FLOW').length;

    // Detecta dinamicamente variáveis {{n}} no corpo do texto e sincroniza o mapeamento
    useEffect(() => {
        const regex = /\{\{(\d+)\}\}/g;
        let match;
        const foundVars = new Set<string>();
        while ((match = regex.exec(form.textoBody || '')) !== null) {
            foundVars.add(match[1]);
        }

        setExemplosMap(prev => {
            const next = { ...prev };
            // Remove as que não existem mais
            Object.keys(next).forEach(k => {
                if (!foundVars.has(k)) {
                    delete next[k];
                }
            });
            // Cria placeholders vazios para novas variáveis
            foundVars.forEach(num => {
                if (next[num] === undefined) {
                    next[num] = '';
                }
            });
            return next;
        });
    }, [form.textoBody]);

    useEffect(() => {
        if (templateParaEditar) {
            let componentes: any[] = [];
            try {
                if (templateParaEditar.componentesJson) {
                    componentes = JSON.parse(templateParaEditar.componentesJson);
                }
            } catch (err) {
                console.error('Erro ao fazer parse dos componentes para edição:', err);
            }

            const bodyComp = componentes.find((c) => c.type === 'BODY');
            const headerComp = componentes.find((c) => c.type === 'HEADER');
            const footerComp = componentes.find((c) => c.type === 'FOOTER');
            const buttonsComp = componentes.find((c) => c.type === 'BUTTONS');

            const mappedButtons: BotaoTemplate[] = (buttonsComp?.buttons || []).map((btn: any) => {
                let tipo: TipoBotao = 'QUICK_REPLY';
                if (btn.type === 'URL') tipo = 'URL';
                else if (btn.type === 'PHONE_NUMBER') tipo = 'PHONE_NUMBER';
                else if (btn.type === 'VOICE_CALL') tipo = 'VOICE_CALL';
                else if (btn.type === 'COPY_CODE') tipo = 'COPY_CODE';
                else if (btn.type === 'FLOW') tipo = 'FLOW';

                return {
                    tipo,
                    texto: btn.text || '',
                    url: btn.url || '',
                    telefone: btn.phoneNumber || btn.phone || btn.telefone || '',
                    exemplo_codigo: btn.example || btn.exemplo_codigo || '',
                    flow_id: btn.flow_id || '',
                    flow_action: btn.flow_action || 'NAVIGATE',
                    navigate_screen: btn.navigate_screen || '',
                };
            });

            setForm({
                nome: templateParaEditar.nome,
                categoria: 'MARKETING',
                idioma: templateParaEditar.idioma || 'pt_BR',
                textoBody: bodyComp?.text || '',
                textoHeader: headerComp?.text || '',
                formatoHeader: headerComp?.format as FormatoHeader || undefined,
                textoFooter: footerComp?.text || '',
                exemploHeaderHandle: headerComp?.example?.header_handle?.[0] || '',
                exemploHeaderTexto: headerComp?.example?.header_text?.[0] || '',
            });

            // Extrai as variáveis existentes no texto do corpo
            const regex = /\{\{(\d+)\}\}/g;
            let match;
            const order: string[] = [];
            while ((match = regex.exec(bodyComp?.text || '')) !== null) {
                order.push(match[1]);
            }

            const examplesArray = bodyComp?.example?.body_text?.[0] || [];
            const initialMap: Record<string, string> = {};
            // Mapeia na ordem que aparecem
            order.forEach((varNum, index) => {
                initialMap[varNum] = examplesArray[index] || '';
            });
            setExemplosMap(initialMap);

            setBotoes(mappedButtons);

            if (headerComp?.format && headerComp.format !== 'TEXT') {
                setUploadState('done');
                setUploadedFileName('Mídia salva na Meta');
            }
        }
    }, [templateParaEditar]);

    const isMediaHeader = form.formatoHeader && form.formatoHeader !== 'TEXT' && form.formatoHeader !== 'LOCATION';
    const isLocationHeader = form.formatoHeader === 'LOCATION';
    const isTextHeaderWithVar = form.formatoHeader === 'TEXT' && form.textoHeader?.includes('{{1}}');

    const addBotao = () => {
        if (botoes.length >= 10) return;
        setBotoes([...botoes, { tipo: 'QUICK_REPLY', texto: '' }]);
    };

    const removeBotao = (i: number) => setBotoes(botoes.filter((_, idx) => idx !== i));

    const updateBotao = (i: number, field: keyof BotaoTemplate, value: any) => {
        const updated = [...botoes];
        if (field === 'tipo') {
            // Ao mudar o tipo do botão, limpa os campos antigos específicos de outros tipos
            updated[i] = {
                tipo: value as TipoBotao,
                texto: updated[i].texto, // Mantém o texto inserido pelo usuário
            };
        } else {
            updated[i] = { ...updated[i], [field]: value };
        }
        setBotoes(updated);
    };

    const handleFormatoHeaderChange = (valor: string) => {
        setForm({ ...form, formatoHeader: (valor as FormatoHeader) || undefined, textoHeader: '', exemploHeaderHandle: '', caminhoMidiaHeader: '', exemploHeaderTexto: '' });
        setLocalPreviewUrl(undefined);
        setUploadState('idle');
        setHandleResult(null);
        setUploadedFileName('');
    };

    const handleMediaFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (form.formatoHeader === 'IMAGE') {
            const reader = new FileReader();
            reader.onload = (ev) => setLocalPreviewUrl(ev.target?.result as string);
            reader.readAsDataURL(file);
        } else {
            setLocalPreviewUrl(undefined);
        }

        setUploadedFileName(file.name);
        setUploadState('uploading');
        setHandleResult(null);

        try {
            const res = await MetaTemplateService.obterHandleExemplo(file);
            if (res.sucesso && res.dados) {
                setHandleResult(res.dados);
                setForm(prev => ({
                    ...prev,
                    exemploHeaderHandle: res.dados.handle,
                    caminhoMidiaHeader: res.dados.caminhoLocal,
                }));
                setUploadState('done');
            } else {
                toast.error(res.mensagem || 'Erro ao obter handle de exemplo.');
                setUploadState('error');
                setLocalPreviewUrl(undefined);
            }
        } catch {
            toast.error('Erro ao conectar com o servidor.');
            setUploadState('error');
            setLocalPreviewUrl(undefined);
        }
    };

    const clearMediaUpload = () => {
        setLocalPreviewUrl(undefined);
        setUploadState('idle');
        setHandleResult(null);
        setUploadedFileName('');
        setForm(prev => ({ ...prev, exemploHeaderHandle: '', caminhoMidiaHeader: '' }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (isMediaHeader && uploadState !== 'done') {
            toast.error('Faça o upload da mídia de exemplo antes de criar o template.');
            return;
        }

        // Mapeia os exemplos na ordem correta das variáveis identificadas no corpo
        const regex = /\{\{(\d+)\}\}/g;
        let match;
        const variablesFound: string[] = [];
        while ((match = regex.exec(form.textoBody || '')) !== null) {
            variablesFound.push(match[1]);
        }
        // Gera um array ordenado correspondente a {{1}}, {{2}}...
        const arrayOrdenado = variablesFound.map(num => exemplosMap[num] || '');

        const payload: CreateTemplateDTO = {
            ...form,
            nome: form.nome.trim().toLowerCase().replace(/\s+/g, '_'),
            textoHeader: form.textoHeader?.trim() || undefined,
            textoFooter: form.textoFooter?.trim() || undefined,
            formatoHeader: form.formatoHeader || undefined,
            exemploHeaderHandle: isMediaHeader ? (form.exemploHeaderHandle || undefined) : undefined,
            caminhoMidiaHeader: isMediaHeader ? (form.caminhoMidiaHeader || undefined) : undefined,
            exemploHeaderTexto: isTextHeaderWithVar ? (form.exemploHeaderTexto?.trim() || undefined) : undefined,
            botoes: botoes.length > 0 ? botoes : undefined,
            exemplosBody: arrayOrdenado.length > 0 ? arrayOrdenado : undefined,
        };

        setIsSaving(true);
        try {
            if (templateParaEditar) {
                // Nova lógica usando endpoint PUT Atualizar
                const updatePayload = {
                    metaTemplateId: templateParaEditar.metaTemplateId,
                    categoria: payload.categoria,
                    textoBody: payload.textoBody,
                    textoHeader: payload.textoHeader,
                    formatoHeader: payload.formatoHeader,
                    exemploHeaderHandle: payload.exemploHeaderHandle,
                    exemploHeaderTexto: payload.exemploHeaderTexto,
                    caminhoMidiaHeader: payload.caminhoMidiaHeader,
                    textoFooter: payload.textoFooter,
                    botoes: payload.botoes,
                    exemplosBody: payload.exemplosBody,
                };

                const res = await MetaTemplateService.update(updatePayload);
                if (res.sucesso) {
                    toast.success('Template atualizado e enviado para análise da Meta!');
                    onCreated();
                    onClose();
                } else {
                    toast.error(res.mensagem || 'Erro ao atualizar template.');
                }
            } else {
                // Criação normal
                const res = await MetaTemplateService.create(payload);
                if (res.sucesso) {
                    toast.success('Template criado e enviado para análise da Meta!');
                    onCreated();
                    onClose();
                } else {
                    toast.error(res.mensagem || 'Erro ao criar template.');
                }
            }
        } catch {
            toast.error('Erro ao conectar com o servidor.');
        } finally {
            setIsSaving(false);
        }
    };

    // Obtém um array simples de valores na ordem de chaves
    const exemplosArray = Object.keys(exemplosMap)
        .sort((a, b) => Number(a) - Number(b))
        .map(k => exemplosMap[k]);

    return (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
            <div className="ct-modal ct-modal-wide">
                <div className="ct-modal-header">
                    <h2>{templateParaEditar ? 'Editar Template de Campanha' : 'Novo Template de Campanha'}</h2>
                    <button className="close-modal-button" onClick={onClose}><FaTimes /></button>
                </div>

                {templateParaEditar && (
                    <div className="ct-edit-warning">
                        <FaExclamationTriangle className="ct-warning-icon" />
                        <span>
                            <strong>Atenção:</strong> Ao editar, o template será atualizado diretamente na Meta e passará por um novo processo de aprovação.
                        </span>
                    </div>
                )}

                <div className="ct-modal-split">
                    {/* ---- Formulário ---- */}
                    <form className="ct-modal-form" onSubmit={handleSubmit} id="ct-create-form">
                        
                        {/* Seção 1: Configurações Gerais */}
                        <section className="ct-form-section">
                            <h3 className="ct-section-title-modal">Configurações Gerais</h3>
                            <div className="ct-section-grid">
                                <div className="ct-form-group">
                                    <label>Nome do template <span className="ct-required">*</span></label>
                                    <input
                                        type="text"
                                        value={form.nome}
                                        onChange={(e) => setForm({ ...form, nome: e.target.value })}
                                        placeholder="ex: confirmacao_agendamento"
                                        required
                                        disabled={!!templateParaEditar}
                                    />
                                    <span className="ct-hint">Letras minúsculas, números e underscores. Espaços são convertidos automaticamente.</span>
                                </div>

                                <div className="ct-form-group">
                                    <label>Idioma <span className="ct-required">*</span></label>
                                    <select
                                        value={form.idioma}
                                        onChange={(e) => setForm({ ...form, idioma: e.target.value })}
                                        required
                                    >
                                        <option value="pt_BR">Português (Brasil)</option>
                                        <option value="en_US">English (US)</option>
                                        <option value="es_ES">Español</option>
                                        <option value="es_AR">Español (Argentina)</option>
                                    </select>
                                </div>
                            </div>
                        </section>

                        {/* Seção 2: Estrutura da Mensagem */}
                        <section className="ct-form-section">
                            <h3 className="ct-section-title-modal">Estrutura da Mensagem</h3>
                            <div className="ct-section-grid-stack">
                                
                                {/* Cabeçalho */}
                                <div className="ct-form-group">
                                    <label>Formato do cabeçalho</label>
                                    <select
                                        value={form.formatoHeader || ''}
                                        onChange={(e) => handleFormatoHeaderChange(e.target.value)}
                                    >
                                        <option value="">Sem cabeçalho</option>
                                        <option value="TEXT">Texto</option>
                                        <option value="IMAGE">Imagem</option>
                                        <option value="VIDEO">Vídeo</option>
                                        <option value="DOCUMENT">Documento</option>
                                        <option value="LOCATION">Localização</option>
                                    </select>
                                </div>

                                {/* Texto do cabeçalho (formato TEXT) */}
                                {form.formatoHeader === 'TEXT' && (
                                    <div className="ct-form-group">
                                        <label>Texto do cabeçalho</label>
                                        <input
                                            type="text"
                                            value={form.textoHeader || ''}
                                            onChange={(e) => setForm({ ...form, textoHeader: e.target.value })}
                                            placeholder="Título do template (suporta {{1}})"
                                        />
                                    </div>
                                )}

                                {/* Exemplo do header TEXT com variável */}
                                {isTextHeaderWithVar && (
                                    <div className="ct-form-group">
                                        <label>Exemplo do cabeçalho</label>
                                        <input
                                            type="text"
                                            value={form.exemploHeaderTexto || ''}
                                            onChange={(e) => setForm({ ...form, exemploHeaderTexto: e.target.value })}
                                            placeholder="Ex: Promoção de Verão"
                                        />
                                        <span className="ct-hint">Obrigatório pela Meta quando o cabeçalho de texto contém {'{{1}}'}.</span>
                                    </div>
                                )}

                                {/* Info: Localização */}
                                {isLocationHeader && (
                                    <div className="ct-location-info">
                                        <FaMapMarkerAlt className="ct-location-info-icon" />
                                        <div>
                                            <strong>Cabeçalho de Localização</strong>
                                            <p>As coordenadas (latitude, longitude, nome e endereço) serão informadas no momento do disparo da campanha. Não é necessário enviar nenhum dado na criação do template.</p>
                                        </div>
                                    </div>
                                )}

                                {/* Upload de mídia para header (IMAGE/VIDEO/DOCUMENT) */}
                                {isMediaHeader && (
                                    <div className="ct-form-group">
                                        <label>
                                            Mídia do cabeçalho <span className="ct-required">*</span>
                                        </label>

                                        {uploadState === 'idle' || uploadState === 'error' ? (
                                            <label className={`ct-upload-area ${uploadState === 'error' ? 'ct-upload-area-error' : ''}`}>
                                                <FaUpload />
                                                <span>
                                                    Clique para selecionar {form.formatoHeader === 'IMAGE' ? 'imagem (JPG/PNG)' : form.formatoHeader === 'VIDEO' ? 'vídeo (MP4)' : 'documento (PDF)'}
                                                </span>
                                                {uploadState === 'error' && <span className="ct-upload-error-msg">Erro no upload — tente novamente</span>}
                                                <input
                                                    type="file"
                                                    accept={MEDIA_ACCEPT[form.formatoHeader!] || ''}
                                                    onChange={handleMediaFileChange}
                                                    style={{ display: 'none' }}
                                                />
                                            </label>
                                        ) : uploadState === 'uploading' ? (
                                            <div className="ct-upload-loading">
                                                <div className="ct-upload-spinner" />
                                                <span>Enviando <strong>{uploadedFileName}</strong> para a Meta...</span>
                                            </div>
                                        ) : (
                                            <div className="ct-upload-success">
                                                {localPreviewUrl ? (
                                                    <img src={localPreviewUrl} alt="prévia" className="ct-upload-img-thumb" />
                                                ) : (
                                                    <div className="ct-upload-file-icon">
                                                        {form.formatoHeader === 'VIDEO' ? <FaVideo /> : <FaFileAlt />}
                                                    </div>
                                                )}
                                                <div className="ct-upload-success-info">
                                                    <FaCheckCircle className="ct-upload-check" />
                                                    <span className="ct-upload-filename">{uploadedFileName}</span>
                                                    <span className="ct-hint">Handle obtido. O arquivo será reutilizado automaticamente no disparo.</span>
                                                </div>
                                                <button type="button" className="ct-upload-remove" onClick={clearMediaUpload}>
                                                    <FaTimes /> Trocar
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Corpo da mensagem */}
                                <div className="ct-form-group">
                                    <label>Texto do corpo <span className="ct-required">*</span></label>
                                    <div className="ct-textarea-container">
                                        <textarea
                                            value={form.textoBody}
                                            onChange={(e) => setForm({ ...form, textoBody: e.target.value })}
                                            placeholder="Olá, {{1}}! Seu agendamento para {{2}} está confirmado."
                                            rows={8}
                                            required
                                            id="ct-textarea-body"
                                        />
                                        <button
                                            type="button"
                                            className="ct-emoji-button"
                                            title="Inserir emoji"
                                            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                                        >
                                            <FaSmile />
                                        </button>
                                        {showEmojiPicker && (
                                            <div ref={emojiPickerRef} className="ct-emoji-picker-container">
                                                <EmojiPicker
                                                    onEmojiClick={(emojiData: EmojiClickData) => {
                                                        setForm(prev => ({ ...prev, textoBody: (prev.textoBody || '') + emojiData.emoji }));
                                                        const el = document.getElementById('ct-textarea-body');
                                                        if (el) el.focus();
                                                    }}
                                                    theme={Theme.LIGHT}
                                                    searchPlaceHolder="Pesquisar emoji"
                                                    width={320}
                                                    height={360}
                                                />
                                            </div>
                                        )}
                                    </div>
                                    <span className="ct-hint">Use {'{{1}}'}, {'{{2}}'} para variáveis dinâmicas.</span>
                                </div>

                                {/* Variáveis dinâmicas detectadas */}
                                {Object.keys(exemplosMap).length > 0 && (
                                    <div className="ct-variables-box">
                                        <span className="ct-variables-title">Exemplos das variáveis detectadas:</span>
                                        <div className="ct-variables-grid">
                                            {Object.keys(exemplosMap).sort((a, b) => Number(a) - Number(b)).map((num) => (
                                                <div key={num} className="ct-variable-input-group">
                                                    <label>Variável {`{{${num}}}`}</label>
                                                    <input
                                                        type="text"
                                                        value={exemplosMap[num]}
                                                        onChange={(e) => setExemplosMap(prev => ({ ...prev, [num]: e.target.value }))}
                                                        placeholder={`Exemplo para {{${num}}}`}
                                                        required
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                        <span className="ct-variables-hint">Esses exemplos são usados para a aprovação da Meta e na pré-visualização.</span>
                                    </div>
                                )}

                                {/* Rodapé */}
                                <div className="ct-form-group">
                                    <label>Rodapé</label>
                                    <input
                                        type="text"
                                        value={form.textoFooter || ''}
                                        onChange={(e) => setForm({ ...form, textoFooter: e.target.value })}
                                        placeholder="LemeIA – Atendimento inteligente"
                                        maxLength={60}
                                    />
                                    <span className="ct-hint">Máx. 60 caracteres. Sem variáveis.</span>
                                </div>

                            </div>
                        </section>

                        {/* Seção 3: Botões (Interatividade) */}
                        <section className="ct-form-section">
                            <div className="ct-botoes-header">
                                <span className="ct-section-title">Botões <span className="ct-hint-inline">(máx. 10)</span></span>
                                {botoes.length < 10 && (
                                    <button type="button" className="ct-btn-add-botao" onClick={addBotao}>
                                        <FaPlus /> Adicionar botão
                                    </button>
                                )}
                            </div>
                            {botoes.map((btn, i) => (
                                <div key={i} className="ct-botao-row">
                                    <select
                                        value={btn.tipo}
                                        onChange={(e) => updateBotao(i, 'tipo', e.target.value as TipoBotao)}
                                    >
                                        <option value="QUICK_REPLY">Resposta rápida</option>
                                        <option value="URL" disabled={urlCount >= 2 && btn.tipo !== 'URL'}>Link (URL) {urlCount >= 2 && btn.tipo !== 'URL' ? '(Máx. 2)' : ''}</option>
                                        <option value="PHONE_NUMBER" disabled={(phoneCount >= 1 && btn.tipo !== 'PHONE_NUMBER') || (voiceCallCount >= 1 && btn.tipo !== 'PHONE_NUMBER')}>Telefone {voiceCallCount >= 1 && btn.tipo !== 'PHONE_NUMBER' ? '(Conflita com Chamada de voz)' : phoneCount >= 1 && btn.tipo !== 'PHONE_NUMBER' ? '(Máx. 1)' : ''}</option>
                                        <option value="VOICE_CALL" disabled={(voiceCallCount >= 1 && btn.tipo !== 'VOICE_CALL') || (phoneCount >= 1 && btn.tipo !== 'VOICE_CALL')}>Chamada de voz {phoneCount >= 1 && btn.tipo !== 'VOICE_CALL' ? '(Conflita com Telefone)' : voiceCallCount >= 1 && btn.tipo !== 'VOICE_CALL' ? '(Máx. 1)' : ''}</option>
                                        <option value="COPY_CODE" disabled={copyCodeCount >= 1 && btn.tipo !== 'COPY_CODE'}>Copiar código {copyCodeCount >= 1 && btn.tipo !== 'COPY_CODE' ? '(Máx. 1)' : ''}</option>
                                        <option value="FLOW" disabled={flowCount >= 1 && btn.tipo !== 'FLOW'}>WhatsApp Flow {flowCount >= 1 && btn.tipo !== 'FLOW' ? '(Máx. 1)' : ''}</option>
                                    </select>
                                    <input
                                        type="text"
                                        value={btn.texto}
                                        onChange={(e) => updateBotao(i, 'texto', e.target.value)}
                                        placeholder="Texto do botão"
                                        maxLength={25}
                                    />
                                    {btn.tipo === 'URL' && (
                                        <input
                                            type="text"
                                            value={btn.url || ''}
                                            onChange={(e) => updateBotao(i, 'url', e.target.value)}
                                            placeholder="https://..."
                                            className="ct-botao-url"
                                        />
                                    )}
                                    {btn.tipo === 'PHONE_NUMBER' && (
                                        <input
                                            type="text"
                                            value={btn.telefone || ''}
                                            onChange={(e) => updateBotao(i, 'telefone', e.target.value)}
                                            placeholder="+5511999999999"
                                            className="ct-botao-phone"
                                        />
                                    )}
                                    {btn.tipo === 'COPY_CODE' && (
                                        <input
                                            type="text"
                                            value={btn.exemplo_codigo || ''}
                                            onChange={(e) => updateBotao(i, 'exemplo_codigo', e.target.value)}
                                            placeholder="Ex: PROMO20"
                                            className="ct-botao-copycode"
                                        />
                                    )}
                                    {btn.tipo === 'FLOW' && (
                                        <div className="ct-botao-flow-fields">
                                            <input
                                                type="text"
                                                value={btn.flow_id || ''}
                                                onChange={(e) => updateBotao(i, 'flow_id', e.target.value)}
                                                placeholder="Flow ID"
                                                className="ct-botao-flow-id"
                                            />
                                            <select
                                                value={btn.flow_action || 'NAVIGATE'}
                                                onChange={(e) => updateBotao(i, 'flow_action', e.target.value)}
                                                className="ct-botao-flow-action"
                                            >
                                                <option value="NAVIGATE">Navigate</option>
                                                <option value="DATA_EXCHANGE">Data Exchange</option>
                                            </select>
                                            {btn.flow_action === 'NAVIGATE' && (
                                                <input
                                                    type="text"
                                                    value={btn.navigate_screen || ''}
                                                    onChange={(e) => updateBotao(i, 'navigate_screen', e.target.value)}
                                                    placeholder="Nome da tela (opcional)"
                                                    className="ct-botao-flow-screen"
                                                />
                                            )}
                                        </div>
                                    )}
                                    <button type="button" className="ct-btn-remove-botao" onClick={() => removeBotao(i)}>
                                        <FaTimes />
                                    </button>
                                </div>
                            ))}
                        </section>
                    </form>

                    {/* ---- Preview ---- */}
                    <div className="ct-preview-panel">
                        <WhatsAppPreview
                            textoHeader={form.textoHeader}
                            formatoHeader={form.formatoHeader}
                            textoBody={form.textoBody}
                            textoFooter={form.textoFooter}
                            botoes={botoes}
                            exemplos={exemplosArray}
                            localPreviewUrl={localPreviewUrl}
                        />
                    </div>
                </div>

                <div className="ct-modal-footer ct-modal-footer-wide">
                    <button type="button" className="ct-btn-secondary" onClick={onClose} disabled={isSaving}>
                        Cancelar
                    </button>
                    <button type="submit" form="ct-create-form" className="ct-btn-primary" disabled={isSaving}>
                        {isSaving ? 'Enviando...' : 'Enviar para análise'}
                    </button>
                </div>
            </div>
        </div>
    );
}

interface DeleteConfirmModalProps {
    nome: string;
    onConfirm: () => void;
    onCancel: () => void;
    isDeleting: boolean;
}

function DeleteConfirmModal({ nome, onConfirm, onCancel, isDeleting }: DeleteConfirmModalProps) {
    return (
        <div className="modal-overlay">
            <div className="ct-confirm-modal">
                <div className="ct-confirm-icon"><FaTrash /></div>
                <h3>Remover template</h3>
                <p>
                    Tem certeza que deseja remover o template <strong>{nome}</strong>?
                    <br />
                    <span className="ct-confirm-warning">Esta ação remove todos os idiomas desse template na Meta e não pode ser desfeita.</span>
                </p>
                <div className="ct-confirm-actions">
                    <button className="ct-btn-secondary" onClick={onCancel} disabled={isDeleting}>Cancelar</button>
                    <button className="ct-btn-danger" onClick={onConfirm} disabled={isDeleting}>
                        {isDeleting ? 'Removendo...' : 'Remover'}
                    </button>
                </div>
            </div>
        </div>
    );
}

const CampaignTemplatesPage = () => {
    const [templates, setTemplates] = useState<MetaTemplate[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSyncing, setIsSyncing] = useState(false);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [templateParaEditar, setTemplateParaEditar] = useState<MetaTemplate | undefined>(undefined);
    const [deleteTarget, setDeleteTarget] = useState<{ id: number; nome: string } | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [filterStatus, setFilterStatus] = useState<TemplateStatus | 'TODOS'>('TODOS');
    const [searchTerm, setSearchTerm] = useState('');

    const loadTemplates = useCallback(async () => {
        setIsLoading(true);
        try {
            const res = await MetaTemplateService.getAll();
            if (res.sucesso) {
                setTemplates(res.dados || []);
            } else {
                toast.error(res.mensagem || 'Erro ao carregar templates.');
            }
        } catch {
            toast.error('Erro ao conectar com o servidor.');
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        const iniciar = async () => {
            // Carrega rápido os dados locais já salvos
            await loadTemplates();
            // Dispara sincronização silenciosa em background para atualizar status da Meta
            setIsSyncing(true);
            try {
                const res = await MetaTemplateService.sincronizar();
                if (res.sucesso) {
                    // Recarrega com os status atualizados
                    const fresh = await MetaTemplateService.getAll();
                    if (fresh.sucesso) {
                        setTemplates(fresh.dados || []);
                    }
                }
            } catch (err) {
                console.error("Erro na sincronização automática inicial:", err);
            } finally {
                setIsSyncing(false);
            }
        };
        iniciar();
    }, [loadTemplates]);

    const handleSincronizar = async () => {
        setIsSyncing(true);
        try {
            const res = await MetaTemplateService.sincronizar();
            if (res.sucesso) {
                toast.success(res.mensagem || 'Sincronização concluída.');
                await loadTemplates();
            } else {
                toast.error(res.mensagem || 'Erro ao sincronizar.');
            }
        } catch {
            toast.error('Erro ao conectar com o servidor.');
        } finally {
            setIsSyncing(false);
        }
    };

    const handleDeleteRequest = (id: number, nome: string) => {
        setDeleteTarget({ id, nome });
    };

    const handleEditRequest = (template: MetaTemplate) => {
        setTemplateParaEditar(template);
        setIsCreateModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsCreateModalOpen(false);
        setTemplateParaEditar(undefined);
    };

    const handleDeleteConfirm = async () => {
        if (!deleteTarget) return;
        setIsDeleting(true);
        try {
            const res = await MetaTemplateService.remove(deleteTarget.id);
            if (res.sucesso) {
                toast.success('Template removido com sucesso.');
                setTemplates((prev) => prev.filter((t) => t.metaTemplateId !== deleteTarget.id));
                setDeleteTarget(null);
            } else {
                toast.error(res.mensagem || 'Erro ao remover template.');
            }
        } catch {
            toast.error('Erro ao conectar com o servidor.');
        } finally {
            setIsDeleting(false);
        }
    };

    const filtered = templates.filter((t) => {
        const matchStatus = filterStatus === 'TODOS' || t.status === filterStatus;
        const matchCat = t.categoria === 'MARKETING';
        const matchSearch = !searchTerm || t.nome.toLowerCase().includes(searchTerm.toLowerCase());
        return matchStatus && matchCat && matchSearch;
    });

    return (
        <div className="page-container">
            <div className="page-header">
                <div className="ct-header-left">
                    <div>
                        <h1>Templates de Campanha</h1>
                    </div>
                </div>
                <div className="ct-header-actions">
                    <button
                        className="ct-btn-sync"
                        onClick={handleSincronizar}
                        disabled={isSyncing}
                        title="Sincronizar templates com a Meta"
                    >
                        <FaSync className={isSyncing ? 'ct-spin' : ''} />
                        {isSyncing ? 'Sincronizando...' : 'Sincronizar'}
                    </button>
                    <button className="ct-btn-primary" onClick={() => setIsCreateModalOpen(true)}>
                        <FaPlus /> Novo template
                    </button>
                </div>
            </div>

            <div className="dashboard-card">
                <div className="contacts-filters-container">
                    <input
                        type="text"
                        className="filter-input ct-search"
                        placeholder="Buscar por nome..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <select
                        className="ct-filter-select"
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value as TemplateStatus | 'TODOS')}
                    >
                        <option value="TODOS">Todos os status</option>
                        {Object.entries(STATUS_LABEL).map(([v, l]) => (
                            <option key={v} value={v}>{l}</option>
                        ))}
                    </select>
                </div>

                <div className="table-container">
                    {isLoading ? (
                        <div style={{ padding: '0 20px 20px' }}>
                            {[1, 2, 3, 4, 5].map(i => (
                                <div key={i} className="contact-skeleton-row">
                                    <div className="skeleton-avatar-box"></div>
                                    <div className="skeleton-text-box" style={{ maxWidth: '200px' }}></div>
                                    <div className="skeleton-text-box" style={{ maxWidth: '150px' }}></div>
                                    <div className="skeleton-text-box" style={{ maxWidth: '150px' }}></div>
                                    <div className="skeleton-text-box" style={{ maxWidth: '100px' }}></div>
                                </div>
                            ))}
                        </div>
                    ) : filtered.length === 0 ? (
                        <div className="ct-empty" style={{ padding: '40px 20px' }}>
                            <FaBullhorn className="ct-empty-icon" />
                            <h3>{templates.length === 0 ? 'Nenhum template encontrado' : 'Nenhum template corresponde ao filtro'}</h3>
                            <p style={{ margin: '8px 0 16px' }}>
                                {templates.length === 0
                                    ? 'Clique em "Sincronizar" para buscar templates existentes ou crie um novo.'
                                    : 'Tente ajustar os filtros de busca.'}
                            </p>
                            {templates.length === 0 && (
                                <button className="ct-btn-primary" onClick={() => setIsCreateModalOpen(true)} style={{ margin: '0 auto' }}>
                                    <FaPlus /> Criar primeiro template
                                </button>
                            )}
                        </div>
                    ) : (
                        <>
                            <table className="management-table">
                                <thead>
                                    <tr>
                                        <th>Template</th>
                                        <th>Status</th>
                                        <th>Categoria</th>
                                        <th>Idioma</th>
                                        <th style={{ textAlign: 'right', paddingRight: '25px' }}>Ações</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filtered.map((t) => (
                                        <tr key={t.metaTemplateId}>
                                            <td>
                                                <div className="contact-name-cell">
                                                    <div className="contact-avatar">
                                                        {t.nome.charAt(0).toUpperCase()}
                                                    </div>
                                                    <span className="contact-name-text">{t.nome}</span>
                                                </div>
                                            </td>
                                            <td>
                                                <StatusBadge status={t.status} />
                                            </td>
                                            <td>
                                                <CategoriaBadge categoria={t.categoria} />
                                            </td>
                                            <td>
                                                <span className="ct-idioma-badge">{t.idioma}</span>
                                            </td>
                                            <td>
                                                <div className="actions-cell" style={{ justifyContent: 'flex-end', paddingRight: '10px' }}>
                                                    <button
                                                        className="action-icon-btn edit"
                                                        onClick={() => handleEditRequest(t)}
                                                        title="Editar template"
                                                    >
                                                        <FaEdit size={14} />
                                                    </button>
                                                    <button
                                                        className="action-icon-btn delete"
                                                        onClick={() => handleDeleteRequest(t.metaTemplateId, t.nome)}
                                                        title="Remover template"
                                                    >
                                                        <FaTrash size={14} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            <div className="ct-list-count" style={{ padding: '16px 20px 0', borderTop: '1px solid var(--border-color-soft)', marginTop: '8px' }}>
                                {filtered.length} template{filtered.length !== 1 ? 's' : ''}
                            </div>
                        </>
                    )}
                </div>
            </div>

            {isCreateModalOpen && (
                <CreateTemplateModal
                    templateParaEditar={templateParaEditar}
                    onClose={handleCloseModal}
                    onCreated={loadTemplates}
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
        </div>
    );
};

export default CampaignTemplatesPage;
