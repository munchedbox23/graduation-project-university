import { ConfigProvider } from 'antd';
import ruRU from 'antd/locale/ru_RU';
import { ReactNode } from 'react';
import { ThemeProvider as StyledThemeProvider } from 'styled-components';

import { theme } from '../theme';

interface AppThemeProviderProps {
  children: ReactNode;
}

const antdTheme = {
  token: {
    colorPrimary: theme.colors.primary,
    colorBgContainer: theme.colors.surface,
    colorBgLayout: theme.colors.background,
    borderRadius: 8,
    fontFamily: theme.fonts.main,
    colorText: theme.colors.text.primary,
    colorTextSecondary: theme.colors.text.secondary,
    colorBorder: theme.colors.border,
    colorError: theme.colors.error,
    colorSuccess: theme.colors.success,
    colorWarning: theme.colors.warning,
  },
};

export function AppThemeProvider({ children }: AppThemeProviderProps) {
  return (
    <StyledThemeProvider theme={theme}>
      <ConfigProvider theme={antdTheme} locale={ruRU}>
        {children}
      </ConfigProvider>
    </StyledThemeProvider>
  );
}
