import type { IState } from "@/app/providers/store-provider";
import { createSelector } from "@reduxjs/toolkit";

export const get<FTName | pascalcase>State = (state: IState) => {
  return state.<FTName | camelcase>;
};

// export const get<FTName | pascalcase>SomeValue = createSelector(
//   get<FTName | pascalcase>State,
//   (state) => state?.someValue
// );
