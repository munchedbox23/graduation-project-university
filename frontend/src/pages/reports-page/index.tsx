import { useEffect, useState } from 'react';

import {
  Button,
  Card,
  Col,
  DatePicker,
  Row,
  Space,
  Statistic,
  Table,
  Typography,
  message,
} from 'antd';
import {
  ClockCircleOutlined,
  DownloadOutlined,
  ExclamationCircleOutlined,
  ThunderboltOutlined,
  UnorderedListOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs, { Dayjs } from 'dayjs';

import { $api } from '@shared/api/api';

const { Title } = Typography;
const { RangePicker } = DatePicker;

interface ReportSummary {
  total_operations: number;
  avg_duration: number;
  sla_violations_count: number;
  total_work_hours: number;
}

interface EmployeeBreakdown {
  employee_id: number;
  employee_name: string;
  operations_count: number;
  avg_duration: number;
  sla_violations: number;
  work_hours: number;
}

interface ReportData {
  summary: ReportSummary;
  breakdown: EmployeeBreakdown[];
}

function formatDuration(seconds: number): string {
  if (!seconds) return '—';
  const mins = Math.floor(seconds / 60);
  const secs = Math.round(seconds % 60);
  return `${mins}м ${secs}с`;
}

function ReportsPage() {
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(false);
  const [dates, setDates] = useState<[Dayjs, Dayjs]>([
    dayjs().startOf('month'),
    dayjs().endOf('day'),
  ]);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const params = {
        date_from: dates[0].format('YYYY-MM-DD'),
        date_to: dates[1].format('YYYY-MM-DD'),
      };
      const res = await $api.get<ReportData>('/api/reports/daily', { params });
      setData(res.data);
    } catch {
      message.error('Не удалось загрузить отчёт');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [dates]);

  const handleExport = async () => {
    try {
      const params = new URLSearchParams({
        date_from: dates[0].format('YYYY-MM-DD'),
        date_to: dates[1].format('YYYY-MM-DD'),
        export: 'csv',
      });
      const res = await $api.get(`/api/reports/daily?${params.toString()}`, {
        responseType: 'blob',
      });
      const url = URL.createObjectURL(res.data as Blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `report_${dates[0].format('YYYYMMDD')}_${dates[1].format('YYYYMMDD')}.csv`;
      link.click();
      URL.revokeObjectURL(url);
    } catch {
      message.error('Ошибка при экспорте');
    }
  };

  const breakdownColumns: ColumnsType<EmployeeBreakdown> = [
    { title: 'Сотрудник', dataIndex: 'employee_name', key: 'employee_name' },
    {
      title: 'Кол-во операций',
      dataIndex: 'operations_count',
      key: 'operations_count',
      sorter: (a, b) => a.operations_count - b.operations_count,
    },
    {
      title: 'Ср. длительность',
      dataIndex: 'avg_duration',
      key: 'avg_duration',
      render: (v: number) => formatDuration(v),
      sorter: (a, b) => a.avg_duration - b.avg_duration,
    },
    {
      title: 'Нарушений SLA',
      dataIndex: 'sla_violations',
      key: 'sla_violations',
      sorter: (a, b) => a.sla_violations - b.sla_violations,
    },
    {
      title: 'Часов отработано',
      dataIndex: 'work_hours',
      key: 'work_hours',
      render: (v: number) => (v != null ? `${v} ч` : '—'),
      sorter: (a, b) => a.work_hours - b.work_hours,
    },
  ];

  return (
    <div>
      <Title level={3} style={{ marginBottom: 24 }}>
        Отчёты
      </Title>

      <Space wrap style={{ marginBottom: 24 }}>
        <RangePicker
          value={dates}
          onChange={(d) => {
            if (d && d[0] && d[1]) setDates([d[0], d[1]]);
          }}
        />
        <Button icon={<DownloadOutlined />} onClick={handleExport}>
          Экспорт CSV
        </Button>
      </Space>

      {data?.summary && (
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Всего операций"
                value={data.summary.total_operations}
                prefix={<UnorderedListOutlined />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Ср. длительность"
                value={formatDuration(data.summary.avg_duration)}
                prefix={<ClockCircleOutlined />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Нарушений SLA"
                value={data.summary.sla_violations_count}
                prefix={<ExclamationCircleOutlined />}
                valueStyle={data.summary.sla_violations_count > 0 ? { color: '#ff4d4f' } : undefined}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Часов отработано"
                value={data.summary.total_work_hours}
                suffix="ч"
                prefix={<ThunderboltOutlined />}
              />
            </Card>
          </Col>
        </Row>
      )}

      <Table<EmployeeBreakdown>
        columns={breakdownColumns}
        dataSource={data?.breakdown ?? []}
        rowKey="employee_id"
        loading={loading}
        pagination={{ pageSize: 20 }}
        size="middle"
        title={() => 'Разбивка по сотрудникам'}
      />
    </div>
  );
}

export default ReportsPage;
