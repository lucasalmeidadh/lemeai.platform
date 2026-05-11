import React from 'react';
import { FaPlay, FaQuestionCircle } from 'react-icons/fa';
import './HelpPage.css';

interface VideoTutorial {
    id: string;
    title: string;
    description: string;
    thumbnail: string;
    youtubeUrl: string;
    duration: string;
}

const tutorials: VideoTutorial[] = [
    {
        id: '1',
        title: 'Introdução ao LemeAI',
        description: 'Conheça os primeiros passos para configurar sua conta e começar a utilizar a plataforma.',
        thumbnail: 'https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg', // Placeholder
        youtubeUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        duration: '05:20'
    },
    {
        id: '2',
        title: 'Gerenciando seu Fluxo de Vendas',
        description: 'Aprenda a organizar seus leads e oportunidades no pipeline de forma eficiente.',
        thumbnail: 'https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg', // Placeholder
        youtubeUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        duration: '08:45'
    },
    {
        id: '3',
        title: 'Configurando a Automação de Chat',
        description: 'Como configurar regras de atendimento automático e integração com IA.',
        thumbnail: 'https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg', // Placeholder
        youtubeUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        duration: '12:10'
    },
    {
        id: '4',
        title: 'Análise de Métricas e Relatórios',
        description: 'Entenda como ler os gráficos do Dashboard e extrair insights valiosos para seu negócio.',
        thumbnail: 'https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg', // Placeholder
        youtubeUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        duration: '06:30'
    },
    {
        id: '5',
        title: 'Conexão com WhatsApp',
        description: 'Passo a passo para conectar seu número oficial ou via Evolution API.',
        thumbnail: 'https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg', // Placeholder
        youtubeUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        duration: '04:15'
    },
    {
        id: '6',
        title: 'Gestão de Contatos e Etiquetas',
        description: 'Mantenha sua base de clientes organizada utilizando etiquetas e filtros avançados.',
        thumbnail: 'https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg', // Placeholder
        youtubeUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        duration: '07:50'
    }
];

const HelpPage: React.FC = () => {
    const handleVideoClick = (url: string) => {
        window.open(url, '_blank', 'noopener,noreferrer');
    };

    return (
        <div className="page-container">
            <div className="help-container">
                <header className="help-header">
                    <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: 'var(--primary-color, #0284c7)', color: 'white', width: '48px', height: '48px', borderRadius: '12px', marginBottom: '1rem' }}>
                        <FaQuestionCircle size={24} />
                    </div>
                    <h1>Central de Ajuda</h1>
                    <p>Aprenda a utilizar o máximo do LemeAI com nossos vídeos tutoriais.</p>
                </header>

                <div className="video-grid">
                    {tutorials.map((video) => (
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
            </div>
        </div>
    );
};

export default HelpPage;
