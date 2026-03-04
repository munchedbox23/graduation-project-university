import { Suspense, useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';

import { Button, Menu, Tag } from 'antd';
import { LogoutOutlined } from '@ant-design/icons';

import { userActions, selectUser, selectUserRole } from '@entities/user';
import { LogoIcon } from '@shared/assets';
import { UserRole } from '@shared/constants';
import { useAppDispatch, useAppSelector } from '@shared/store';

import { getMenuItems } from './menu-config';
import {
  ContentLayout,
  HeaderLeft,
  HeaderRight,
  LogoImg,
  LogoText,
  SiderLogo,
  StyledContent,
  StyledHeader,
  StyledLayout,
  StyledSider,
  UserName,
} from './styles';

const ROLE_TAG_COLOR: Record<UserRole, string> = {
  [UserRole.ADMIN]: 'red',
  [UserRole.HEAD]: 'blue',
  [UserRole.EMP]: 'green',
};

const ROLE_LABEL: Record<UserRole, string> = {
  [UserRole.ADMIN]: 'Администратор',
  [UserRole.HEAD]: 'Руководитель',
  [UserRole.EMP]: 'Сотрудник',
};

export function MainLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const user = useAppSelector(selectUser);
  const role = useAppSelector(selectUserRole);

  const menuItems = getMenuItems(role);

  const handleMenuClick = ({ key }: { key: string }) => {
    navigate(key);
  };

  const handleLogout = () => {
    dispatch(userActions.logout());
    navigate('/login');
  };

  return (
    <StyledLayout>
      <StyledSider
        collapsible
        collapsed={collapsed}
        onCollapse={setCollapsed}
        width={240}
        collapsedWidth={80}
      >
        <SiderLogo onClick={() => navigate('/dashboard')}>
          <LogoImg src={LogoIcon} alt="logo" />
          {!collapsed && <LogoText>ОперОфис</LogoText>}
        </SiderLogo>

        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={handleMenuClick}
          style={{ borderRight: 0, flex: 1 }}
        />
      </StyledSider>

      <ContentLayout $collapsed={collapsed}>
        <StyledHeader>
          <HeaderLeft>
            {user && <UserName>{user.full_name}</UserName>}
            {role && (
              <Tag color={ROLE_TAG_COLOR[role]}>{ROLE_LABEL[role]}</Tag>
            )}
          </HeaderLeft>

          <HeaderRight>
            <Button
              type="text"
              icon={<LogoutOutlined />}
              onClick={handleLogout}
              danger
            >
              Выйти
            </Button>
          </HeaderRight>
        </StyledHeader>

        <StyledContent>
          <Suspense fallback={null}>
            <Outlet />
          </Suspense>
        </StyledContent>
      </ContentLayout>
    </StyledLayout>
  );
}
