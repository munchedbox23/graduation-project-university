import { Navigate, Outlet } from 'react-router-dom';

import { selectIsAuthenticated } from '@entities/user';
import { useAppSelector } from '@shared/store';

import { routerPaths } from '../lib';

export function ProtectedRoute() {
  const isAuthenticated = useAppSelector(selectIsAuthenticated);

  if (!isAuthenticated) {
    return <Navigate to={routerPaths.login} replace />;
  }

  return <Outlet />;
}
