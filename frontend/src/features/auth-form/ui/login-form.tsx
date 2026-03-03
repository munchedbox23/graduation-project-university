import { LockOutlined, MailOutlined } from '@ant-design/icons';
import { Button, Form, Input } from 'antd';
import { useNavigate } from 'react-router-dom';

import { login, selectUserError, selectUserIsLoading } from '@entities/user';
import { ROLE_HOME_PATHS } from '@shared/constants';
import { useAppDispatch, useAppSelector } from '@shared/store';

import { ErrorMessage, FormSubtitle, FormTitle, FormWrapper } from './styles';

interface LoginFormValues {
  email: string;
  password: string;
}

export function LoginForm() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const isLoading = useAppSelector(selectUserIsLoading);
  const error = useAppSelector(selectUserError);

  const onFinish = async (values: LoginFormValues) => {
    const result = await dispatch(login(values));
    if (login.fulfilled.match(result)) {
      const role = result.payload.me.role;
      navigate(ROLE_HOME_PATHS[role], { replace: true });
    }
  };

  return (
    <FormWrapper>
      <FormTitle>Добро пожаловать</FormTitle>
      <FormSubtitle>Войдите в систему мониторинга</FormSubtitle>

      {error && <ErrorMessage>{error}</ErrorMessage>}

      <Form
        layout="vertical"
        onFinish={onFinish}
        autoComplete="off"
        requiredMark={false}
      >
        <Form.Item
          name="email"
          label="Email"
          rules={[
            { required: true, message: 'Введите email' },
            { type: 'email', message: 'Введите корректный email' },
          ]}
        >
          <Input
            prefix={<MailOutlined />}
            placeholder="your@email.com"
            size="large"
          />
        </Form.Item>

        <Form.Item
          name="password"
          label="Пароль"
          rules={[{ required: true, message: 'Введите пароль' }]}
        >
          <Input.Password
            prefix={<LockOutlined />}
            placeholder="Введите пароль"
            size="large"
          />
        </Form.Item>

        <Form.Item>
          <Button
            type="primary"
            htmlType="submit"
            size="large"
            loading={isLoading}
            block
          >
            Войти
          </Button>
        </Form.Item>
      </Form>
    </FormWrapper>
  );
}
