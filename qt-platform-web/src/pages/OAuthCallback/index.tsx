import { useEffect, useState } from 'react';
import { Spin, Result, Button } from 'antd';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAppDispatch } from '@/store/hooks';
import { setCredentials } from '@/store/slices/authSlice';
import { authApi } from '@/utils/api';
import { useCallback } from 'react';

interface AuthResponse {
  data: {
    user: {
      id: number;
      email: string;
      username: string;
      avatarUrl?: string;
      roles: string[];
    };
    accessToken: string;
    refreshToken: string;
  };
}

export default function OAuthCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [error, setError] = useState('');

  const handleCallback = useCallback(async (code: string) => {
    try {
      const res = await authApi.githubCallback(code) as AuthResponse;
      dispatch(setCredentials({
        user: res.data.user,
        accessToken: res.data.accessToken,
        refreshToken: res.data.refreshToken,
      }));
      navigate('/', { replace: true });
    } catch {
      setError('GitHub login failed, please try again');
    }
  }, [dispatch, navigate]);

  useEffect(() => {
    const code = searchParams.get('code');
    if (!code) { setError('Missing authorization code'); return; }
    handleCallback(code);
  }, [searchParams, handleCallback]);

  
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Result 
          status="error" 
          title="Authorization Failed" 
          subTitle={error}
          extra={<Button type="primary" onClick={() => navigate('/login')}>Back to Login</Button>} 
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <Spin size="large" />
      <p className="mt-4 text-slate-500 dark:text-slate-400">Processing GitHub authorization...</p>
    </div>
  );
}
