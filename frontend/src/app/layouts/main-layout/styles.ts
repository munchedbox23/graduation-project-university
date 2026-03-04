import { Layout } from 'antd';
import styled from 'styled-components';

const { Sider, Header, Content } = Layout;

export const StyledLayout = styled(Layout)`
  min-height: 100vh;
`;

export const StyledSider = styled(Sider)`
  &.ant-layout-sider {
    background: ${({ theme }) => theme.colors.sidebarBg};
    box-shadow: 2px 0 8px rgba(0, 0, 0, 0.15);
    position: fixed;
    left: 0;
    top: 0;
    bottom: 0;
    z-index: 100;
    overflow-y: auto;
    overflow-x: hidden;
  }

  .ant-layout-sider-children {
    display: flex;
    flex-direction: column;
  }

  .ant-menu.ant-menu-dark {
    background: ${({ theme }) => theme.colors.sidebarBg};
    flex: 1;
  }
`;

export const SiderLogo = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  min-height: 64px;
  overflow: hidden;
  cursor: pointer;
`;

export const LogoImg = styled.img`
  width: 32px;
  height: 32px;
  object-fit: contain;
  flex-shrink: 0;
`;

export const LogoText = styled.span`
  color: #ffffff;
  font-size: 14px;
  font-weight: 700;
  font-family: ${({ theme }) => theme.fonts.header};
  white-space: nowrap;
  overflow: hidden;
  line-height: 1.3;
`;

export const StyledHeader = styled(Header)`
  &.ant-layout-header {
    background: ${({ theme }) => theme.colors.surface};
    padding: 0 24px;
    height: 64px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    box-shadow: ${({ theme }) => theme.shadows.sm};
    position: sticky;
    top: 0;
    z-index: 99;
  }
`;

export const HeaderLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

export const HeaderRight = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

export const UserName = styled.span`
  font-size: 14px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.text.primary};
  font-family: ${({ theme }) => theme.fonts.main};
`;

export const ContentLayout = styled(Layout)<{ $collapsed: boolean }>`
  margin-left: ${({ $collapsed }) => ($collapsed ? '80px' : '240px')};
  transition: margin-left 0.2s;
`;

export const StyledContent = styled(Content)`
  padding: 24px;
  background: ${({ theme }) => theme.colors.background};
  min-height: calc(100vh - 64px);
  overflow: auto;
`;
