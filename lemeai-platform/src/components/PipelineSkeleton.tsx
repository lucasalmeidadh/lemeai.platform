import React from 'react';
import '../pages/PipelinePage.css'; // Reuse pipeline layout styles
import './Skeleton.css';

const PipelineSkeleton = () => {
    return (
        <div className="pipeline-container">
            <div className="pipeline-header">
                <div className="skeleton skeleton-header" style={{ width: '250px' }}></div>
                <div className="skeleton" style={{ width: '180px', height: '40px', borderRadius: '8px' }}></div>
            </div>

            <div className="pipeline-board">
                {[1, 2, 3, 4, 5].map((col) => (
                    <div key={col} className="pipeline-column">
                        <div className="column-header">
                            <div className="skeleton skeleton-text" style={{ width: '60%' }}></div>
                            <div className="skeleton skeleton-avatar" style={{ width: '24px', height: '24px' }}></div>
                        </div>
                        <div className="column-body">
                            {[1, 2, 3].map((card) => (
                                <div key={card} className="kanban-card" style={{ cursor: 'default' }}>
                                    <div className="card-tags">
                                        <div className="skeleton" style={{ width: '60px', height: '20px', borderRadius: '12px' }}></div>
                                    </div>
                                    <div className="skeleton skeleton-text" style={{ width: '80%', marginBottom: '8px' }}></div>
                                    <div className="skeleton skeleton-text" style={{ width: '40%', marginBottom: '12px' }}></div>
                                    <div className="card-footer">
                                        <div className="skeleton skeleton-text-sm" style={{ width: '60px' }}></div>
                                        <div className="skeleton skeleton-avatar" style={{ width: '24px', height: '24px' }}></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default PipelineSkeleton;
