import { Middleware } from '@reduxjs/toolkit';

import { USER_TOKEN_KEY, USER_DATA_KEY } from '@shared/storage-keys';
import { setItemToLocalStorage } from '@shared/lib';

import type { IState } from '../types';

export const localStorageMiddleware: Middleware<object, IState> = (store) => (next) => (action) => {
  const result = next(action);
  const state = store.getState();

  if (state.user.token) {
    setItemToLocalStorage(USER_TOKEN_KEY, state.user.token);
  }
  if (state.user.user) {
    setItemToLocalStorage(USER_DATA_KEY, state.user.user);
  }

  return result;
};
