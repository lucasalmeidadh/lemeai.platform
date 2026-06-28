import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FaArrowLeft } from 'react-icons/fa';
import { HelpService } from '../services/HelpService';
import type { HelpArticle } from '../types/Help';
import './HelpArticlePage.css';

const HelpArticlePage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [article, setArticle] = useState<HelpArticle | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (id) {
            loadArticle(parseInt(id, 10));
        }
    }, [id]);

    const loadArticle = async (articleId: number) => {
        setIsLoading(true);
        try {
            const data = await HelpService.getArticleById(articleId);
            setArticle(data);
        } catch (error) {
            console.error("Erro ao carregar artigo:", error);
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) {
        return (
            <div className="page-container help-article-page">
                <div className="help-article-loading">Carregando tutorial...</div>
            </div>
        );
    }

    if (!article) {
        return (
            <div className="page-container help-article-page">
                <div className="help-article-error">
                    <h2>Artigo não encontrado</h2>
                    <button className="action-button" onClick={() => navigate('/help')}>
                        Voltar para Central de Ajuda
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="page-container help-article-page">
            <div className="help-article-container">
                <header className="help-article-header">
                    <button className="help-back-btn" onClick={() => navigate('/help')}>
                        <FaArrowLeft /> Voltar
                    </button>
                    <h1>{article.titulo}</h1>
                    <div className="help-article-meta">
                        <span>Atualizado em {new Date(article.dataAtualizacao || article.dataCriacao).toLocaleDateString('pt-BR')}</span>
                        {article.tags && <span> • {article.tags.split(',').join(', ')}</span>}
                    </div>
                </header>

                <div 
                    className="help-article-content"
                    dangerouslySetInnerHTML={{ __html: article.conteudo }}
                />
            </div>
        </div>
    );
};

export default HelpArticlePage;
