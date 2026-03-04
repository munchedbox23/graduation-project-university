export const theme = {
  colors: {
    primary: '#0232c2',
    primaryHover: '#0449e0',
    primaryLight: '#e8eeff',
    background: '#f0f2f5',
    surface: '#ffffff',
    surfaceSecondary: '#fafafa',
    text: {
      primary: '#141c1f',
      secondary: '#5a6872',
      hint: '#adbcc0',
      inverse: '#ffffff',
    },
    success: '#52c41a',
    warning: '#faad14',
    error: '#ff4d4f',
    border: '#e8e8ea',
    divider: '#f0f0f0',
    sidebarBg: '#001529',
    sidebarText: '#ffffffa6',
    sidebarActiveText: '#ffffff',
  },
  fonts: {
    main: "'Nunito Sans', sans-serif",
    header: "'Roboto', sans-serif",
  },
  sizes: {
    navbarHeight: '60px',
    sidebarWidth: '240px',
    sidebarCollapsedWidth: '80px',
  },
  borderRadius: {
    sm: '4px',
    md: '8px',
    lg: '12px',
    xl: '16px',
  },
  shadows: {
    sm: '0 1px 3px rgba(0, 0, 0, 0.08)',
    md: '0 4px 12px rgba(0, 0, 0, 0.12)',
    lg: '0 8px 24px rgba(0, 0, 0, 0.15)',
  },
  transitions: {
    default: '0.2s ease',
    slow: '0.35s ease',
  },
} as const;

export type AppTheme = typeof theme;
