import type { IState } from '@app/providers/store-provider/types';

export const selectUserToken = (state: IState) => state.user.token;
export const selectUser = (state: IState) => state.user.user;
export const selectUserRole = (state: IState) => state.user.user?.role;
export const selectIsAuthenticated = (state: IState) => Boolean(state.user.token);
export const selectUserIsLoading = (state: IState) => state.user.isLoading;
export const selectUserError = (state: IState) => state.user.error;
