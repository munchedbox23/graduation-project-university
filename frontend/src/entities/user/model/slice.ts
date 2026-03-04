import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { AxiosError } from 'axios';

import type { ThunkConfig } from '@app/providers/store-provider/types';
import { getItemFromLocalStorage, setItemToLocalStorage } from '@shared/lib';
import { USER_DATA_KEY, USER_TOKEN_KEY } from '@shared/storage-keys';

import type { ILoginResponse, IUser, IUserState } from './types';

const initialState: IUserState = {
  token: getItemFromLocalStorage<string>(USER_TOKEN_KEY) ?? null,
  user: getItemFromLocalStorage<IUser>(USER_DATA_KEY) ?? null,
  isLoading: false,
};

export const login = createAsyncThunk<
  ILoginResponse,
  { email: string; password: string },
  ThunkConfig<string>
>('user/login', async (params, thunkAPI) => {
  try {
    const response = await thunkAPI.extra.api.post<ILoginResponse>('/api/auth/login', {
      email: params.email,
      password: params.password,
    });
    return response.data;
  } catch (e) {
    if (e instanceof AxiosError) {
      return thunkAPI.rejectWithValue(
        e.response?.data?.message || 'Неверный email или пароль',
      );
    }
    return thunkAPI.rejectWithValue('Неизвестная ошибка');
  }
});

export const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    logout: (state) => {
      state.token = null;
      state.user = null;
      localStorage.removeItem(USER_TOKEN_KEY);
      localStorage.removeItem(USER_DATA_KEY);
    },
    clearError: (state) => {
      state.error = undefined;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(login.pending, (state) => {
      state.isLoading = true;
      state.error = undefined;
    });
    builder.addCase(login.fulfilled, (state, action) => {
      state.isLoading = false;
      state.token = action.payload.access_token;
      state.user = action.payload.me;
      setItemToLocalStorage(USER_TOKEN_KEY, action.payload.access_token);
      setItemToLocalStorage(USER_DATA_KEY, action.payload.me);
    });
    builder.addCase(login.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload || action.error.message;
    });
  },
});

export const userActions = userSlice.actions;
