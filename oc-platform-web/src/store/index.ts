import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import themeReducer from './slices/themeSlice';
import siteConfigReducer from './slices/siteConfigSlice';
import platformConfigReducer from './slices/platformConfigSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    theme: themeReducer,
    siteConfig: siteConfigReducer,
    platformConfig: platformConfigReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
