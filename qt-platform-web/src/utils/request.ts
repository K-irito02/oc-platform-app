import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { message } from 'antd';

const request = axios.create({
  baseURL: '/api/v1',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 请求拦截器
request.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('access_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    // FormData 请求需要让浏览器自动设置 Content-Type（包含 boundary）
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// 响应拦截器
request.interceptors.response.use(
  (response) => {
    const { data } = response;
    if (data.code !== 0) {
      message.error(data.message || '请求失败');
      return Promise.reject(new Error(data.message));
    }
    return data;
  },
  (error: AxiosError<{ code: number; message: string }>) => {
    if (error.response) {
      const { status, data } = error.response;
      switch (status) {
        case 401:
          // Prevent infinite loop if already on login page
          if (!window.location.pathname.endsWith('/login')) {
            localStorage.removeItem('access_token');
            localStorage.removeItem('refresh_token');
            window.location.href = '/login';
          }
          break;
        case 403:
          message.error('权限不足');
          break;
        case 429:
          message.error('请求过于频繁，请稍后再试');
          break;
        default:
          message.error(data?.message || '服务器错误');
      }
    } else {
      message.error('网络连接失败');
    }
    return Promise.reject(error);
  }
);

export default request;
