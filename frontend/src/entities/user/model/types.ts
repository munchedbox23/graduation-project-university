import { UserRole } from '@shared/constants';

export interface IUser {
  employee_id: number;
  full_name: string;
  email: string;
  role: UserRole;
  department_id: number;
  position: string;
}

export interface ILoginResponse {
  access_token: string;
  me: IUser;
}

export interface IUserState {
  token: string | null;
  user: IUser | null;
  isLoading: boolean;
  error?: string;
}
