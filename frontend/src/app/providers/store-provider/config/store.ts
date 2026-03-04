import { combineReducers, configureStore } from '@reduxjs/toolkit';

import { $api } from '@shared/api/api';
import { rtkApi } from '@shared/api/rtk-api';

import type { ThunkExtraArg } from '../types';
import { localStorageMiddleware } from './middleware';
import { rootReducer } from './reducer';

const appReducer = combineReducers(rootReducer);

export function createReduxStore() {
  const extraArg: ThunkExtraArg = {
    api: $api,
  };

  return configureStore({
    reducer: appReducer,
    devTools: __IS_DEV__,
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({
        thunk: { extraArgument: extraArg },
        serializableCheck: false,
      })
        .concat(rtkApi.middleware)
        .concat(localStorageMiddleware as any),
  });
}

export type AppStore = ReturnType<typeof createReduxStore>;
export type AppDispatch = AppStore['dispatch'];
