import axios from "axios";

import { getItemFromLocalStorage } from "@shared/lib";
import { USER_TOKEN_KEY } from "@shared/storage-keys";

export const $api = axios.create({
  baseURL: __API_URL__,
});

$api.interceptors.request.use((config) => {
  const token = getItemFromLocalStorage<string>(USER_TOKEN_KEY);
  if (token) {
    config.headers.authorization = `Bearer ${token}`;
  }
  return config;
});
