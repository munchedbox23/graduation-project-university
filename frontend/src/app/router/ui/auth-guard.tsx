import { Navigate, Outlet } from 'react-router-dom';

import { selectIsAuthenticated } from '@entities/user';
import { HOME_PATH } from '@shared/constants';
import { useAppSelector } from '@shared/store';

export function AuthGuard() {
  const isAuthenticated = useAppSelector(selectIsAuthenticated);

  if (isAuthenticated) {
    return <Navigate to={HOME_PATH} replace />;
  }

  return <Outlet />;
}
