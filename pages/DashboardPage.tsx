import React, { useState, useEffect } from 'react';
import { Account, Heir, Document } from '../types';
import { MOCK_ACCOUNTS, MOCK_HEIRS, MOCK_DOCUMENTS } from '../constants';
import { chatWithAssistant } from '../geminiService';
import { logout, getAuthState } from '../services/authService';
import {
  calculateInheritanceTax,
  allocateTax,
  TaxCalculationResult,
  AllocationResult,
} from '../services/taxService';

type TabItem = 'overview' | 'tasks' | 'heirs' | 'distributions';

interface Task {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed';
  priority: 'high' | 'medium' | 'low';
  dueDate: string;
}

const MOCK_TASKS: Task[] = [
  { id: '1', title: '사망진단서 수집', description: '공인된 사망진단서 사본 확보', status: 'completed', priority: 'high', dueDate: '2025-01-10' },
  { id: '2', title: '금융기관 통보', description: '은행 및 증권사에 사망 통보', status: 'in_progress', priority: 'high', dueDate: '2025-01-20' },
  { id: '3', title: '가족관계증명서 발급', description: '주민센터에서 가족관계증명서 발급', status: 'completed', priority: 'high', dueDate: '2025-01-11' },
  { id: '4', title: '부동산 등기부등본 확인', description: '강남구 아파트 및 용인시 농지 등기 확인', status: 'in_progress', priority: 'high', dueDate: '2025-01-25' },
  { id: '5', title: '국민연금 유족급여 신청', description: '국민연금공단에 유족연금 신청', status: 'pending', priority: 'medium', dueDate: '2025-02-01' },
  { id: '6', title: '상속세 신고서 준비', description: '6개월 내 상속세 신고 완료', status: 'pending', priority: 'high', dueDate: '2025-07-10' },
  { id: '7', title: '상속재산 분할협의서 작성', description: '상속인 전원 합의 후 작성', status: 'pending', priority: 'medium', dueDate: '2025-03-01' },
  { id: '8', title: '자동차 명의이전', description: '그랜저 차량 상속인 명의로 이전', status: 'pending', priority: 'low', dueDate: '2025-04-10' },
];

// 추가 가능한 할 일 예시 목록
const SUGGESTED_TASKS: Omit<Task, 'id'>[] = [
  { title: '상속포기 신고서 작성', description: '상속포기 시 3개월 내 법원에 신고', status: 'pending', priority: 'high', dueDate: '' },
  { title: '한정승인 신청', description: '상속재산 범위 내에서만 채무 승계', status: 'pending', priority: 'high', dueDate: '' },
  { title: '피상속인 채무 조회', description: '금융감독원 채무조회 서비스 이용', status: 'pending', priority: 'high', dueDate: '' },
  { title: '보험금 청구', description: '생명보험, 손해보험 등 보험금 청구', status: 'pending', priority: 'medium', dueDate: '' },
  { title: '퇴직금 수령', description: '재직 중 사망 시 퇴직금 수령 절차', status: 'pending', priority: 'medium', dueDate: '' },
  { title: '공과금 명의변경', description: '전기, 가스, 수도 등 명의 변경', status: 'pending', priority: 'low', dueDate: '' },
  { title: '휴대폰 해지/명의변경', description: '통신사 방문하여 처리', status: 'pending', priority: 'low', dueDate: '' },
  { title: '신용카드 해지', description: '각 카드사에 사망 신고 및 해지', status: 'pending', priority: 'medium', dueDate: '' },
  { title: '연금 수급권 확인', description: '국민연금, 공무원연금 등 유족연금 확인', status: 'pending', priority: 'medium', dueDate: '' },
  { title: '주식 명의개서', description: '증권사 방문하여 상속인 명의로 변경', status: 'pending', priority: 'medium', dueDate: '' },
];

// 자동 진행 단계 정의 (데이터 기반)
interface ProgressStep {
  id: string;
  title: string;
  description: string;
  icon: string;
  checkComplete: (data: ProgressData) => boolean;
}

interface ProgressData {
  accounts: Account[];
  heirs: Heir[];
  docs: Document[];
  taxResult: TaxCalculationResult | null;
}

const PROGRESS_STEPS: ProgressStep[] = [
  {
    id: 'assets',
    title: '자산 연동',
    description: '금융 자산을 연동하세요',
    icon: '🏦',
    checkComplete: (data) => data.accounts.length > 0,
  },
  {
    id: 'heirs',
    title: '상속인 등록',
    description: '상속인을 등록하세요',
    icon: '👨‍👩‍👧‍👦',
    checkComplete: (data) => data.heirs.length > 0,
  },
  {
    id: 'documents',
    title: '필수 문서 업로드',
    description: '사망진단서, 가족관계증명서 등',
    icon: '📄',
    checkComplete: (data) => data.docs.length >= 2,
  },
  {
    id: 'tax',
    title: '상속세 계산',
    description: '예상 상속세를 계산하세요',
    icon: '🧮',
    checkComplete: (data) => data.taxResult !== null,
  },
  {
    id: 'distribution',
    title: '배분 계획 수립',
    description: '상속인별 배분 비율을 설정하세요',
    icon: '📊',
    checkComplete: (data) => data.heirs.length > 0 && data.heirs.every(h => h.allocation > 0),
  },
];

// 레벨 시스템 정의
interface LevelInfo {
  level: number;
  name: string;
  minPercent: number;
  maxPercent: number;
  icon: string;
  color: string;
  bgColor: string;
  borderColor: string;
}

const LEVELS: LevelInfo[] = [
  { level: 1, name: '시작', minPercent: 0, maxPercent: 19, icon: '🌱', color: 'text-slate-600', bgColor: 'bg-slate-100', borderColor: 'border-slate-300' },
  { level: 2, name: '준비', minPercent: 20, maxPercent: 39, icon: '🌿', color: 'text-blue-600', bgColor: 'bg-blue-100', borderColor: 'border-blue-300' },
  { level: 3, name: '진행', minPercent: 40, maxPercent: 59, icon: '🌳', color: 'text-slate-600', bgColor: 'bg-slate-100', borderColor: 'border-slate-300' },
  { level: 4, name: '마무리', minPercent: 60, maxPercent: 79, icon: '⭐', color: 'text-amber-600', bgColor: 'bg-amber-100', borderColor: 'border-amber-300' },
  { level: 5, name: '완료', minPercent: 80, maxPercent: 100, icon: '👑', color: 'text-emerald-600', bgColor: 'bg-emerald-100', borderColor: 'border-emerald-300' },
];

// 격려 메시지
const getMotivationalMessage = (completedSteps: number, totalSteps: number): string => {
  const percent = Math.round((completedSteps / totalSteps) * 100);
  if (completedSteps === 0) return '상속 준비를 시작해보세요!';
  if (percent < 40) return '좋은 시작이에요! 계속 진행해보세요.';
  if (percent < 60) return '잘 하고 있어요! 절반을 넘었어요!';
  if (percent < 80) return '대단해요! 거의 다 왔어요!';
  if (percent < 100) return '마지막 단계만 남았어요!';
  return '축하합니다! 모든 준비가 완료되었어요! 🎉';
};

const getCurrentLevel = (percent: number): LevelInfo => {
  return LEVELS.find(l => percent >= l.minPercent && percent <= l.maxPercent) || LEVELS[0];
};

const getNextLevel = (currentLevel: LevelInfo): LevelInfo | null => {
  const nextIndex = LEVELS.findIndex(l => l.level === currentLevel.level) + 1;
  return nextIndex < LEVELS.length ? LEVELS[nextIndex] : null;
};

const getTimeGreeting = (): string => {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return '좋은 아침이에요';
  if (hour >= 12 && hour < 17) return '좋은 오후예요';
  if (hour >= 17 && hour < 21) return '좋은 저녁이에요';
  return '좋은 밤이에요';
};

const DashboardPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabItem>('overview');
  const [accounts, setAccounts] = useState<Account[]>(MOCK_ACCOUNTS);
  const [heirs, setHeirs] = useState<Heir[]>(MOCK_HEIRS);
  const [tasks, setTasks] = useState<Task[]>(MOCK_TASKS);
  const [docs, setDocs] = useState<Document[]>(MOCK_DOCUMENTS);
  const [chatMessage, setChatMessage] = useState('');
  const [chatHistory, setChatHistory] = useState<{role: 'user' | 'assistant', text: string}[]>([]);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isAddTaskOpen, setIsAddTaskOpen] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [prevCompletedCount, setPrevCompletedCount] = useState(0);
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [newLevel, setNewLevel] = useState<LevelInfo | null>(null);

  // 상속세 계산기 상태
  const [taxInput, setTaxInput] = useState({
    total_assets: 0,
    children: 0,
    spouse_inherited: 0,
    financial_assets: 0,
    housing_deduction: 0,
    debts: 0,
  });
  const [taxResult, setTaxResult] = useState<TaxCalculationResult | null>(null);
  const [allocationResult, setAllocationResult] = useState<AllocationResult | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [taxError, setTaxError] = useState<string | null>(null);

  const authState = getAuthState();
  const userName = authState.userInfo?.user_name || '사용자';

  // 자동 진행률 계산 (데이터 기반)
  const progressData: ProgressData = { accounts, heirs, docs, taxResult };
  const completedSteps = PROGRESS_STEPS.filter(step => step.checkComplete(progressData));
  const completedStepCount = completedSteps.length;
  const totalSteps = PROGRESS_STEPS.length;
  const progressPercent = Math.round((completedStepCount / totalSteps) * 100);
  const currentLevel = getCurrentLevel(progressPercent);
  const nextLevel = getNextLevel(currentLevel);

  // 단계 완료 및 레벨업 감지
  useEffect(() => {
    if (prevCompletedCount > 0 && completedStepCount > prevCompletedCount) {
      // 단계 완료 축하
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 3000);

      // 레벨업 체크
      const prevPercent = Math.round((prevCompletedCount / totalSteps) * 100);
      const newPercent = progressPercent;
      const prevLevel = getCurrentLevel(prevPercent);
      const newLevelInfo = getCurrentLevel(newPercent);
      if (newLevelInfo.level > prevLevel.level) {
        setNewLevel(newLevelInfo);
        setShowLevelUp(true);
        setTimeout(() => setShowLevelUp(false), 3000);
      }
    }
    setPrevCompletedCount(completedStepCount);
  }, [completedStepCount, totalSteps, progressPercent, prevCompletedCount]);

  // 할 일 추가 함수
  const handleAddTask = (suggestedTask: Omit<Task, 'id'>) => {
    const today = new Date();
    const dueDate = new Date(today.setMonth(today.getMonth() + 1));
    const newTask: Task = {
      ...suggestedTask,
      id: String(Date.now()),
      dueDate: suggestedTask.dueDate || dueDate.toISOString().split('T')[0],
    };
    setTasks(prev => [...prev, newTask]);
    setIsAddTaskOpen(false);
  };

  const handleSendMessage = async () => {
    if (!chatMessage.trim()) return;
    const userMsg = chatMessage;
    setChatMessage('');
    setChatHistory(prev => [...prev, { role: 'user', text: userMsg }]);
    const response = await chatWithAssistant(userMsg, { accounts, heirs });
    setChatHistory(prev => [...prev, { role: 'assistant', text: response || '오류가 발생했습니다' }]);
  };

  // 상속세 계산 핸들러
  const handleCalculateTax = async () => {
    setIsCalculating(true);
    setTaxError(null);

    try {
      // 총 자산이 0이면 연동된 자산 사용
      const inputData = {
        ...taxInput,
        total_assets: taxInput.total_assets || totalEstate,
      };

      const result = await calculateInheritanceTax(inputData);
      setTaxResult(result);

      // 상속인별 세액 안분
      if (result.tax > 0 && heirs.length > 0) {
        const heirData = heirs.map(h => ({
          name: h.name,
          inherited_assets: Math.round(totalEstate * (h.allocation / 100)),
        }));
        const allocation = await allocateTax(result.tax, heirData);
        setAllocationResult(allocation);
      }
    } catch (err) {
      setTaxError(err instanceof Error ? err.message : '계산 중 오류가 발생했습니다');
    } finally {
      setIsCalculating(false);
    }
  };

  const formatter = new Intl.NumberFormat('ko-KR', { style: 'currency', currency: 'KRW' });
  const totalEstate = accounts.reduce((sum, acc) => sum + acc.balance, 0);

  const tabs: { id: TabItem; label: string; icon: React.ReactNode }[] = [
    {
      id: 'overview',
      label: '개요',
      icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
    },
    {
      id: 'tasks',
      label: '할 일',
      icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>
    },
    {
      id: 'heirs',
      label: '상속인',
      icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
    },
    {
      id: 'distributions',
      label: '배분',
      icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
    },
  ];

  const pendingTasks = tasks.filter(t => t.status === 'pending').length;
  const inProgressTasks = tasks.filter(t => t.status === 'in_progress').length;
  const completedTasks = tasks.filter(t => t.status === 'completed').length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 to-slate-200">
      {/* Top Header */}
      <header className="bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <img src="/sangsokidda.png" alt="상속잇다" className="h-10" />
              <p className="text-xs text-slate-500">김철수님의 유산</p>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-slate-600">총 유산 가치:</span>
              <span className="text-lg font-bold text-blue-600">{formatter.format(totalEstate)}</span>
              <button
                onClick={logout}
                className="ml-4 px-4 py-2 text-sm text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
              >
                로그아웃
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Tab Navigation */}
      <nav className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-all ${
                  activeTab === tab.id
                    ? 'border-blue-600 text-blue-600 bg-blue-50/50'
                    : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm text-slate-500">진행 현황</span>
                  <span className="text-sm font-semibold text-slate-900">{completedTasks}/{tasks.length}</span>
                </div>
                <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-600 rounded-full transition-all" style={{ width: `${(completedTasks / tasks.length) * 100}%` }} />
                </div>
                <div className="text-xs text-slate-400 mt-2">{Math.round((completedTasks / tasks.length) * 100)}% 완료</div>
              </div>
              <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-sm">
                <div className="text-sm text-slate-500 mb-1">문서</div>
                <div className="text-2xl font-bold text-slate-900">{docs.length}건</div>
                <div className="text-xs text-slate-400 mt-1">보관 중</div>
              </div>
              <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-sm">
                <div className="text-sm text-slate-500 mb-1">상속인</div>
                <div className="text-2xl font-bold text-slate-900">{heirs.length}명</div>
                <div className="flex items-center gap-1 mt-2">
                  {heirs.map(heir => (
                    <div
                      key={heir.id}
                      className={`w-3 h-3 rounded-full ${heir.status === 'active' ? 'bg-emerald-500' : 'bg-slate-300'}`}
                      title={`${heir.name} - ${heir.status === 'active' ? '활성' : '대기'}`}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Upcoming Tasks + Greeting */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2 bg-white rounded-lg border border-slate-200 shadow-sm">
                <div className="px-5 py-4 border-b border-slate-100">
                  <h3 className="font-semibold text-slate-900">예정된 할 일</h3>
                </div>
                <div className="divide-y divide-slate-100">
                  {tasks.filter(t => t.status !== 'completed').slice(0, 3).map(task => (
                    <div key={task.id} className="px-5 py-3 flex items-center justify-between hover:bg-slate-50">
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${
                          task.priority === 'high' ? 'bg-red-500' : task.priority === 'medium' ? 'bg-amber-500' : 'bg-slate-400'
                        }`} />
                        <div>
                          <p className="text-sm font-medium text-slate-900">{task.title}</p>
                          <p className="text-xs text-slate-500">마감: {task.dueDate}</p>
                        </div>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                        task.status === 'in_progress' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {task.status === 'in_progress' ? '진행 중' : '대기'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-sm p-5 flex flex-col justify-center">
                <h2 className="text-xl font-bold text-white mb-2">
                  {userName}님,<br />{getTimeGreeting()}
                </h2>
                <p className="text-blue-100 text-sm">
                  오늘도 함께 해주셔서 감사합니다.
                </p>
              </div>
            </div>

            {/* Assets Table */}
            <div className="bg-white rounded-lg border border-slate-200 shadow-sm">
              <div className="px-5 py-4 border-b border-slate-100">
                <h3 className="font-semibold text-slate-900">자산 요약</h3>
              </div>
              <table className="w-full">
                <thead className="bg-slate-50 text-left">
                  <tr>
                    <th className="px-5 py-3 text-xs font-semibold text-slate-500 uppercase">금융기관</th>
                    <th className="px-5 py-3 text-xs font-semibold text-slate-500 uppercase">계좌명</th>
                    <th className="px-5 py-3 text-xs font-semibold text-slate-500 uppercase">유형</th>
                    <th className="px-5 py-3 text-xs font-semibold text-slate-500 uppercase text-right">금액</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {accounts.map(account => (
                    <tr key={account.id} className="hover:bg-slate-50">
                      <td className="px-5 py-4 text-sm font-medium text-slate-900">{account.institution}</td>
                      <td className="px-5 py-4 text-sm text-slate-600">{account.name}</td>
                      <td className="px-5 py-4">
                        <span className="text-xs px-2 py-1 rounded bg-slate-100 text-slate-600">{account.category}</span>
                      </td>
                      <td className="px-5 py-4 text-sm font-semibold text-slate-900 text-right">{formatter.format(account.balance)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-slate-50">
                  <tr>
                    <td colSpan={3} className="px-5 py-3 text-sm font-semibold text-slate-900">합계</td>
                    <td className="px-5 py-3 text-sm font-bold text-blue-600 text-right">{formatter.format(totalEstate)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        )}

        {/* Tasks Tab */}
        {activeTab === 'tasks' && (
          <div className="space-y-6">
            {/* Gamified Progress Bar */}
            <div className={`relative bg-gradient-to-br from-white to-slate-50 rounded-2xl border-2 ${currentLevel.borderColor} p-6 shadow-lg overflow-hidden`}>
              {/* Confetti Animation */}
              {showConfetti && (
                <div className="absolute inset-0 pointer-events-none z-10">
                  {[...Array(50)].map((_, i) => (
                    <div
                      key={i}
                      className="absolute animate-bounce"
                      style={{
                        left: `${Math.random() * 100}%`,
                        top: `${Math.random() * 100}%`,
                        animationDelay: `${Math.random() * 0.5}s`,
                        animationDuration: `${0.5 + Math.random() * 0.5}s`,
                      }}
                    >
                      <span className="text-lg">{['🎉', '✨', '⭐', '🌟', '💫'][Math.floor(Math.random() * 5)]}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Level Up Notification */}
              {showLevelUp && newLevel && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-20 animate-pulse">
                  <div className="bg-white rounded-2xl p-8 text-center shadow-2xl transform animate-bounce">
                    <div className="text-5xl mb-3">{newLevel.icon}</div>
                    <h3 className="text-2xl font-bold text-slate-900 mb-1">레벨 업!</h3>
                    <p className={`text-lg font-semibold ${newLevel.color}`}>{newLevel.name} 달성!</p>
                  </div>
                </div>
              )}

              {/* Header with Level Badge */}
              <div className="flex items-start justify-between mb-5">
                <div className="flex items-center gap-4">
                  {/* Level Badge */}
                  <div className={`w-16 h-16 ${currentLevel.bgColor} rounded-2xl flex items-center justify-center text-3xl shadow-inner border-2 ${currentLevel.borderColor}`}>
                    {currentLevel.icon}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${currentLevel.bgColor} ${currentLevel.color}`}>
                        Lv.{currentLevel.level}
                      </span>
                      <h3 className={`text-xl font-bold ${currentLevel.color}`}>{currentLevel.name}</h3>
                    </div>
                    <p className="text-sm text-slate-500 mt-1">
                      {completedStepCount}단계 완료 / {totalSteps}단계 전체
                    </p>
                    <p className="text-sm text-slate-600 mt-1 font-medium">
                      {getMotivationalMessage(completedStepCount, totalSteps)}
                    </p>
                  </div>
                </div>

                {/* Percentage Display */}
                <div className="text-right">
                  <div className={`text-4xl font-black ${currentLevel.color}`}>
                    {progressPercent}%
                  </div>
                  {nextLevel && (
                    <p className="text-xs text-slate-400 mt-1">
                      다음 레벨까지 {nextLevel.minPercent - progressPercent}%
                    </p>
                  )}
                </div>
              </div>

              {/* Progress Bar with Step Markers */}
              <div className="relative mb-4">
                {/* Step Markers */}
                <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex justify-between px-0 z-10 pointer-events-none">
                  {PROGRESS_STEPS.map((step, index) => {
                    const position = ((index + 1) / totalSteps) * 100;
                    const isComplete = step.checkComplete(progressData);
                    return (
                      <div
                        key={step.id}
                        className="absolute transform -translate-x-1/2"
                        style={{ left: `${position}%` }}
                      >
                        <div
                          className={`w-7 h-7 rounded-full flex items-center justify-center text-sm transition-all duration-500 ${
                            isComplete
                              ? 'bg-gradient-to-br from-emerald-400 to-emerald-500 text-white shadow-lg scale-110'
                              : 'bg-white border-2 border-slate-300'
                          }`}
                        >
                          {isComplete ? '✓' : step.icon}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Progress Bar Background */}
                <div className="h-6 bg-slate-200 rounded-full overflow-hidden shadow-inner">
                  {/* Progress Bar Fill with Shine Effect */}
                  <div
                    className="h-full rounded-full transition-all duration-700 ease-out relative overflow-hidden"
                    style={{
                      width: `${progressPercent}%`,
                      background: progressPercent === 100
                        ? 'linear-gradient(90deg, #10b981, #059669, #10b981)'
                        : 'linear-gradient(90deg, #3b82f6, #8b5cf6, #3b82f6)',
                      backgroundSize: '200% 100%',
                      animation: 'shimmer 2s linear infinite',
                    }}
                  >
                    {/* Shine Overlay */}
                    <div
                      className="absolute inset-0 opacity-30"
                      style={{
                        background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.5) 50%, transparent 100%)',
                        animation: 'shine 2s ease-in-out infinite',
                      }}
                    />
                    {/* Pulse Effect at End */}
                    {progressPercent > 0 && progressPercent < 100 && (
                      <div className="absolute right-0 top-0 bottom-0 w-4 bg-white/40 animate-pulse rounded-full" />
                    )}
                  </div>
                </div>
              </div>

              {/* Step Progress Cards */}
              <div className="mt-5 pt-5 border-t border-slate-200">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-semibold text-slate-700">상속 준비 단계</span>
                  <span className="text-xs text-slate-400">{completedStepCount}/{totalSteps} 완료</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
                  {PROGRESS_STEPS.map((step) => {
                    const isComplete = step.checkComplete(progressData);
                    return (
                      <div
                        key={step.id}
                        className={`p-4 rounded-xl text-center transition-all duration-300 ${
                          isComplete
                            ? 'bg-gradient-to-br from-emerald-50 to-emerald-100 border-2 border-emerald-300 shadow-md'
                            : 'bg-slate-50 border-2 border-slate-200'
                        }`}
                      >
                        <div className={`text-2xl mb-2 ${isComplete ? '' : 'grayscale opacity-50'}`}>
                          {isComplete ? '✅' : step.icon}
                        </div>
                        <div className={`text-xs font-semibold ${isComplete ? 'text-emerald-700' : 'text-slate-500'}`}>
                          {step.title}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-1 line-clamp-2">
                          {isComplete ? '완료!' : step.description}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Data Summary */}
              <div className="grid grid-cols-4 gap-3 mt-5 pt-5 border-t border-slate-200">
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{accounts.length}</div>
                  <div className="text-xs text-slate-500">연동 자산</div>
                </div>
                <div className="text-center p-3 bg-slate-50 rounded-lg">
                  <div className="text-2xl font-bold text-slate-600">{heirs.length}</div>
                  <div className="text-xs text-slate-500">상속인</div>
                </div>
                <div className="text-center p-3 bg-amber-50 rounded-lg">
                  <div className="text-2xl font-bold text-amber-600">{docs.length}</div>
                  <div className="text-xs text-slate-500">문서</div>
                </div>
                <div className="text-center p-3 bg-emerald-50 rounded-lg">
                  <div className="text-2xl font-bold text-emerald-600">
                    {completedStepCount}/{totalSteps}
                  </div>
                  <div className="text-xs text-slate-500">진행률</div>
                </div>
              </div>
            </div>

            {/* CSS for animations */}
            <style>{`
              @keyframes shimmer {
                0% { background-position: 200% 0; }
                100% { background-position: -200% 0; }
              }
              @keyframes shine {
                0% { transform: translateX(-100%); }
                100% { transform: translateX(200%); }
              }
            `}</style>

            {/* Task List */}
            <div className="bg-white rounded-lg border border-slate-200 shadow-sm">
              <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                <h3 className="font-semibold text-slate-900">전체 할 일</h3>
                <button
                  onClick={() => setIsAddTaskOpen(true)}
                  className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                >
                  + 할 일 추가
                </button>
              </div>
              <div className="divide-y divide-slate-100">
                {tasks.map(task => (
                  <div key={task.id} className="px-5 py-4 flex items-center gap-4 hover:bg-slate-50">
                    {/* Status Icon */}
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                      task.status === 'completed' ? 'bg-emerald-100' :
                      task.status === 'in_progress' ? 'bg-blue-100' : 'bg-slate-100'
                    }`}>
                      {task.status === 'completed' ? (
                        <svg className="w-4 h-4 text-emerald-600" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      ) : task.status === 'in_progress' ? (
                        <svg className="w-4 h-4 text-blue-600 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      )}
                    </div>
                    {/* Priority Indicator */}
                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                      task.priority === 'high' ? 'bg-red-500' : task.priority === 'medium' ? 'bg-amber-500' : 'bg-slate-400'
                    }`} />
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium ${task.status === 'completed' ? 'text-slate-400 line-through' : 'text-slate-900'}`}>
                        {task.title}
                      </p>
                      <p className="text-xs text-slate-500 truncate">{task.description}</p>
                    </div>
                    <div className="text-xs text-slate-500">{task.dueDate}</div>
                    <span className={`text-xs px-2 py-1 rounded-full font-medium flex-shrink-0 ${
                      task.status === 'completed' ? 'bg-emerald-100 text-emerald-700' :
                      task.status === 'in_progress' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {task.status === 'completed' ? '완료' : task.status === 'in_progress' ? '진행 중' : '대기'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Heirs Tab */}
        {activeTab === 'heirs' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-900">상속인 관리</h2>
              <button className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors">
                + 상속인 추가
              </button>
            </div>

            {/* 상속 동의 현황 */}
            <div className="bg-gradient-to-r from-slate-700 to-slate-800 rounded-xl p-6 text-white">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-bold">상속 동의 현황</h3>
                  <p className="text-slate-300 text-sm">상속인들의 상속 분할 동의 상태</p>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold">{heirs.filter(h => h.status === 'active').length}/{heirs.length}</div>
                  <div className="text-slate-300 text-sm">동의 완료</div>
                </div>
              </div>
              <div className="h-3 bg-slate-600/50 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-400 rounded-full transition-all"
                  style={{ width: `${(heirs.filter(h => h.status === 'active').length / heirs.length) * 100}%` }}
                />
              </div>
              <div className="grid grid-cols-3 gap-4 mt-4">
                <div className="bg-white/10 rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold">{heirs.filter(h => h.status === 'active').length}</div>
                  <div className="text-xs text-slate-300">동의 완료</div>
                </div>
                <div className="bg-white/10 rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold">{heirs.filter(h => h.status === 'pending').length}</div>
                  <div className="text-xs text-slate-300">대기 중</div>
                </div>
                <div className="bg-white/10 rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold">0</div>
                  <div className="text-xs text-slate-300">거부</div>
                </div>
              </div>
            </div>

            {/* 유언장 열람 섹션 */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                    <span className="text-xl">📜</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900">유언장 열람</h3>
                    <p className="text-sm text-slate-500">금고에 보관된 유언장을 확인하세요</p>
                  </div>
                </div>
                <span className="px-3 py-1 bg-emerald-100 text-emerald-700 text-xs font-medium rounded-full">
                  보관됨
                </span>
              </div>
              <div className="p-6">
                <div className="flex items-center gap-6">
                  {/* 유언장 미리보기 */}
                  <div className="w-32 h-40 bg-gradient-to-br from-amber-50 to-amber-100 rounded-lg border-2 border-amber-200 flex flex-col items-center justify-center">
                    <span className="text-4xl mb-2">📄</span>
                    <span className="text-xs text-amber-700 font-medium">자필유언장</span>
                    <span className="text-[10px] text-amber-600">2024.12.15</span>
                  </div>

                  {/* 유언장 정보 */}
                  <div className="flex-1">
                    <h4 className="font-semibold text-slate-900 mb-2">자필유언장_2024.pdf</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2 text-slate-600">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span>작성일: 2024년 12월 15일</span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-600">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                        <span>AES-256 암호화 보관</span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-600">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>공증 완료</span>
                      </div>
                    </div>

                    <div className="flex gap-3 mt-4">
                      <button className="px-4 py-2 bg-amber-600 text-white text-sm font-medium rounded-lg hover:bg-amber-700 transition-colors flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        유언장 열람
                      </button>
                      <button className="px-4 py-2 border border-slate-200 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-50 transition-colors">
                        다운로드
                      </button>
                    </div>
                  </div>
                </div>

                {/* 열람 기록 */}
                <div className="mt-6 pt-6 border-t border-slate-100">
                  <h4 className="text-sm font-semibold text-slate-700 mb-3">최근 열람 기록</h4>
                  <div className="space-y-2">
                    {[
                      { name: '김영희', date: '2025.01.28 14:30', action: '열람' },
                      { name: '김철수', date: '2025.01.27 10:15', action: '열람' },
                      { name: '대리인', date: '2025.01.25 09:00', action: '확인' },
                    ].map((log, i) => (
                      <div key={i} className="flex items-center justify-between py-2 px-3 bg-slate-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-slate-200 rounded-full flex items-center justify-center text-xs font-bold text-slate-600">
                            {log.name.charAt(0)}
                          </div>
                          <span className="text-sm text-slate-700">{log.name}</span>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="text-xs text-slate-500">{log.date}</span>
                          <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full">{log.action}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* 상속인 목록 */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {heirs.map(heir => (
                <div key={heir.id} className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
                  <div className="p-5">
                    <div className="flex items-start gap-4">
                      <div className="relative">
                        <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center text-xl font-bold text-blue-600">
                          {heir.name.charAt(0).toUpperCase()}
                        </div>
                        {/* 동의 상태 뱃지 */}
                        <div className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center ${
                          heir.status === 'active' ? 'bg-emerald-500' : 'bg-amber-500'
                        }`}>
                          {heir.status === 'active' ? (
                            <svg className="w-3.5 h-3.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          ) : (
                            <svg className="w-3.5 h-3.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                            </svg>
                          )}
                        </div>
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-slate-900">{heir.name}</h3>
                        <p className="text-sm text-slate-500">{heir.relationship}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                            heir.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                          }`}>
                            {heir.status === 'active' ? '동의 완료' : '동의 대기'}
                          </span>
                          {heir.status === 'active' && (
                            <span className="text-xs text-slate-400">2025.01.15</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="px-5 py-4 bg-slate-50 border-t border-slate-100">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-slate-600">배분 비율</span>
                      <span className="text-sm font-semibold text-slate-900">{heir.allocation}%</span>
                    </div>
                    <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-600 rounded-full" style={{ width: `${heir.allocation}%` }} />
                    </div>
                    <div className="mt-3 text-sm text-slate-600">
                      예상 금액: <span className="font-semibold text-slate-900">{formatter.format(totalEstate * (heir.allocation / 100))}</span>
                    </div>
                    {heir.status !== 'active' && (
                      <button className="w-full mt-3 px-3 py-2 bg-slate-600 text-white text-sm font-medium rounded-lg hover:bg-slate-700 transition-colors">
                        동의 요청 재발송
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Distributions Tab */}
        {activeTab === 'distributions' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-900">배분 계획</h2>
              <button className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors">
                리포트 생성
              </button>
            </div>

            {/* Distribution Summary */}
            <div className="bg-white rounded-lg border border-slate-200 shadow-sm">
              <div className="px-5 py-4 border-b border-slate-100">
                <h3 className="font-semibold text-slate-900">배분 개요</h3>
              </div>
              <div className="p-5">
                <div className="flex items-center gap-8 mb-6">
                  <div>
                    <div className="text-sm text-slate-500">총 유산</div>
                    <div className="text-2xl font-bold text-slate-900">{formatter.format(totalEstate)}</div>
                  </div>
                  <div className="h-12 w-px bg-slate-200" />
                  <div>
                    <div className="text-sm text-slate-500">상속인 수</div>
                    <div className="text-2xl font-bold text-slate-900">{heirs.length}명</div>
                  </div>
                  <div className="h-12 w-px bg-slate-200" />
                  <div>
                    <div className="text-sm text-slate-500">배분 완료</div>
                    <div className="text-2xl font-bold text-emerald-600">{formatter.format(0)}</div>
                  </div>
                </div>

                {/* Distribution Chart (simple bar) */}
                <div className="space-y-4">
                  {heirs.map(heir => (
                    <div key={heir.id}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-slate-700">{heir.name}</span>
                        <span className="text-sm text-slate-500">{heir.allocation}% • {formatter.format(totalEstate * (heir.allocation / 100))}</span>
                      </div>
                      <div className="h-6 bg-slate-100 rounded overflow-hidden">
                        <div
                          className="h-full bg-blue-600 rounded flex items-center justify-end pr-2"
                          style={{ width: `${heir.allocation}%` }}
                        >
                          {heir.allocation >= 20 && (
                            <span className="text-xs text-white font-medium">{heir.allocation}%</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Distribution Table */}
            <div className="bg-white rounded-lg border border-slate-200 shadow-sm">
              <div className="px-5 py-4 border-b border-slate-100">
                <h3 className="font-semibold text-slate-900">상속인별 자산 배분</h3>
              </div>
              <table className="w-full">
                <thead className="bg-slate-50 text-left">
                  <tr>
                    <th className="px-5 py-3 text-xs font-semibold text-slate-500 uppercase">상속인</th>
                    <th className="px-5 py-3 text-xs font-semibold text-slate-500 uppercase">관계</th>
                    <th className="px-5 py-3 text-xs font-semibold text-slate-500 uppercase text-center">배분율</th>
                    <th className="px-5 py-3 text-xs font-semibold text-slate-500 uppercase text-right">예상 금액</th>
                    <th className="px-5 py-3 text-xs font-semibold text-slate-500 uppercase text-right">상태</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {heirs.map(heir => (
                    <tr key={heir.id} className="hover:bg-slate-50">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-sm font-bold text-blue-600">
                            {heir.name.charAt(0)}
                          </div>
                          <span className="text-sm font-medium text-slate-900">{heir.name}</span>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-sm text-slate-600">{heir.relationship}</td>
                      <td className="px-5 py-4 text-sm text-slate-900 text-center font-semibold">{heir.allocation}%</td>
                      <td className="px-5 py-4 text-sm font-semibold text-slate-900 text-right">
                        {formatter.format(totalEstate * (heir.allocation / 100))}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <span className="text-xs px-2 py-1 rounded-full bg-amber-100 text-amber-700 font-medium">
                          대기
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-slate-50">
                  <tr>
                    <td colSpan={2} className="px-5 py-3 text-sm font-semibold text-slate-900">합계</td>
                    <td className="px-5 py-3 text-sm font-bold text-slate-900 text-center">100%</td>
                    <td className="px-5 py-3 text-sm font-bold text-blue-600 text-right">{formatter.format(totalEstate)}</td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* 상속세 계산기 */}
            <div className="bg-white rounded-lg border border-slate-200 shadow-sm">
              <div className="px-5 py-4 border-b border-slate-100">
                <h3 className="font-semibold text-slate-900">상속세 계산기</h3>
                <p className="text-xs text-slate-500 mt-1">2026년 현행 세법 기준</p>
              </div>

              <div className="p-5">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* 입력 영역 */}
                  <div className="space-y-4">
                    <h4 className="font-medium text-slate-900 mb-3">상속 정보 입력</h4>

                    {/* 총 상속재산 */}
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">총 상속재산</label>
                      <div className="relative">
                        <input
                          type="number"
                          value={taxInput.total_assets || ''}
                          onChange={(e) => setTaxInput(prev => ({ ...prev, total_assets: Number(e.target.value) }))}
                          className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder={totalEstate.toString()}
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">원</span>
                      </div>
                      <p className="text-xs text-slate-400 mt-1">연동된 자산: {formatter.format(totalEstate)}</p>
                    </div>

                    {/* 채무 금액 */}
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">채무 금액</label>
                      <div className="relative">
                        <input
                          type="number"
                          value={taxInput.debts || ''}
                          onChange={(e) => setTaxInput(prev => ({ ...prev, debts: Number(e.target.value) }))}
                          className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="0"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">원</span>
                      </div>
                    </div>

                    {/* 자녀 수 */}
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">자녀 수</label>
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => setTaxInput(prev => ({ ...prev, children: Math.max(0, prev.children - 1) }))}
                          className="w-10 h-10 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 font-bold"
                        >
                          -
                        </button>
                        <span className="w-12 text-center text-lg font-semibold">{taxInput.children}</span>
                        <button
                          onClick={() => setTaxInput(prev => ({ ...prev, children: prev.children + 1 }))}
                          className="w-10 h-10 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 font-bold"
                        >
                          +
                        </button>
                        <span className="text-sm text-slate-500">명</span>
                      </div>
                    </div>

                    {/* 배우자 상속액 */}
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">배우자 상속액</label>
                      <div className="relative">
                        <input
                          type="number"
                          value={taxInput.spouse_inherited || ''}
                          onChange={(e) => setTaxInput(prev => ({ ...prev, spouse_inherited: Number(e.target.value) }))}
                          className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="0 (없으면 공제 없음)"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">원</span>
                      </div>
                      <p className="text-xs text-slate-400 mt-1">배우자 공제: 5억~30억</p>
                    </div>

                    {/* 금융재산 */}
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">금융재산</label>
                      <div className="relative">
                        <input
                          type="number"
                          value={taxInput.financial_assets || ''}
                          onChange={(e) => setTaxInput(prev => ({ ...prev, financial_assets: Number(e.target.value) }))}
                          className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="0"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">원</span>
                      </div>
                      <p className="text-xs text-slate-400 mt-1">금융재산 공제: 최대 2억</p>
                    </div>

                    {/* 동거주택 공제 */}
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">동거주택 공제액</label>
                      <div className="relative">
                        <input
                          type="number"
                          value={taxInput.housing_deduction || ''}
                          onChange={(e) => setTaxInput(prev => ({ ...prev, housing_deduction: Number(e.target.value) }))}
                          className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="0"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">원</span>
                      </div>
                      <p className="text-xs text-slate-400 mt-1">10년 이상 동거 시 최대 6억 공제</p>
                    </div>

                    {/* 계산 버튼 */}
                    <button
                      onClick={handleCalculateTax}
                      disabled={isCalculating}
                      className="w-full py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:bg-slate-400"
                    >
                      {isCalculating ? '계산 중...' : '상속세 계산하기'}
                    </button>

                    {taxError && (
                      <p className="text-sm text-red-600">{taxError}</p>
                    )}
                  </div>

                  {/* 결과 영역 */}
                  <div className="bg-slate-50 rounded-xl p-5">
                    <h4 className="font-medium text-slate-900 mb-4">계산 결과</h4>

                    {taxResult ? (
                      <>
                        <div className="space-y-3">
                          <div className="flex justify-between text-sm">
                            <span className="text-slate-600">총 상속재산</span>
                            <span className="font-medium">{formatter.format(taxResult.total_assets)}</span>
                          </div>
                          <div className="h-px bg-slate-200 my-2" />
                          <div className="flex justify-between text-sm">
                            <span className="text-slate-600">(-) 일괄/인적공제</span>
                            <span className="font-medium text-blue-600">-{formatter.format(taxResult.deductions.basic_or_personal)}</span>
                          </div>
                          {taxResult.deductions.spouse > 0 && (
                            <div className="flex justify-between text-sm">
                              <span className="text-slate-600">(-) 배우자공제</span>
                              <span className="font-medium text-blue-600">-{formatter.format(taxResult.deductions.spouse)}</span>
                            </div>
                          )}
                          {taxResult.deductions.financial > 0 && (
                            <div className="flex justify-between text-sm">
                              <span className="text-slate-600">(-) 금융재산공제</span>
                              <span className="font-medium text-blue-600">-{formatter.format(taxResult.deductions.financial)}</span>
                            </div>
                          )}
                          {taxResult.deductions.housing > 0 && (
                            <div className="flex justify-between text-sm">
                              <span className="text-slate-600">(-) 동거주택공제</span>
                              <span className="font-medium text-blue-600">-{formatter.format(taxResult.deductions.housing)}</span>
                            </div>
                          )}
                          {taxResult.deductions.debts > 0 && (
                            <div className="flex justify-between text-sm">
                              <span className="text-slate-600">(-) 채무</span>
                              <span className="font-medium text-red-600">-{formatter.format(taxResult.deductions.debts)}</span>
                            </div>
                          )}
                          <div className="h-px bg-slate-200 my-2" />
                          <div className="flex justify-between text-sm">
                            <span className="text-slate-600">과세표준</span>
                            <span className="font-semibold">{formatter.format(taxResult.taxable_base)}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-slate-600">적용세율</span>
                            <span className="font-medium">{(taxResult.rate * 100).toFixed(0)}%</span>
                          </div>
                        </div>

                        <div className="mt-6 p-4 bg-blue-600 rounded-xl text-white">
                          <div className="text-sm text-blue-200 mb-1">예상 상속세</div>
                          <div className="text-3xl font-bold">{formatter.format(taxResult.tax)}</div>
                          <div className="text-xs text-blue-200 mt-2">
                            실효세율: {taxResult.total_assets > 0 ? ((taxResult.tax / taxResult.total_assets) * 100).toFixed(2) : 0}%
                          </div>
                        </div>

                        {/* 상속인별 세액 안분 */}
                        {allocationResult && allocationResult.allocated.length > 0 && (
                          <div className="mt-6">
                            <h5 className="text-sm font-medium text-slate-700 mb-3">상속인별 세액 안분</h5>
                            <div className="space-y-2">
                              {allocationResult.allocated.map((heir, idx) => (
                                <div key={idx} className="flex justify-between items-center p-3 bg-white rounded-lg border border-slate-200">
                                  <div>
                                    <span className="font-medium text-slate-900">{heir.name}</span>
                                    <span className="text-xs text-slate-500 ml-2">({(heir.ratio * 100).toFixed(1)}%)</span>
                                  </div>
                                  <span className="font-semibold text-slate-900">{formatter.format(heir.allocated_tax)}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        <p className="text-xs text-slate-400 mt-4 text-center">
                          * 본 계산 결과는 참고용이며, 실제 세액은 세무사 상담을 권장합니다.
                        </p>
                      </>
                    ) : (
                      <div className="h-64 flex items-center justify-center text-slate-400">
                        <div className="text-center">
                          <svg className="w-12 h-12 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                          </svg>
                          <p className="text-sm">상속 정보를 입력하고<br />계산 버튼을 눌러주세요</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* 세율표 */}
                <div className="mt-6 p-4 bg-slate-50 rounded-xl">
                  <h5 className="text-sm font-medium text-slate-700 mb-3">2026년 상속세율표</h5>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-slate-500">
                          <th className="text-left py-2 font-medium">과세표준</th>
                          <th className="text-center py-2 font-medium">세율</th>
                          <th className="text-right py-2 font-medium">누진공제</th>
                        </tr>
                      </thead>
                      <tbody className="text-slate-700">
                        <tr className={taxResult?.rate === 0.10 ? 'bg-blue-100 font-semibold' : ''}>
                          <td className="py-1.5">1억원 이하</td>
                          <td className="text-center">10%</td>
                          <td className="text-right">-</td>
                        </tr>
                        <tr className={taxResult?.rate === 0.20 ? 'bg-blue-100 font-semibold' : ''}>
                          <td className="py-1.5">1억 초과 ~ 5억 이하</td>
                          <td className="text-center">20%</td>
                          <td className="text-right">1,000만원</td>
                        </tr>
                        <tr className={taxResult?.rate === 0.30 ? 'bg-blue-100 font-semibold' : ''}>
                          <td className="py-1.5">5억 초과 ~ 10억 이하</td>
                          <td className="text-center">30%</td>
                          <td className="text-right">6,000만원</td>
                        </tr>
                        <tr className={taxResult?.rate === 0.40 ? 'bg-blue-100 font-semibold' : ''}>
                          <td className="py-1.5">10억 초과 ~ 30억 이하</td>
                          <td className="text-center">40%</td>
                          <td className="text-right">1억 6,000만원</td>
                        </tr>
                        <tr className={taxResult?.rate === 0.50 ? 'bg-blue-100 font-semibold' : ''}>
                          <td className="py-1.5">30억 초과</td>
                          <td className="text-center">50%</td>
                          <td className="text-right">4억 6,000만원</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

      </main>

      {/* Floating AI Chat Button */}
      <button
        onClick={() => setIsChatOpen(!isChatOpen)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-all flex items-center justify-center z-50"
      >
        {isChatOpen ? (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        )}
      </button>

      {/* Add Task Modal */}
      {isAddTaskOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4 max-h-[80vh] flex flex-col">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-lg">할 일 추가</h3>
                <p className="text-sm text-slate-500">추가할 항목을 선택하세요</p>
              </div>
              <button
                onClick={() => setIsAddTaskOpen(false)}
                className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {SUGGESTED_TASKS.filter(
                suggested => !tasks.some(existing => existing.title === suggested.title)
              ).map((suggestedTask, index) => (
                <button
                  key={index}
                  onClick={() => handleAddTask(suggestedTask)}
                  className="w-full text-left p-4 rounded-lg border border-slate-200 hover:border-blue-300 hover:bg-blue-50 transition-all group"
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${
                      suggestedTask.priority === 'high' ? 'bg-red-500' :
                      suggestedTask.priority === 'medium' ? 'bg-amber-500' : 'bg-slate-400'
                    }`} />
                    <div className="flex-1">
                      <p className="font-medium text-slate-900 group-hover:text-blue-600">
                        {suggestedTask.title}
                      </p>
                      <p className="text-sm text-slate-500 mt-0.5">
                        {suggestedTask.description}
                      </p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full font-medium flex-shrink-0 ${
                      suggestedTask.priority === 'high' ? 'bg-red-100 text-red-700' :
                      suggestedTask.priority === 'medium' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {suggestedTask.priority === 'high' ? '높음' :
                       suggestedTask.priority === 'medium' ? '보통' : '낮음'}
                    </span>
                  </div>
                </button>
              ))}
              {SUGGESTED_TASKS.filter(
                suggested => !tasks.some(existing => existing.title === suggested.title)
              ).length === 0 && (
                <div className="text-center py-8 text-slate-400">
                  <svg className="w-12 h-12 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-sm">모든 추천 할 일을 추가했습니다</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* AI Chat Popup */}
      {isChatOpen && (
        <div className="fixed bottom-24 right-6 w-96 h-[500px] bg-white rounded-xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden z-50">
          <div className="p-4 bg-blue-600 text-white">
            <h3 className="font-bold">AI 상속 도우미</h3>
            <p className="text-xs opacity-80">상속, 세금, 배분에 대해 물어보세요</p>
          </div>
          <div className="flex-1 p-4 overflow-y-auto space-y-4">
            {chatHistory.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center text-center text-slate-400 space-y-3">
                <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <p className="text-sm">무엇을 도와드릴까요?</p>
              </div>
            )}
            {chatHistory.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] px-4 py-3 rounded-xl text-sm ${
                  msg.role === 'user' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-800'
                }`}>
                  {msg.text}
                </div>
              </div>
            ))}
          </div>
          <div className="p-4 border-t border-slate-100 flex gap-2">
            <input
              type="text"
              value={chatMessage}
              onChange={(e) => setChatMessage(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="질문을 입력하세요..."
              className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={handleSendMessage}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardPage;
