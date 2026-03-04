import styled from 'styled-components';

export const FormWrapper = styled.div`
  width: 100%;
  max-width: 400px;
`;

export const FormTitle = styled.h2`
  font-family: ${({ theme }) => theme.fonts.header};
  font-size: 28px;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.text.primary};
  margin: 0 0 8px 0;
`;

export const FormSubtitle = styled.p`
  font-size: 14px;
  color: ${({ theme }) => theme.colors.text.secondary};
  margin: 0 0 32px 0;
`;

export const ErrorMessage = styled.div`
  background: #fff2f0;
  border: 1px solid #ffccc7;
  border-radius: ${({ theme }) => theme.borderRadius.md};
  padding: 10px 14px;
  color: ${({ theme }) => theme.colors.error};
  font-size: 14px;
  margin-bottom: 16px;
`;
