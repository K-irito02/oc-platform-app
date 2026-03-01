import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import request from '@/utils/request';

export interface SiteConfig {
  siteName: string;
  siteNameEn: string;
  siteDescription: string;
  siteLogo: string;
  registerEnabled: boolean;
  commentAutoApprove: boolean;
  uploadMaxFileSize: number;
  footerBeian: string;
  footerBeianEn: string;
  footerIcp: string;
  footerIcpEn: string;
  footerHoliday: string;
  footerHolidayEn: string;
  footerQuote: string;
  footerQuoteEn: string;
  footerQuoteAuthor: string;
  footerQuoteAuthorEn: string;
}

type ApiResponse<T> = {
  data: T;
};

interface SiteConfigState {
  config: SiteConfig;
  loading: boolean;
  error: string | null;
  lastFetched: number | null;
}

const defaultConfig: SiteConfig = {
  siteName: 'KiritoLab',
  siteNameEn: 'KiritoLab',
  siteDescription: '',
  siteLogo: '',
  registerEnabled: true,
  commentAutoApprove: false,
  uploadMaxFileSize: 1073741824,
  footerBeian: '',
  footerBeianEn: '',
  footerIcp: '',
  footerIcpEn: '',
  footerHoliday: '',
  footerHolidayEn: '',
  footerQuote: '',
  footerQuoteEn: '',
  footerQuoteAuthor: '',
  footerQuoteAuthorEn: '',
};

const initialState: SiteConfigState = {
  config: defaultConfig,
  loading: false,
  error: null,
  lastFetched: null,
};

// 从后端获取站点配置（公共 API，无需认证）
export const fetchSiteConfig = createAsyncThunk(
  'siteConfig/fetch',
  async (_, { rejectWithValue }) => {
    try {
      const res = await request.get('/public/site-config') as ApiResponse<SiteConfig>;
      return res.data;
    } catch (error: unknown) {
      const err = error as { message?: string };
      return rejectWithValue(err.message || 'Failed to fetch site config');
    }
  }
);

export const siteConfigSlice = createSlice({
  name: 'siteConfig',
  initialState,
  reducers: {
    updateSiteConfig: (state, action: PayloadAction<Partial<SiteConfig>>) => {
      state.config = { ...state.config, ...action.payload };
    },
    resetSiteConfig: (state) => {
      state.config = defaultConfig;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchSiteConfig.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSiteConfig.fulfilled, (state, action) => {
        state.loading = false;
        state.config = { ...defaultConfig, ...action.payload };
        state.lastFetched = Date.now();
      })
      .addCase(fetchSiteConfig.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { updateSiteConfig, resetSiteConfig } = siteConfigSlice.actions;

export default siteConfigSlice.reducer;
