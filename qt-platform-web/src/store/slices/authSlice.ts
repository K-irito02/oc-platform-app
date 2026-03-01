import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface UserInfo {
  id: number;
  username: string;
  nickname?: string;
  email: string;
  avatarUrl?: string | null;
  roles?: string[];
  themeConfig?: string;
}

interface AuthState {
  isAuthenticated: boolean;
  user: UserInfo | null;
  accessToken: string | null;
  refreshToken: string | null;
}

const initialState: AuthState = {
  isAuthenticated: !!localStorage.getItem('access_token'),
  user: null,
  accessToken: localStorage.getItem('access_token'),
  refreshToken: localStorage.getItem('refresh_token'),
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (
      state,
      action: PayloadAction<{ user: UserInfo; accessToken: string; refreshToken: string }>
    ) => {
      state.isAuthenticated = true;
      state.user = action.payload.user;
      state.accessToken = action.payload.accessToken;
      state.refreshToken = action.payload.refreshToken;
      localStorage.setItem('access_token', action.payload.accessToken);
      localStorage.setItem('refresh_token', action.payload.refreshToken);
    },
    setUser: (state, action: PayloadAction<UserInfo>) => {
      state.user = action.payload;
    },
    logout: (state) => {
      state.isAuthenticated = false;
      state.user = null;
      state.accessToken = null;
      state.refreshToken = null;
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
    },
  },
});

export const { setCredentials, setUser, logout } = authSlice.actions;

export const selectUser = (state: { auth: AuthState }) => state.auth.user;
export const selectIsAuthenticated = (state: { auth: AuthState }) => state.auth.isAuthenticated;

export default authSlice.reducer;
