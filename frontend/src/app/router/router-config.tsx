import { lazy } from 'react';
import { Navigate, createBrowserRouter } from 'react-router-dom';

import AuthLayout from '../layouts/auth-layout';
import { MainLayout } from '../layouts/main-layout';
import { routerPaths } from './lib';
import { AuthGuard } from './ui/auth-guard';
import { ProtectedRoute } from './ui/protected-route';

const LoginPageAsync = lazy(() => import('@pages/login-page'));
const DashboardPageAsync = lazy(() => import('@pages/dashboard-page'));
const EmployeesPageAsync = lazy(() => import('@pages/employees-page'));
const OperationsPageAsync = lazy(() => import('@pages/operations-page'));
const SLAPageAsync = lazy(() => import('@pages/sla-page'));
const KPIPageAsync = lazy(() => import('@pages/kpi-page'));
const ImportPageAsync = lazy(() => import('@pages/import-page'));
const TasksPageAsync = lazy(() => import('@pages/tasks-page'));
const SchedulePageAsync = lazy(() => import('@pages/schedule-page'));
const AuditPageAsync = lazy(() => import('@pages/audit-page'));
const ReportsPageAsync = lazy(() => import('@pages/reports-page'));

export const router = createBrowserRouter([
  { path: '/', element: <Navigate to={routerPaths.login} replace /> },
  {
    path: routerPaths.login,
    element: <AuthGuard />,
    children: [
      {
        element: <AuthLayout />,
        children: [{ index: true, element: <LoginPageAsync /> }],
      },
    ],
  },
  {
    path: routerPaths.dashboard,
    element: <ProtectedRoute />,
    children: [
      {
        element: <MainLayout />,
        children: [
          { index: true, element: <DashboardPageAsync /> },
          { path: 'employees', element: <EmployeesPageAsync /> },
          { path: 'operations', element: <OperationsPageAsync /> },
          { path: 'sla', element: <SLAPageAsync /> },
          { path: 'kpi', element: <KPIPageAsync /> },
          { path: 'import', element: <ImportPageAsync /> },
          { path: 'tasks', element: <TasksPageAsync /> },
          { path: 'schedule', element: <SchedulePageAsync /> },
          { path: 'audit', element: <AuditPageAsync /> },
          { path: 'reports', element: <ReportsPageAsync /> },
        ],
      },
    ],
  },
]);
