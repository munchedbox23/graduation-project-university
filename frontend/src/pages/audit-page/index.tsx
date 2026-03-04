import { useEffect, useState } from 'react';

import {
  DatePicker,
  Select,
  Space,
  Table,
  Tag,
  Typography,
  message,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import dayjs, { Dayjs } from 'dayjs';

import { $api } from '@shared/api/api';

const { Title } = Typography;
const { RangePicker } = DatePicker;

interface AuditLog {
  audit_id: number;
  employee_name: string;
  action: string;
  ip: string;
  created_at: string;
}

interface Employee {
  employee_id: number;
  full_name: string;
}

const ACTION_COLOR: Record<string, string> = {
  LOGIN: 'blue',
  LOGOUT: 'default',
  CREATE: 'green',
  UPDATE: 'orange',
  DELETE: 'red',
  IMPORT: 'purple',
};

function AuditPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(false);
  const [filterEmployee, setFilterEmployee] = useState<number | undefined>();
  const [filterDates, setFilterDates] = useState<[Dayjs, Dayjs] | null>(null);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params: Record<string, unknown> = {};
      if (filterEmployee) params.employee_id = filterEmployee;
      if (filterDates) {
        params.date_from = filterDates[0].format('YYYY-MM-DD');
        params.date_to = filterDates[1].format('YYYY-MM-DD');
      }
      const res = await $api.get<{ data: AuditLog[] }>('/api/audit', { params });
      setLogs(res.data.data ?? []);
    } catch {
      message.error('Не удалось загрузить журнал аудита');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    $api.get<{ data: Employee[] }>('/api/employees').then((r) => setEmployees(r.data.data ?? [])).catch(() => {});
  }, []);

  useEffect(() => {
    fetchLogs();
  }, [filterEmployee, filterDates]);

  const columns: ColumnsType<AuditLog> = [
    { title: 'Сотрудник', dataIndex: 'employee_name', key: 'employee_name' },
    {
      title: 'Действие',
      dataIndex: 'action',
      key: 'action',
      render: (v: string) => {
        const colorKey = Object.keys(ACTION_COLOR).find((k) => v.toUpperCase().includes(k));
        return <Tag color={colorKey ? ACTION_COLOR[colorKey] : 'default'}>{v}</Tag>;
      },
    },
    { title: 'IP-адрес', dataIndex: 'ip', key: 'ip', width: 150 },
    {
      title: 'Дата и время',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (v: string) => dayjs(v).format('DD.MM.YYYY HH:mm:ss'),
      sorter: (a, b) => a.created_at.localeCompare(b.created_at),
      defaultSortOrder: 'descend',
    },
  ];

  return (
    <div>
      <Title level={3} style={{ marginBottom: 24 }}>
        Журнал аудита
      </Title>

      <Space wrap style={{ marginBottom: 16 }}>
        <Select
          placeholder="Сотрудник"
          allowClear
          style={{ width: 220 }}
          onChange={(v) => setFilterEmployee(v)}
          options={employees.map((e) => ({ value: e.employee_id, label: e.full_name }))}
        />
        <RangePicker
          onChange={(dates) =>
            setFilterDates(dates ? [dates[0] as Dayjs, dates[1] as Dayjs] : null)
          }
        />
      </Space>

      <Table<AuditLog>
        columns={columns}
        dataSource={logs}
        rowKey="audit_id"
        loading={loading}
        pagination={{ pageSize: 20, showTotal: (total) => `Всего: ${total}` }}
        size="middle"
      />
    </div>
  );
}

export default AuditPage;
