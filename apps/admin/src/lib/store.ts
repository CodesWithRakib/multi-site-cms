'use client';

import { createAppStore, createPlatformApi, createTypedHooks } from '@multi-site-cms/redux';

import { publicConfig } from '@/config/env';

export const platformApi = createPlatformApi({
  baseUrl: publicConfig.apiBaseUrl,
  timeoutMs: 5_000,
});

export const makeStore = () => createAppStore(platformApi);

export type AppStore = ReturnType<typeof makeStore>;
export type RootState = ReturnType<AppStore['getState']>;
export type AppDispatch = AppStore['dispatch'];

export const { useAppDispatch, useAppSelector } = createTypedHooks<AppStore>();
export const { useGetHealthQuery } = platformApi;
