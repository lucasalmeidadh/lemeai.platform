import React, { useState, useEffect, useRef } from 'react';
import { FaImage, FaSpinner, FaArrowLeft, FaPlus } from 'react-icons/fa';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { HelpService } from '../services/HelpService';
import type { HelpCategory } from '../types/Help';
import CustomSelect from '../components/CustomSelect';
import CategoryCreateModal from '../components/CategoryCreateModal';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import './HelpArticleEditorPage.css';

const HelpArticleEditorPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const isEditing = !!id;

    const [categories, setCategories] = useState<HelpCategory[]>([]);
    const [isLoading, setIsLoading] = useState(isEditing);
    const [isSaving, setIsSaving] = useState(false);
    const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
    
    const [formData, setFormData] = useState({ titulo: '', conteudo: '', categoriaId: 0, tags: '', isRascunho: false });
    
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        loadData();
    }, [id]);

    const loadData = async () => {
        try {
            const cats = await HelpService.getCategories();
            setCategories(cats);
            
            if (cats.length > 0 && !isEditing) {
                setFormData(prev => ({ ...prev, categoriaId: cats[0].id }));
            }

            if (isEditing && id) {
                setIsLoading(true);
                const article = await HelpService.getArticleById(Number(id));
                setFormData({
                    titulo: article.titulo,
                    conteudo: article.conteudo,
                    categoriaId: article.categoriaId,
                    tags: article.tags || '',
                    isRascunho: article.isRascunho || false
                });
            }
        } catch (error) {
            toast.error("Erro ao carregar os dados");
            navigate('/admin/help');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSave = async (asDraft: boolean) => {
        if (!formData.titulo || !formData.conteudo || !formData.categoriaId) {
            toast.error("Preencha os campos obrigatórios (Título, Categoria, Conteúdo)");
            return;
        }

        setIsSaving(true);
        const dataToSave = { ...formData, isRascunho: asDraft };
        
        try {
            if (isEditing && id) {
                await HelpService.updateArticle({ ...dataToSave, id: Number(id) });
                toast.success(asDraft ? "Rascunho atualizado!" : "Artigo publicado com sucesso!");
            } else {
                await HelpService.createArticle(dataToSave);
                toast.success(asDraft ? "Rascunho salvo!" : "Artigo publicado com sucesso!");
            }
            navigate('/admin/help');
        } catch (error) {
            toast.error("Erro ao salvar o artigo");
        } finally {
            setIsSaving(false);
        }
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        try {
            const url = await HelpService.uploadImage(file);
            const imgHtml = `\n<img src="${url}" alt="Imagem do Tutorial" />\n`;
            setFormData(prev => ({ ...prev, conteudo: prev.conteudo + imgHtml }));
            toast.success("Imagem inserida com sucesso!");
        } catch (error) {
            toast.error("Erro ao fazer upload da imagem");
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    if (isLoading) {
        return <div className="page-container"><div className="loading-state">Carregando...</div></div>;
    }

    return (
        <div className="page-container help-editor-container">
            <div className="page-header">
                <div className="title-area">
                    <button className="back-button" onClick={() => navigate('/admin/help')} title="Voltar">
                        <FaArrowLeft />
                    </button>
                    <h1>{isEditing ? 'Editar Artigo' : 'Criar Novo Artigo'}</h1>
                </div>
                <div className="header-actions">
                    <button className="cancel-btn-header" onClick={() => navigate('/admin/help')} disabled={isSaving}>Cancelar</button>
                    <button className="cancel-btn-header" onClick={() => handleSave(true)} disabled={isSaving}>
                        {isSaving ? 'Salvando...' : 'Salvar como Rascunho'}
                    </button>
                    <button className="save-button" onClick={() => handleSave(false)} disabled={isSaving}>
                        {isSaving ? 'Publicando...' : 'Publicar Artigo'}
                    </button>
                </div>
            </div>

            <div className="help-editor-content card">
                <div className="form-group row">
                    <div className="col-md-6">
                        <label>Título *</label>
                        <input 
                            type="text" 
                            className="form-control"
                            value={formData.titulo} 
                            onChange={e => setFormData({...formData, titulo: e.target.value})} 
                            placeholder="Ex: Como criar uma campanha..."
                        />
                    </div>
                    <div className="col-md-6">
                        <label>Categoria *</label>
                        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                            <div style={{ flex: 1 }}>
                                <CustomSelect 
                                    options={categories.map(cat => ({ value: cat.id.toString(), label: cat.nome }))}
                                    value={formData.categoriaId ? formData.categoriaId.toString() : ""}
                                    onChange={(val) => setFormData({...formData, categoriaId: Number(val)})}
                                    placeholder="Selecione uma categoria..."
                                />
                            </div>
                            <button 
                                type="button" 
                                className="action-icon-btn" 
                                style={{ backgroundColor: 'var(--petroleum-blue)', color: 'white', padding: '10px', borderRadius: '6px', border: 'none', cursor: 'pointer', height: '42px', width: '42px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                onClick={() => setIsCategoryModalOpen(true)}
                                title="Nova Categoria"
                            >
                                <FaPlus />
                            </button>
                        </div>
                    </div>
                </div>

                <div className="form-group">
                    <label>Tags (separadas por vírgula)</label>
                    <input 
                        type="text" 
                        className="form-control"
                        value={formData.tags} 
                        onChange={e => setFormData({...formData, tags: e.target.value})} 
                        placeholder="Ex: campanhas, disparador, whatsapp"
                    />
                </div>

                <div className="form-group editor-group">
                    <div className="editor-header">
                        <label>Conteúdo (HTML) *</label>
                        <span className="upload-image-wrapper">
                            <input 
                                type="file" 
                                accept="image/*" 
                                ref={fileInputRef} 
                                onChange={handleImageUpload} 
                                style={{ display: 'none' }} 
                            />
                            <button 
                                type="button" 
                                className="insert-image-btn" 
                                onClick={() => fileInputRef.current?.click()}
                                disabled={isUploading}
                            >
                                {isUploading ? <FaSpinner className="spin" /> : <FaImage />} 
                                Inserir Imagem
                            </button>
                        </span>
                    </div>
                    <div className="quill-wrapper" style={{ marginTop: '10px' }}>
                        <ReactQuill 
                            theme="snow"
                            value={formData.conteudo} 
                            onChange={val => setFormData({...formData, conteudo: val})} 
                            placeholder="Escreva o conteúdo do tutorial aqui..."
                            style={{ height: '500px', marginBottom: '50px' }}
                        />
                    </div>
                </div>
            </div>
            
            <CategoryCreateModal 
                isOpen={isCategoryModalOpen}
                onClose={() => setIsCategoryModalOpen(false)}
                onSuccess={(newCategory) => {
                    setCategories(prev => [...prev, newCategory]);
                    setFormData(prev => ({ ...prev, categoriaId: newCategory.id }));
                }}
            />
        </div>
    );
};

export default HelpArticleEditorPage;
