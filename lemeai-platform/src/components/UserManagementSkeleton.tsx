import React from 'react';
import '../pages/UserManagementPage.css'; // Reuse styles
import './Skeleton.css';

const UserManagementSkeleton = () => {
    return (
        <div style={{ padding: '40px' }}>
            <div className="page-header">
                <div className="skeleton skeleton-header" style={{ width: '250px' }}></div>
                <div className="skeleton" style={{ width: '180px', height: '40px', borderRadius: '8px' }}></div>
            </div>

            <div className="dashboard-card">
                <div className="filters-container">
                    <div className="skeleton skeleton-input" style={{ width: '300px', marginRight: '20px' }}></div>
                    <div className="select-filters">
                        <div className="skeleton skeleton-input" style={{ width: '200px' }}></div>
                        <div className="users-filters">
                            <div className="skeleton" style={{ width: '80px', height: '40px', borderRadius: '20px' }}></div>
                            <div className="skeleton" style={{ width: '80px', height: '40px', borderRadius: '20px' }}></div>
                        </div>
                    </div>
                </div>

                <div className="table-container">
                    <table className="management-table">
                        <thead>
                            <tr>
                                {['Nome', 'E-mail', 'Perfil', 'Status', 'Ações'].map((head, i) => (
                                    <th key={i}><div className="skeleton skeleton-text" style={{ width: '80%' }}></div></th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {[1, 2, 3, 4, 5].map((row) => (
                                <tr key={row}>
                                    <td><div className="skeleton skeleton-text"></div></td>
                                    <td><div className="skeleton skeleton-text"></div></td>
                                    <td><div className="skeleton skeleton-text" style={{ width: '100px' }}></div></td>
                                    <td><div className="skeleton" style={{ width: '80px', height: '24px', borderRadius: '12px' }}></div></td>
                                    <td><div className="skeleton" style={{ width: '60px', height: '30px', borderRadius: '4px' }}></div></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default UserManagementSkeleton;
