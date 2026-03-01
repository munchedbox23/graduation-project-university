import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

import { getItemFromLocalStorage } from "../lib";

export const rtkApi = createApi({
  reducerPath: "api",
  baseQuery: fetchBaseQuery({
    baseUrl: __API_SERVICE_URL__,
    credentials: "include",
    prepareHeaders: (headers) => {
      const token = getItemFromLocalStorage("");
      if (token) {
        headers.set("Authorization", token);
      }

      return headers;
    },
  }),
  endpoints: () => ({}),
});
