import React from 'react';
import { useAuth, UserRole } from '../context/AuthContext';

interface Props {
  allowedRoles: UserRole[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const ProtectedRoute: React.FC<Props> = ({ 
  allowedRoles, 
  children, 
  fallback = <p className="p-4 text-center text-red-500">Accès refusé : permissions insuffisantes.</p> 
}) => {
  const { role, loading } = useAuth();

  if (loading) return <div className="p-8 text-center">Chargement...</div>;
  if (!allowedRoles.includes(role)) return <>{fallback}</>;

  return <>{children}</>;
};