import { useEffect, useState } from 'react';

import {
  Badge,
  Button,
  Calendar,
  Card,
  Col,
  Form,
  Modal,
  Row,
  Select,
  Space,
  Tag,
  TimePicker,
  Tooltip,
  Typography,
  message,
} from 'antd';
import { DeleteOutlined, TeamOutlined } from '@ant-design/icons';
import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';

import { selectUser, selectUserRole } from '@entities/user';
import { $api } from '@shared/api/api';
import { UserRole } from '@shared/constants';
import { useAppSelector } from '@shared/store';

const { Title, Text } = Typography;

type ShiftType = 'WORK' | 'VACATION' | 'SICK' | 'DAYOFF' | 'REMOTE';

const SHIFT_META: Record<ShiftType, { label: string; color: string; badge: 'success' | 'warning' | 'error' | 'default' | 'processing' }> = {
  WORK:     { label: 'Рабочий день', color: '#52c41a', badge: 'success' },
  REMOTE:   { label: 'Удалённо',     color: '#1677ff', badge: 'processing' },
  VACATION: { label: 'Отпуск',       color: '#faad14', badge: 'warning' },
  SICK:     { label: 'Больничный',   color: '#ff4d4f', badge: 'error' },
  DAYOFF:   { label: 'Выходной',     color: '#8c8c8c', badge: 'default' },
};

interface ScheduleEntry {
  schedule_id: number;
  employee_id: number;
  employee_name?: string;
  work_date: string;
  start_time?: string;
  end_time?: string;
  shift_type: ShiftType;
}

interface Employee {
  employee_id: number;
  full_name: string;
}

type ScheduleMap = Record<string, ScheduleEntry>;

function buildKey(date: string, empId: number) {
  return `${date}-${empId}`;
}

function SchedulePage() {
  const role = useAppSelector(selectUserRole);
  const user = useAppSelector(selectUser);
  const canManage = role === UserRole.ADMIN || role === UserRole.HEAD;

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [scheduleMap, setScheduleMap] = useState<ScheduleMap>({});
  const [loading, setLoading] = useState(false);
  const [currentMonth, setCurrentMonth] = useState<Dayjs>(dayjs());
  const [filterEmpId, setFilterEmpId] = useState<number | null>(
    canManage ? null : (user?.employee_id ?? null),
  );

  const [modalOpen, setModalOpen] = useState(false);
  const [modalDate, setModalDate] = useState<Dayjs | null>(null);
  const [modalEmpId, setModalEmpId] = useState<number | null>(null);
  const [editEntry, setEditEntry] = useState<ScheduleEntry | null>(null);
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm();

  const fetchMonth = async (month: Dayjs) => {
    setLoading(true);
    try {
      const from = month.startOf('month').format('YYYY-MM-DD');
      const to = month.endOf('month').format('YYYY-MM-DD');
      const params: Record<string, unknown> = { from, to };
      if (!canManage && user) params.employee_id = user.employee_id;
      else if (filterEmpId) params.employee_id = filterEmpId;

      const res = await $api.get<{ data: ScheduleEntry[] }>('/api/schedule', { params });
      const map: ScheduleMap = {};
      for (const e of res.data.data ?? []) {
        map[buildKey(e.work_date, e.employee_id)] = e;
      }
      setScheduleMap(map);
    } catch {
      message.error('Не удалось загрузить график');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (canManage) {
      $api
        .get<{ data: Employee[] }>('/api/employees')
        .then((r) => setEmployees(r.data.data ?? []))
        .catch(() => {});
    }
  }, []);

  useEffect(() => {
    fetchMonth(currentMonth);
  }, [currentMonth, filterEmpId]);

  const openModal = (date: Dayjs, empId: number) => {
    const key = buildKey(date.format('YYYY-MM-DD'), empId);
    const existing = scheduleMap[key] ?? null;
    setModalDate(date);
    setModalEmpId(empId);
    setEditEntry(existing);
    form.resetFields();
    if (existing) {
      form.setFieldsValue({
        shift_type: existing.shift_type,
        start_time: existing.start_time ? dayjs(existing.start_time, 'HH:mm:ss') : null,
        end_time: existing.end_time ? dayjs(existing.end_time, 'HH:mm:ss') : null,
      });
    } else {
      form.setFieldsValue({
        shift_type: 'WORK',
        start_time: dayjs('09:00', 'HH:mm'),
        end_time: dayjs('18:00', 'HH:mm'),
      });
    }
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!modalDate || !modalEmpId) return;
    try {
      const values = await form.validateFields();
      setSaving(true);
      const shiftType: ShiftType = values.shift_type;
      const needsTime = shiftType === 'WORK' || shiftType === 'REMOTE';
      const body = {
        employee_id: modalEmpId,
        work_date: modalDate.format('YYYY-MM-DD'),
        shift_type: shiftType,
        start_time: needsTime && values.start_time ? (values.start_time as Dayjs).format('HH:mm') : null,
        end_time: needsTime && values.end_time ? (values.end_time as Dayjs).format('HH:mm') : null,
      };
      if (editEntry) {
        await $api.patch(`/api/schedule/${editEntry.schedule_id}`, {
          shift_type: body.shift_type,
          start_time: body.start_time,
          end_time: body.end_time,
        });
      } else {
        await $api.post('/api/schedule', body);
      }
      message.success('График сохранён');
      setModalOpen(false);
      fetchMonth(currentMonth);
    } catch {
      message.error('Ошибка при сохранении');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!editEntry) return;
    setSaving(true);
    try {
      await $api.delete(`/api/schedule/${editEntry.schedule_id}`);
      message.success('Запись удалена');
      setModalOpen(false);
      fetchMonth(currentMonth);
    } catch {
      message.error('Ошибка при удалении');
    } finally {
      setSaving(false);
    }
  };

  const cellRender = (date: Dayjs) => {
    const dateStr = date.format('YYYY-MM-DD');
    const empIds = filterEmpId
      ? [filterEmpId]
      : canManage
        ? employees.map((e) => e.employee_id)
        : user
          ? [user.employee_id]
          : [];

    const entries = empIds
      .map((id) => scheduleMap[buildKey(dateStr, id)])
      .filter(Boolean) as ScheduleEntry[];

    if (entries.length === 0) return null;

    // Одиночный сотрудник — показываем цветную плашку с временем
    if (filterEmpId || !canManage) {
      const e = entries[0];
      const meta = SHIFT_META[e.shift_type] ?? SHIFT_META.WORK;
      const timeLabel = e.start_time
        ? `${e.start_time.slice(0, 5)}–${e.end_time?.slice(0, 5) ?? ''}`
        : '';
      return (
        <div
          style={{
            background: meta.color,
            borderRadius: 4,
            padding: '1px 4px',
            lineHeight: '16px',
            marginTop: 2,
          }}
        >
          <Text style={{ fontSize: 10, color: '#fff', fontWeight: 600, display: 'block' }}>
            {meta.label}
          </Text>
          {timeLabel && (
            <Text style={{ fontSize: 10, color: 'rgba(255,255,255,0.85)', display: 'block' }}>
              {timeLabel}
            </Text>
          )}
        </div>
      );
    }

    // Все сотрудники — только цветные точки с tooltip
    return (
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3, marginTop: 2 }}>
        {entries.slice(0, 6).map((e) => {
          const meta = SHIFT_META[e.shift_type] ?? SHIFT_META.WORK;
          const empName =
            e.employee_name ??
            employees.find((em) => em.employee_id === e.employee_id)?.full_name ??
            '';
          const firstName = empName.split(' ')[1]?.[0] ?? empName[0] ?? '?';
          const timeLabel = e.start_time
            ? `${e.start_time.slice(0, 5)}–${e.end_time?.slice(0, 5) ?? ''}`
            : '';
          return (
            <Tooltip
              key={e.schedule_id}
              title={`${empName}: ${meta.label}${timeLabel ? ' ' + timeLabel : ''}`}
            >
              <div
                style={{
                  width: 18,
                  height: 18,
                  borderRadius: '50%',
                  background: meta.color,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 9,
                  color: '#fff',
                  fontWeight: 700,
                  cursor: 'default',
                  flexShrink: 0,
                }}
              >
                {firstName}
              </div>
            </Tooltip>
          );
        })}
        {entries.length > 6 && (
          <div
            style={{
              width: 18,
              height: 18,
              borderRadius: '50%',
              background: '#d9d9d9',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 9,
              color: '#595959',
              fontWeight: 700,
            }}
          >
            +{entries.length - 6}
          </div>
        )}
      </div>
    );
  };

  const shiftType = Form.useWatch('shift_type', form) as ShiftType | undefined;
  const needsTime = shiftType === 'WORK' || shiftType === 'REMOTE';
  const modalEmpName =
    employees.find((e) => e.employee_id === modalEmpId)?.full_name ??
    user?.full_name ??
    '';

  return (
    <div>
      <Title level={3} style={{ marginBottom: 16 }}>
        График работы
      </Title>

      <Card size="small" style={{ marginBottom: 16 }}>
        <Row gutter={[16, 8]} align="middle">
          <Col>
            <Space wrap>
              {(Object.entries(SHIFT_META) as [ShiftType, (typeof SHIFT_META)[ShiftType]][]).map(
                ([key, meta]) => (
                  <Tag key={key} color={meta.color}>
                    {meta.label}
                  </Tag>
                ),
              )}
            </Space>
          </Col>
          {canManage && (
            <Col>
              <Select
                style={{ width: 220 }}
                placeholder="Все сотрудники"
                allowClear
                value={filterEmpId ?? undefined}
                onChange={(v) => setFilterEmpId(v ?? null)}
                suffixIcon={<TeamOutlined />}
              >
                {employees.map((e) => (
                  <Select.Option key={e.employee_id} value={e.employee_id}>
                    {e.full_name}
                  </Select.Option>
                ))}
              </Select>
            </Col>
          )}
        </Row>
      </Card>

      {canManage && (
        <Text type="secondary" style={{ display: 'block', marginBottom: 8 }}>
          Нажмите на дату, чтобы добавить или изменить смену.
        </Text>
      )}

      <Card loading={loading}>
        <Calendar
          onPanelChange={(date) => setCurrentMonth(date)}
          onSelect={(date, info) => {
            if (info?.source !== 'date') return;
            const empId = filterEmpId ?? user?.employee_id;
            if (!empId) return;
            openModal(date, empId);
          }}
          cellRender={cellRender}
        />
      </Card>

      <Modal
        title={
          <span>
            {editEntry ? 'Изменить смену' : 'Добавить смену'} —{' '}
            <Text type="secondary">{modalDate?.format('DD.MM.YYYY')}</Text>
          </span>
        }
        open={modalOpen}
        onOk={handleSave}
        onCancel={() => setModalOpen(false)}
        confirmLoading={saving}
        okText="Сохранить"
        cancelText="Отмена"
        destroyOnClose
        footer={(_, { OkBtn, CancelBtn }) => (
          <Space style={{ width: '100%', justifyContent: 'space-between' }}>
            {editEntry ? (
              <Button danger icon={<DeleteOutlined />} onClick={handleDelete} loading={saving}>
                Удалить
              </Button>
            ) : (
              <span />
            )}
            <Space>
              <CancelBtn />
              <OkBtn />
            </Space>
          </Space>
        )}
      >
        <Text type="secondary" style={{ display: 'block', marginBottom: 12 }}>
          Сотрудник: <strong>{modalEmpName}</strong>
        </Text>

        <Form form={form} layout="vertical">
          <Form.Item name="shift_type" label="Тип смены" rules={[{ required: true }]}>
            <Select>
              {(Object.entries(SHIFT_META) as [ShiftType, (typeof SHIFT_META)[ShiftType]][]).map(
                ([key, meta]) => (
                  <Select.Option key={key} value={key}>
                    <Badge color={meta.color} text={meta.label} />
                  </Select.Option>
                ),
              )}
            </Select>
          </Form.Item>

          {needsTime && (
            <Row gutter={12}>
              <Col span={12}>
                <Form.Item name="start_time" label="Начало">
                  <TimePicker format="HH:mm" style={{ width: '100%' }} minuteStep={15} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="end_time" label="Конец">
                  <TimePicker format="HH:mm" style={{ width: '100%' }} minuteStep={15} />
                </Form.Item>
              </Col>
            </Row>
          )}
        </Form>

        <div style={{ marginTop: 4 }}>
          <Text type="secondary" style={{ fontSize: 12 }}>
            Быстрые шаблоны:
          </Text>
          <Space wrap style={{ marginTop: 6 }}>
            <Button
              size="small"
              onClick={() =>
                form.setFieldsValue({
                  shift_type: 'WORK',
                  start_time: dayjs('09:00', 'HH:mm'),
                  end_time: dayjs('18:00', 'HH:mm'),
                })
              }
            >
              Стандарт 9–18
            </Button>
            <Button
              size="small"
              onClick={() =>
                form.setFieldsValue({
                  shift_type: 'WORK',
                  start_time: dayjs('08:00', 'HH:mm'),
                  end_time: dayjs('17:00', 'HH:mm'),
                })
              }
            >
              Ранний 8–17
            </Button>
            <Button
              size="small"
              onClick={() =>
                form.setFieldsValue({
                  shift_type: 'REMOTE',
                  start_time: dayjs('09:00', 'HH:mm'),
                  end_time: dayjs('18:00', 'HH:mm'),
                })
              }
            >
              Удалённо
            </Button>
            <Button
              size="small"
              danger
              onClick={() =>
                form.setFieldsValue({ shift_type: 'VACATION', start_time: null, end_time: null })
              }
            >
              Отпуск
            </Button>
            <Button
              size="small"
              onClick={() =>
                form.setFieldsValue({ shift_type: 'SICK', start_time: null, end_time: null })
              }
            >
              Больничный
            </Button>
            <Button
              size="small"
              onClick={() =>
                form.setFieldsValue({ shift_type: 'DAYOFF', start_time: null, end_time: null })
              }
            >
              Выходной
            </Button>
          </Space>
        </div>
      </Modal>
    </div>
  );
}

export default SchedulePage;
