import { AxiosInstance } from 'axios';

import type { IUserState } from '@entities/user';
import { EnhancedStore, Reducer, ReducersMapObject, StateFromReducersMapObject, UnknownAction } from '@reduxjs/toolkit';
import { rtkApi } from '@shared/api/rtk-api';

export interface IRequiredState {
  user: IUserState;
  [rtkApi.reducerPath]: ReturnType<typeof rtkApi.reducer>;
}

export interface IState extends IRequiredState {
  [key: string]: any;
}

export type StateKeys = keyof IState;

export interface ThunkExtraArg {
  api: AxiosInstance;
}

export interface ReducerManager {
  getReducerMap: () => ReducersMapObject<IState>;
  reduce: (state: IState, action: UnknownAction) => StateFromReducersMapObject<IState>;
  add: (key: StateKeys, reducer: Reducer) => void;
  remove: (key: StateKeys) => void;
}

export interface ReduxStoreWithManager extends EnhancedStore<IState> {
  reducerManager: ReducerManager;
}

export interface ThunkConfig<T> {
  rejectValue: T;
  extra: ThunkExtraArg;
  state: IState;
}
