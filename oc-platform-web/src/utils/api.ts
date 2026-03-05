import request from './request';

// ===== Types =====
export interface PlatformOption {
  value: string;
  label: string;
  labelEn: string;
  icon: string;
  architectures: string[];
  enabled: boolean;
  sortOrder: number;
}

export interface ArchitectureOption {
  value: string;
  label: string;
  labelEn: string;
}

export interface PlatformConfig {
  platforms: PlatformOption[];
  architectures: ArchitectureOption[];
  allowCustomPlatform: boolean;
  allowCustomArchitecture: boolean;
}

// ===== Auth API =====
export const authApi = {
  login: (data: { email: string; password: string }) =>
    request.post('/auth/login', data, {
      headers: { 'X-Silent-Error': 'true' }
    }),
  register: (data: { username: string; email: string; password: string; verificationCode: string }) =>
    request.post('/auth/register', data),
  logout: () => request.post('/auth/logout'),
  refresh: (refreshToken: string) =>
    request.post('/auth/refresh', { refreshToken }),
  sendCode: (data: { email: string; type: string }) =>
    request.post('/auth/send-code', data),
  resetPassword: (data: { email: string; code: string; newPassword: string }) =>
    request.post('/auth/reset-password', data),
  changePassword: (data: { oldPassword: string; newPassword: string }) =>
    request.put('/auth/change-password', data),
  sendChangeEmailCode: (data: { newEmail: string }) =>
    request.post('/auth/send-change-email-code', data),
  changeEmail: (data: { code: string; newEmail: string }) =>
    request.put('/auth/change-email', data),
  getGithubUrl: () => request.get('/auth/oauth/github'),
  githubCallback: (code: string) =>
    request.get(`/auth/oauth/github/callback?code=${code}`),
};

// ===== User API =====
export const userApi = {
  getProfile: () => request.get('/users/profile'),
  updateProfile: (data: { bio?: string; avatarUrl?: string }) =>
    request.put('/users/profile', data),
  updateLanguage: (language: string) =>
    request.put('/users/language', { language }),
  getPublicProfile: (id: number) => request.get(`/users/${id}/public`),
  getTheme: () => request.get('/users/me/theme'),
  updateTheme: (themeConfig: string) =>
    request.put('/users/me/theme', { themeConfig }),
  uploadAvatar: (formData: FormData) =>
    request.post('/users/me/avatar', formData),
};

// ===== Product API =====
export const productApi = {
  list: (params: { page?: number; size?: number; categoryId?: number; sort?: string; keyword?: string }) =>
    request.get('/products', { params }),
  getFeatured: () => request.get('/products/featured'),
  getBySlug: (slug: string) => request.get(`/products/public/${slug}`),
  getById: (id: number) => request.get(`/products/public/id/${id}`),
  search: (params: { q: string; page?: number; size?: number }) =>
    request.get('/products/search', { params }),
  getVersions: (id: number) => request.get(`/products/${id}/versions`),
  getLatestVersion: (id: number) => request.get(`/products/${id}/versions/latest`),
  incrementDownload: (id: number) => request.post(`/products/${id}/download`),
  incrementVersionDownload: (versionId: number) => request.post(`/products/versions/${versionId}/download`),
  getPlatformConfig: () => request.get('/products/platform-config'),
};

// ===== Category API =====
export const categoryApi = {
  getAll: () => request.get('/categories'),
  getById: (id: number) => request.get(`/categories/${id}`),
};

// ===== Comment API =====
export const commentApi = {
  getProductComments: (productId: number, params: { page?: number; size?: number; sortBy?: string; sortOrder?: string }) =>
    request.get(`/comments/product/${productId}`, { params }),
  create: (productId: number, data: { content: string; parentId?: number; rating?: number }) =>
    request.post(`/comments/product/${productId}`, data, {
      headers: { 'X-Silent-Error': 'true' }
    }),
  update: (id: number, content: string) =>
    request.put(`/comments/${id}`, { content }),
  delete: (id: number) => request.delete(`/comments/${id}`),
  like: (id: number) => request.post(`/comments/${id}/like`),
  unlike: (id: number) => request.delete(`/comments/${id}/like`),
};

// ===== Rating API =====
export const ratingApi = {
  create: (productId: number, rating: number) =>
    request.post(`/ratings/product/${productId}`, { rating }),
  update: (id: number, rating: number) =>
    request.put(`/ratings/${id}`, { rating }),
  delete: (id: number) =>
    request.delete(`/ratings/${id}`),
  getStats: (productId: number) =>
    request.get(`/ratings/product/${productId}/stats`),
  getMyRating: (productId: number) =>
    request.get(`/ratings/product/${productId}/me`),
  getMyRatings: (params: { page?: number; size?: number }) =>
    request.get('/ratings/me', { params }),
};

// ===== Feedback API =====
export const feedbackApi = {
  create: (data: { content: string; email?: string; contact?: string; parentId?: number; isPublic?: boolean }) =>
    request.post('/feedbacks', data, {
      headers: { 'X-Silent-Error': 'true' }
    }),
  list: (params: { page?: number; size?: number; sortBy?: string; sortOrder?: string }) =>
    request.get('/feedbacks', { params }),
  like: (id: number) => request.post(`/feedbacks/${id}/like`),
  unlike: (id: number) => request.delete(`/feedbacks/${id}/like`),
};

// ===== Notification API =====
export const notificationApi = {
  list: (params: { page?: number; size?: number; isRead?: boolean }) =>
    request.get('/notifications', { params }),
  getUnreadCount: () => request.get('/notifications/unread-count'),
  markAsRead: (id: number) => request.put(`/notifications/${id}/read`),
  markAllRead: () => request.put('/notifications/read-all'),
};

// ===== File API =====
export const fileApi = {
  upload: (file: File, type = 'general') => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);
    return request.post('/files/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  uploadImage: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return request.post('/files/upload/image', formData);
  },
  uploadVideo: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return request.post('/files/upload/video', formData);
  },
  uploadAvatar: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return request.post('/files/upload/avatar', formData);
  },
  uploadProductImage: (file: File, productId: number) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('productId', String(productId));
    return request.post('/files/upload/product-image', formData);
  },
  uploadProductVideo: (file: File, productId: number) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('productId', String(productId));
    return request.post('/files/upload/product-video', formData);
  },
  uploadProductDownload: (file: File, productId: number) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('productId', String(productId));
    return request.post('/files/upload/product-download', formData);
  },
  uploadApplication: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', 'application');
    return request.post('/files/upload', formData);
  },
  getDownloadUrl: (fileId: number, expiry = 60) =>
    request.get(`/files/download-url/${fileId}`, { params: { expiry } }),
  download: (fileId: number) => `/api/v1/files/download/${fileId}`,
};

// ===== System API (Public) =====
export const systemApi = {
  getGlobalTheme: () => request.get('/system/theme'),
};

// ===== Update Check API =====
export const updateApi = {
  check: (params: { product: number; version: string; platform: string; arch?: string }) =>
    request.get('/updates/check', { params }),
};

// ===== Admin API =====
export const adminApi = {
  getDashboardStats: () => request.get('/admin/dashboard/stats'),
  // Users
  listUsers: (params: { page?: number; size?: number; keyword?: string; status?: string }) =>
    request.get('/admin/users', { params }),
  getUser: (id: number) => request.get(`/admin/users/${id}`),
  updateUserStatus: (id: number, status: string) =>
    request.put(`/admin/users/${id}/status`, { status }, {
      headers: { 'X-Silent-Error': 'true' }
    }),
  // Products
  listProducts: (params: { page?: number; size?: number; categoryId?: number; status?: string; keyword?: string }) =>
    request.get('/admin/products', { params }),
  getProduct: (id: number) => request.get(`/admin/products/${id}`),
  createProduct: (data: Record<string, unknown>) =>
    request.post('/admin/products', data),
  updateProduct: (id: number, data: Record<string, unknown>) =>
    request.put(`/admin/products/${id}`, data),
  deleteProduct: (id: number) => request.delete(`/admin/products/${id}`),
  auditProduct: (id: number, status: string) =>
    request.put(`/admin/products/${id}/audit`, { status }),
  updateDisplayVersion: (productId: number, platformKey: string, versionId: number | null) =>
    request.put(`/admin/products/${productId}/display-version`, { platformKey, versionId }),
  createVersion: (productId: number, data: Record<string, unknown>) =>
    request.post(`/admin/products/${productId}/versions`, data),
  updateVersion: (versionId: number, data: Record<string, unknown>) =>
    request.put(`/admin/products/versions/${versionId}`, data),
  deleteVersion: (versionId: number) =>
    request.delete(`/admin/products/versions/${versionId}`),
  publishVersion: (versionId: number) =>
    request.put(`/admin/products/versions/${versionId}/publish`),
  updateVersionShowOnDetail: (versionId: number, showOnDetail: boolean) =>
    request.put(`/admin/products/versions/${versionId}/show-on-detail`, { showOnDetail }),
  getVersions: (productId: number) =>
    request.get(`/admin/products/${productId}/versions`),
  // Comments
  listComments: (params: { page?: number; size?: number; status?: string; productId?: number }) =>
    request.get('/admin/comments', { params }),
  auditComment: (id: number, status: string) =>
    request.put(`/admin/comments/${id}/audit`, { status }),
  deleteComment: (id: number) => request.delete(`/admin/comments/${id}`),
  // Categories
  createCategory: (data: Record<string, unknown>) =>
    request.post('/admin/products/categories', data),
  updateCategory: (id: number, data: Record<string, unknown>) =>
    request.put(`/admin/products/categories/${id}`, data),
  deleteCategory: (id: number) =>
    request.delete(`/admin/products/categories/${id}`),
  // System
  getSystemConfigs: () => request.get('/admin/system/configs'),
  updateSystemConfig: (key: string, value: string) =>
    request.put(`/admin/system/configs/${key}`, { value }),
  // Audit logs
  getAuditLogs: (params: { page?: number; size?: number; userId?: number; action?: string }) =>
    request.get('/admin/audit-logs', { params }),
  // Theme
  getGlobalTheme: () => request.get('/admin/system/theme'),
  updateGlobalTheme: (themeConfig: string) =>
    request.put('/admin/system/theme', { themeConfig }),
  // Feedbacks
  listFeedbacks: (params: { page?: number; size?: number; status?: string; keyword?: string }) =>
    request.get('/feedbacks/admin', { params }),
  updateFeedbackStatus: (id: number, status: string) =>
    request.put(`/feedbacks/admin/${id}/status`, null, { params: { status } }),
  deleteFeedback: (id: number) => request.delete(`/feedbacks/admin/${id}`),
  // Platform Config
  updatePlatformConfig: (config: PlatformConfig) =>
    request.put('/products/platform-config', config),
  // Maintenance Mode
  getMaintenanceConfig: () => request.get('/admin/system/maintenance'),
  updateMaintenanceConfig: (data: {
    enabled: boolean;
    title: string;
    titleEn: string;
    message: string;
    messageEn: string;
    estimatedTime?: string | null;
  }) => request.put('/admin/system/maintenance', data),
  // Filing Config
  sendFilingCode: () => request.post('/admin/system/filing/send-code'),
  getFilingConfig: () => request.get('/admin/system/filing'),
  updateFilingConfig: (data: {
    verificationCode: string;
    icp: string;
    policeBeian: string;
    policeIconUrl?: string;
  }) => request.put('/admin/system/filing', data),
};
