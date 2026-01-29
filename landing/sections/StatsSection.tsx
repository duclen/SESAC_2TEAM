import React from 'react';
import { useScrollAnimation } from '../hooks/useScrollAnimation';
import { useCountUp } from '../hooks/useCountUp';

interface StatItemProps {
  value: number;
  suffix: string;
  label: string;
  delay?: number;
}

const StatItem: React.FC<StatItemProps> = ({ value, suffix, label, delay = 0 }) => {
  const { ref, isVisible } = useScrollAnimation({ threshold: 0.3 });
  const count = useCountUp({ end: value, duration: 2000, delay, enabled: isVisible });

  return (
    <div
      ref={ref}
      className={`text-center transition-all duration-700 ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
      }`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      <div className="text-5xl md:text-6xl font-bold text-slate-900 mb-2 stat-number">
        {count.toLocaleString()}{suffix}
      </div>
      <p className="text-slate-600 text-lg">{label}</p>
    </div>
  );
};

const StatsSection: React.FC = () => {
  const { ref: titleRef, isVisible: titleVisible } = useScrollAnimation();

  const stats = [
    { value: 10000, suffix: '+', label: '가족이 신뢰' },
    { value: 50, suffix: '조+', label: '관리 중인 자산' },
    { value: 99, suffix: '%', label: '고객 만족도' },
    { value: 24, suffix: '/7', label: '보안 모니터링' },
  ];

  return (
    <section className="py-24 md:py-32 bg-white">
      <div className="max-w-7xl mx-auto px-6">
        {/* Section Header */}
        <div
          ref={titleRef}
          className={`text-center max-w-3xl mx-auto mb-16 transition-all duration-700 ${
            titleVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
        >
          <span className="text-indigo-600 font-semibold mb-4 block">신뢰</span>
          <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-6">
            숫자로 증명하는 신뢰
          </h2>
          <p className="text-xl text-slate-600">
            수많은 가족들이 LegacyVault를 통해 소중한 자산을 관리하고 있습니다.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 md:gap-12">
          {stats.map((stat, index) => (
            <StatItem
              key={index}
              value={stat.value}
              suffix={stat.suffix}
              label={stat.label}
              delay={index * 150}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default StatsSection;
