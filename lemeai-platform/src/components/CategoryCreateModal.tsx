import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { HelpService } from '../services/HelpService';
import type { HelpCategory } from '../types/Help';
import './CategoryCreateModal.css';

interface CategoryCreateModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: (newCategory: HelpCategory) => void;
}

const CategoryCreateModal: React.FC<CategoryCreateModalProps> = ({ isOpen, onClose, onSuccess }) => {
    const [nome, setNome] = useState('');
    const [descricao, setDescricao] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    if (!isOpen) return null;

    const handleSave = async () => {
        if (!nome.trim()) {
            toast.error("O nome da categoria é obrigatório.");
            return;
        }

        setIsSaving(true);
        try {
            const novaCategoria = await HelpService.createCategory({ nome, descricao, icone: 'FaBook' });
            toast.success("Categoria criada com sucesso!");
            setNome('');
            setDescricao('');
            onSuccess(novaCategoria);
            onClose();
        } catch (error) {
            console.error("Erro ao criar categoria", error);
            toast.error("Erro ao criar categoria.");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="modal-overlay">
            <div className="category-modal">
                <div className="modal-header">
                    <h2>Nova Categoria</h2>
                    <button className="close-btn" onClick={onClose}>&times;</button>
                </div>
                <div className="modal-body">
                    <div className="form-group">
                        <label>Nome da Categoria *</label>
                        <input 
                            type="text" 
                            className="form-control" 
                            value={nome}
                            onChange={(e) => setNome(e.target.value)}
                            placeholder="Ex: Integrações"
                            disabled={isSaving}
                        />
                    </div>
                    <div className="form-group">
                        <label>Descrição</label>
                        <input 
                            type="text" 
                            className="form-control" 
                            value={descricao}
                            onChange={(e) => setDescricao(e.target.value)}
                            placeholder="Descrição breve da categoria"
                            disabled={isSaving}
                        />
                    </div>
                </div>
                <div className="modal-footer">
                    <button className="cancel-btn" onClick={onClose} disabled={isSaving}>Cancelar</button>
                    <button className="save-btn" onClick={handleSave} disabled={isSaving}>
                        {isSaving ? 'Salvando...' : 'Criar Categoria'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CategoryCreateModal;
