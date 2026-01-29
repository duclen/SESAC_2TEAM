import React from 'react';
import { useScrollAnimation } from '../hooks/useScrollAnimation';

interface StepProps {
  number: number;
  title: string;
  description: string;
  isLast?: boolean;
  delay?: number;
}

const Step: React.FC<StepProps> = ({ number, title, description, isLast = false, delay = 0 }) => {
  const { ref, isVisible } = useScrollAnimation({ threshold: 0.3 });

  return (
    <div
      ref={ref}
      className={`relative flex gap-6 transition-all duration-700 ${
        isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-8'
      }`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {/* Step Number & Line */}
      <div className="flex flex-col items-center">
        <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center text-white text-2xl font-bold shadow-lg shadow-indigo-200">
          {number}
        </div>
        {!isLast && (
          <div className="w-0.5 h-full bg-gradient-to-b from-indigo-200 to-transparent mt-4" />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 pb-12">
        <h3 className="text-2xl font-bold text-slate-900 mb-3">{title}</h3>
        <p className="text-slate-600 text-lg leading-relaxed">{description}</p>
      </div>
    </div>
  );
};

const HowItWorksSection: React.FC = () => {
  const { ref: titleRef, isVisible: titleVisible } = useScrollAnimation();

  const steps = [
    {
      title: '계정 연결',
      description: '은행, 증권사, 보험사 계정을 안전하게 연결하세요. 오픈뱅킹 API를 통해 자동으로 자산 정보를 불러옵니다. 수동 입력도 가능합니다.',
    },
    {
      title: '상속인 지정',
      description: '가족 구성원을 등록하고 각자의 상속 비율을 설정하세요. 특정 자산은 특정 상속인에게 배분하는 것도 가능합니다.',
    },
    {
      title: 'AI 분석 받기',
      description: 'AI가 세금, 유동성, 법적 요건을 분석하여 최적의 상속 계획을 제안합니다. 필요한 문서 목록도 자동으로 정리해 드립니다.',
    },
    {
      title: '안전하게 보관',
      description: '모든 정보와 문서는 군사 수준의 암호화로 보호됩니다. 지정된 시점에 지정된 상속인에게만 정보가 전달됩니다.',
    },
  ];

  return (
    <section id="how-it-works" className="py-24 md:py-32 bg-slate-50">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-16 items-start">
          {/* Left: Header */}
          <div
            ref={titleRef}
            className={`lg:sticky lg:top-32 transition-all duration-700 ${
              titleVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}
          >
            <span className="text-indigo-600 font-semibold mb-4 block">이용 방법</span>
            <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-6">
              4단계로 끝나는<br />
              유산 관리
            </h2>
            <p className="text-xl text-slate-600 mb-8">
              복잡한 절차는 저희가 처리합니다.<br />
              당신은 중요한 결정에만 집중하세요.
            </p>

            {/* Visual Element */}
            <div className="hidden lg:block">
              <div className="relative w-full aspect-square max-w-sm">
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-3xl" />
                <div className="absolute inset-4 bg-white rounded-2xl shadow-xl flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-6xl mb-4">🏠</div>
                    <p className="text-slate-600 font-medium">소중한 자산을<br />안전하게</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Steps */}
          <div className="space-y-0">
            {steps.map((step, index) => (
              <Step
                key={index}
                number={index + 1}
                title={step.title}
                description={step.description}
                isLast={index === steps.length - 1}
                delay={index * 150}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;
