import { configureStore } from "@reduxjs/toolkit";
import sftFormSlice from "./sft-form-slice";

const store = configureStore({
  reducer: {
    sftForm: sftFormSlice.reducer,
  },
});

export default store;
