import { combineReducers, configureStore } from "@reduxjs/toolkit";
import { persistStore, persistReducer } from "redux-persist";
import storage from "redux-persist/lib/storage"; // Default is localStorage for web
import authReducer from "./auth/auth.slice.js";
import profileReducer from "./profileSlice/profile.slice.js";
import visaReducer from "./visaSlice/visa.slice.js";
import employeeSlice from "./employeeSlice/employee.slice.js";
import searchSlice from "./searchSlice/search.slice.js";
import housingSlice from "./housingSlice/housing.slice.js";
import notificationReducer from "./notificationSlice/notification.slice.js";
import hrVisaSlice from "./hrVisaStatus/hrVisaStatus.slice";
import onboardingSlice from './onboardingSlice/onboarding.slice.js';

const rootReducer = combineReducers({
  auth: authReducer,
  profile: profileReducer,
  visa: visaReducer,
  employee: employeeSlice,
  search: searchSlice,
  housing: housingSlice,
  notification: notificationReducer,
  hrVisa: hrVisaSlice,
  onboarding: onboardingSlice,
});


// Persist configuration
const persistConfig = {
  key: "root",
  storage, // Use localStorage to persist the state
  whitelist: ["auth", "profile", "employee", "search", "housing"],
};

const persistedReducer = persistReducer(persistConfig, rootReducer);

const store = configureStore({
  reducer: persistedReducer, // Use the persisted root reducer
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false, // Disable serializable check for redux-persist
    }),
  devTools: true,
});

// Create the persistor to manage rehydrating the store
export const persistor = persistStore(store);

export default store;
