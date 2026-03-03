export { userSlice, userActions, login } from './model/slice';
export type { IUser, IUserState, ILoginResponse } from './model/types';
export {
  selectUser,
  selectUserToken,
  selectUserRole,
  selectIsAuthenticated,
  selectUserIsLoading,
  selectUserError,
} from './model/selectors';
