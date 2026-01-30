import React, { useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useScrollAnimation } from '../../landing/hooks/useScrollAnimation';

interface FeatureData {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  benefits: string[];
  howItWorks: {
    step: number;
    title: string;
    description: string;
  }[];
  icon: React.ReactNode;
}

const featuresData: Record<string, FeatureData> = {
  'asset-management': {
    id: 'asset-management',
    title: '금융 자산 통합 관리',
    subtitle: '모든 자산을 한눈에',
    description: '은행, 증권, 보험, 부동산 등 흩어져 있는 모든 자산 정보를 한 곳에서 실시간으로 확인하고 관리하세요. 오픈뱅킹 API를 통해 자동으로 동기화되어 항상 최신 정보를 유지합니다.',
    benefits: [
      '50개 이상의 금융기관 연동 지원',
      '실시간 자산 현황 대시보드',
      '자산 변동 이력 추적 및 리포트',
      '부동산, 차량 등 비금융 자산 수동 등록',
      '가족 구성원별 자산 현황 공유',
    ],
    howItWorks: [
      { step: 1, title: '금융기관 선택', description: '연동할 은행, 증권사, 보험사를 선택합니다.' },
      { step: 2, title: '본인 인증', description: '공동인증서 또는 간편인증으로 본인 확인을 진행합니다.' },
      { step: 3, title: '자동 동기화', description: '계좌 정보가 자동으로 불러와지고 실시간 업데이트됩니다.' },
    ],
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
    ),
  },
  'heir-designation': {
    id: 'heir-designation',
    title: '상속인 지정 및 배분',
    subtitle: '체계적인 상속 계획',
    description: '가족 구성원별 상속 비율을 설정하고, 자산별 맞춤 배분 계획을 세우세요. 법적 요건에 맞는 문서도 자동으로 생성되어 복잡한 절차를 간소화합니다.',
    benefits: [
      '상속인별 비율 및 금액 자동 계산',
      '특정 자산의 특정 상속인 지정',
      '유류분 자동 검토 및 알림',
      '상속 계획서 PDF 자동 생성',
      '상속인 연락처 및 정보 안전 보관',
    ],
    howItWorks: [
      { step: 1, title: '상속인 등록', description: '가족 구성원의 정보와 관계를 등록합니다.' },
      { step: 2, title: '배분 비율 설정', description: '전체 또는 자산별 상속 비율을 설정합니다.' },
      { step: 3, title: '문서 생성', description: '법적 요건에 맞는 상속 계획서가 자동 생성됩니다.' },
    ],
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    ),
  },
  'ai-analysis': {
    id: 'ai-analysis',
    title: 'AI 기반 분석',
    subtitle: '전문가 수준의 인사이트',
    description: 'AI가 세금 영향, 유동성 리스크, 최적 상속 시기를 분석합니다. 변호사나 세무사 상담 전에 기본적인 분석을 받아보고, 더 효율적인 상담을 진행하세요.',
    benefits: [
      '상속세 예상 금액 자동 계산',
      '유동성 부족 리스크 사전 경고',
      '절세 전략 맞춤 제안',
      '상속 시나리오별 비교 분석',
      '24시간 AI 채팅 상담',
    ],
    howItWorks: [
      { step: 1, title: '자산 분석', description: 'AI가 등록된 자산의 유형과 규모를 분석합니다.' },
      { step: 2, title: '시뮬레이션', description: '다양한 상속 시나리오를 시뮬레이션합니다.' },
      { step: 3, title: '맞춤 제안', description: '최적의 상속 전략과 절세 방안을 제안합니다.' },
    ],
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
      </svg>
    ),
  },
  'digital-vault': {
    id: 'digital-vault',
    title: '디지털 금고',
    subtitle: '중요 문서 안전 보관',
    description: '유언장, 보험증권, 부동산 등기부 등 중요 문서를 암호화하여 안전하게 보관하세요. 지정된 상속인만 접근할 수 있으며, 설정된 조건에 따라 자동으로 공개됩니다.',
    benefits: [
      '군사 수준 256-bit AES 암호화',
      '문서별 접근 권한 세분화 설정',
      '자동 만료 알림 및 갱신 안내',
      '원본 파일 무결성 검증',
      '다중 백업으로 데이터 영구 보존',
    ],
    howItWorks: [
      { step: 1, title: '문서 업로드', description: '중요 문서를 안전하게 업로드합니다.' },
      { step: 2, title: '권한 설정', description: '문서별로 접근 가능한 상속인을 지정합니다.' },
      { step: 3, title: '조건 설정', description: '문서 공개 조건과 시점을 설정합니다.' },
    ],
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
  },
  'notifications': {
    id: 'notifications',
    title: '실시간 알림',
    subtitle: '놓치지 않는 관리',
    description: '자산 변동, 문서 만료, 법률 변경 등 중요한 이벤트를 실시간으로 알려드립니다. 이메일, SMS, 앱 푸시 등 원하는 방식으로 알림을 받아보세요.',
    benefits: [
      '자산 잔액 변동 즉시 알림',
      '보험/계약 만료 사전 알림',
      '상속 관련 법률 변경 안내',
      '상속인 정보 변경 감지',
      '맞춤형 알림 주기 설정',
    ],
    howItWorks: [
      { step: 1, title: '알림 설정', description: '받고 싶은 알림 유형을 선택합니다.' },
      { step: 2, title: '채널 선택', description: '이메일, SMS, 앱 푸시 중 선택합니다.' },
      { step: 3, title: '실시간 모니터링', description: '시스템이 24시간 변동 사항을 감지합니다.' },
    ],
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
      </svg>
    ),
  },
  'security': {
    id: 'security',
    title: '최고 수준 보안',
    subtitle: '철통같은 자산 보호',
    description: 'TLS 1.3, 256-bit AES 암호화, 다중 인증으로 자산 정보를 철저히 보호합니다. 금융보안원 인증을 받은 시스템으로 안심하고 사용하세요.',
    benefits: [
      'TLS 1.3 최신 암호화 프로토콜',
      '256-bit AES 데이터 암호화',
      '생체인증 및 OTP 다중 인증',
      '이상 접근 탐지 및 차단',
      '금융보안원 보안 인증 획득',
    ],
    howItWorks: [
      { step: 1, title: '계정 보호', description: '강력한 비밀번호와 다중 인증을 설정합니다.' },
      { step: 2, title: '데이터 암호화', description: '모든 데이터는 전송 및 저장 시 암호화됩니다.' },
      { step: 3, title: '실시간 감시', description: '24시간 보안 모니터링으로 위협을 차단합니다.' },
    ],
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
      </svg>
    ),
  },
};

const FeatureDetailPage: React.FC = () => {
  const { featureId } = useParams<{ featureId: string }>();
  const navigate = useNavigate();
  const { ref: heroRef, isVisible: heroVisible } = useScrollAnimation();
  const { ref: benefitsRef, isVisible: benefitsVisible } = useScrollAnimation();
  const { ref: stepsRef, isVisible: stepsVisible } = useScrollAnimation();

  const feature = featureId ? featuresData[featureId] : null;

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [featureId]);

  if (!feature) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-black mb-4">페이지를 찾을 수 없습니다</h1>
          <Link to="/" className="text-neutral-500 hover:text-black transition-colors">
            홈으로 돌아가기
          </Link>
        </div>
      </div>
    );
  }

  const featureKeys = Object.keys(featuresData);
  const currentIndex = featureKeys.indexOf(featureId || '');
  const prevFeature = currentIndex > 0 ? featuresData[featureKeys[currentIndex - 1]] : null;
  const nextFeature = currentIndex < featureKeys.length - 1 ? featuresData[featureKeys[currentIndex + 1]] : null;

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 nav-blur">
        <nav className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-10 h-10 bg-black rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">L</span>
              </div>
              <span className="text-xl font-bold text-black">LegacyVault</span>
            </Link>
            <div className="flex items-center gap-4">
              <Link
                to="/#features"
                className="text-neutral-500 hover:text-black font-medium transition-colors"
              >
                모든 기능
              </Link>
              <Link
                to="/app"
                className="px-5 py-2.5 bg-black text-white font-semibold rounded-full hover:bg-neutral-800 transition-colors"
              >
                시작하기
              </Link>
            </div>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6">
        <div
          ref={heroRef}
          className={`max-w-4xl mx-auto transition-all duration-700 ${
            heroVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
        >
          <Link
            to="/#features"
            className="inline-flex items-center gap-2 text-neutral-500 hover:text-black transition-colors mb-8"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            모든 기능 보기
          </Link>

          <div className="flex items-start gap-6 mb-8">
            <div className="w-16 h-16 bg-black rounded-2xl flex items-center justify-center text-white">
              {feature.icon}
            </div>
            <div>
              <p className="text-neutral-400 font-medium mb-2">{feature.subtitle}</p>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-black">
                {feature.title}
              </h1>
            </div>
          </div>

          <p className="text-xl text-neutral-600 leading-relaxed mb-12">
            {feature.description}
          </p>

          <Link
            to="/app"
            className="inline-flex px-8 py-4 bg-black text-white font-semibold rounded-full hover:bg-neutral-800 transition-all text-lg"
          >
            지금 시작하기
          </Link>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 px-6 bg-neutral-50">
        <div
          ref={benefitsRef}
          className={`max-w-4xl mx-auto transition-all duration-700 ${
            benefitsVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
        >
          <h2 className="text-3xl md:text-4xl font-bold text-black mb-12">주요 혜택</h2>
          <div className="space-y-6">
            {feature.benefits.map((benefit, index) => (
              <div
                key={index}
                className="flex items-start gap-4 p-6 bg-white rounded-xl border border-neutral-100 hover:border-neutral-300 transition-all"
              >
                <div className="w-8 h-8 bg-black rounded-full flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <p className="text-lg text-neutral-700">{benefit}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 px-6">
        <div
          ref={stepsRef}
          className={`max-w-4xl mx-auto transition-all duration-700 ${
            stepsVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
        >
          <h2 className="text-3xl md:text-4xl font-bold text-black mb-12">이용 방법</h2>
          <div className="space-y-8">
            {feature.howItWorks.map((step, index) => (
              <div key={index} className="flex gap-6">
                <div className="w-12 h-12 bg-black rounded-xl flex items-center justify-center text-white text-xl font-bold flex-shrink-0">
                  {step.step}
                </div>
                <div className="pt-2">
                  <h3 className="text-xl font-bold text-black mb-2">{step.title}</h3>
                  <p className="text-neutral-600">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Navigation */}
      <section className="py-12 px-6 border-t border-neutral-100">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          {prevFeature ? (
            <Link
              to={`/features/${prevFeature.id}`}
              className="flex items-center gap-3 text-neutral-500 hover:text-black transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <div className="text-right">
                <p className="text-sm text-neutral-400">이전</p>
                <p className="font-medium">{prevFeature.title}</p>
              </div>
            </Link>
          ) : (
            <div />
          )}
          {nextFeature ? (
            <Link
              to={`/features/${nextFeature.id}`}
              className="flex items-center gap-3 text-neutral-500 hover:text-black transition-colors"
            >
              <div>
                <p className="text-sm text-neutral-400">다음</p>
                <p className="font-medium">{nextFeature.title}</p>
              </div>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          ) : (
            <div />
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6 bg-black">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            지금 바로 시작하세요
          </h2>
          <p className="text-neutral-400 text-lg mb-8">
            무료로 시작하고, 필요할 때 업그레이드하세요.
          </p>
          <Link
            to="/app"
            className="inline-flex px-8 py-4 bg-white text-black font-bold rounded-full hover:bg-neutral-100 transition-all text-lg"
          >
            무료로 시작하기
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 border-t border-neutral-100">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <p className="text-neutral-500 text-sm">© 2024 LegacyVault</p>
          <Link to="/" className="text-neutral-500 hover:text-black transition-colors text-sm">
            홈으로
          </Link>
        </div>
      </footer>
    </div>
  );
};

export default FeatureDetailPage;
