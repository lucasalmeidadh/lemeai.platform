import React from 'react';
import '../pages/SystemPromptsPage.css';
import './Skeleton.css';

const SystemPromptsSkeleton: React.FC = () => {
    return (
        <div className="config-hamburger-layout" style={{ marginTop: '20px' }}>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                {[1, 2, 3, 4].map((tab) => (
                    <div key={tab} className="skeleton" style={{ width: '110px', height: '32px', borderRadius: '6px' }}></div>
                ))}
            </div>

            <div className="dashboard-card wizard-card">
                <div className="skeleton skeleton-header" style={{ width: '220px', marginBottom: '8px' }}></div>
                <div className="skeleton" style={{ width: '380px', height: '14px', borderRadius: '4px', marginBottom: '20px' }}></div>

                <div className="skeleton" style={{ width: '100%', height: '46px', borderRadius: '10px', marginBottom: '16px' }}></div>
                <div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
                    <div className="skeleton" style={{ width: '100%', height: '46px', borderRadius: '10px' }}></div>
                    <div className="skeleton" style={{ width: '100%', height: '46px', borderRadius: '10px' }}></div>
                </div>
                <div className="skeleton" style={{ width: '100%', height: '120px', borderRadius: '10px' }}></div>
            </div>
        </div>
    );
};

export default SystemPromptsSkeleton;
