import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';

import type { AppDispatch } from '@app/providers/store-provider/config/store';
import type { IState } from '@app/providers/store-provider/types';

export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<IState> = useSelector;
