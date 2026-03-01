import axios from "axios";


export const $api = axios.create({
  baseURL: __API_URL__,
});

$api.interceptors.request.use((config) => {
  const token = localStorage.getItem("");
  if (token) {
    config.headers.authorization = token;
  }
  return config;
});
