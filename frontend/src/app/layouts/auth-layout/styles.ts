import styled from 'styled-components';

export const AuthLayoutWrapper = styled.div`
  display: flex;
  height: 100vh;
  width: 100%;
  background: ${({ theme }) => theme.colors.background};
`;

export const LogoSection = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: ${({ theme }) => theme.colors.primary};
  gap: 24px;
  padding: 40px;
`;

export const LogoImage = styled.img`
  width: 120px;
  height: 120px;
  object-fit: contain;
  filter: brightness(0) invert(1);
`;

export const LogoTitle = styled.h1`
  color: ${({ theme }) => theme.colors.text.inverse};
  font-family: ${({ theme }) => theme.fonts.header};
  font-size: 24px;
  font-weight: 700;
  text-align: center;
  margin: 0;
`;

export const LogoSubtitle = styled.p`
  color: rgba(255, 255, 255, 0.75);
  font-size: 14px;
  text-align: center;
  margin: 0;
  max-width: 280px;
`;

export const FormSection = styled.div`
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px;
  background: ${({ theme }) => theme.colors.surface};
`;
