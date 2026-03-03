import {
  AuditOutlined,
  BarChartOutlined,
  CalendarOutlined,
  CheckSquareOutlined,
  DashboardOutlined,
  FileTextOutlined,
  ImportOutlined,
  SafetyCertificateOutlined,
  TeamOutlined,
  UnorderedListOutlined,
} from '@ant-design/icons';
import type { MenuProps } from 'antd';

import { UserRole } from '@shared/constants';

type MenuItem = Required<MenuProps>['items'][number];

const ADMIN_MENU: MenuItem[] = [
  { key: '/dashboard', icon: <DashboardOutlined />, label: 'Дашборд' },
  { key: '/dashboard/employees', icon: <TeamOutlined />, label: 'Сотрудники' },
  { key: '/dashboard/operations', icon: <UnorderedListOutlined />, label: 'Операции' },
  { key: '/dashboard/sla', icon: <SafetyCertificateOutlined />, label: 'SLA / Регламенты' },
  { key: '/dashboard/kpi', icon: <BarChartOutlined />, label: 'KPI Шаблоны' },
  { key: '/dashboard/import', icon: <ImportOutlined />, label: 'Импорт данных' },
  { key: '/dashboard/tasks', icon: <CheckSquareOutlined />, label: 'Задачи' },
  { key: '/dashboard/schedule', icon: <CalendarOutlined />, label: 'Графики работы' },
  { key: '/dashboard/audit', icon: <AuditOutlined />, label: 'Аудит' },
];

const HEAD_MENU: MenuItem[] = [
  { key: '/dashboard', icon: <DashboardOutlined />, label: 'Дашборд KPI' },
  { key: '/dashboard/employees', icon: <TeamOutlined />, label: 'Сотрудники' },
  { key: '/dashboard/operations', icon: <UnorderedListOutlined />, label: 'Операции' },
  { key: '/dashboard/sla', icon: <SafetyCertificateOutlined />, label: 'Мониторинг SLA' },
  { key: '/dashboard/reports', icon: <FileTextOutlined />, label: 'Отчёты' },
  { key: '/dashboard/tasks', icon: <CheckSquareOutlined />, label: 'Задачи' },
  { key: '/dashboard/schedule', icon: <CalendarOutlined />, label: 'Графики / Загрузка' },
];

const EMP_MENU: MenuItem[] = [
  { key: '/dashboard', icon: <DashboardOutlined />, label: 'Мои показатели' },
  { key: '/dashboard/operations', icon: <UnorderedListOutlined />, label: 'Мои операции' },
  { key: '/dashboard/tasks', icon: <CheckSquareOutlined />, label: 'Мои задачи' },
  { key: '/dashboard/schedule', icon: <CalendarOutlined />, label: 'Мой график' },
];

export function getMenuItems(role?: UserRole): MenuItem[] {
  switch (role) {
    case UserRole.ADMIN:
      return ADMIN_MENU;
    case UserRole.HEAD:
      return HEAD_MENU;
    case UserRole.EMP:
      return EMP_MENU;
    default:
      return [];
  }
}
