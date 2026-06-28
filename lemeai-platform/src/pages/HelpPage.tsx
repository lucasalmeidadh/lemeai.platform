import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaPlay, FaQuestionCircle, FaSearch, FaBook, FaRocket, FaStream, FaBullhorn, FaRobot, FaFolderOpen } from 'react-icons/fa';
import { HelpService } from '../services/HelpService';
import type { HelpCategory, HelpArticle } from '../types/Help';
import './HelpPage.css';

interface VideoTutorial {
    id: string;
    title: string;
    description: string;
    thumbnail: string;
    youtubeUrl: string;
    duration: string;
}

const videoTutorials: VideoTutorial[] = [
    {
        id: '1',
        title: 'Introdução ao LemeAI',
        description: 'Conheça os primeiros passos para configurar sua conta e começar a utilizar a plataforma.',
        thumbnail: 'https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg',
        youtubeUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        duration: '05:20'
    },
    {
        id: '2',
        title: 'Gerenciando seu Fluxo de Vendas',
        description: 'Aprenda a organizar seus leads e oportunidades no pipeline de forma eficiente.',
        thumbnail: 'https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg',
        youtubeUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        duration: '08:45'
    }
];

const iconMap: Record<string, React.ReactNode> = {
    'FaRocket': <FaRocket />,
    'FaStream': <FaStream />,
    'FaBullhorn': <FaBullhorn />,
    'FaRobot': <FaRobot />,
    'FaBook': <FaBook />
};

const HelpPage: React.FC = () => {
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState('');
    const [categories, setCategories] = useState<HelpCategory[]>([]);
    const [articles, setArticles] = useState<HelpArticle[]>([]);
    const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, []);

    useEffect(() => {
        const fetchFiltered = async () => {
            const filteredArticles = await HelpService.getArticles(searchTerm, selectedCategory || undefined);
            setArticles(filteredArticles);
        };
        
        const timeoutId = setTimeout(() => {
            fetchFiltered();
        }, 300); // debounce
        return () => clearTimeout(timeoutId);
    }, [searchTerm, selectedCategory]);

    const loadData = async () => {
        setIsLoading(true);
        try {
            const [cats, arts] = await Promise.all([
                HelpService.getCategories(),
                HelpService.getArticles()
            ]);
            setCategories(cats);
            setArticles(arts);
        } catch (error) {
            console.error("Erro ao carregar dados de ajuda:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleVideoClick = (url: string) => {
        window.open(url, '_blank', 'noopener,noreferrer');
    };

    const handleCategoryClick = (categoryId: number) => {
        if (selectedCategory === categoryId) {
            setSelectedCategory(null);
        } else {
            setSelectedCategory(categoryId);
        }
    };

    return (
        <div className="page-container help-page">
            <header className="help-header-hero">
                <div className="help-header-content">
                    <div className="help-icon-wrapper">
                        <FaQuestionCircle size={32} />
                    </div>
                    <h1>Central de Ajuda</h1>
                    <p>Encontre tutoriais passo a passo e respostas para suas dúvidas.</p>
                    
                    <div className="help-search-bar">
                        <FaSearch className="search-icon" />
                        <input 
                            type="text" 
                            placeholder="Buscar por tutoriais ou palavras-chave..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
            </header>

            <div className="help-content-container">
                {/* Categorias */}
                <section className="help-categories-section">
                    <h2>Categorias</h2>
                    <div className="help-categories-grid">
                        {categories.map(cat => (
                            <div 
                                key={cat.id} 
                                className={`help-category-card ${selectedCategory === cat.id ? 'selected' : ''}`}
                                onClick={() => handleCategoryClick(cat.id)}
                            >
                                <div className="help-category-icon">
                                    {cat.icone ? iconMap[cat.icone] || <FaFolderOpen /> : <FaFolderOpen />}
                                </div>
                                <h3>{cat.nome}</h3>
                                {cat.descricao && <p>{cat.descricao}</p>}
                            </div>
                        ))}
                    </div>
                </section>

                {/* Artigos e Tutoriais */}
                <section className="help-articles-section">
                    <h2>{selectedCategory ? `Artigos da categoria` : `Artigos recentes`}</h2>
                    {isLoading ? (
                        <div className="help-loading">Carregando artigos...</div>
                    ) : articles.length === 0 ? (
                        <div className="help-empty">Nenhum artigo encontrado.</div>
                    ) : (
                        <div className="help-articles-list">
                            {articles.map(article => (
                                <div 
                                    key={article.id} 
                                    className="help-article-item"
                                    onClick={() => navigate(`/help/article/${article.id}`)}
                                >
                                    <div className="help-article-item-icon">
                                        <FaBook />
                                    </div>
                                    <div className="help-article-item-content">
                                        <h4>{article.titulo}</h4>
                                        <div className="help-article-item-meta">
                                            {categories.find(c => c.id === article.categoriaId)?.nome || 'Sem categoria'}
                                            {article.tags && ` • ${article.tags.split(',').slice(0,2).join(', ')}`}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </section>

                {/* Vídeos (Fallback) */}
                {!searchTerm && !selectedCategory && (
                    <section className="help-videos-section">
                        <h2>Tutoriais em Vídeo</h2>
                        <div className="video-grid">
                            {videoTutorials.map((video) => (
                                <div 
                                    key={video.id} 
                                    className="video-card"
                                    onClick={() => handleVideoClick(video.youtubeUrl)}
                                >
                                    <div className="video-thumbnail">
                                        <img src={video.thumbnail} alt={video.title} />
                                        <div className="play-button-overlay">
                                            <FaPlay />
                                        </div>
                                        <span className="video-duration">{video.duration}</span>
                                    </div>
                                    <div className="video-info">
                                        <h3>{video.title}</h3>
                                        <p>{video.description}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                )}
            </div>
        </div>
    );
};

export default HelpPage;
