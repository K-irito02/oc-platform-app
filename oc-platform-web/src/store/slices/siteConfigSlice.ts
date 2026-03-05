import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import request from '@/utils/request';

export interface SiteConfig {
  siteName: string;
  siteNameEn: string;
  siteDescription: string;
  siteLogo: string;
  faviconLogo: string;
  siteUrl: string;
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
  socialGithub: string;
  socialTwitter: string;
  socialLinkedin: string;
  socialWeibo: string;
  socialWechat: string;
  socialEmail: string;
}

export interface SiteConfigState {
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
  faviconLogo: '',
  siteUrl: '',
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
  socialGithub: '',
  socialTwitter: '',
  socialLinkedin: '',
  socialWeibo: '',
  socialWechat: '',
  socialEmail: '',
};

const initialState: SiteConfigState = {
  config: defaultConfig,
  loading: false,
  error: null,
  lastFetched: null,
};

type ApiResponse<T> = {
  data?: T;
};

// 从后端获取站点配置（公共 API，无需认证）
export const fetchSiteConfig = createAsyncThunk(
  'siteConfig/fetch',
  async (_, { rejectWithValue }) => {
    try {
      const res = await request.get('/public/site-config') as ApiResponse<Record<string, unknown>>;
      if (res.data) {
        const config = {
          ...res.data,
          faviconLogo: res.data['siteFavicon'] || '',
        };
        return config as SiteConfig;
      }
      return defaultConfig;
    } catch (error: unknown) {
      const err = error as { message?: string };
      return rejectWithValue(err.message || 'Failed to fetch site config');
    }
  }
);

const siteConfigSlice = createSlice({
  name: 'siteConfig',
  initialState,
  reducers: {
    updateConfig: (state, action: PayloadAction<Partial<SiteConfig>>) => {
      state.config = { ...state.config, ...action.payload };
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchSiteConfig.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSiteConfig.fulfilled, (state, action) => {
        state.config = action.payload;
        state.loading = false;
        state.lastFetched = Date.now();
      })
      .addCase(fetchSiteConfig.rejected, (state, action) => {
        state.error = action.payload as string;
        state.loading = false;
      });
  },
});

export const { updateConfig, clearError } = siteConfigSlice.actions;
export default siteConfigSlice.reducer;
