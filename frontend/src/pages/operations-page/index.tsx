import { useEffect, useState } from 'react';

import {
  Button,
  DatePicker,
  Form,
  Modal,
  Select,
  Space,
  Table,
  Tag,
  Typography,
  message,
} from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs, { Dayjs } from 'dayjs';

import { $api } from '@shared/api/api';

const { Title } = Typography;
const { RangePicker } = DatePicker;

interface Employee {
  employee_id: number;
  full_name: string;
}

interface OperationType {
  operation_type_id: number;
  name: string;
}

interface Operation {
  operation_id: number;
  employee_name: string;
  operation_type_name: string;
  start_time: string;
  end_time: string | null;
  status: string;
  sla_ok: boolean;
}

const STATUS_COLOR: Record<string, string> = {
  DONE: 'green',
  CANCELED: 'red',
  IN_PROGRESS: 'blue',
};

const STATUS_LABEL: Record<string, string> = {
  DONE: 'Выполнено',
  CANCELED: 'Отменено',
  IN_PROGRESS: 'В работе',
};

function calcDuration(start: string, end: string | null): string {
  if (!end) return '—';
  const diff = dayjs(end).diff(dayjs(start), 'second');
  const mins = Math.floor(diff / 60);
  const secs = diff % 60;
  return `${mins}м ${secs}с`;
}

function OperationsPage() {
  const [operations, setOperations] = useState<Operation[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [opTypes, setOpTypes] = useState<OperationType[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm();

  const [filterEmployee, setFilterEmployee] = useState<number | undefined>();
  const [filterType, setFilterType] = useState<number | undefined>();
  const [filterStatus, setFilterStatus] = useState<string | undefined>();
  const [filterDates, setFilterDates] = useState<[Dayjs, Dayjs] | null>(null);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const params: Record<string, unknown> = {};
      if (filterEmployee) params.employee_id = filterEmployee;
      if (filterType) params.operation_type_id = filterType;
      if (filterStatus) params.status = filterStatus;
      if (filterDates) {
        params.date_from = filterDates[0].format('YYYY-MM-DD');
        params.date_to = filterDates[1].format('YYYY-MM-DD');
      }
      const res = await $api.get<{ data: Operation[] }>('/api/operations', { params });
      setOperations(res.data.data ?? []);
    } catch {
      message.error('Не удалось загрузить операции');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    $api.get<{ data: Employee[] }>('/api/employees').then((r) => setEmployees(r.data.data ?? [])).catch(() => {});
    $api.get<{ data: OperationType[] }>('/api/operation-types').then((r) => setOpTypes(r.data.data ?? [])).catch(() => {});
  }, []);

  useEffect(() => {
    fetchAll();
  }, [filterEmployee, filterType, filterStatus, filterDates]);

  const handleCreate = async () => {
    try {
      const values = await form.validateFields();
      setSaving(true);
      await $api.post('/api/operations', {
        ...values,
        start_time: values.start_time?.toISOString(),
        end_time: values.end_time?.toISOString(),
      });
      message.success('Операция добавлена');
      setModalOpen(false);
      form.resetFields();
      fetchAll();
    } catch {
      message.error('Ошибка при добавлении');
    } finally {
      setSaving(false);
    }
  };

  const columns: ColumnsType<Operation> = [
    { title: 'Сотрудник', dataIndex: 'employee_name', key: 'employee_name' },
    { title: 'Тип операции', dataIndex: 'operation_type_name', key: 'operation_type_name' },
    {
      title: 'Начало',
      dataIndex: 'start_time',
      key: 'start_time',
      render: (v: string) => dayjs(v).format('DD.MM.YYYY HH:mm'),
    },
    {
      title: 'Конец',
      dataIndex: 'end_time',
      key: 'end_time',
      render: (v: string | null) => (v ? dayjs(v).format('DD.MM.YYYY HH:mm') : '—'),
    },
    {
      title: 'Длительность',
      key: 'duration',
      render: (_, r) => calcDuration(r.start_time, r.end_time),
    },
    {
      title: 'Статус',
      dataIndex: 'status',
      key: 'status',
      render: (v: string) => (
        <Tag color={STATUS_COLOR[v] ?? 'default'}>{STATUS_LABEL[v] ?? v}</Tag>
      ),
    },
    {
      title: 'SLA',
      dataIndex: 'sla_ok',
      key: 'sla_ok',
      render: (v: boolean) =>
        v == null ? '—' : <Tag color={v ? 'green' : 'red'}>{v ? 'OK' : 'Нарушение'}</Tag>,
    },
  ];

  return (
    <div>
      <Title level={3} style={{ marginBottom: 24 }}>
        Операции
      </Title>

      <Space wrap style={{ marginBottom: 16 }}>
        <Select
          placeholder="Сотрудник"
          allowClear
          style={{ width: 200 }}
          onChange={(v) => setFilterEmployee(v)}
          options={employees.map((e) => ({ value: e.employee_id, label: e.full_name }))}
        />
        <Select
          placeholder="Тип операции"
          allowClear
          style={{ width: 220 }}
          onChange={(v) => setFilterType(v)}
          options={opTypes.map((t) => ({ value: t.operation_type_id, label: t.name }))}
        />
        <RangePicker
          onChange={(dates) =>
            setFilterDates(dates ? [dates[0] as Dayjs, dates[1] as Dayjs] : null)
          }
        />
        <Select
          placeholder="Статус"
          allowClear
          style={{ width: 160 }}
          onChange={(v) => setFilterStatus(v)}
          options={[
            { value: 'DONE', label: 'Выполнено' },
            { value: 'IN_PROGRESS', label: 'В работе' },
            { value: 'CANCELED', label: 'Отменено' },
          ]}
        />
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalOpen(true)}>
          Добавить операцию
        </Button>
      </Space>

      <Table<Operation>
        columns={columns}
        dataSource={operations}
        rowKey="operation_id"
        loading={loading}
        pagination={{ pageSize: 15 }}
        size="middle"
      />

      <Modal
        title="Новая операция"
        open={modalOpen}
        onOk={handleCreate}
        onCancel={() => setModalOpen(false)}
        confirmLoading={saving}
        okText="Сохранить"
        cancelText="Отмена"
        destroyOnClose
        width={480}
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item name="employee_id" label="Сотрудник" rules={[{ required: true }]}>
            <Select options={employees.map((e) => ({ value: e.employee_id, label: e.full_name }))} />
          </Form.Item>
          <Form.Item name="operation_type_id" label="Тип операции" rules={[{ required: true }]}>
            <Select options={opTypes.map((t) => ({ value: t.operation_type_id, label: t.name }))} />
          </Form.Item>
          <Form.Item name="start_time" label="Начало" rules={[{ required: true }]}>
            <DatePicker showTime style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="end_time" label="Конец">
            <DatePicker showTime style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="status" label="Статус" rules={[{ required: true }]}>
            <Select>
              <Select.Option value="DONE">Выполнено</Select.Option>
              <Select.Option value="IN_PROGRESS">В работе</Select.Option>
              <Select.Option value="CANCELED">Отменено</Select.Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

export default OperationsPage;
