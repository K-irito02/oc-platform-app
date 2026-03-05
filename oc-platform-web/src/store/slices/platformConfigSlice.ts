import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { productApi, PlatformConfig } from '../../utils/api';

interface PlatformConfigState {
  config: PlatformConfig | null;
  loading: boolean;
  error: string | null;
}

const initialState: PlatformConfigState = {
  config: null,
  loading: false,
  error: null,
};

export const fetchPlatformConfig = createAsyncThunk(
  'platformConfig/fetch',
  async (_, { rejectWithValue }) => {
    try {
      const res = await productApi.getPlatformConfig();
      return res.data as PlatformConfig;
    } catch (error: unknown) {
      const err = error as { message?: string };
      return rejectWithValue(err.message || 'Failed to fetch platform config');
    }
  }
);

const platformConfigSlice = createSlice({
  name: 'platformConfig',
  initialState,
  reducers: {
    setPlatformConfig: (state, action: PayloadAction<PlatformConfig>) => {
      state.config = action.payload;
    },
    clearPlatformConfig: (state) => {
      state.config = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchPlatformConfig.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPlatformConfig.fulfilled, (state, action) => {
        state.loading = false;
        state.config = action.payload;
      })
      .addCase(fetchPlatformConfig.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { setPlatformConfig, clearPlatformConfig } = platformConfigSlice.actions;
export default platformConfigSlice.reducer;
