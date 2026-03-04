import { useState } from 'react';

import {
  Alert,
  Button,
  Card,
  Table,
  Typography,
  Upload,
  message,
} from 'antd';
import { InboxOutlined, UploadOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import type { UploadFile } from 'antd/es/upload/interface';

import { $api } from '@shared/api/api';

const { Title, Text, Paragraph } = Typography;
const { Dragger } = Upload;

interface ImportRow {
  row: number;
  status: 'ok' | 'error';
  message: string;
}

interface ImportResult {
  total: number;
  imported: number;
  failed: number;
  rows: ImportRow[];
}

const EXPECTED_COLUMNS = [
  'full_name',
  'email',
  'password',
  'position',
  'phone',
  'salary',
  'experience_years',
  'role',
  'department_id',
];

function ImportPage() {
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);

  const handleUpload = async () => {
    if (fileList.length === 0) {
      message.warning('Выберите CSV файл');
      return;
    }

    const formData = new FormData();
    formData.append('file', fileList[0].originFileObj as File);

    setLoading(true);
    try {
      const res = await $api.post<ImportResult>('/api/import/employees', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setResult(res.data);
      message.success(`Импорт завершён: ${res.data.imported} записей загружено`);
      setFileList([]);
    } catch {
      message.error('Ошибка при загрузке файла');
    } finally {
      setLoading(false);
    }
  };

  const columns: ColumnsType<ImportRow> = [
    { title: 'Строка', dataIndex: 'row', key: 'row', width: 80 },
    {
      title: 'Статус',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (v: string) => (
        <Text type={v === 'ok' ? 'success' : 'danger'}>{v === 'ok' ? 'OK' : 'Ошибка'}</Text>
      ),
    },
    { title: 'Сообщение', dataIndex: 'message', key: 'message' },
  ];

  return (
    <div>
      <Title level={3} style={{ marginBottom: 24 }}>
        Импорт данных
      </Title>

      <Card title="Формат CSV файла" style={{ marginBottom: 24, maxWidth: 640 }}>
        <Paragraph>
          Файл должен содержать следующие колонки (в порядке или с заголовками):
        </Paragraph>
        <code style={{ display: 'block', padding: '8px 12px', background: '#f5f5f5', borderRadius: 6 }}>
          {EXPECTED_COLUMNS.join(', ')}
        </code>
        <Paragraph style={{ marginTop: 12, marginBottom: 0 }}>
          <Text type="secondary">
            Разделитель — запятая. Кодировка — UTF-8. Первая строка — заголовки.
          </Text>
        </Paragraph>
      </Card>

      <Card style={{ maxWidth: 640, marginBottom: 24 }}>
        <Dragger
          accept=".csv"
          maxCount={1}
          fileList={fileList}
          beforeUpload={(file) => {
            setFileList([file]);
            return false;
          }}
          onRemove={() => setFileList([])}
        >
          <p className="ant-upload-drag-icon">
            <InboxOutlined />
          </p>
          <p className="ant-upload-text">Перетащите CSV файл сюда или нажмите для выбора</p>
          <p className="ant-upload-hint">Поддерживается только формат .csv</p>
        </Dragger>

        <Button
          type="primary"
          icon={<UploadOutlined />}
          onClick={handleUpload}
          loading={loading}
          disabled={fileList.length === 0}
          style={{ marginTop: 16 }}
        >
          Загрузить
        </Button>
      </Card>

      {result && (
        <Card title="Результат импорта" style={{ maxWidth: 800 }}>
          <Alert
            type={result.failed === 0 ? 'success' : 'warning'}
            message={`Загружено: ${result.imported} / ${result.total}. Ошибок: ${result.failed}`}
            style={{ marginBottom: 16 }}
          />
          {result.rows.length > 0 && (
            <Table<ImportRow>
              columns={columns}
              dataSource={result.rows}
              rowKey="row"
              size="small"
              pagination={{ pageSize: 20 }}
            />
          )}
        </Card>
      )}
    </div>
  );
}

export default ImportPage;
