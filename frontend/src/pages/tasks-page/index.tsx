import { useEffect, useState } from 'react';

import {
  Button,
  DatePicker,
  Form,
  Input,
  Modal,
  Select,
  Space,
  Switch,
  Table,
  Tag,
  Typography,
  message,
} from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';

import { selectUser, selectUserRole } from '@entities/user';
import { $api } from '@shared/api/api';
import { UserRole } from '@shared/constants';
import { useAppSelector } from '@shared/store';

const { Title } = Typography;

interface Task {
  task_id: number;
  title: string;
  description: string;
  assignee_name: string;
  assignee_id: number;
  creator_name: string;
  due_date: string;
  status: string;
  created_at: string;
}

interface Employee {
  employee_id: number;
  full_name: string;
}

const STATUS_COLOR: Record<string, string> = {
  ASSIGNED: 'blue',
  IN_PROGRESS: 'orange',
  DONE: 'green',
  CANCELED: 'red',
};

const STATUS_LABEL: Record<string, string> = {
  ASSIGNED: 'Назначено',
  IN_PROGRESS: 'В работе',
  DONE: 'Выполнено',
  CANCELED: 'Отменено',
};

function TasksPage() {
  const role = useAppSelector(selectUserRole);
  const user = useAppSelector(selectUser);
  const canCreate = role === UserRole.ADMIN || role === UserRole.HEAD;
  const isEmp = role === UserRole.EMP;

  const [tasks, setTasks] = useState<Task[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string | undefined>();
  const [myOnly, setMyOnly] = useState(false);
  const [form] = Form.useForm();

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const params: Record<string, unknown> = {};
      if (filterStatus) params.status = filterStatus;
      if (myOnly && user) params.assignee_id = user.employee_id;
      const res = await $api.get<{ data: Task[] }>('/api/tasks', { params });
      setTasks(res.data.data ?? []);
    } catch {
      message.error('Не удалось загрузить задачи');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [filterStatus, myOnly]);

  useEffect(() => {
    if (canCreate) {
      $api.get<{ data: Employee[] }>('/api/employees').then((r) => setEmployees(r.data.data ?? [])).catch(() => {});
    }
  }, [canCreate]);

  const handleCreate = async () => {
    try {
      const values = await form.validateFields();
      setSaving(true);
      await $api.post('/api/tasks', {
        ...values,
        due_date: values.due_date?.toISOString(),
      });
      message.success('Задача создана');
      setModalOpen(false);
      form.resetFields();
      fetchTasks();
    } catch {
      message.error('Ошибка при создании задачи');
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = async (taskId: number, newStatus: string) => {
    try {
      await $api.patch(`/api/tasks/${taskId}`, { status: newStatus });
      message.success('Статус обновлён');
      fetchTasks();
    } catch {
      message.error('Ошибка при обновлении статуса');
    }
  };

  const columns: ColumnsType<Task> = [
    { title: 'Задача', dataIndex: 'title', key: 'title' },
    { title: 'Исполнитель', dataIndex: 'assignee_name', key: 'assignee_name' },
    { title: 'Постановщик', dataIndex: 'creator_name', key: 'creator_name' },
    {
      title: 'Срок',
      dataIndex: 'due_date',
      key: 'due_date',
      render: (v: string) => (v ? dayjs(v).format('DD.MM.YYYY') : '—'),
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
      title: 'Создана',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (v: string) => dayjs(v).format('DD.MM.YYYY HH:mm'),
    },
    ...(isEmp
      ? [
          {
            title: 'Действие',
            key: 'action',
            width: 180,
            render: (_: unknown, record: Task) => (
              <Space size="small">
                {record.status === 'ASSIGNED' && (
                  <Button
                    size="small"
                    type="primary"
                    onClick={() => handleStatusChange(record.task_id, 'IN_PROGRESS')}
                  >
                    Взять в работу
                  </Button>
                )}
                {record.status === 'IN_PROGRESS' && record.assignee_id === user?.employee_id && (
                  <Button
                    size="small"
                    type="primary"
                    onClick={() => handleStatusChange(record.task_id, 'DONE')}
                  >
                    Выполнить
                  </Button>
                )}
              </Space>
            ),
          },
        ]
      : []),
  ];

  return (
    <div>
      <Title level={3} style={{ marginBottom: 24 }}>
        Задачи
      </Title>

      <Space wrap style={{ marginBottom: 16 }}>
        <Select
          placeholder="Статус"
          allowClear
          style={{ width: 180 }}
          onChange={(v) => setFilterStatus(v)}
          options={Object.entries(STATUS_LABEL).map(([value, label]) => ({ value, label }))}
        />
        <Space>
          <Switch
            checked={myOnly}
            onChange={setMyOnly}
            size="small"
          />
          <span>Только мои задачи</span>
        </Space>
        {canCreate && (
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalOpen(true)}>
            Создать задачу
          </Button>
        )}
      </Space>

      <Table<Task>
        columns={columns}
        dataSource={tasks}
        rowKey="task_id"
        loading={loading}
        pagination={{ pageSize: 15 }}
        size="middle"
      />

      <Modal
        title="Создать задачу"
        open={modalOpen}
        onOk={handleCreate}
        onCancel={() => setModalOpen(false)}
        confirmLoading={saving}
        okText="Создать"
        cancelText="Отмена"
        destroyOnClose
        width={480}
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item name="assignee_id" label="Исполнитель" rules={[{ required: true }]}>
            <Select
              options={employees.map((e) => ({ value: e.employee_id, label: e.full_name }))}
              showSearch
              filterOption={(input, option) =>
                (option?.label as string ?? '').toLowerCase().includes(input.toLowerCase())
              }
            />
          </Form.Item>
          <Form.Item name="title" label="Название" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="description" label="Описание">
            <Input.TextArea rows={3} />
          </Form.Item>
          <Form.Item name="due_date" label="Срок выполнения">
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

export default TasksPage;
