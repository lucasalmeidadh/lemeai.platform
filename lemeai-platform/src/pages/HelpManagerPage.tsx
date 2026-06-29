import React, { useState, useEffect } from 'react';
import { FaPlus, FaEdit, FaTrash, FaCheck, FaTimes } from 'react-icons/fa';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { HelpService } from '../services/HelpService';
import ConfirmationModal from '../components/ConfirmationModal';
import type { HelpArticle, HelpCategory, HelpVideo } from '../types/Help';
import './HelpManagerPage.css';

type ActiveTab = 'artigos' | 'videos';

interface VideoFormData {
    titulo: string;
    descricao: string;
    youtubeUrl: string;
    duracao: string;
    ordem: number;
    ativo: boolean;
}

const emptyVideoForm: VideoFormData = {
    titulo: '',
    descricao: '',
    youtubeUrl: '',
    duracao: '',
    ordem: 0,
    ativo: true,
};

function extractThumbnail(url: string): string {
    let videoId: string | null = null;
    if (url.includes('youtu.be/')) {
        videoId = url.split('youtu.be/')[1]?.split('?')[0];
    } else if (url.includes('v=')) {
        videoId = url.split('v=')[1]?.split('&')[0];
    } else if (url.includes('embed/')) {
        videoId = url.split('embed/')[1]?.split('?')[0];
    }
    return videoId ? `https://img.youtube.com/vi/${videoId}/mqdefault.jpg` : '';
}

const HelpManagerPage: React.FC = () => {
    const [activeTab, setActiveTab] = useState<ActiveTab>('artigos');
    const [articles, setArticles] = useState<HelpArticle[]>([]);
    const [categories, setCategories] = useState<HelpCategory[]>([]);
    const [videos, setVideos] = useState<HelpVideo[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const navigate = useNavigate();

    // Article filters
    const [searchTerm, setSearchTerm] = useState('');
    const [categoryFilter, setCategoryFilter] = useState<number | 'Todos'>('Todos');
    const [statusFilter, setStatusFilter] = useState<'Todos' | 'Publicado' | 'Rascunho'>('Todos');

    // Delete Modal State
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState<{ type: 'artigo' | 'video'; id: number } | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    // Video Modal State
    const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
    const [videoForm, setVideoForm] = useState<VideoFormData>(emptyVideoForm);
    const [editingVideoId, setEditingVideoId] = useState<number | null>(null);
    const [isSavingVideo, setIsSavingVideo] = useState(false);

    // Video search
    const [videoSearchTerm, setVideoSearchTerm] = useState('');
    const [videoStatusFilter, setVideoStatusFilter] = useState<'Todos' | 'Ativo' | 'Inativo'>('Todos');

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setIsLoading(true);
        try {
            const [cats, arts, vids] = await Promise.all([
                HelpService.getCategories(),
                HelpService.getArticles(),
                HelpService.getVideos()
            ]);
            setCategories(cats);
            setArticles(arts);
            setVideos(vids);
        } catch (error) {
            toast.error("Erro ao carregar dados");
        } finally {
            setIsLoading(false);
        }
    };

    // ── Article handlers ──

    const handleCreateNew = () => {
        navigate('/admin/help/new');
    };

    const handleEdit = (article: HelpArticle) => {
        navigate(`/admin/help/edit/${article.id}`);
    };

    const confirmDeleteArticle = (id: number) => {
        setDeleteTarget({ type: 'artigo', id });
        setIsConfirmOpen(true);
    };

    // ── Video handlers ──

    const openVideoModal = (video?: HelpVideo) => {
        if (video) {
            setEditingVideoId(video.id);
            setVideoForm({
                titulo: video.titulo,
                descricao: video.descricao || '',
                youtubeUrl: video.youtubeUrl,
                duracao: video.duracao || '',
                ordem: video.ordem,
                ativo: video.ativo,
            });
        } else {
            setEditingVideoId(null);
            setVideoForm(emptyVideoForm);
        }
        setIsVideoModalOpen(true);
    };

    const closeVideoModal = () => {
        setIsVideoModalOpen(false);
        setEditingVideoId(null);
        setVideoForm(emptyVideoForm);
    };

    const handleSaveVideo = async () => {
        if (!videoForm.titulo.trim() || !videoForm.youtubeUrl.trim()) {
            toast.error("Título e URL do YouTube são obrigatórios");
            return;
        }
        setIsSavingVideo(true);
        try {
            if (editingVideoId) {
                await HelpService.updateVideo(editingVideoId, videoForm);
                toast.success("Vídeo atualizado com sucesso!");
            } else {
                await HelpService.createVideo(videoForm);
                toast.success("Vídeo criado com sucesso!");
            }
            closeVideoModal();
            loadData();
        } catch (error) {
            toast.error("Erro ao salvar vídeo");
        } finally {
            setIsSavingVideo(false);
        }
    };

    const confirmDeleteVideo = (id: number) => {
        setDeleteTarget({ type: 'video', id });
        setIsConfirmOpen(true);
    };

    // ── Shared delete handler ──

    const handleDeleteConfirmed = async () => {
        if (!deleteTarget) return;
        setIsDeleting(true);
        try {
            if (deleteTarget.type === 'artigo') {
                await HelpService.deleteArticle(deleteTarget.id);
                toast.success("Artigo excluído com sucesso!");
            } else {
                await HelpService.deleteVideo(deleteTarget.id);
                toast.success("Vídeo excluído com sucesso!");
            }
            loadData();
        } catch (error) {
            toast.error(`Erro ao excluir ${deleteTarget.type}`);
        } finally {
            setIsDeleting(false);
            setIsConfirmOpen(false);
            setDeleteTarget(null);
        }
    };

    // ── Filters ──

    const filteredArticles = articles.filter(article => {
        const searchLower = searchTerm.toLowerCase();
        const matchesSearch = article.titulo.toLowerCase().includes(searchLower);
        const matchesCategory = categoryFilter === 'Todos' || article.categoriaId === categoryFilter;
        const matchesStatus = statusFilter === 'Todos' ||
            (statusFilter === 'Rascunho' && article.isRascunho) ||
            (statusFilter === 'Publicado' && !article.isRascunho);
        return matchesSearch && matchesCategory && matchesStatus;
    });

    const filteredVideos = videos.filter(video => {
        const searchLower = videoSearchTerm.toLowerCase();
        const matchesSearch = video.titulo.toLowerCase().includes(searchLower);
        const matchesStatus = videoStatusFilter === 'Todos' ||
            (videoStatusFilter === 'Ativo' && video.ativo) ||
            (videoStatusFilter === 'Inativo' && !video.ativo);
        return matchesSearch && matchesStatus;
    });

    return (
        <div className="page-container">
            <div className="page-header">
                <h1>Gerenciamento de Ajuda</h1>
                {activeTab === 'artigos' ? (
                    <button className="add-button" onClick={handleCreateNew}>
                        <FaPlus /> Novo Artigo
                    </button>
                ) : (
                    <button className="add-button" onClick={() => openVideoModal()}>
                        <FaPlus /> Novo Vídeo
                    </button>
                )}
            </div>

            <div className="help-tabs">
                <button
                    className={`help-tab ${activeTab === 'artigos' ? 'active' : ''}`}
                    onClick={() => setActiveTab('artigos')}
                >
                    Artigos
                </button>
                <button
                    className={`help-tab ${activeTab === 'videos' ? 'active' : ''}`}
                    onClick={() => setActiveTab('videos')}
                >
                    Vídeos
                </button>
            </div>

            {activeTab === 'artigos' ? (
                <div className="dashboard-card">
                    <div className="filters-container">
                        <input
                            type="text"
                            placeholder="Buscar por título..."
                            className="filter-input"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                        <div className="select-filters">
                            <select
                                className="filter-select"
                                value={categoryFilter}
                                onChange={e => setCategoryFilter(e.target.value === 'Todos' ? 'Todos' : Number(e.target.value))}
                            >
                                <option value="Todos">Todas as Categorias</option>
                                {categories.map(cat => (
                                    <option key={cat.id} value={cat.id}>{cat.nome}</option>
                                ))}
                            </select>
                            <div className="users-filters">
                                <button
                                    className={`filter-button ${statusFilter === 'Todos' ? 'active' : ''}`}
                                    onClick={() => setStatusFilter('Todos')}
                                >
                                    Todos
                                </button>
                                <button
                                    className={`filter-button ${statusFilter === 'Publicado' ? 'active' : ''}`}
                                    onClick={() => setStatusFilter('Publicado')}
                                >
                                    Publicados
                                </button>
                                <button
                                    className={`filter-button ${statusFilter === 'Rascunho' ? 'active' : ''}`}
                                    onClick={() => setStatusFilter('Rascunho')}
                                >
                                    Rascunhos
                                </button>
                            </div>
                        </div>
                    </div>

                    {isLoading ? (
                        <div className="loading-state" style={{ padding: '40px', textAlign: 'center' }}>Carregando artigos...</div>
                    ) : (
                        <div className="table-container">
                            <table className="management-table">
                                <thead>
                                    <tr>
                                        <th>Título</th>
                                        <th>Categoria</th>
                                        <th>Data de Atualização</th>
                                        <th style={{ textAlign: 'right', paddingRight: '25px' }}>Ações</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredArticles.length > 0 ? (
                                        filteredArticles.map(article => (
                                            <tr key={article.id}>
                                                <td>
                                                    {article.titulo}
                                                    {article.isRascunho && <span className="badge badge-warning" style={{ marginLeft: '10px' }}>Rascunho</span>}
                                                </td>
                                                <td>{categories.find(c => c.id === article.categoriaId)?.nome || '-'}</td>
                                                <td>{new Date(article.dataAtualizacao || article.dataCriacao).toLocaleDateString('pt-BR')}</td>
                                                <td>
                                                    <div className="actions-cell" style={{ justifyContent: 'flex-end' }}>
                                                        <button className="action-icon-btn edit" onClick={() => handleEdit(article)} title="Editar">
                                                            <FaEdit size={14} />
                                                        </button>
                                                        <button className="action-icon-btn delete" onClick={() => confirmDeleteArticle(article.id)} title="Excluir">
                                                            <FaTrash size={14} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={4} style={{ textAlign: 'center', padding: '40px' }}>
                                                Nenhum artigo encontrado com os filtros aplicados.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            ) : (
                <div className="dashboard-card">
                    <div className="filters-container">
                        <input
                            type="text"
                            placeholder="Buscar por título..."
                            className="filter-input"
                            value={videoSearchTerm}
                            onChange={e => setVideoSearchTerm(e.target.value)}
                        />
                        <div className="select-filters">
                            <div className="users-filters">
                                <button
                                    className={`filter-button ${videoStatusFilter === 'Todos' ? 'active' : ''}`}
                                    onClick={() => setVideoStatusFilter('Todos')}
                                >
                                    Todos
                                </button>
                                <button
                                    className={`filter-button ${videoStatusFilter === 'Ativo' ? 'active' : ''}`}
                                    onClick={() => setVideoStatusFilter('Ativo')}
                                >
                                    Ativos
                                </button>
                                <button
                                    className={`filter-button ${videoStatusFilter === 'Inativo' ? 'active' : ''}`}
                                    onClick={() => setVideoStatusFilter('Inativo')}
                                >
                                    Inativos
                                </button>
                            </div>
                        </div>
                    </div>

                    {isLoading ? (
                        <div className="loading-state" style={{ padding: '40px', textAlign: 'center' }}>Carregando vídeos...</div>
                    ) : (
                        <div className="table-container">
                            <table className="management-table">
                                <thead>
                                    <tr>
                                        <th style={{ width: '80px' }}>Thumb</th>
                                        <th>Título</th>
                                        <th>Duração</th>
                                        <th>Ordem</th>
                                        <th>Status</th>
                                        <th style={{ textAlign: 'right', paddingRight: '25px' }}>Ações</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredVideos.length > 0 ? (
                                        filteredVideos.map(video => (
                                            <tr key={video.id}>
                                                <td>
                                                    <img
                                                        src={video.thumbnailUrl}
                                                        alt={video.titulo}
                                                        style={{ width: '64px', height: '36px', objectFit: 'cover', borderRadius: '4px' }}
                                                    />
                                                </td>
                                                <td>{video.titulo}</td>
                                                <td>{video.duracao || '-'}</td>
                                                <td>{video.ordem}</td>
                                                <td>
                                                    <span className={`status-badge status-${video.ativo ? 'ativo' : 'inativo'}`}>
                                                        {video.ativo ? 'Ativo' : 'Inativo'}
                                                    </span>
                                                </td>
                                                <td>
                                                    <div className="actions-cell" style={{ justifyContent: 'flex-end' }}>
                                                        <button className="action-icon-btn edit" onClick={() => openVideoModal(video)} title="Editar">
                                                            <FaEdit size={14} />
                                                        </button>
                                                        <button className="action-icon-btn delete" onClick={() => confirmDeleteVideo(video.id)} title="Excluir">
                                                            <FaTrash size={14} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={6} style={{ textAlign: 'center', padding: '40px' }}>
                                                Nenhum vídeo encontrado.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {/* Video Modal */}
            {isVideoModalOpen && (
                <div className="help-modal-overlay" onClick={closeVideoModal}>
                    <div className="help-modal-content" onClick={e => e.stopPropagation()}>
                        <h2>{editingVideoId ? 'Editar Vídeo' : 'Novo Vídeo'}</h2>
                        <div className="help-modal-form">
                            <div className="form-group">
                                <label>Título *</label>
                                <input
                                    type="text"
                                    value={videoForm.titulo}
                                    onChange={e => setVideoForm({ ...videoForm, titulo: e.target.value })}
                                    placeholder="Ex: Introdução ao LemeAI"
                                />
                            </div>
                            <div className="form-group">
                                <label>Descrição</label>
                                <textarea
                                    value={videoForm.descricao}
                                    onChange={e => setVideoForm({ ...videoForm, descricao: e.target.value })}
                                    placeholder="Breve descrição do vídeo"
                                    rows={3}
                                />
                            </div>
                            <div className="form-group">
                                <label>URL do YouTube *</label>
                                <input
                                    type="text"
                                    value={videoForm.youtubeUrl}
                                    onChange={e => setVideoForm({ ...videoForm, youtubeUrl: e.target.value })}
                                    placeholder="https://www.youtube.com/watch?v=... ou https://youtu.be/..."
                                />
                            </div>
                            {videoForm.youtubeUrl && extractThumbnail(videoForm.youtubeUrl) && (
                                <div className="form-group">
                                    <label>Preview</label>
                                    <img
                                        src={extractThumbnail(videoForm.youtubeUrl)}
                                        alt="Preview"
                                        style={{ width: '200px', borderRadius: '8px', border: '1px solid var(--border-color)' }}
                                    />
                                </div>
                            )}
                            <div style={{ display: 'flex', gap: '1rem' }}>
                                <div className="form-group" style={{ flex: 1 }}>
                                    <label>Duração</label>
                                    <input
                                        type="text"
                                        value={videoForm.duracao}
                                        onChange={e => setVideoForm({ ...videoForm, duracao: e.target.value })}
                                        placeholder="Ex: 05:20"
                                    />
                                </div>
                                <div className="form-group" style={{ flex: 1 }}>
                                    <label>Ordem</label>
                                    <input
                                        type="number"
                                        value={videoForm.ordem}
                                        onChange={e => setVideoForm({ ...videoForm, ordem: parseInt(e.target.value) || 0 })}
                                    />
                                </div>
                            </div>
                            <div className="form-group">
                                <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                                    <input
                                        type="checkbox"
                                        checked={videoForm.ativo}
                                        onChange={e => setVideoForm({ ...videoForm, ativo: e.target.checked })}
                                        style={{ width: '18px', height: '18px' }}
                                    />
                                    Vídeo ativo (visível na Central de Ajuda)
                                </label>
                            </div>
                        </div>
                        <div className="help-modal-footer">
                            <button className="cancel-btn" onClick={closeVideoModal}>Cancelar</button>
                            <button className="save-btn" onClick={handleSaveVideo} disabled={isSavingVideo}>
                                {isSavingVideo ? 'Salvando...' : 'Salvar'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <ConfirmationModal
                isOpen={isConfirmOpen}
                onClose={() => { setIsConfirmOpen(false); setDeleteTarget(null); }}
                onConfirm={handleDeleteConfirmed}
                title={deleteTarget?.type === 'video' ? 'Excluir Vídeo' : 'Excluir Artigo'}
                message={`Tem certeza que deseja excluir permanentemente ${deleteTarget?.type === 'video' ? 'este vídeo' : 'este artigo de ajuda'}?`}
                confirmText="Sim, excluir"
                isConfirming={isDeleting}
            />
        </div>
    );
};

export default HelpManagerPage;
