import { useEffect, useState } from 'react';

import {
  Button,
  DatePicker,
  Form,
  Input,
  Modal,
  Select,
  Space,
  Table,
  Tabs,
  Tag,
  Typography,
  message,
} from 'antd';
import { PlusOutlined, SyncOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';

import { $api } from '@shared/api/api';

const { Title } = Typography;

interface KPITemplate {
  kpi_id: number;
  name: string;
  formula: string;
  unit: string;
}

interface KPIResult {
  result_id: number;
  employee_name: string;
  kpi_name: string;
  period_date: string;
  value: number;
}

interface Employee {
  employee_id: number;
  full_name: string;
}

function KPIPage() {
  const [templates, setTemplates] = useState<KPITemplate[]>([]);
  const [results, setResults] = useState<KPIResult[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(false);
  const [recalcLoading, setRecalcLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('templates');
  const [filterEmployee, setFilterEmployee] = useState<number | undefined>();
  const [filterDate, setFilterDate] = useState<string | undefined>();
  const [form] = Form.useForm();

  const fetchTemplates = async () => {
    try {
      const res = await $api.get<{ data: KPITemplate[] }>('/api/kpi/templates');
      setTemplates(res.data.data ?? []);
    } catch {
      message.error('Не удалось загрузить шаблоны KPI');
    }
  };

  const fetchResults = async () => {
    setLoading(true);
    try {
      const params: Record<string, unknown> = {};
      if (filterEmployee) params.employee_id = filterEmployee;
      if (filterDate) params.period_date = filterDate;
      const res = await $api.get<{ data: KPIResult[] }>('/api/kpi/results', { params });
      setResults(res.data.data ?? []);
    } catch {
      message.error('Не удалось загрузить результаты KPI');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
    $api.get<{ data: Employee[] }>('/api/employees').then((r) => setEmployees(r.data.data ?? [])).catch(() => {});
  }, []);

  useEffect(() => {
    if (activeTab === 'results') {
      fetchResults();
    }
  }, [activeTab, filterEmployee, filterDate]);

  const handleRecalculate = async () => {
    setRecalcLoading(true);
    try {
      const today = dayjs().format('YYYY-MM-DD');
      await $api.post(`/api/kpi/recalculate?date=${today}`);
      message.success('KPI пересчитаны');
      fetchResults();
    } catch {
      message.error('Ошибка при пересчёте KPI');
    } finally {
      setRecalcLoading(false);
    }
  };

  const handleSaveTemplate = async () => {
    try {
      const values = await form.validateFields();
      setSaving(true);
      await $api.post('/api/kpi/templates', values);
      message.success('Шаблон создан');
      setModalOpen(false);
      form.resetFields();
      fetchTemplates();
    } catch {
      message.error('Ошибка при создании шаблона');
    } finally {
      setSaving(false);
    }
  };

  const templateColumns: ColumnsType<KPITemplate> = [
    { title: 'Название', dataIndex: 'name', key: 'name' },
    { title: 'Формула', dataIndex: 'formula', key: 'formula', render: (v) => <code>{v}</code> },
    {
      title: 'Единица',
      dataIndex: 'unit',
      key: 'unit',
      render: (v) => <Tag>{v}</Tag>,
    },
  ];

  const resultColumns: ColumnsType<KPIResult> = [
    { title: 'Сотрудник', dataIndex: 'employee_name', key: 'employee_name' },
    { title: 'KPI', dataIndex: 'kpi_name', key: 'kpi_name' },
    {
      title: 'Период',
      dataIndex: 'period_date',
      key: 'period_date',
      render: (v: string) => dayjs(v).format('DD.MM.YYYY'),
    },
    {
      title: 'Значение',
      dataIndex: 'value',
      key: 'value',
      render: (v: number) => (v != null ? v.toFixed(2) : '—'),
    },
  ];

  return (
    <div>
      <Title level={3} style={{ marginBottom: 24 }}>
        KPI
      </Title>

      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={[
          {
            key: 'templates',
            label: 'Шаблоны',
            children: (
              <>
                <Space style={{ marginBottom: 16 }}>
                  <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={() => setModalOpen(true)}
                  >
                    Добавить шаблон
                  </Button>
                </Space>
                <Table<KPITemplate>
                  columns={templateColumns}
                  dataSource={templates}
                  rowKey="kpi_id"
                  pagination={{ pageSize: 15 }}
                  size="middle"
                />
              </>
            ),
          },
          {
            key: 'results',
            label: 'Результаты',
            children: (
              <>
                <Space wrap style={{ marginBottom: 16 }}>
                  <Select
                    placeholder="Сотрудник"
                    allowClear
                    style={{ width: 220 }}
                    onChange={(v) => setFilterEmployee(v)}
                    options={employees.map((e) => ({ value: e.employee_id, label: e.full_name }))}
                  />
                  <DatePicker
                    placeholder="Дата периода"
                    onChange={(d) => setFilterDate(d ? d.format('YYYY-MM-DD') : undefined)}
                  />
                  <Button
                    icon={<SyncOutlined />}
                    loading={recalcLoading}
                    onClick={handleRecalculate}
                  >
                    Пересчитать KPI
                  </Button>
                </Space>
                <Table<KPIResult>
                  columns={resultColumns}
                  dataSource={results}
                  rowKey="result_id"
                  loading={loading}
                  pagination={{ pageSize: 15 }}
                  size="middle"
                />
              </>
            ),
          },
        ]}
      />

      <Modal
        title="Новый шаблон KPI"
        open={modalOpen}
        onOk={handleSaveTemplate}
        onCancel={() => setModalOpen(false)}
        confirmLoading={saving}
        okText="Сохранить"
        cancelText="Отмена"
        destroyOnClose
        width={480}
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item name="name" label="Название" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="formula" label="Формула" rules={[{ required: true }]}>
            <Input placeholder="avg_duration / 60" />
          </Form.Item>
          <Form.Item name="unit" label="Единица" rules={[{ required: true }]}>
            <Input placeholder="мин, %, шт" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

export default KPIPage;
