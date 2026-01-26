import React from 'react';
import '../pages/Dashboard.css'; // Reuse dashboard layout styles
import './Skeleton.css';

const DashboardSkeleton = () => {
    return (
        <div style={{ padding: '40px' }}>
            {/* Header */}
            <div className="skeleton skeleton-header" style={{ width: '200px', marginBottom: '30px' }}></div>

            {/* KPI Grid */}
            <div className="kpi-grid">
                {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="dashboard-card" style={{ display: 'flex', alignItems: 'center', padding: '20px' }}>
                        <div className="skeleton skeleton-avatar" style={{ width: '50px', height: '50px', marginRight: '15px' }}></div>
                        <div style={{ flex: 1 }}>
                            <div className="skeleton skeleton-text" style={{ width: '60%', marginBottom: '10px' }}></div>
                            <div className="skeleton skeleton-text" style={{ width: '40%', height: '24px' }}></div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Charts Area */}
            <div className="dashboard-charts-area">
                <div className="dashboard-card" style={{ height: '400px', padding: '20px' }}>
                    <div className="skeleton skeleton-text" style={{ width: '200px', marginBottom: '20px' }}></div>
                    <div className="skeleton" style={{ width: '100%', height: '300px' }}></div>
                </div>
            </div>

            {/* Filters */}
            <div className="dashboard-card" style={{ padding: '20px', marginBottom: '20px' }}>
                <div className="filters-container">
                    <div className="skeleton skeleton-input" style={{ width: '300px', marginRight: '20px' }}></div>
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <div className="skeleton skeleton-input" style={{ width: '150px' }}></div>
                        <div className="skeleton skeleton-input" style={{ width: '150px' }}></div>
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="dashboard-card">
                <div className="table-container">
                    <table className="deals-table">
                        <thead>
                            <tr>
                                {['Cliente', 'Número', 'Tipo', 'Status', 'Detalhes'].map((header, index) => (
                                    <th key={index}><div className="skeleton skeleton-text" style={{ width: '80%' }}></div></th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {[1, 2, 3, 4, 5].map((row) => (
                                <tr key={row}>
                                    <td><div className="skeleton skeleton-text"></div></td>
                                    <td><div className="skeleton skeleton-text"></div></td>
                                    <td><div className="skeleton skeleton-text"></div></td>
                                    <td><div className="skeleton skeleton-text" style={{ width: '100px', borderRadius: '12px' }}></div></td>
                                    <td><div className="skeleton skeleton-text" style={{ width: '80px' }}></div></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default DashboardSkeleton;
