import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

import { getItemFromLocalStorage } from "../lib";
import { USER_TOKEN_KEY } from "../storage-keys";

export const rtkApi = createApi({
  reducerPath: "api",
  baseQuery: fetchBaseQuery({
    baseUrl: __API_URL__,
    prepareHeaders: (headers) => {
      const token = getItemFromLocalStorage<string>(USER_TOKEN_KEY);
      if (token) {
        headers.set("Authorization", `Bearer ${token}`);
      }

      return headers;
    },
  }),
  endpoints: () => ({}),
});
