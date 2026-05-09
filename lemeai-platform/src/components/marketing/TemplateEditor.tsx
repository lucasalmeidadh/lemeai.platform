import React, { useState, useEffect } from 'react';
import { FaTimes, FaPlus, FaTrash, FaWhatsapp, FaImage, FaFont, FaExternalLinkAlt, FaPhone } from 'react-icons/fa';
import type { WhatsAppTemplate, TemplateComponent, HeaderFormat } from '../../services/MarketingService';
import './TemplateEditor.css';

interface TemplateEditorProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (template: Partial<WhatsAppTemplate>) => void;
}

const TemplateEditor: React.FC<TemplateEditorProps> = ({ isOpen, onClose, onSave }) => {
    const [name, setName] = useState('');
    const [category, setCategory] = useState<'MARKETING' | 'UTILITY' | 'AUTHENTICATION'>('MARKETING');
    const [headerType, setHeaderType] = useState<'NONE' | 'TEXT' | 'MEDIA'>('NONE');
    const [headerText, setHeaderText] = useState('');
    const [bodyText, setBodyText] = useState('');
    const [footerText, setFooterText] = useState('');
    const [buttons, setButtons] = useState<any[]>([]);

    if (!isOpen) return null;

    const handleAddButton = () => {
        if (buttons.length >= 3) return;
        setButtons([...buttons, { type: 'QUICK_REPLY', text: '' }]);
    };

    const handleRemoveButton = (index: number) => {
        setButtons(buttons.filter((_, i) => i !== index));
    };

    const updateButton = (index: number, field: string, value: string) => {
        const newButtons = [...buttons];
        newButtons[index] = { ...newButtons[index], [field]: value };
        setButtons(newButtons);
    };

    const handleSave = () => {
        const components: TemplateComponent[] = [];
        
        if (headerType !== 'NONE') {
            components.push({
                type: 'HEADER',
                format: headerType === 'TEXT' ? 'TEXT' : 'IMAGE',
                text: headerType === 'TEXT' ? headerText : undefined
            });
        }

        components.push({ type: 'BODY', text: bodyText });

        if (footerText) {
            components.push({ type: 'FOOTER', text: footerText });
        }

        if (buttons.length > 0) {
            components.push({ type: 'BUTTONS', buttons });
        }

        onSave({
            name: name.toLowerCase().replace(/\s+/g, '_'),
            category,
            language: 'pt_BR',
            components
        });
        onClose();
    };

    return (
        <div className="modal-overlay">
            <div className="template-editor-container">
                <header className="editor-header">
                    <div className="header-title">
                        <h2>Novo Template de WhatsApp</h2>
                        <p>Configure a estrutura da mensagem seguindo as regras da Meta.</p>
                    </div>
                    <button onClick={onClose} className="close-btn"><FaTimes /></button>
                </header>

                <div className="editor-layout">
                    <div className="editor-form scrollable">
                        <section className="form-section">
                            <h3>Informações Básicas</h3>
                            <div className="form-group">
                                <label>Nome do Template (interno)</label>
                                <input 
                                    type="text" 
                                    placeholder="ex: boas_vindas_vendas" 
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                />
                                <small>Use apenas letras minúsculas e sublinhados.</small>
                            </div>
                            <div className="form-group">
                                <label>Categoria</label>
                                <select value={category} onChange={(e: any) => setCategory(e.target.value)}>
                                    <option value="MARKETING">Marketing</option>
                                    <option value="UTILITY">Utilidade</option>
                                    <option value="AUTHENTICATION">Autenticação</option>
                                </select>
                            </div>
                        </section>

                        <section className="form-section">
                            <h3>Cabeçalho (Opcional)</h3>
                            <div className="header-type-selector">
                                <button className={headerType === 'NONE' ? 'active' : ''} onClick={() => setHeaderType('NONE')}>Nenhum</button>
                                <button className={headerType === 'TEXT' ? 'active' : ''} onClick={() => setHeaderType('TEXT')}><FaFont /> Texto</button>
                                <button className={headerType === 'MEDIA' ? 'active' : ''} onClick={() => setHeaderType('MEDIA')}><FaImage /> Mídia</button>
                            </div>
                            {headerType === 'TEXT' && (
                                <input 
                                    type="text" 
                                    placeholder="Texto do cabeçalho..." 
                                    value={headerText}
                                    onChange={(e) => setHeaderText(e.target.value)}
                                    maxLength={60}
                                />
                            )}
                            {headerType === 'MEDIA' && (
                                <div className="media-info-box">
                                    <FaImage /> O arquivo de mídia será definido no momento do disparo.
                                </div>
                            )}
                        </section>

                        <section className="form-section">
                            <h3>Corpo da Mensagem</h3>
                            <textarea 
                                placeholder="Digite aqui o conteúdo principal da mensagem..."
                                value={bodyText}
                                onChange={(e) => setBodyText(e.target.value)}
                                rows={5}
                            />
                            <div className="variable-tip">
                                Dica: Use <strong>{"{{1}}"}</strong>, <strong>{"{{2}}"}</strong> para adicionar variáveis personalizadas.
                            </div>
                        </section>

                        <section className="form-section">
                            <h3>Rodapé (Opcional)</h3>
                            <input 
                                type="text" 
                                placeholder="Texto curto no rodapé..." 
                                value={footerText}
                                onChange={(e) => setFooterText(e.target.value)}
                                maxLength={60}
                            />
                        </section>

                        <section className="form-section">
                            <div className="section-header">
                                <h3>Botões (Opcional)</h3>
                                <button className="add-btn-small" onClick={handleAddButton} disabled={buttons.length >= 3}>
                                    <FaPlus /> Adicionar
                                </button>
                            </div>
                            <div className="buttons-list">
                                {buttons.map((btn, index) => (
                                    <div key={index} className="button-item-form">
                                        <select value={btn.type} onChange={(e) => updateButton(index, 'type', e.target.value)}>
                                            <option value="QUICK_REPLY">Resposta Rápida</option>
                                            <option value="URL">Link Externo</option>
                                            <option value="PHONE_NUMBER">Número de Telefone</option>
                                        </select>
                                        <input 
                                            type="text" 
                                            placeholder="Texto do botão" 
                                            value={btn.text}
                                            onChange={(e) => updateButton(index, 'text', e.target.value)}
                                        />
                                        <button className="delete-btn" onClick={() => handleRemoveButton(index)}><FaTrash /></button>
                                    </div>
                                ))}
                            </div>
                        </section>
                    </div>

                    <div className="editor-preview">
                        <h3>Visualização Prévia</h3>
                        <div className="wa-preview-container">
                            <div className="wa-message-bubble">
                                {headerType === 'MEDIA' && (
                                    <div className="wa-preview-header-media">
                                        <FaImage />
                                    </div>
                                )}
                                {headerType === 'TEXT' && headerText && (
                                    <div className="wa-preview-header-text">{headerText}</div>
                                )}
                                <div className="wa-preview-body">
                                    {bodyText || 'Conteúdo da mensagem...'}
                                </div>
                                {footerText && (
                                    <div className="wa-preview-footer">{footerText}</div>
                                )}
                                {buttons.length > 0 && (
                                    <div className="wa-preview-buttons">
                                        {buttons.map((btn, i) => (
                                            <div key={i} className="wa-preview-button">
                                                {btn.type === 'URL' && <FaExternalLinkAlt />}
                                                {btn.type === 'PHONE_NUMBER' && <FaPhone />}
                                                {btn.text || 'Botão ' + (i + 1)}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                <footer className="editor-footer">
                    <button className="btn-cancel" onClick={onClose}>Cancelar</button>
                    <button className="btn-save" onClick={handleSave} disabled={!name || !bodyText}>
                        Enviar para Aprovação
                    </button>
                </footer>
            </div>
        </div>
    );
};

export default TemplateEditor;
