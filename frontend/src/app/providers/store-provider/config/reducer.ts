import { ReducersMapObject } from '@reduxjs/toolkit';

import { userSlice } from '@entities/user';
import { rtkApi } from '@shared/api/rtk-api';

import type { IState } from '../types';

export const rootReducer: ReducersMapObject<IState> = {
  user: userSlice.reducer,
  [rtkApi.reducerPath]: rtkApi.reducer,
};
