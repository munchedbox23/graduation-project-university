import { Suspense } from 'react';
import { Outlet } from 'react-router-dom';

import { LogoIcon } from '@shared/assets';

import {
  AuthLayoutWrapper,
  FormSection,
  LogoImage,
  LogoSection,
  LogoSubtitle,
  LogoTitle,
} from './styles';

function AuthLayout() {
  return (
    <AuthLayoutWrapper>
      <LogoSection>
        <LogoImage src={LogoIcon} alt="Bank logo" />
        <LogoTitle>ОперОфис — Мониторинг</LogoTitle>
        <LogoSubtitle>
          Система мониторинга и анализа эффективности бизнес-процессов операционного офиса банка
        </LogoSubtitle>
      </LogoSection>

      <FormSection>
        <Suspense fallback={null}>
          <Outlet />
        </Suspense>
      </FormSection>
    </AuthLayoutWrapper>
  );
}

export default AuthLayout;
