import React from 'react';
import '../pages/SystemPromptsPage.css';
import './Skeleton.css';

const SystemPromptsSkeleton: React.FC = () => {
    return (
        <div className="config-hamburger-layout" style={{ marginTop: '20px' }}>
            {/* TOP - Cabeçalho */}
            <div className="dashboard-card section-cabecalho" style={{ marginBottom: '20px' }}>
                <div className="skeleton skeleton-header" style={{ width: '250px', marginBottom: '8px' }}></div>
                <div className="skeleton" style={{ width: '400px', height: '16px', borderRadius: '4px', marginBottom: '15px' }}></div>
                <div className="skeleton" style={{ width: '100%', height: '180px', borderRadius: '8px' }}></div>
            </div>

            {/* MIDDLE - Regras */}
            <div className="dashboard-card section-regras" style={{ marginBottom: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                    <div>
                        <div className="skeleton skeleton-header" style={{ width: '200px', marginBottom: '8px' }}></div>
                        <div className="skeleton" style={{ width: '300px', height: '16px', borderRadius: '4px' }}></div>
                    </div>
                    <div className="skeleton" style={{ width: '140px', height: '36px', borderRadius: '8px' }}></div>
                </div>

                <div className="table-container">
                    <table className="management-table">
                        <thead>
                            <tr>
                                <th style={{ width: '60px' }}><div className="skeleton skeleton-text" style={{ width: '40px' }}></div></th>
                                <th><div className="skeleton skeleton-text" style={{ width: '150px' }}></div></th>
                                <th style={{ width: '100px' }}><div className="skeleton skeleton-text" style={{ width: '60px' }}></div></th>
                            </tr>
                        </thead>
                        <tbody>
                            {[1, 2, 3].map((row) => (
                                <tr key={row}>
                                    <td><div className="skeleton skeleton-text" style={{ width: '20px', margin: '0 auto' }}></div></td>
                                    <td><div className="skeleton skeleton-text"></div></td>
                                    <td>
                                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                                            <div className="skeleton" style={{ width: '30px', height: '30px', borderRadius: '4px' }}></div>
                                            <div className="skeleton" style={{ width: '30px', height: '30px', borderRadius: '4px' }}></div>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* BOTTOM - Rodapé */}
            <div className="dashboard-card section-rodape" style={{ marginBottom: '20px' }}>
                <div className="skeleton skeleton-header" style={{ width: '250px', marginBottom: '8px' }}></div>
                <div className="skeleton" style={{ width: '400px', height: '16px', borderRadius: '4px', marginBottom: '15px' }}></div>
                <div className="skeleton" style={{ width: '100%', height: '180px', borderRadius: '8px' }}></div>
            </div>
        </div>
    );
};

export default SystemPromptsSkeleton;
