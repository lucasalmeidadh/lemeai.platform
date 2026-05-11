import React from 'react';
import '../pages/Dashboard.css'; // Reuse dashboard layout styles
import './Skeleton.css';

const DashboardSkeleton = () => {
    return (
        <div style={{ width: '100%' }}>
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
                <div className="dashboard-card chart-card" style={{ height: '400px', padding: '20px' }}>
                    <div className="skeleton skeleton-text" style={{ width: '200px', marginBottom: '10px' }}></div>
                    <div className="skeleton skeleton-text" style={{ width: '150px', height: '14px', marginBottom: '25px' }}></div>
                    <div className="skeleton" style={{ width: '100%', height: '280px', borderRadius: '8px' }}></div>
                </div>
                
                <div className="dashboard-card chart-card" style={{ height: '400px', padding: '20px' }}>
                    <div className="skeleton skeleton-text" style={{ width: '150px', marginBottom: '10px' }}></div>
                    <div className="skeleton skeleton-text" style={{ width: '120px', height: '14px', marginBottom: '25px' }}></div>
                    <div className="skeleton" style={{ width: '100%', height: '280px', borderRadius: '8px' }}></div>
                </div>
            </div>
        </div>
    );
};

export default DashboardSkeleton;
