import { useEffect, useState } from 'react';

import {
  Button,
  Form,
  InputNumber,
  Modal,
  Space,
  Switch,
  Table,
  Tag,
  Typography,
  message,
} from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';

import { $api } from '@shared/api/api';

const { Title } = Typography;

interface SLARecord {
  sla_id: number;
  operation_type_name: string;
  norm_seconds: number;
  threshold_seconds: number;
  is_active: boolean;
}

interface OperationType {
  operation_type_id: number;
  name: string;
}

function formatSeconds(secs: number): string {
  const mins = Math.floor(secs / 60);
  const s = secs % 60;
  return mins > 0 ? `${mins}м ${s}с` : `${s}с`;
}

function SLAPage() {
  const [records, setRecords] = useState<SLARecord[]>([]);
  const [opTypes, setOpTypes] = useState<OperationType[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<SLARecord | null>(null);
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm();

  const fetchRecords = async () => {
    setLoading(true);
    try {
      const res = await $api.get<{ data: SLARecord[] }>('/api/sla');
      setRecords(res.data.data ?? []);
    } catch {
      message.error('Не удалось загрузить SLA регламенты');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
    $api.get<{ data: OperationType[] }>('/api/operation-types').then((r) => setOpTypes(r.data.data ?? [])).catch(() => {});
  }, []);

  const openCreate = () => {
    setEditTarget(null);
    form.resetFields();
    form.setFieldsValue({ is_active: true });
    setModalOpen(true);
  };

  const openEdit = (rec: SLARecord) => {
    setEditTarget(rec);
    form.setFieldsValue(rec);
    setModalOpen(true);
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      setSaving(true);
      if (editTarget) {
        await $api.patch(`/api/sla/${editTarget.sla_id}`, values);
        message.success('Регламент обновлён');
      } else {
        await $api.post('/api/sla', values);
        message.success('Регламент создан');
      }
      setModalOpen(false);
      fetchRecords();
    } catch {
      message.error('Ошибка при сохранении');
    } finally {
      setSaving(false);
    }
  };

  const columns: ColumnsType<SLARecord> = [
    { title: 'Тип операции', dataIndex: 'operation_type_name', key: 'operation_type_name' },
    {
      title: 'Норма',
      dataIndex: 'norm_seconds',
      key: 'norm_seconds',
      render: (v: number) => formatSeconds(v),
    },
    {
      title: 'Порог нарушения',
      dataIndex: 'threshold_seconds',
      key: 'threshold_seconds',
      render: (v: number) => formatSeconds(v),
    },
    {
      title: 'Активен',
      dataIndex: 'is_active',
      key: 'is_active',
      render: (v: boolean) => (
        <Tag color={v ? 'green' : 'default'}>{v ? 'Да' : 'Нет'}</Tag>
      ),
    },
    {
      title: 'Действия',
      key: 'actions',
      width: 120,
      render: (_, record) => (
        <Button type="link" onClick={() => openEdit(record)}>
          Изменить
        </Button>
      ),
    },
  ];

  return (
    <div>
      <Title level={3} style={{ marginBottom: 24 }}>
        SLA / Регламенты
      </Title>

      <Space style={{ marginBottom: 16 }}>
        <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
          Добавить регламент
        </Button>
      </Space>

      <Table<SLARecord>
        columns={columns}
        dataSource={records}
        rowKey="sla_id"
        loading={loading}
        pagination={{ pageSize: 15 }}
        size="middle"
      />

      <Modal
        title={editTarget ? 'Редактировать регламент' : 'Новый регламент'}
        open={modalOpen}
        onOk={handleSave}
        onCancel={() => setModalOpen(false)}
        confirmLoading={saving}
        okText="Сохранить"
        cancelText="Отмена"
        destroyOnClose
        width={480}
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          {!editTarget && (
            <Form.Item
              name="operation_type_id"
              label="Тип операции"
              rules={[{ required: true, message: 'Выберите тип операции' }]}
            >
              <select
                style={{
                  width: '100%',
                  height: 32,
                  border: '1px solid #d9d9d9',
                  borderRadius: 6,
                  padding: '0 8px',
                }}
              >
                <option value="">— выберите —</option>
                {opTypes.map((t) => (
                  <option key={t.operation_type_id} value={t.operation_type_id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </Form.Item>
          )}
          <Form.Item
            name="norm_seconds"
            label="Норма (секунды)"
            rules={[{ required: true, message: 'Введите норму' }]}
          >
            <InputNumber min={1} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item
            name="threshold_seconds"
            label="Порог нарушения (секунды)"
            rules={[{ required: true, message: 'Введите порог' }]}
          >
            <InputNumber min={1} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="is_active" label="Активен" valuePropName="checked">
            <Switch />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

export default SLAPage;
