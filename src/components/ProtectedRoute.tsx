import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { obtenerSesion } from '../services/authService';
import { PATHS } from '../routes/paths';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

/**
 * Si no hay sesión y se entra por cualquier URL protegida → login.
 */
export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const session = obtenerSesion();
  const location = useLocation();

  if (!session?.key) {
    return <Navigate to={PATHS.login} replace state={{ from: location.pathname }} />;
  }

  return <>{children}</>;
};
