import { Typography } from 'antd';

function HeadPage() {
  return (
    <div>
      <Typography.Title level={2}>Дашборд руководителя</Typography.Title>
      <Typography.Text type="secondary">
        Дашборды KPI, мониторинг SLA, отчёты и постановка задач
      </Typography.Text>
    </div>
  );
}

export default HeadPage;
