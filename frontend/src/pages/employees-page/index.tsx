import { useEffect, useState } from 'react';

import {
  Button,
  Form,
  Input,
  InputNumber,
  Modal,
  Select,
  Space,
  Table,
  Tag,
  Typography,
  message,
} from 'antd';
import { PlusOutlined, SearchOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';

import { selectUserRole } from '@entities/user';
import { $api } from '@shared/api/api';
import { UserRole } from '@shared/constants';
import { useAppSelector } from '@shared/store';

const { Title } = Typography;

interface Employee {
  employee_id: number;
  full_name: string;
  email: string;
  position: string;
  department_id: number;
  role: UserRole;
  phone: string;
  experience_years: number;
  salary: number;
}

const ROLE_COLOR: Record<UserRole, string> = {
  [UserRole.ADMIN]: 'red',
  [UserRole.HEAD]: 'blue',
  [UserRole.EMP]: 'green',
};

const ROLE_LABEL: Record<UserRole, string> = {
  [UserRole.ADMIN]: 'Администратор',
  [UserRole.HEAD]: 'Руководитель',
  [UserRole.EMP]: 'Сотрудник',
};

function EmployeesPage() {
  const role = useAppSelector(selectUserRole);
  const isAdmin = role === UserRole.ADMIN;

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Employee | null>(null);
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm();

  const fetchEmployees = async () => {
    setLoading(true);
    try {
      const res = await $api.get<{ data: Employee[] }>('/api/employees');
      setEmployees(res.data.data ?? []);
    } catch {
      message.error('Не удалось загрузить сотрудников');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  const openCreate = () => {
    setEditTarget(null);
    form.resetFields();
    setModalOpen(true);
  };

  const openEdit = (emp: Employee) => {
    setEditTarget(emp);
    form.setFieldsValue({ ...emp, password: undefined });
    setModalOpen(true);
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      setSaving(true);
      if (editTarget) {
        await $api.patch(`/api/employees/${editTarget.employee_id}`, values);
        message.success('Сотрудник обновлён');
      } else {
        await $api.post('/api/employees', values);
        message.success('Сотрудник создан');
      }
      setModalOpen(false);
      fetchEmployees();
    } catch {
      message.error('Ошибка при сохранении');
    } finally {
      setSaving(false);
    }
  };

  const filtered = employees.filter((e) =>
    e.full_name.toLowerCase().includes(search.toLowerCase()),
  );

  const columns: ColumnsType<Employee> = [
    {
      title: 'ФИО',
      dataIndex: 'full_name',
      key: 'full_name',
      sorter: (a, b) => a.full_name.localeCompare(b.full_name),
    },
    {
      title: 'Должность',
      dataIndex: 'position',
      key: 'position',
    },
    {
      title: 'Отдел ID',
      dataIndex: 'department_id',
      key: 'department_id',
      width: 90,
    },
    {
      title: 'Роль',
      dataIndex: 'role',
      key: 'role',
      width: 150,
      render: (r: UserRole) => (
        <Tag color={ROLE_COLOR[r]}>{ROLE_LABEL[r] ?? r}</Tag>
      ),
    },
    {
      title: 'Телефон',
      dataIndex: 'phone',
      key: 'phone',
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: 'Стаж (лет)',
      dataIndex: 'experience_years',
      key: 'experience_years',
      width: 100,
    },
    {
      title: 'Оклад',
      dataIndex: 'salary',
      key: 'salary',
      width: 120,
      render: (v: number) =>
        v != null
          ? new Intl.NumberFormat('ru-RU', {
              style: 'currency',
              currency: 'RUB',
              maximumFractionDigits: 0,
            }).format(v)
          : '—',
    },
    ...(isAdmin
      ? [
          {
            title: 'Действия',
            key: 'actions',
            width: 120,
            render: (_: unknown, record: Employee) => (
              <Button type="link" onClick={() => openEdit(record)}>
                Изменить
              </Button>
            ),
          },
        ]
      : []),
  ];

  return (
    <div>
      <Title level={3} style={{ marginBottom: 24 }}>
        Сотрудники
      </Title>

      <Space style={{ marginBottom: 16, width: '100%', justifyContent: 'space-between' }}>
        <Input
          placeholder="Поиск по имени..."
          prefix={<SearchOutlined />}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ width: 300 }}
          allowClear
        />
        {isAdmin && (
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
            Добавить сотрудника
          </Button>
        )}
      </Space>

      <Table<Employee>
        columns={columns}
        dataSource={filtered}
        rowKey="employee_id"
        loading={loading}
        pagination={{ pageSize: 15, showSizeChanger: false }}
        size="middle"
      />

      <Modal
        title={editTarget ? 'Редактировать сотрудника' : 'Новый сотрудник'}
        open={modalOpen}
        onOk={handleSave}
        onCancel={() => setModalOpen(false)}
        confirmLoading={saving}
        okText="Сохранить"
        cancelText="Отмена"
        destroyOnClose
        width={520}
        styles={{ body: { maxHeight: '70vh', overflowY: 'auto', paddingRight: 8 } }}
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item name="full_name" label="ФИО" rules={[{ required: true, message: 'Введите ФИО' }]}>
            <Input />
          </Form.Item>
          <Form.Item
            name="email"
            label="Email"
            rules={[
              { required: true, message: 'Введите email' },
              { type: 'email', message: 'Некорректный email' },
            ]}
          >
            <Input />
          </Form.Item>
          {!editTarget && (
            <Form.Item
              name="password"
              label="Пароль"
              rules={[{ required: true, message: 'Введите пароль' }]}
            >
              <Input.Password />
            </Form.Item>
          )}
          <Form.Item name="position" label="Должность" rules={[{ required: true, message: 'Введите должность' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="phone" label="Телефон">
            <Input />
          </Form.Item>
          <Form.Item name="salary" label="Оклад">
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="experience_years" label="Стаж (лет)">
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="role" label="Роль" rules={[{ required: true, message: 'Выберите роль' }]}>
            <Select>
              <Select.Option value={UserRole.ADMIN}>Администратор</Select.Option>
              <Select.Option value={UserRole.HEAD}>Руководитель</Select.Option>
              <Select.Option value={UserRole.EMP}>Сотрудник</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="department_id" label="ID отдела">
            <InputNumber min={1} style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

export default EmployeesPage;
