import { type ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { canAccessRoute, getUserPermissions, getFirstAccessibleRoute } from '../config/permissions';

interface PermissionGuardProps {
  children: ReactNode;
}

const PermissionGuard = ({ children }: PermissionGuardProps) => {
  const location = useLocation();

  const rawUser = localStorage.getItem('user');
  if (!rawUser) {
    return <Navigate to="/login" replace />;
  }

  const permissions = getUserPermissions();

  if (!canAccessRoute(location.pathname, permissions)) {
    return <Navigate to={getFirstAccessibleRoute(permissions)} replace />;
  }

  return <>{children}</>;
};

export default PermissionGuard;
