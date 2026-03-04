import { Typography } from 'antd';

function AdminPage() {
  return (
    <div>
      <Typography.Title level={2}>Панель администратора</Typography.Title>
      <Typography.Text type="secondary">
        Управление пользователями, KPI-шаблонами, SLA-регламентами и импорт данных
      </Typography.Text>
    </div>
  );
}

export default AdminPage;
