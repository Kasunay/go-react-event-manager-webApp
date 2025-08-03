// src/components/PublicOnlyRoute.tsx
import React from 'react';
// Import Outlet from react-router-dom
import { Navigate, useLocation, Outlet } from 'react-router';
import { useAuth } from '../contexts/AuthContext'; // Adjust path as needed

interface PublicOnlyRouteProps {
  // We no longer explicitly expect 'children' for this pattern,
  // as Outlet handles it for react-router-dom's nested routes.
  // So, you can remove the children prop from the interface
  // or keep it as optional React.ReactNode if you intend to use it in other ways.
  // For this nested route pattern, it's not strictly needed here.
}

export const PublicOnlyRoute: React.FC<PublicOnlyRouteProps> = () => { // Remove children from FC args
  const { isLoggedIn, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (isLoggedIn) {
    const from = location.state?.from?.pathname || '/';
    return <Navigate to={from} replace />;
  }

  // User is not logged in, allow them to access the public-only content.
  // Crucially, render <Outlet /> here, which will render the matched nested route.
  return <Outlet />;
};