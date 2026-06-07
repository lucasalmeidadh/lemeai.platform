import React, { useState } from 'react';
import { FaBullhorn, FaArrowLeft } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { novidadesData } from '../data/novidadesMock';
import './NovidadesPage.css';

type FilterType = 'todos' | 'recurso' | 'melhoria' | 'correcao';

const NovidadesPage: React.FC = () => {
    const navigate = useNavigate();
    const [activeFilter, setActiveFilter] = useState<FilterType>('todos');

    const filteredNovidades = novidadesData.filter((item) => {
        if (activeFilter === 'todos') return true;
        return item.category === activeFilter;
    });

    return (
        <div className="page-container">
            <div className="novidades-page-container">
                <header className="novidades-page-header">
                    <button className="back-btn" onClick={() => navigate(-1)} title="Voltar">
                        <FaArrowLeft /> Voltar
                    </button>
                    <div className="novidades-title-container">
                        <div className="novidades-icon-box">
                            <FaBullhorn size={24} />
                        </div>
                        <div>
                            <h1>Novidades do Sistema</h1>
                            <p>Fique por dentro dos novos recursos, melhorias e correções da plataforma LemeAI.</p>
                        </div>
                    </div>
                </header>

                <div className="novidades-filters">
                    {(['todos', 'recurso', 'melhoria', 'correcao'] as FilterType[]).map((filter) => (
                        <button
                            key={filter}
                            className={`filter-btn ${activeFilter === filter ? 'active' : ''}`}
                            onClick={() => setActiveFilter(filter)}
                        >
                            {filter === 'todos' && 'Todas'}
                            {filter === 'recurso' && 'Novos Recursos'}
                            {filter === 'melhoria' && 'Melhorias'}
                            {filter === 'correcao' && 'Correções'}
                        </button>
                    ))}
                </div>

                <div className="novidades-timeline">
                    {filteredNovidades.length > 0 ? (
                        filteredNovidades.map((item) => (
                            <div key={item.id} className="novidade-card">
                                <div className="novidade-card-header">
                                    <span className={`novidades-tag tag-${item.category}`}>
                                        {item.category === 'recurso' ? 'Novo Recurso' : item.category === 'melhoria' ? 'Melhoria' : 'Correção'}
                                    </span>
                                    <span className="novidade-card-date">{item.date}</span>
                                </div>
                                <h2 className="novidade-card-title">{item.title}</h2>
                                <p className="novidade-card-description">{item.description}</p>
                            </div>
                        ))
                    ) : (
                        <div className="novidades-empty">
                            <p>Nenhuma novidade encontrada para esta categoria.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default NovidadesPage;
