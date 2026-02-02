import React from 'react';
import { useScrollAnimation } from '../hooks/useScrollAnimation';
import { useGridHover } from '../hooks/useGridHover';

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  delay?: number;
}

const FeatureCard: React.FC<FeatureCardProps> = ({ icon, title, description, delay = 0 }) => {
  const { ref, isVisible } = useScrollAnimation({ threshold: 0.2 });
  const { handlers, style, hoverState } = useGridHover(8);

  return (
    <div
      ref={ref}
      className={`grid-item p-8 cursor-pointer transition-all duration-700 ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'
      }`}
      style={{ ...style, transitionDelay: `${delay}ms` }}
      onMouseEnter={handlers.onMouseEnter}
      onMouseMove={handlers.onMouseMove}
      onMouseLeave={handlers.onMouseLeave}
    >
      <div className="grid-item-content">
        <div className="icon-container mb-6">
          {icon}
        </div>
        <h3 className="text-xl font-bold text-black mb-3">{title}</h3>
        <p className="text-neutral-500 leading-relaxed">{description}</p>

        {/* Hover indicator */}
        <div
          className={`mt-6 flex items-center gap-2 text-sm font-medium transition-all duration-300 ${
            hoverState.isHovered ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-2'
          }`}
        >
          <span className="text-black">자세히 보기</span>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
          </svg>
        </div>
      </div>
    </div>
  );
};

const FeaturesSection: React.FC = () => {
  const { ref: titleRef, isVisible: titleVisible } = useScrollAnimation();

  const features = [
    {
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      ),
      title: '금융 자산 통합 관리',
      description: '은행, 증권, 보험, 부동산 등 모든 자산을 한 곳에서 실시간으로 확인하고 관리하세요.',
    },
    {
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
      title: '상속인 지정 및 배분',
      description: '가족 구성원별 상속 비율을 설정하고, 자산별 맞춤 배분 계획을 세우세요.',
    },
    {
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
      ),
      title: 'AI 기반 분석',
      description: 'AI가 세금 영향, 유동성 리스크, 최적 상속 시기를 분석합니다.',
    },
    {
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      title: '디지털 금고',
      description: '중요 문서를 암호화하여 안전하게 보관하세요. 지정된 상속인만 접근 가능합니다.',
    },
    {
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
      ),
      title: '실시간 알림',
      description: '자산 변동, 문서 만료, 법률 변경 등 중요한 이벤트를 실시간으로 알려드립니다.',
    },
    {
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
      ),
      title: '최고 수준 보안',
      description: 'TLS 1.3, 256-bit AES 암호화, 다중 인증으로 자산 정보를 철저히 보호합니다.',
    },
  ];

  return (
    <section id="features" className="py-24 md:py-32 bg-white">
      <div className="max-w-7xl mx-auto px-6">
        {/* Section Header */}
        <div
          ref={titleRef}
          className={`text-center max-w-3xl mx-auto mb-16 transition-all duration-700 ${
            titleVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
        >
          <span className="text-neutral-400 font-medium mb-4 block uppercase tracking-widest text-sm">Features</span>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-black mb-6">
            유산 관리의 모든 것
          </h2>
          <p className="text-lg md:text-xl text-neutral-500">
            복잡한 상속 절차를 간단하게. 필요한 모든 기능을 한 플랫폼에서.
          </p>
        </div>

        {/* Feature Grid - Responsive with border gaps */}
        <div className="responsive-grid border border-neutral-100">
          {features.map((feature, index) => (
            <FeatureCard
              key={index}
              icon={feature.icon}
              title={feature.title}
              description={feature.description}
              delay={index * 80}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
