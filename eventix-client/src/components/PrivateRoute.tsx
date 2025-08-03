// src/components/PrivateRoute.tsx
import React from 'react';
import { Navigate, useLocation, Outlet } from 'react-router'; // Import Outlet
import { useAuth } from '../contexts/AuthContext'; // Adjust the import path if needed

interface PrivateRouteProps {
  // Similar to PublicOnlyRouteProps, remove children from interface or make optional
}

export const PrivateRoute: React.FC<PrivateRouteProps> = () => { // Remove children from FC args
  const { isLoggedIn, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <div>Loading authentication...</div>;
  }

  if (!isLoggedIn) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Render <Outlet /> for nested routes
  return <Outlet />;
};