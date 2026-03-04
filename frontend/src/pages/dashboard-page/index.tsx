import { useEffect, useState } from 'react';

import {
  Card,
  Col,
  Progress,
  Row,
  Statistic,
  Table,
  Tag,
  Tooltip,
  Typography,
  message,
} from 'antd';
import {
  AuditOutlined,
  CheckSquareOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
  TeamOutlined,
  UnorderedListOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  ResponsiveContainer,
  Tooltip as ChartTooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { selectUser, selectUserRole } from '@entities/user';
import { $api } from '@shared/api/api';
import { UserRole } from '@shared/constants';
import { useAppSelector } from '@shared/store';

const { Title, Text } = Typography;

// ---- Типы ----
interface KPIResult {
  kpi_result_id: number;
  employee_id: number;
  kpi_template_id: number;
  period_date: string;
  value: number;
  employee_name?: string;
  kpi_name?: string;
  unit?: string;
}

interface AuditLog {
  audit_id: number;
  employee_id?: number;
  employee_name?: string;
  action: string;
  ip: string;
  created_at: string;
}

interface ListResponse<T> {
  data: T[];
  total: number;
}

interface DashboardHeadResponse {
  total_employees: number;
  operations_today: number;
  sla_violations_today: number;
  avg_duration_today: number;
  kpi_results: KPIResult[];
}

interface DashboardEmployeeResponse {
  operations_today: number;
  tasks_pending: number;
  avg_duration: number;
  kpi_results: KPIResult[];
  today_schedule?: {
    schedule_id: number;
    work_date: string;
    shift_type?: string;
    start_time?: string;
    end_time?: string;
  };
}

interface DailyTrendPoint {
  date: string;
  operations_count: number;
  sla_violations: number;
  avg_duration_seconds: number;
}

interface OpTypeCount {
  name: string;
  count: number;
}

// ---- Heatmap нарушений SLA ----
function SLAHeatmap({ data }: { data: DailyTrendPoint[] }) {
  if (!data.length) return <Text type="secondary">Нет данных</Text>;
  const max = Math.max(...data.map((d) => d.sla_violations), 1);

  function getColor(val: number) {
    if (val === 0) return '#f6ffed';
    const intensity = val / max;
    if (intensity < 0.33) return '#ffccc7';
    if (intensity < 0.66) return '#ff7875';
    return '#ff4d4f';
  }

  return (
    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 8 }}>
      {data.map((d) => (
        <Tooltip key={d.date} title={`${dayjs(d.date).format('DD.MM')}: ${d.sla_violations} нарушений`}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 4,
              background: getColor(d.sla_violations),
              border: '1px solid #f0f0f0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 10,
              color: d.sla_violations > 0 ? '#fff' : '#52c41a',
              cursor: 'default',
              fontWeight: 600,
            }}
          >
            {d.sla_violations || '✓'}
          </div>
        </Tooltip>
      ))}
    </div>
  );
}

const PIE_COLORS = ['#0232c2', '#52c41a', '#faad14', '#ff4d4f', '#13c2c2', '#722ed1', '#eb2f96', '#fa8c16'];

// ===== ADMIN DASHBOARD =====
function AdminDashboard() {
  const [head, setHead] = useState<DashboardHeadResponse | null>(null);
  const [trend, setTrend] = useState<DailyTrendPoint[]>([]);
  const [opTypes, setOpTypes] = useState<OpTypeCount[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      $api.get<DashboardHeadResponse>('/api/dashboard/head'),
      $api.get<DailyTrendPoint[]>('/api/dashboard/trend?days=14'),
      $api.get<OpTypeCount[]>('/api/dashboard/op-types'),
      $api.get<ListResponse<AuditLog>>('/api/audit'),
    ])
      .then(([headRes, trendRes, opRes, auditRes]) => {
        setHead(headRes.data);
        setTrend(Array.isArray(trendRes.data) ? trendRes.data : []);
        setOpTypes(Array.isArray(opRes.data) ? opRes.data.filter((x) => x.count > 0) : []);
        setAuditLogs((auditRes.data?.data ?? []).slice(0, 6));
      })
      .catch(() => message.error('Ошибка загрузки дашборда'))
      .finally(() => setLoading(false));
  }, []);

  const auditColumns: ColumnsType<AuditLog> = [
    { title: 'Сотрудник', dataIndex: 'employee_name', key: 'employee_name', render: (v) => v ?? '—' },
    { title: 'Действие', dataIndex: 'action', key: 'action', render: (v) => <Tag>{v}</Tag> },
    { title: 'IP', dataIndex: 'ip', key: 'ip' },
    {
      title: 'Время',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (v: string) => dayjs(v).format('DD.MM HH:mm'),
    },
  ];

  const chartData = trend.map((d) => ({
    ...d,
    date: dayjs(d.date).format('DD.MM'),
    avg_min: Math.round(d.avg_duration_seconds / 60),
  }));

  const slaRate = head
    ? head.operations_today > 0
      ? Math.round((1 - head.sla_violations_today / head.operations_today) * 100)
      : 100
    : null;

  return (
    <>
      <Title level={3}>Панель администратора</Title>

      {/* Статистика */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={6}>
          <Card loading={loading}>
            <Statistic title="Сотрудников" value={head?.total_employees ?? '—'} prefix={<TeamOutlined />} />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card loading={loading}>
            <Statistic title="Операций сегодня" value={head?.operations_today ?? '—'} prefix={<UnorderedListOutlined />} />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card loading={loading}>
            <Statistic
              title="Нарушений SLA"
              value={head?.sla_violations_today ?? '—'}
              prefix={<ExclamationCircleOutlined />}
              valueStyle={(head?.sla_violations_today ?? 0) > 0 ? { color: '#ff4d4f' } : undefined}
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card loading={loading}>
            <Statistic
              title="Среднее время (мин)"
              value={head ? Math.round(head.avg_duration_today / 60) : '—'}
              prefix={<ClockCircleOutlined />}
            />
          </Card>
        </Col>
      </Row>

      {/* Главные графики */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} lg={14}>
          <Card title="Операции за 14 дней" loading={loading}>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={chartData} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <ChartTooltip />
                <Bar dataKey="operations_count" name="Операции" fill="#0232c2" radius={[3, 3, 0, 0]} />
                <Bar dataKey="sla_violations" name="Нарушения SLA" fill="#ff4d4f" radius={[3, 3, 0, 0]} />
                <Legend />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Col>
        <Col xs={24} lg={10}>
          <Card title="Среднее время операции (мин)" loading={loading}>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={chartData} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <ChartTooltip />
                <Line type="monotone" dataKey="avg_min" name="Мин" stroke="#0232c2" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </Col>
      </Row>

      {/* Распределение + SLA compliance */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} lg={12}>
          <Card title="Распределение операций по типам (сегодня)" loading={loading}>
            {opTypes.length > 0 ? (
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie
                    data={opTypes}
                    dataKey="count"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={90}
                    label={({ percent }) => `${((percent ?? 0) * 100).toFixed(0)}%`}
                  >
                    {opTypes.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <ChartTooltip formatter={(val, name) => [val, name]} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ height: 240, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Text type="secondary">Нет операций сегодня</Text>
              </div>
            )}
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="Тепловая карта нарушений SLA (14 дней)" loading={loading}>
            <Text type="secondary" style={{ fontSize: 12 }}>
              Чем темнее — тем больше нарушений.
            </Text>
            <SLAHeatmap data={trend} />
            {slaRate !== null && (
              <div style={{ marginTop: 16 }}>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  Соблюдение SLA сегодня
                </Text>
                <Progress
                  percent={slaRate}
                  strokeColor={slaRate >= 80 ? '#52c41a' : slaRate >= 60 ? '#faad14' : '#ff4d4f'}
                  style={{ marginTop: 4 }}
                />
              </div>
            )}
          </Card>
        </Col>
      </Row>

      {/* Аудит */}
      <Card title={<span><AuditOutlined style={{ marginRight: 8 }} />Последние события аудита</span>}>
        <Table<AuditLog>
          columns={auditColumns}
          dataSource={auditLogs}
          rowKey="audit_id"
          loading={loading}
          pagination={false}
          size="small"
        />
      </Card>
    </>
  );
}

// ===== HEAD DASHBOARD =====
function HeadDashboard() {
  const [head, setHead] = useState<DashboardHeadResponse | null>(null);
  const [trend, setTrend] = useState<DailyTrendPoint[]>([]);
  const [opTypes, setOpTypes] = useState<OpTypeCount[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      $api.get<DashboardHeadResponse>('/api/dashboard/head'),
      $api.get<DailyTrendPoint[]>('/api/dashboard/trend?days=7'),
      $api.get<OpTypeCount[]>('/api/dashboard/op-types'),
    ])
      .then(([headRes, trendRes, opRes]) => {
        setHead(headRes.data);
        setTrend(Array.isArray(trendRes.data) ? trendRes.data : []);
        setOpTypes(Array.isArray(opRes.data) ? opRes.data.filter((x) => x.count > 0) : []);
      })
      .catch(() => message.error('Ошибка загрузки дашборда'))
      .finally(() => setLoading(false));
  }, []);

  const chartData = trend.map((d) => ({
    ...d,
    date: dayjs(d.date).format('DD.MM'),
    avg_min: Math.round(d.avg_duration_seconds / 60),
  }));

  // Radar: KPI по сотрудникам — нормализуем до 100
  const kpiByEmployee = (head?.kpi_results ?? []).reduce<Record<string, Record<string, number>>>(
    (acc, k) => {
      const name = (k.employee_name ?? String(k.employee_id)).split(' ')[0];
      if (!acc[name]) acc[name] = {};
      if (k.kpi_name) acc[name][k.kpi_name] = Number(k.value?.toFixed(1));
      return acc;
    },
    {},
  );

  const radarSubjects = [...new Set((head?.kpi_results ?? []).map((k) => k.kpi_name).filter(Boolean))] as string[];

  const radarData = radarSubjects.map((subject) => {
    const row: Record<string, unknown> = { subject };
    Object.entries(kpiByEmployee).forEach(([empName, kpis]) => {
      row[empName] = kpis[subject] ?? 0;
    });
    return row;
  });

  const empNames = Object.keys(kpiByEmployee);
  const COLORS = ['#0232c2', '#52c41a', '#faad14', '#ff4d4f', '#13c2c2', '#722ed1'];

  const slaRate = head
    ? head.operations_today > 0
      ? Math.round((1 - head.sla_violations_today / head.operations_today) * 100)
      : 100
    : null;

  return (
    <>
      <Title level={3}>Дашборд руководителя</Title>
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={6}>
          <Card loading={loading}>
            <Statistic title="Сотрудников" value={head?.total_employees ?? '—'} prefix={<TeamOutlined />} />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card loading={loading}>
            <Statistic title="Операций сегодня" value={head?.operations_today ?? '—'} prefix={<UnorderedListOutlined />} />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card loading={loading}>
            <Statistic
              title="Нарушений SLA"
              value={head?.sla_violations_today ?? '—'}
              prefix={<ExclamationCircleOutlined />}
              valueStyle={(head?.sla_violations_today ?? 0) > 0 ? { color: '#ff4d4f' } : undefined}
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card loading={loading}>
            {slaRate !== null && (
              <>
                <Text type="secondary" style={{ fontSize: 12 }}>Соблюдение SLA</Text>
                <Progress
                  type="circle"
                  percent={slaRate}
                  size={80}
                  strokeColor={slaRate >= 80 ? '#52c41a' : slaRate >= 60 ? '#faad14' : '#ff4d4f'}
                  style={{ display: 'block', margin: '4px auto 0' }}
                />
              </>
            )}
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} lg={14}>
          <Card title="Динамика операций за 7 дней" loading={loading}>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={chartData} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <ChartTooltip />
                <Bar dataKey="operations_count" name="Операции" fill="#0232c2" radius={[3, 3, 0, 0]} />
                <Bar dataKey="sla_violations" name="Нарушения SLA" fill="#ff4d4f" radius={[3, 3, 0, 0]} />
                <Legend />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Col>
        <Col xs={24} lg={10}>
          <Card title="Типы операций сегодня" loading={loading}>
            {opTypes.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={opTypes} dataKey="count" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={false}>
                    {opTypes.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <ChartTooltip formatter={(val, name) => [val, name]} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Text type="secondary">Нет операций сегодня</Text>
              </div>
            )}
          </Card>
        </Col>
      </Row>

      {/* Radar KPI */}
      {radarData.length > 0 && empNames.length > 0 && (
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={24} lg={12}>
            <Card title="Сравнение KPI сотрудников" loading={loading}>
              <ResponsiveContainer width="100%" height={260}>
                <RadarChart data={radarData}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10 }} />
                  {empNames.slice(0, 5).map((name, i) => (
                    <Radar
                      key={name}
                      name={name}
                      dataKey={name}
                      stroke={COLORS[i % COLORS.length]}
                      fill={COLORS[i % COLORS.length]}
                      fillOpacity={0.15}
                    />
                  ))}
                  <Legend />
                  <ChartTooltip />
                </RadarChart>
              </ResponsiveContainer>
            </Card>
          </Col>
          <Col xs={24} lg={12}>
            <Card title="Тепловая карта нарушений SLA (7 дней)" loading={loading}>
              <Text type="secondary" style={{ fontSize: 12 }}>
                Чем темнее — тем больше нарушений. Наводите курсор для деталей.
              </Text>
              <SLAHeatmap data={trend} />
            </Card>
          </Col>
        </Row>
      )}

      {(radarData.length === 0 || empNames.length === 0) && (
        <Card title="Тепловая карта нарушений SLA (7 дней)" loading={loading} style={{ marginBottom: 24 }}>
          <SLAHeatmap data={trend} />
        </Card>
      )}
    </>
  );
}

// ===== EMPLOYEE DASHBOARD =====
function EmployeeDashboard() {
  const user = useAppSelector(selectUser);
  const [emp, setEmp] = useState<DashboardEmployeeResponse | null>(null);
  const [trend, setTrend] = useState<DailyTrendPoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    Promise.all([
      $api.get<DashboardEmployeeResponse>('/api/dashboard/employee'),
      $api.get<DailyTrendPoint[]>('/api/dashboard/trend?days=14'),
    ])
      .then(([empRes, trendRes]) => {
        setEmp(empRes.data);
        setTrend(Array.isArray(trendRes.data) ? trendRes.data : []);
      })
      .catch(() => message.error('Ошибка загрузки дашборда'))
      .finally(() => setLoading(false));
  }, [user]);

  const chartData = trend.map((d) => ({
    ...d,
    date: dayjs(d.date).format('DD.MM'),
    avg_min: Math.round(d.avg_duration_seconds / 60),
  }));

  const SHIFT_LABEL: Record<string, { label: string; color: string }> = {
    WORK:     { label: 'Рабочий день', color: '#52c41a' },
    REMOTE:   { label: 'Удалённо',     color: '#1677ff' },
    VACATION: { label: 'Отпуск',       color: '#faad14' },
    SICK:     { label: 'Больничный',   color: '#ff4d4f' },
    DAYOFF:   { label: 'Выходной',     color: '#8c8c8c' },
  };

  const shiftType = emp?.today_schedule?.shift_type ?? 'WORK';
  const shiftMeta = SHIFT_LABEL[shiftType] ?? SHIFT_LABEL.WORK;

  return (
    <>
      <Title level={3}>Мои показатели</Title>
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={8}>
          <Card loading={loading}>
            <Statistic title="Операций сегодня" value={emp?.operations_today ?? '—'} prefix={<UnorderedListOutlined />} />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card loading={loading}>
            <Statistic
              title="Задач в работе"
              value={emp?.tasks_pending ?? '—'}
              prefix={<CheckSquareOutlined />}
              valueStyle={(emp?.tasks_pending ?? 0) > 0 ? { color: '#faad14' } : undefined}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card loading={loading}>
            <Statistic
              title="Среднее время (мин)"
              value={emp ? Math.round((emp.avg_duration ?? 0) / 60) : '—'}
              prefix={<ClockCircleOutlined />}
            />
          </Card>
        </Col>
      </Row>

      {/* График сегодня + KPI прогресс */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        {emp?.today_schedule && (
          <Col xs={24} sm={8}>
            <Card loading={loading} title="График сегодня">
              <div style={{ textAlign: 'center' }}>
                <Tag color={shiftMeta.color} style={{ fontSize: 13, padding: '4px 12px' }}>
                  {shiftMeta.label}
                </Tag>
                {emp.today_schedule.start_time && (
                  <div style={{ marginTop: 8, fontSize: 20, fontWeight: 700, color: '#0232c2' }}>
                    {emp.today_schedule.start_time.slice(0, 5)} – {emp.today_schedule.end_time?.slice(0, 5) ?? ''}
                  </div>
                )}
              </div>
            </Card>
          </Col>
        )}

        {/* KPI cards as progress */}
        {(emp?.kpi_results ?? []).slice(0, emp?.today_schedule ? 2 : 3).map((kpi) => (
          <Col key={kpi.kpi_result_id} xs={24} sm={8}>
            <Card loading={loading} title={kpi.kpi_name ?? 'KPI'}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 28, fontWeight: 700, color: '#0232c2' }}>
                  {Number(kpi.value?.toFixed(1))}
                  <span style={{ fontSize: 14, fontWeight: 400, marginLeft: 4, color: '#8c8c8c' }}>
                    {kpi.unit ?? ''}
                  </span>
                </div>
              </div>
            </Card>
          </Col>
        ))}
      </Row>

      {/* Тренды */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} lg={14}>
          <Card title="Динамика операций за 14 дней" loading={loading}>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={chartData} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <ChartTooltip />
                <Bar dataKey="operations_count" name="Операции" fill="#0232c2" radius={[3, 3, 0, 0]} />
                <Bar dataKey="sla_violations" name="Нарушения SLA" fill="#ff4d4f" radius={[3, 3, 0, 0]} />
                <Legend />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Col>
        <Col xs={24} lg={10}>
          <Card title="Среднее время операции (мин)" loading={loading}>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={chartData} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <ChartTooltip />
                <Line type="monotone" dataKey="avg_min" name="Мин" stroke="#0232c2" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </Col>
      </Row>

      {(emp?.kpi_results?.length ?? 0) === 0 && !loading && (
        <Card>
          <Text type="secondary">KPI за сегодня ещё не рассчитаны.</Text>
        </Card>
      )}
    </>
  );
}

// ===== ROOT =====
function DashboardPage() {
  const role = useAppSelector(selectUserRole);
  if (role === UserRole.ADMIN) return <AdminDashboard />;
  if (role === UserRole.HEAD) return <HeadDashboard />;
  return <EmployeeDashboard />;
}

export default DashboardPage;
