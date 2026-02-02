import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { login, getAuthState } from '../../services/authService';

const LandingHeader: React.FC = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const authState = getAuthState();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogin = async () => {
    setIsLoggingIn(true);
    try {
      await login();
    } catch (error) {
      console.error('Login failed:', error);
      setIsLoggingIn(false);
    }
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled ? 'nav-blur shadow-sm' : 'bg-transparent'
      }`}
    >
      <nav className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center">
            <img src="/sangsokidda.png" alt="상속잇다" className="h-10" />
          </Link>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-neutral-500 hover:text-black font-medium transition-colors line-reveal">
              기능
            </a>
            <a href="#how-it-works" className="text-neutral-500 hover:text-black font-medium transition-colors line-reveal">
              이용방법
            </a>
            <a href="#testimonials" className="text-neutral-500 hover:text-black font-medium transition-colors line-reveal">
              후기
            </a>
          </div>

          {/* CTA Buttons */}
          <div className="flex items-center gap-3">
            {authState.isAuthenticated ? (
              <Link
                to="/app"
                className="px-5 py-2.5 bg-black text-white font-semibold rounded-full hover:bg-neutral-800 transition-colors"
              >
                대시보드
              </Link>
            ) : (
              <>
                <button
                  onClick={handleLogin}
                  disabled={isLoggingIn}
                  className="hidden sm:inline-flex px-4 py-2 text-neutral-500 font-medium hover:text-black transition-colors disabled:opacity-50"
                >
                  {isLoggingIn ? '로그인 중...' : '로그인'}
                </button>
                <button
                  onClick={handleLogin}
                  disabled={isLoggingIn}
                  className="px-5 py-2.5 bg-black text-white font-semibold rounded-full hover:bg-neutral-800 transition-colors disabled:opacity-50"
                >
                  {isLoggingIn ? '처리 중...' : '인증서 로그인'}
                </button>
              </>
            )}
          </div>
        </div>
      </nav>
    </header>
  );
};

export default LandingHeader;
