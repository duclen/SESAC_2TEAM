import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { exchangeCodeForToken, saveAuthState, getUserInfo } from '../services/authService';

const CallbackPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const handleCallback = async () => {
      const code = searchParams.get('code');
      const error = searchParams.get('error');
      const errorDescription = searchParams.get('error_description');

      if (error) {
        setStatus('error');
        setErrorMessage(errorDescription || error);
        return;
      }

      if (!code) {
        setStatus('error');
        setErrorMessage('인증 코드가 없습니다.');
        return;
      }

      try {
        // Exchange code for tokens
        const tokenResponse = await exchangeCodeForToken(code);

        // Save auth state
        saveAuthState({
          isAuthenticated: true,
          accessToken: tokenResponse.access_token,
          refreshToken: tokenResponse.refresh_token || null,
        });

        // Try to get user info
        try {
          const userInfo = await getUserInfo(tokenResponse.access_token);
          saveAuthState({ userInfo });
        } catch {
          // User info is optional, continue without it
          console.warn('Could not fetch user info');
        }

        // Redirect to dashboard
        navigate('/app');
      } catch (err) {
        setStatus('error');
        setErrorMessage(err instanceof Error ? err.message : '인증 처리 중 오류가 발생했습니다.');
      }
    };

    handleCallback();
  }, [searchParams, navigate]);

  if (status === 'error') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-slate-900 mb-2">인증 실패</h2>
            <p className="text-slate-600 mb-6">{errorMessage}</p>
            <button
              onClick={() => navigate('/')}
              className="w-full px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
            >
              홈으로 돌아가기
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center">
      <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full mx-4">
        <div className="text-center">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">인증 처리 중...</h2>
          <p className="text-slate-600">잠시만 기다려 주세요.</p>
        </div>
      </div>
    </div>
  );
};

export default CallbackPage;
