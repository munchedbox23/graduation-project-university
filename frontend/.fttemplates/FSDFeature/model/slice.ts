import { createSlice } from "@reduxjs/toolkit";
import { <FTName | pascalcase>Schema } from "./types";

function getInitialState<FTName | pascalcase>(): <FTName | pascalcase>Schema {
  return {
    // Initial state
  };
}

const INITIAL_STATE = getInitialState<FTName | pascalcase>();

export const <FTName | camelcase>Slice = createSlice({
  name: "<FTName | camelcase>",
  initialState: INITIAL_STATE,
  reducers: {},
  extraReducers: (builder) => {},
});

export const { reducer: <FTName | camelcase>Reducer } = <FTName | camelcase>Slice;
