import { RouterProvider } from 'react-router-dom';

import { StoreProvider } from './providers/store-provider';
import { AppThemeProvider } from './providers/theme-provider';
import { router } from './router';
import './styles/index.css';

function AppRoot() {
  return (
    <StoreProvider>
      <AppThemeProvider>
        <RouterProvider router={router} />
      </AppThemeProvider>
    </StoreProvider>
  );
}

export default AppRoot;
