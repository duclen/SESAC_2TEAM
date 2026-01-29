import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const LandingHeader: React.FC = () => {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled ? 'nav-blur shadow-sm' : 'bg-transparent'
      }`}
    >
      <nav className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-lg">L</span>
            </div>
            <span className="text-xl font-bold text-slate-900">LegacyVault</span>
          </Link>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-slate-600 hover:text-slate-900 font-medium transition-colors">
              기능
            </a>
            <a href="#how-it-works" className="text-slate-600 hover:text-slate-900 font-medium transition-colors">
              이용방법
            </a>
            <a href="#testimonials" className="text-slate-600 hover:text-slate-900 font-medium transition-colors">
              후기
            </a>
          </div>

          {/* CTA Buttons */}
          <div className="flex items-center gap-3">
            <Link
              to="/app"
              className="hidden sm:inline-flex px-4 py-2 text-slate-600 font-medium hover:text-slate-900 transition-colors"
            >
              로그인
            </Link>
            <Link
              to="/app"
              className="px-5 py-2.5 bg-slate-900 text-white font-semibold rounded-xl hover:bg-slate-800 transition-colors"
            >
              무료로 시작하기
            </Link>
          </div>
        </div>
      </nav>
    </header>
  );
};

export default LandingHeader;
