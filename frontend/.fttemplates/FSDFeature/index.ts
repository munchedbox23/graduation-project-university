import { lazy } from "react";

export * from "./model";
export type * from "./model";

export const <FTName | pascalcase> = lazy(
  () => import(/*webpackChunkName: "<FTName | paramcase>"*/ "./ui")
);
