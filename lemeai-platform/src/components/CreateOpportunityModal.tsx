import { useState, useEffect } from 'react';
import { FaTimes, FaRocket } from 'react-icons/fa';
import toast from 'react-hot-toast';
import { OpportunityService, type CreateOpportunityPayload } from '../services/OpportunityService';
import { ContactService, type Contact } from '../services/ContactService';
import './CreateOpportunityModal.css';

interface CreateOpportunityModalProps {
    isOpen: boolean;
    onClose: () => void;
    onCreated: () => void;
}

const TIPO_LEAD_OPTIONS = [
    { value: '', label: 'Selecionar temperatura' },
    { value: '1', label: 'Quente' },
    { value: '2', label: 'Morno' },
    { value: '3', label: 'Frio' },
];

const CreateOpportunityModal = ({ isOpen, onClose, onCreated }: CreateOpportunityModalProps) => {
    const [contatoNovo, setContatoNovo] = useState(true);
    const [contacts, setContacts] = useState<Contact[]>([]);
    const [contactSearch, setContactSearch] = useState('');
    const [isLoadingContacts, setIsLoadingContacts] = useState(false);

    const [nomeContato, setNomeContato] = useState('');
    const [telefone, setTelefone] = useState('');
    const [email, setEmail] = useState('');
    const [contatoId, setContatoId] = useState<number | null>(null);
    const [tipoLeadId, setTipoLeadId] = useState('');
    const [valor, setValor] = useState('');
    const [observacao, setObservacao] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (!isOpen) return;
        resetForm();
        loadContacts();
    }, [isOpen]);

    const resetForm = () => {
        setContatoNovo(true);
        setContactSearch('');
        setNomeContato('');
        setTelefone('');
        setEmail('');
        setContatoId(null);
        setTipoLeadId('');
        setValor('');
        setObservacao('');
        setIsSaving(false);
    };

    const loadContacts = async () => {
        setIsLoadingContacts(true);
        try {
            const res = await ContactService.getAll();
            if (res.sucesso) setContacts(res.dados ?? []);
        } catch {
            // silencioso — lista de contatos é opcional
        } finally {
            setIsLoadingContacts(false);
        }
    };

    const filteredContacts = contacts.filter(c =>
        c.nome.toLowerCase().includes(contactSearch.toLowerCase()) ||
        c.telefone?.includes(contactSearch)
    );

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (contatoNovo && !nomeContato.trim()) {
            toast.error('Informe o nome do contato.');
            return;
        }
        if (!contatoNovo && !contatoId) {
            toast.error('Selecione um contato existente.');
            return;
        }

        const payload: CreateOpportunityPayload = {
            contatoNovo,
            contatoId: contatoNovo ? null : contatoId,
            contato: contatoNovo
                ? {
                      nome: nomeContato.trim(),
                      telefone: telefone.trim() || undefined,
                      email: email.trim() || undefined,
                  }
                : null,
            usuarioResponsavelId: null,
            tipoLeadId: tipoLeadId ? Number(tipoLeadId) : null,
            valor: valor ? parseFloat(valor) : null,
            observacao: observacao.trim() || null,
        };

        setIsSaving(true);
        try {
            const result = await OpportunityService.createOpportunity(payload);
            if (result.sucesso) {
                toast.success('Oportunidade criada com sucesso!');
                onCreated();
                onClose();
            } else {
                toast.error(result.mensagem || 'Erro ao criar oportunidade.');
            }
        } catch {
            toast.error('Erro ao criar oportunidade.');
        } finally {
            setIsSaving(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="com-overlay" onClick={onClose}>
            <div className="com-modal" onClick={e => e.stopPropagation()}>
                <div className="com-header">
                    <div className="com-header-info">
                        <FaRocket className="com-header-icon" />
                        <h3>Nova Oportunidade</h3>
                    </div>
                    <button className="com-close" onClick={onClose} aria-label="Fechar" disabled={isSaving}>
                        <FaTimes />
                    </button>
                </div>

                <form className="com-body" onSubmit={handleSubmit}>
                    <div className="com-toggle-row">
                        <button
                            type="button"
                            className={`com-toggle-btn ${contatoNovo ? 'active' : ''}`}
                            onClick={() => setContatoNovo(true)}
                            disabled={isSaving}
                        >
                            Novo contato
                        </button>
                        <button
                            type="button"
                            className={`com-toggle-btn ${!contatoNovo ? 'active' : ''}`}
                            onClick={() => setContatoNovo(false)}
                            disabled={isSaving}
                        >
                            Contato existente
                        </button>
                    </div>

                    {contatoNovo ? (
                        <div className="com-form-grid">
                            <div className="com-form-group com-full">
                                <label>Nome <span className="com-required">*</span></label>
                                <input
                                    type="text"
                                    className="com-input"
                                    value={nomeContato}
                                    onChange={e => setNomeContato(e.target.value)}
                                    placeholder="Nome do contato"
                                    disabled={isSaving}
                                    autoFocus
                                />
                            </div>
                            <div className="com-form-group">
                                <label>Telefone</label>
                                <input
                                    type="text"
                                    className="com-input"
                                    value={telefone}
                                    onChange={e => setTelefone(e.target.value)}
                                    placeholder="5511999990000"
                                    disabled={isSaving}
                                />
                            </div>
                            <div className="com-form-group">
                                <label>E-mail</label>
                                <input
                                    type="email"
                                    className="com-input"
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    placeholder="email@exemplo.com"
                                    disabled={isSaving}
                                />
                            </div>
                        </div>
                    ) : (
                        <div className="com-form-group com-full">
                            <label>Buscar contato <span className="com-required">*</span></label>
                            <input
                                type="text"
                                className="com-input"
                                value={contactSearch}
                                onChange={e => {
                                    setContactSearch(e.target.value);
                                    setContatoId(null);
                                }}
                                placeholder="Pesquisar por nome ou telefone..."
                                disabled={isSaving}
                                autoFocus
                            />
                            <div className="com-contact-list">
                                {isLoadingContacts ? (
                                    <p className="com-contact-empty">Carregando contatos...</p>
                                ) : filteredContacts.length === 0 ? (
                                    <p className="com-contact-empty">Nenhum contato encontrado.</p>
                                ) : (
                                    filteredContacts.slice(0, 6).map(c => (
                                        <div
                                            key={c.contatoId}
                                            className={`com-contact-item ${contatoId === c.contatoId ? 'selected' : ''}`}
                                            onClick={() => !isSaving && setContatoId(c.contatoId)}
                                        >
                                            <span className="com-contact-name">{c.nome}</span>
                                            <span className="com-contact-phone">{c.telefone}</span>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    )}

                    <div className="com-form-grid">
                        <div className="com-form-group">
                            <label>Temperatura do lead</label>
                            <select
                                className="com-input com-select"
                                value={tipoLeadId}
                                onChange={e => setTipoLeadId(e.target.value)}
                                disabled={isSaving}
                            >
                                {TIPO_LEAD_OPTIONS.map(o => (
                                    <option key={o.value} value={o.value}>{o.label}</option>
                                ))}
                            </select>
                        </div>
                        <div className="com-form-group">
                            <label>Valor estimado (R$)</label>
                            <input
                                type="number"
                                step="0.01"
                                min="0"
                                className="com-input"
                                value={valor}
                                onChange={e => setValor(e.target.value)}
                                placeholder="0,00"
                                disabled={isSaving}
                            />
                        </div>
                        <div className="com-form-group com-full">
                            <label>Observação</label>
                            <textarea
                                className="com-input com-textarea"
                                value={observacao}
                                onChange={e => setObservacao(e.target.value)}
                                placeholder="Detalhe como surgiu essa oportunidade..."
                                rows={3}
                                disabled={isSaving}
                            />
                        </div>
                    </div>

                    <div className="com-footer">
                        <button type="button" className="com-btn-cancel" onClick={onClose} disabled={isSaving}>
                            Cancelar
                        </button>
                        <button type="submit" className="com-btn-confirm" disabled={isSaving}>
                            {isSaving ? 'Criando...' : 'Criar Oportunidade'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateOpportunityModal;
