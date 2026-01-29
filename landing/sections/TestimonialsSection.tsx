import React from 'react';
import { useScrollAnimation } from '../hooks/useScrollAnimation';

interface TestimonialProps {
  quote: string;
  name: string;
  role: string;
  delay?: number;
}

const TestimonialCard: React.FC<TestimonialProps> = ({ quote, name, role, delay = 0 }) => {
  const { ref, isVisible } = useScrollAnimation({ threshold: 0.2 });

  return (
    <div
      ref={ref}
      className={`testimonial-card hover-lift transition-all duration-700 ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'
      }`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      <p className="text-slate-700 text-lg leading-relaxed mb-6 pl-8">
        {quote}
      </p>
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
          {name.charAt(0)}
        </div>
        <div>
          <p className="font-semibold text-slate-900">{name}</p>
          <p className="text-slate-500 text-sm">{role}</p>
        </div>
      </div>
    </div>
  );
};

const TestimonialsSection: React.FC = () => {
  const { ref: titleRef, isVisible: titleVisible } = useScrollAnimation();

  const testimonials = [
    {
      quote: '부모님의 자산 정리가 막막했는데, LegacyVault 덕분에 체계적으로 정리할 수 있었습니다. AI 분석 기능이 특히 유용했어요.',
      name: '김민수',
      role: '서울, 40대 가장',
    },
    {
      quote: '변호사, 세무사 상담 비용만 해도 상당했는데, 기본적인 분석은 이 서비스로 충분합니다. 시간과 비용을 많이 절약했어요.',
      name: '이영희',
      role: '부산, 자영업자',
    },
    {
      quote: '해외에 있는 자녀들에게 자산 현황을 공유하기 어려웠는데, 이제는 안전하게 필요한 정보만 공유할 수 있어서 좋습니다.',
      name: '박정호',
      role: '대전, 은퇴자',
    },
  ];

  return (
    <section id="testimonials" className="py-24 md:py-32 bg-white">
      <div className="max-w-7xl mx-auto px-6">
        {/* Section Header */}
        <div
          ref={titleRef}
          className={`text-center max-w-3xl mx-auto mb-16 transition-all duration-700 ${
            titleVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
        >
          <span className="text-indigo-600 font-semibold mb-4 block">고객 후기</span>
          <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-6">
            고객들의 이야기
          </h2>
          <p className="text-xl text-slate-600">
            LegacyVault를 통해 유산 관리의 걱정을 덜어낸 분들의 경험을 들어보세요.
          </p>
        </div>

        {/* Testimonials Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <TestimonialCard
              key={index}
              quote={testimonial.quote}
              name={testimonial.name}
              role={testimonial.role}
              delay={index * 150}
            />
          ))}
        </div>

        {/* Trust Badges */}
        <div className="mt-16 flex flex-wrap items-center justify-center gap-8">
          <div className="flex items-center gap-3 px-6 py-3 bg-slate-50 rounded-xl">
            <svg className="w-8 h-8 text-indigo-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span className="text-slate-700 font-medium">금융보안원 인증</span>
          </div>
          <div className="flex items-center gap-3 px-6 py-3 bg-slate-50 rounded-xl">
            <svg className="w-8 h-8 text-indigo-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span className="text-slate-700 font-medium">ISO 27001 인증</span>
          </div>
          <div className="flex items-center gap-3 px-6 py-3 bg-slate-50 rounded-xl">
            <svg className="w-8 h-8 text-indigo-600" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            <span className="text-slate-700 font-medium">앱스토어 4.9점</span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
