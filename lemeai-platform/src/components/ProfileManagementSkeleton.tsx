import React from 'react';
import '../pages/ProfileManagementPage.css';
import './Skeleton.css';

const ProfileManagementSkeleton = () => {
    return (
        <div style={{ padding: '40px' }}>
            <div className="skeleton skeleton-header" style={{ width: '300px', marginBottom: '30px' }}></div>

            <div className="profile-layout">
                {/* List Skeleton */}
                <div className="dashboard-card profile-list-card">
                    <div className="skeleton skeleton-text" style={{ width: '150px', marginBottom: '15px' }}></div>
                    <ul>
                        {[1, 2].map(i => (
                            <li key={i} style={{ display: 'flex', alignItems: 'center', height: '40px', marginBottom: '10px' }}>
                                <div className="skeleton skeleton-text" style={{ width: '100%' }}></div>
                            </li>
                        ))}
                    </ul>
                </div>

                {/* Details Skeleton */}
                <div className="dashboard-card profile-details-card">
                    <div className="skeleton skeleton-text" style={{ width: '250px', marginBottom: '20px' }}></div>
                    <div className="permissions-grid">
                        {[1, 2, 3, 4, 5].map(i => (
                            <div key={i} className="permission-item">
                                <div className="permission-label" style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                    <div className="skeleton skeleton-avatar" style={{ width: '20px', height: '20px' }}></div>
                                    <div className="skeleton skeleton-text" style={{ width: '120px' }}></div>
                                </div>
                                <div className="skeleton" style={{ width: '40px', height: '20px', borderRadius: '10px' }}></div>
                            </div>
                        ))}
                    </div>
                    <div className="profile-actions">
                        <div className="skeleton" style={{ width: '150px', height: '40px', borderRadius: '8px' }}></div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProfileManagementSkeleton;
