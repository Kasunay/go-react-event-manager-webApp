// src/components/PrivateRoute.tsx
import React from 'react';
import { Navigate, useLocation, Outlet } from 'react-router'; // Import Outlet
import { useAuth } from '../contexts/AuthContext'; // Adjust the import path if needed

interface PrivateRouteProps {
  // Similar to PublicOnlyRouteProps, remove children from interface or make optional
}

export const AdminRoute: React.FC<PrivateRouteProps> = () => { // Remove children from FC args
  const { isLoading, isAdmin, isCreator } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <div>Loading authentication...</div>;
  }

  if (!isAdmin() && !isCreator()) {
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  // Render <Outlet /> for nested routes
  return <Outlet />;
};