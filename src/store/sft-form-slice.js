import { createSlice } from "@reduxjs/toolkit";

const initialState = { isActivityStarted: false };
const sftFormSlice = createSlice({
  name: "sftForm",
  initialState,
  reducers: {
    startActivity(state) {
      state.isActivityStarted = true;
    },
    stopActivity(state) {
      state.isActivityStarted = false;
    },
  },
});
export const sftFormActions = sftFormSlice.actions;
export default sftFormSlice;
