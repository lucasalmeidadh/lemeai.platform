import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
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
    FaReply,
    FaWhatsapp,
    FaUpload,
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
type FormatoHeader = 'TEXT' | 'IMAGE' | 'VIDEO' | 'DOCUMENT';
type TipoBotao = 'URL' | 'QUICK_REPLY' | 'PHONE_NUMBER';

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

interface TemplateCardProps {
    template: MetaTemplate;
    onDelete: (id: number, nome: string) => void;
}

function TemplateCard({ template, onDelete }: TemplateCardProps) {
    const [expanded, setExpanded] = useState(false);

    let componentes: any[] = [];
    try {
        if (template.componentesJson) {
            componentes = JSON.parse(template.componentesJson);
        }
    } catch {
        componentes = [];
    }

    const bodyComp = componentes.find((c) => c.type === 'BODY');
    const headerComp = componentes.find((c) => c.type === 'HEADER');
    const footerComp = componentes.find((c) => c.type === 'FOOTER');
    const buttonsComp = componentes.find((c) => c.type === 'BUTTONS');

    return (
        <div className="ct-card">
            <div className="ct-card-header">
                <div className="ct-card-meta">
                    <span className="ct-card-nome">{template.nome}</span>
                    <div className="ct-card-badges">
                        <StatusBadge status={template.status} />
                        <CategoriaBadge categoria={template.categoria} />
                        <span className="ct-idioma-badge">{template.idioma}</span>
                        {template.qualidade && (
                            <span className={`ct-qualidade-badge ct-q-${template.qualidade.toLowerCase()}`}>
                                {template.qualidade === 'HIGH' ? 'Alta qualidade' : template.qualidade === 'MEDIUM' ? 'Média qualidade' : 'Baixa qualidade'}
                            </span>
                        )}
                    </div>
                    {template.status === 'REJECTED' && template.motivoRejeicao && (
                        <p className="ct-rejeicao-msg">
                            <FaTimesCircle /> Motivo: {REJEICAO_LABEL[template.motivoRejeicao] || template.motivoRejeicao}
                        </p>
                    )}
                </div>
                <div className="ct-card-actions">
                    <button
                        className="ct-btn-icon ct-btn-expand"
                        onClick={() => setExpanded(!expanded)}
                        title={expanded ? 'Recolher' : 'Ver detalhes'}
                    >
                        {expanded ? <FaChevronUp /> : <FaEye />}
                    </button>
                    <button
                        className="ct-btn-icon ct-btn-delete"
                        onClick={() => onDelete(template.metaTemplateId, template.nome)}
                        title="Remover template"
                    >
                        <FaTrash />
                    </button>
                </div>
            </div>

            {expanded && (
                <div className="ct-card-body">
                    {headerComp && (
                        <div className="ct-comp-section">
                            <span className="ct-comp-label">Cabeçalho ({headerComp.format || 'TEXT'})</span>
                            <p className="ct-comp-text">{headerComp.text || '(mídia)'}</p>
                        </div>
                    )}
                    {bodyComp && (
                        <div className="ct-comp-section">
                            <span className="ct-comp-label">Corpo</span>
                            <p className="ct-comp-text">{bodyComp.text}</p>
                        </div>
                    )}
                    {footerComp && (
                        <div className="ct-comp-section">
                            <span className="ct-comp-label">Rodapé</span>
                            <p className="ct-comp-text ct-comp-footer">{footerComp.text}</p>
                        </div>
                    )}
                    {buttonsComp && buttonsComp.buttons?.length > 0 && (
                        <div className="ct-comp-section">
                            <span className="ct-comp-label">Botões</span>
                            <div className="ct-buttons-preview">
                                {buttonsComp.buttons.map((btn: any, i: number) => (
                                    <span key={i} className="ct-btn-preview">{btn.text}</span>
                                ))}
                            </div>
                        </div>
                    )}
                    <div className="ct-comp-dates">
                        <span>Criado em: {new Date(template.criadoEm).toLocaleDateString('pt-BR')}</span>
                        {template.sincronizadoEm && (
                            <span>Sincronizado: {new Date(template.sincronizadoEm).toLocaleDateString('pt-BR')}</span>
                        )}
                    </div>
                </div>
            )}
        </div>
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
    };

    const mediaLabel: Record<string, string> = {
        IMAGE: 'Imagem', VIDEO: 'Vídeo', DOCUMENT: 'Documento',
    };

    const botaoIcon = (tipo: TipoBotao) => {
        if (tipo === 'URL') return <FaExternalLinkAlt />;
        if (tipo === 'PHONE_NUMBER') return <FaPhone />;
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
            <p className="ct-preview-note">As variáveis {'{{1}}'}, {'{{2}}'} são substituídas pelos exemplos informados</p>
        </div>
    );
}

const emptyForm: CreateTemplateDTO = {
    nome: '',
    categoria: 'UTILITY',
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

function CreateTemplateModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
    const [form, setForm] = useState<CreateTemplateDTO>({ ...emptyForm });
    const [exemplosRaw, setExemplosRaw] = useState('');
    const [botoes, setBotoes] = useState<BotaoTemplate[]>([]);
    const [isSaving, setIsSaving] = useState(false);
    const [localPreviewUrl, setLocalPreviewUrl] = useState<string | undefined>();
    const [uploadState, setUploadState] = useState<UploadState>('idle');
    const [uploadedFileName, setUploadedFileName] = useState<string>('');
    const [handleResult, setHandleResult] = useState<ObterHandleExemploResult | null>(null);

    const isMediaHeader = form.formatoHeader && form.formatoHeader !== 'TEXT';
    const isTextHeaderWithVar = form.formatoHeader === 'TEXT' && form.textoHeader?.includes('{{1}}');

    const addBotao = () => {
        if (botoes.length >= 3) return;
        setBotoes([...botoes, { tipo: 'QUICK_REPLY', texto: '' }]);
    };

    const removeBotao = (i: number) => setBotoes(botoes.filter((_, idx) => idx !== i));

    const updateBotao = (i: number, field: keyof BotaoTemplate, value: string) => {
        const updated = [...botoes];
        updated[i] = { ...updated[i], [field]: value };
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

        // Show local preview immediately for images
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
            exemplosBody: exemplosRaw.trim()
                ? exemplosRaw.split(',').map((s) => s.trim()).filter(Boolean)
                : undefined,
        };

        setIsSaving(true);
        try {
            const res = await MetaTemplateService.create(payload);
            if (res.sucesso) {
                toast.success('Template criado! Aguardando aprovação da Meta.');
                onCreated();
                onClose();
            } else {
                toast.error(res.mensagem || 'Erro ao criar template.');
            }
        } catch {
            toast.error('Erro ao conectar com o servidor.');
        } finally {
            setIsSaving(false);
        }
    };

    const exemplosArray = exemplosRaw.trim()
        ? exemplosRaw.split(',').map((s) => s.trim())
        : [];

    return (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
            <div className="ct-modal ct-modal-wide">
                <div className="ct-modal-header">
                    <h2>Novo Template de Campanha</h2>
                    <button className="close-modal-button" onClick={onClose}><FaTimes /></button>
                </div>

                <div className="ct-modal-split">
                    {/* ---- Formulário ---- */}
                    <form className="ct-modal-form" onSubmit={handleSubmit} id="ct-create-form">
                        <div className="ct-form-grid">
                            <div className="ct-form-group ct-span-2">
                                <label>Nome do template <span className="ct-required">*</span></label>
                                <input
                                    type="text"
                                    value={form.nome}
                                    onChange={(e) => setForm({ ...form, nome: e.target.value })}
                                    placeholder="ex: confirmacao_agendamento"
                                    required
                                />
                                <span className="ct-hint">Letras minúsculas, números e underscores. Espaços são convertidos automaticamente.</span>
                            </div>

                            <div className="ct-form-group">
                                <label>Categoria <span className="ct-required">*</span></label>
                                <select
                                    value={form.categoria}
                                    onChange={(e) => setForm({ ...form, categoria: e.target.value as TemplateCategoria })}
                                    required
                                >
                                    <option value="UTILITY">Utilidade</option>
                                    <option value="MARKETING">Marketing</option>
                                    <option value="AUTHENTICATION">Autenticação</option>
                                </select>
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
                                <div className="ct-form-group ct-span-2">
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

                            {/* Upload de mídia para header (IMAGE/VIDEO/DOCUMENT) */}
                            {isMediaHeader && (
                                <div className="ct-form-group ct-span-2">
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

                            <div className="ct-form-group ct-span-2">
                                <label>Texto do corpo <span className="ct-required">*</span></label>
                                <textarea
                                    value={form.textoBody}
                                    onChange={(e) => setForm({ ...form, textoBody: e.target.value })}
                                    placeholder="Olá, {{1}}! Seu agendamento para {{2}} está confirmado."
                                    rows={4}
                                    required
                                />
                                <span className="ct-hint">Use {'{{1}}'}, {'{{2}}'} para variáveis dinâmicas.</span>
                            </div>

                            <div className="ct-form-group ct-span-2">
                                <label>Exemplos das variáveis</label>
                                <input
                                    type="text"
                                    value={exemplosRaw}
                                    onChange={(e) => setExemplosRaw(e.target.value)}
                                    placeholder="Maria, 15/06/2026, 14:00"
                                />
                                <span className="ct-hint">Separe por vírgula. Obrigatório quando o corpo tem variáveis.</span>
                            </div>

                            <div className="ct-form-group ct-span-2">
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

                        <div className="ct-botoes-section">
                            <div className="ct-botoes-header">
                                <span className="ct-section-title">Botões <span className="ct-hint-inline">(máx. 3)</span></span>
                                {botoes.length < 3 && (
                                    <button type="button" className="ct-btn-add-botao" onClick={addBotao}>
                                        <FaPlus /> Adicionar botão
                                    </button>
                                )}
                            </div>
                            {botoes.map((btn, i) => (
                                <div key={i} className="ct-botao-row">
                                    <select
                                        value={btn.tipo}
                                        onChange={(e) => updateBotao(i, 'tipo', e.target.value)}
                                    >
                                        {Object.entries(BOTAO_TIPO_LABEL).map(([v, l]) => (
                                            <option key={v} value={v}>{l}</option>
                                        ))}
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
                                    <button type="button" className="ct-btn-remove-botao" onClick={() => removeBotao(i)}>
                                        <FaTimes />
                                    </button>
                                </div>
                            ))}
                        </div>
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
                        {isSaving ? 'Criando...' : 'Criar template'}
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
    const [deleteTarget, setDeleteTarget] = useState<{ id: number; nome: string } | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [filterStatus, setFilterStatus] = useState<TemplateStatus | 'TODOS'>('TODOS');
    const [filterCategoria, setFilterCategoria] = useState<TemplateCategoria | 'TODOS'>('TODOS');
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
        loadTemplates();
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
        const matchCat = filterCategoria === 'TODOS' || t.categoria === filterCategoria;
        const matchSearch = !searchTerm || t.nome.toLowerCase().includes(searchTerm.toLowerCase());
        return matchStatus && matchCat && matchSearch;
    });

    return (
        <div className="page-container">
            <div className="page-header">
                <div className="ct-header-left">
                    <FaBullhorn className="ct-page-icon" />
                    <div>
                        <h1>Templates de Campanha</h1>
                        <p className="ct-page-subtitle">Gerencie os templates de mensagem WhatsApp para campanhas via Meta</p>
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

            <div className="ct-filters">
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
                <select
                    className="ct-filter-select"
                    value={filterCategoria}
                    onChange={(e) => setFilterCategoria(e.target.value as TemplateCategoria | 'TODOS')}
                >
                    <option value="TODOS">Todas as categorias</option>
                    {Object.entries(CATEGORIA_LABEL).map(([v, l]) => (
                        <option key={v} value={v}>{l}</option>
                    ))}
                </select>
            </div>

            <div className="ct-content">
                {isLoading ? (
                    <div className="ct-loading">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="ct-skeleton" />
                        ))}
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="ct-empty">
                        <FaBullhorn className="ct-empty-icon" />
                        <h3>{templates.length === 0 ? 'Nenhum template encontrado' : 'Nenhum template corresponde ao filtro'}</h3>
                        <p>
                            {templates.length === 0
                                ? 'Clique em "Sincronizar" para buscar templates existentes ou crie um novo.'
                                : 'Tente ajustar os filtros de busca.'}
                        </p>
                        {templates.length === 0 && (
                            <button className="ct-btn-primary" onClick={() => setIsCreateModalOpen(true)}>
                                <FaPlus /> Criar primeiro template
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="ct-list">
                        <div className="ct-list-count">{filtered.length} template{filtered.length !== 1 ? 's' : ''}</div>
                        {filtered.map((t) => (
                            <TemplateCard
                                key={t.metaTemplateId}
                                template={t}
                                onDelete={handleDeleteRequest}
                            />
                        ))}
                    </div>
                )}
            </div>

            {isCreateModalOpen && (
                <CreateTemplateModal
                    onClose={() => setIsCreateModalOpen(false)}
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
