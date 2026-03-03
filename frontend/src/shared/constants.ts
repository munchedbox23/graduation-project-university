export enum UserRole {
  ADMIN = 'ADMIN',
  HEAD = 'HEAD',
  EMP = 'EMP',
}

export enum PagesEnum {
  LOGIN = 'LOGIN',
  DASHBOARD = 'DASHBOARD',
  EMPLOYEES = 'EMPLOYEES',
  OPERATIONS = 'OPERATIONS',
  SLA = 'SLA',
  KPI = 'KPI',
  TASKS = 'TASKS',
  SCHEDULE = 'SCHEDULE',
  IMPORT = 'IMPORT',
  AUDIT = 'AUDIT',
  REPORTS = 'REPORTS',
}

export const ROUTER_PATHS: Record<PagesEnum, string> = {
  [PagesEnum.LOGIN]: '/login',
  [PagesEnum.DASHBOARD]: '/dashboard',
  [PagesEnum.EMPLOYEES]: '/dashboard/employees',
  [PagesEnum.OPERATIONS]: '/dashboard/operations',
  [PagesEnum.SLA]: '/dashboard/sla',
  [PagesEnum.KPI]: '/dashboard/kpi',
  [PagesEnum.TASKS]: '/dashboard/tasks',
  [PagesEnum.SCHEDULE]: '/dashboard/schedule',
  [PagesEnum.IMPORT]: '/dashboard/import',
  [PagesEnum.AUDIT]: '/dashboard/audit',
  [PagesEnum.REPORTS]: '/dashboard/reports',
};

// После логина все роли попадают на /dashboard — дальше роль определяет контент
export const HOME_PATH = ROUTER_PATHS[PagesEnum.DASHBOARD];

export const ROLE_HOME_PATHS: Record<UserRole, string> = {
  [UserRole.ADMIN]: ROUTER_PATHS[PagesEnum.DASHBOARD],
  [UserRole.HEAD]: ROUTER_PATHS[PagesEnum.DASHBOARD],
  [UserRole.EMP]: ROUTER_PATHS[PagesEnum.DASHBOARD],
};
