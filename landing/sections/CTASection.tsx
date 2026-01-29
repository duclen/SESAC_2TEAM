import React from 'react';
import { Link } from 'react-router-dom';
import { useScrollAnimation } from '../hooks/useScrollAnimation';

const CTASection: React.FC = () => {
  const { ref, isVisible } = useScrollAnimation({ threshold: 0.3 });

  return (
    <section className="py-24 md:py-32 cta-gradient relative overflow-hidden">
      {/* Background Decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
      </div>

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div
          ref={ref}
          className={`text-center max-w-3xl mx-auto transition-all duration-700 ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
        >
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            지금 시작하세요
          </h2>
          <p className="text-xl text-indigo-100 mb-12 leading-relaxed">
            소중한 자산과 사랑하는 가족을 위한 첫 걸음.<br />
            무료로 시작하고, 필요할 때 업그레이드하세요.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/app"
              className="w-full sm:w-auto px-8 py-4 bg-white text-indigo-600 font-bold rounded-2xl hover:bg-indigo-50 transition-all shadow-xl shadow-indigo-900/20 text-lg"
            >
              무료로 시작하기
            </Link>
            <a
              href="#features"
              className="w-full sm:w-auto px-8 py-4 bg-white/10 text-white font-semibold rounded-2xl border-2 border-white/30 hover:bg-white/20 transition-all text-lg"
            >
              더 알아보기
            </a>
          </div>

          {/* Feature Highlights */}
          <div className="mt-12 flex flex-wrap items-center justify-center gap-6 text-indigo-100">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              <span>신용카드 불필요</span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              <span>30일 무료 체험</span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              <span>언제든 취소 가능</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTASection;
