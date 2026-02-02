import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { login, getAuthState } from '../services/authService';
import {
  getAccountList,
  getAccountBalance,
  BankAccount,
  AccountBalanceResponse,
  getBankName,
} from '../services/accountService';
import {
  checkPin,
  getDocuments,
  addDocument,
  deleteDocument,
  SafeDocument,
} from '../services/safeService';

// 초기 데모 문서 (암호화 저장소가 비어있을 때 사용)
const DEMO_DOCUMENTS: Omit<SafeDocument, 'id' | 'uploadedAt'>[] = [
  { name: '자필유언장_2024.pdf', type: 'will', size: '2.3MB' },
  { name: '생명보험증권_삼성생명.pdf', type: 'insurance', size: '1.8MB' },
  { name: '부동산매매계약서_강남아파트.pdf', type: 'contract', size: '4.2MB' },
];

const OwnerDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [isLinkingModalOpen, setIsLinkingModalOpen] = useState(false);
  const [isAgentModalOpen, setIsAgentModalOpen] = useState(false);
  const [agentModalStep, setAgentModalStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [balances, setBalances] = useState<Map<string, AccountBalanceResponse>>(new Map());
  const [error, setError] = useState<string | null>(null);

  // 금고 모달 상태
  const [isSafeModalOpen, setIsSafeModalOpen] = useState(false);
  const [safePin, setSafePin] = useState('');
  const [isSafeUnlocked, setIsSafeUnlocked] = useState(false);
  const [safeError, setSafeError] = useState(false);
  const [safeDocuments, setSafeDocuments] = useState<SafeDocument[]>([]);
  const [isLoadingDocs, setIsLoadingDocs] = useState(false);

  // 암호화된 금고에서 문서 로드
  const loadSafeDocuments = async () => {
    setIsLoadingDocs(true);
    try {
      const docs = await getDocuments();
      if (docs.length === 0) {
        // 첫 실행 시 데모 문서 추가
        for (const demo of DEMO_DOCUMENTS) {
          await addDocument(demo);
        }
        const newDocs = await getDocuments();
        setSafeDocuments(newDocs);
      } else {
        setSafeDocuments(docs);
      }
    } catch (err) {
      console.error('문서 로드 실패:', err);
    } finally {
      setIsLoadingDocs(false);
    }
  };

  // PIN 검증 (AES-256 암호화 기반)
  const handlePinVerify = async () => {
    try {
      const isValid = await checkPin(safePin);
      if (isValid) {
        setIsSafeUnlocked(true);
        await loadSafeDocuments();
      } else {
        setSafeError(true);
        setTimeout(() => {
          setSafeError(false);
          setSafePin('');
        }, 1500);
      }
    } catch (err) {
      console.error('PIN 검증 실패:', err);
      setSafeError(true);
    }
  };

  // 문서 삭제
  const handleDeleteDocument = async (id: string) => {
    try {
      await deleteDocument(id);
      setSafeDocuments(prev => prev.filter(doc => doc.id !== id));
    } catch (err) {
      console.error('문서 삭제 실패:', err);
    }
  };

  // 자산요약보고서 모달 상태
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

  const authState = getAuthState();

  // 계좌 목록 로드
  const loadAccounts = async () => {
    if (!authState.isAuthenticated) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await getAccountList();
      if (response.rsp_code === 'A0000' && response.res_list) {
        setAccounts(response.res_list);

        // 각 계좌의 잔액 조회
        const balanceMap = new Map<string, AccountBalanceResponse>();
        await Promise.all(
          response.res_list.map(async (account) => {
            try {
              const balance = await getAccountBalance(account.fintech_use_num);
              balanceMap.set(account.fintech_use_num, balance);
            } catch (err) {
              console.error(`잔액 조회 실패: ${account.bank_name}`, err);
            }
          })
        );
        setBalances(balanceMap);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '계좌 조회 중 오류가 발생했습니다');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAccounts();
  }, [authState.isAuthenticated]);

  // 자산 연동 시작
  const handleStartLinking = async () => {
    setIsLinkingModalOpen(false);
    try {
      await login();
    } catch (err) {
      setError('인증 서버 연결에 실패했습니다');
    }
  };

  // 금액 포맷팅
  const formatCurrency = (amount: string | number) => {
    const num = typeof amount === 'string' ? parseInt(amount, 10) : amount;
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: 'KRW',
    }).format(num);
  };

  // 총 자산 계산
  const balanceValues: AccountBalanceResponse[] = [...balances.values()];
  const totalAssets = balanceValues.reduce((sum, balance) => {
    return sum + parseInt(balance.balance_amt || '0', 10);
  }, 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 to-slate-200">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <img src="/sangsokidda.png" alt="상속잇다" className="h-10" />
              <p className="text-xs text-slate-500">본인 계정</p>
            </div>
            <div className="flex items-center gap-4">
              {authState.isAuthenticated && (
                <span className="text-sm text-slate-600">
                  {authState.userInfo?.user_name}님
                </span>
              )}
              <span className="px-3 py-1 bg-blue-100 text-blue-700 text-sm font-medium rounded-full">
                본인
              </span>
              <button
                onClick={() => navigate('/select-role')}
                className="px-4 py-2 text-sm text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
              >
                역할 변경
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section - 5 Core Features */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 mb-1">상속 준비 서비스</h2>
              <p className="text-slate-600">5가지 핵심 기능으로 체계적인 상속을 준비하세요</p>
            </div>
            <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-emerald-50 rounded-full">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
              <span className="text-sm text-emerald-700 font-medium">서비스 이용 중</span>
            </div>
          </div>

          {/* 4 Core Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            {/* 1. 자산관리 */}
            <button
              onClick={() => setIsLinkingModalOpen(true)}
              className="group bg-white rounded-2xl p-5 text-left border border-slate-200 hover:shadow-lg hover:border-slate-300 transition-all"
            >
              <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center mb-3">
                <span className="text-2xl">💰</span>
              </div>
              <h3 className="text-slate-900 font-bold mb-1">자산관리</h3>
              <p className="text-slate-500 text-xs leading-relaxed">
                금융자산 통합 연동 및 실시간 현황 파악
              </p>
              <div className="mt-3 flex items-center gap-1 text-slate-400 text-xs">
                <span>{accounts.length}개 계좌</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </button>

            {/* 2. 상속vs증여 시뮬레이션 */}
            <button
              onClick={() => setIsReportModalOpen(true)}
              className="group bg-white rounded-2xl p-5 text-left border border-slate-200 hover:shadow-lg hover:border-slate-300 transition-all"
            >
              <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center mb-3">
                <span className="text-2xl">📊</span>
              </div>
              <h3 className="text-slate-900 font-bold mb-1">상속vs증여</h3>
              <p className="text-slate-500 text-xs leading-relaxed">
                세금 비교 시뮬레이션으로 최적의 방법 선택
              </p>
              <div className="mt-3 flex items-center gap-1 text-slate-400 text-xs">
                <span>시뮬레이션</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </button>

            {/* 3. 사후 관리 권한부여 */}
            <button
              onClick={() => { setIsAgentModalOpen(true); setAgentModalStep(0); }}
              className="group bg-white rounded-2xl p-5 text-left border border-slate-200 hover:shadow-lg hover:border-slate-300 transition-all"
            >
              <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center mb-3">
                <span className="text-2xl">🤝</span>
              </div>
              <h3 className="text-slate-900 font-bold mb-1">권한부여</h3>
              <p className="text-slate-500 text-xs leading-relaxed">
                사후 관리 대리인 지정 및 권한 설정
              </p>
              <div className="mt-3 flex items-center gap-1 text-slate-400 text-xs">
                <span>대리인 지정</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </button>

            {/* 4. 디지털 유언장 금고 */}
            <button
              onClick={() => { setIsSafeModalOpen(true); setSafePin(''); setIsSafeUnlocked(false); setSafeError(false); }}
              className="group bg-white rounded-2xl p-5 text-left border border-slate-200 hover:shadow-lg hover:border-slate-300 transition-all"
            >
              <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center mb-3">
                <span className="text-2xl">🔐</span>
              </div>
              <h3 className="text-slate-900 font-bold mb-1">유언장 금고</h3>
              <p className="text-slate-500 text-xs leading-relaxed">
                디지털 유언장 및 중요 문서 보관
              </p>
              <div className="mt-3 flex items-center gap-1 text-slate-400 text-xs">
                <span>{safeDocuments.length}개 문서</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {/* Total Assets Summary */}
        {accounts.length > 0 && (
          <div className="mb-8 bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl p-6 text-white">
            <p className="text-blue-100 text-sm mb-1">총 연동 자산</p>
            <p className="text-3xl font-bold">{formatCurrency(totalAssets)}</p>
            <p className="text-blue-200 text-sm mt-2">{accounts.length}개 계좌 연동됨</p>
          </div>
        )}

        {/* Linked Accounts */}
        {isLoading ? (
          <div className="bg-white rounded-xl border border-slate-200 p-12 shadow-sm">
            <div className="flex flex-col items-center justify-center">
              <div className="w-12 h-12 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin mb-4" />
              <p className="text-slate-500">계좌 정보를 불러오는 중...</p>
            </div>
          </div>
        ) : accounts.length > 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-semibold text-slate-900">연동된 계좌</h3>
              <button
                onClick={loadAccounts}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                새로고침
              </button>
            </div>
            <div className="divide-y divide-slate-100">
              {accounts.map((account) => {
                const balance = balances.get(account.fintech_use_num);
                return (
                  <div
                    key={account.fintech_use_num}
                    className="px-6 py-4 flex items-center justify-between hover:bg-slate-50"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center">
                        <span className="text-lg font-bold text-slate-600">
                          {account.bank_name?.charAt(0) || getBankName(account.bank_code_std).charAt(0)}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-slate-900">
                          {account.bank_name || getBankName(account.bank_code_std)}
                        </p>
                        <p className="text-sm text-slate-500">
                          {account.account_num_masked}
                          {account.account_alias && ` (${account.account_alias})`}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-slate-900">
                        {balance ? formatCurrency(balance.balance_amt) : '-'}
                      </p>
                      <p className="text-xs text-slate-500">
                        {balance?.product_name || account.account_type}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center">
                  <svg
                    className="w-6 h-6 text-slate-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                    />
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-slate-900">새로 연동된 계좌 없음</p>
                  <p className="text-sm text-slate-500">오픈뱅킹으로 계좌를 추가 연동하세요</p>
                </div>
              </div>
              <button
                onClick={() => setIsLinkingModalOpen(true)}
                className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
              >
                연동하기
              </button>
            </div>
          </div>
        )}

        {/* Asset Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
          {/* Monthly Asset Trend */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
            <h3 className="font-semibold text-slate-900 mb-6">월별 자산 추이</h3>
            <div className="relative h-64">
              {/* Y축 라벨 */}
              <div className="absolute left-0 top-0 bottom-8 w-16 flex flex-col justify-between text-xs text-slate-400">
                <span>5억</span>
                <span>4억</span>
                <span>3억</span>
                <span>2억</span>
                <span>1억</span>
                <span>0</span>
              </div>

              {/* 차트 영역 */}
              <div className="ml-16 h-full relative">
                {/* 그리드 라인 */}
                <div className="absolute inset-0 flex flex-col justify-between pb-8">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="border-t border-slate-100 w-full" />
                  ))}
                </div>

                {/* 선 그래프 SVG */}
                <svg className="w-full h-[calc(100%-32px)]" viewBox="0 0 400 200" preserveAspectRatio="none">
                  {/* 그라데이션 영역 */}
                  <defs>
                    <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.3" />
                      <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  <path
                    d="M0,160 L66,140 L133,120 L200,100 L266,80 L333,60 L400,40 L400,200 L0,200 Z"
                    fill="url(#areaGradient)"
                  />
                  <path
                    d="M0,160 L66,140 L133,120 L200,100 L266,80 L333,60 L400,40"
                    fill="none"
                    stroke="#3b82f6"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  {/* 데이터 포인트 */}
                  {[[0, 160], [66, 140], [133, 120], [200, 100], [266, 80], [333, 60], [400, 40]].map(([x, y], i) => (
                    <circle key={i} cx={x} cy={y} r="5" fill="#3b82f6" stroke="white" strokeWidth="2" />
                  ))}
                </svg>

                {/* X축 라벨 */}
                <div className="flex justify-between text-xs text-slate-400 mt-2">
                  <span>7월</span>
                  <span>8월</span>
                  <span>9월</span>
                  <span>10월</span>
                  <span>11월</span>
                  <span>12월</span>
                  <span>1월</span>
                </div>
              </div>
            </div>

            {/* 범례 및 요약 */}
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-blue-500 rounded-full" />
                <span className="text-sm text-slate-600">총 자산</span>
              </div>
              <div className="text-right">
                <span className="text-emerald-600 text-sm font-medium">+23.5%</span>
                <span className="text-slate-400 text-xs ml-2">지난 6개월</span>
              </div>
            </div>
          </div>

          {/* Asset Distribution */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
            <h3 className="font-semibold text-slate-900 mb-6">자산 유형별 분포</h3>

            <div className="flex items-center gap-8">
              {/* 도넛 차트 */}
              <div className="relative w-40 h-40 flex-shrink-0">
                <svg viewBox="0 0 100 100" className="transform -rotate-90">
                  {/* 배경 원 */}
                  <circle cx="50" cy="50" r="40" fill="none" stroke="#f1f5f9" strokeWidth="20" />
                  {/* 예금 - 45% */}
                  <circle
                    cx="50" cy="50" r="40"
                    fill="none"
                    stroke="#3b82f6"
                    strokeWidth="20"
                    strokeDasharray="113 251.2"
                    strokeDashoffset="0"
                  />
                  {/* 주식 - 30% */}
                  <circle
                    cx="50" cy="50" r="40"
                    fill="none"
                    stroke="#8b5cf6"
                    strokeWidth="20"
                    strokeDasharray="75.4 251.2"
                    strokeDashoffset="-113"
                  />
                  {/* 부동산 - 20% */}
                  <circle
                    cx="50" cy="50" r="40"
                    fill="none"
                    stroke="#10b981"
                    strokeWidth="20"
                    strokeDasharray="50.2 251.2"
                    strokeDashoffset="-188.4"
                  />
                  {/* 기타 - 5% */}
                  <circle
                    cx="50" cy="50" r="40"
                    fill="none"
                    stroke="#f59e0b"
                    strokeWidth="20"
                    strokeDasharray="12.6 251.2"
                    strokeDashoffset="-238.6"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-slate-900">4.8억</p>
                    <p className="text-xs text-slate-500">총 자산</p>
                  </div>
                </div>
              </div>

              {/* 범례 */}
              <div className="flex-1 space-y-3">
                {[
                  { label: '예금', value: '2.16억', percent: 45, color: 'bg-blue-500' },
                  { label: '주식', value: '1.44억', percent: 30, color: 'bg-purple-500' },
                  { label: '부동산', value: '0.96억', percent: 20, color: 'bg-emerald-500' },
                  { label: '기타', value: '0.24억', percent: 5, color: 'bg-amber-500' },
                ].map((item) => (
                  <div key={item.label} className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${item.color}`} />
                    <div className="flex-1">
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-700">{item.label}</span>
                        <span className="font-medium text-slate-900">{item.value}</span>
                      </div>
                      <div className="h-1.5 bg-slate-100 rounded-full mt-1 overflow-hidden">
                        <div className={`h-full ${item.color} rounded-full`} style={{ width: `${item.percent}%` }} />
                      </div>
                    </div>
                    <span className="text-xs text-slate-400 w-10 text-right">{item.percent}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Recent Transactions */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-semibold text-slate-900">최근 거래 내역</h3>
              <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">전체보기</button>
            </div>
            <div className="space-y-4">
              {[
                { type: 'in', desc: '급여 입금', amount: '+3,500,000', date: '01.28', bank: '신한은행' },
                { type: 'out', desc: '카드 결제', amount: '-450,000', date: '01.27', bank: '삼성카드' },
                { type: 'in', desc: '이자 입금', amount: '+12,500', date: '01.25', bank: 'KB국민' },
                { type: 'out', desc: '공과금 납부', amount: '-180,000', date: '01.25', bank: '자동이체' },
                { type: 'in', desc: '배당금 입금', amount: '+85,000', date: '01.20', bank: '키움증권' },
              ].map((tx, i) => (
                <div key={i} className="flex items-center justify-between py-2">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${tx.type === 'in' ? 'bg-emerald-100' : 'bg-red-100'}`}>
                      {tx.type === 'in' ? (
                        <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                        </svg>
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-900">{tx.desc}</p>
                      <p className="text-xs text-slate-500">{tx.bank}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-semibold ${tx.type === 'in' ? 'text-emerald-600' : 'text-red-600'}`}>
                      {tx.amount}원
                    </p>
                    <p className="text-xs text-slate-400">{tx.date}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Monthly Income/Expense */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
            <h3 className="font-semibold text-slate-900 mb-6">월별 수입/지출</h3>
            <div className="space-y-4">
              {[
                { month: '1월', income: 4200000, expense: 2800000 },
                { month: '12월', income: 5500000, expense: 3200000 },
                { month: '11월', income: 3800000, expense: 2500000 },
                { month: '10월', income: 4100000, expense: 2900000 },
                { month: '9월', income: 3900000, expense: 2600000 },
              ].map((item) => {
                const maxValue = 6000000;
                const incomeWidth = (item.income / maxValue) * 100;
                const expenseWidth = (item.expense / maxValue) * 100;
                return (
                  <div key={item.month}>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-slate-600 font-medium">{item.month}</span>
                      <div className="flex gap-4 text-xs">
                        <span className="text-emerald-600">+{(item.income / 10000).toFixed(0)}만</span>
                        <span className="text-red-500">-{(item.expense / 10000).toFixed(0)}만</span>
                      </div>
                    </div>
                    <div className="flex gap-1 h-4">
                      <div
                        className="bg-emerald-400 rounded-l-full"
                        style={{ width: `${incomeWidth}%` }}
                      />
                      <div
                        className="bg-red-400 rounded-r-full"
                        style={{ width: `${expenseWidth}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* 범례 */}
            <div className="flex items-center justify-center gap-6 mt-6 pt-4 border-t border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-emerald-400 rounded-full" />
                <span className="text-sm text-slate-600">수입</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-red-400 rounded-full" />
                <span className="text-sm text-slate-600">지출</span>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Asset Linking Modal */}
      {isLinkingModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">금융결제원 자산 연동</h3>
              <p className="text-slate-600 text-sm">
                금융결제원 오픈뱅킹 서비스를 통해
                <br />
                안전하게 계좌를 연동합니다
              </p>
            </div>

            <div className="space-y-4 mb-6">
              <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
                <svg
                  className="w-5 h-5 text-blue-600 mt-0.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                  />
                </svg>
                <div>
                  <p className="font-medium text-slate-900 text-sm">다양한 인증 방법</p>
                  <p className="text-xs text-slate-500">금융인증서, 공동인증서, 휴대전화 인증</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
                <svg
                  className="w-5 h-5 text-blue-600 mt-0.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                  />
                </svg>
                <div>
                  <p className="font-medium text-slate-900 text-sm">전 금융기관 연동</p>
                  <p className="text-xs text-slate-500">은행, 증권사 계좌 통합 관리</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
                <svg
                  className="w-5 h-5 text-blue-600 mt-0.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                  />
                </svg>
                <div>
                  <p className="font-medium text-slate-900 text-sm">조회 전용</p>
                  <p className="text-xs text-slate-500">잔액 조회만 가능, 이체 불가</p>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setIsLinkingModalOpen(false)}
                className="flex-1 px-4 py-3 border border-slate-200 text-slate-700 font-medium rounded-lg hover:bg-slate-50 transition-colors"
              >
                취소
              </button>
              <button
                onClick={handleStartLinking}
                className="flex-1 px-4 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
              >
                연동 시작
              </button>
            </div>

            <p className="text-xs text-slate-400 text-center mt-4">
              금융결제원 오픈뱅킹 서비스 이용약관에 동의하게 됩니다
            </p>
          </div>
        </div>
      )}

      {/* Agent Designation Modal */}
      {isAgentModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-xl overflow-hidden">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-slate-700 to-slate-800 px-6 py-5 text-white">
              <h3 className="text-xl font-bold">대리인 지정</h3>
              <p className="text-slate-300 text-sm mt-1">상속 집행을 도울 신뢰할 수 있는 사람을 지정하세요</p>
            </div>

            {/* Modal Content */}
            <div className="p-6 max-h-[60vh] overflow-y-auto">
              {agentModalStep === 0 && (
                <div className="space-y-5">
                  {/* 상속 집행 대리 */}
                  <div className="flex gap-4 p-4 bg-slate-50 rounded-xl">
                    <div className="w-10 h-10 bg-slate-200 rounded-lg flex items-center justify-center flex-shrink-0">
                      <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-semibold text-slate-900 mb-1">상속 집행을 대리해요</h4>
                      <p className="text-sm text-slate-600">
                        대리인은 사후에 사망 증빙서류를 제출하여 유언대용신탁 및 상속 개시 절차를 돕습니다.
                        서류 발급이 가능한 신뢰할 수 있는 사람인지 확인해 주세요.
                        대리인은 지정된 범위 내의 행정 절차만 지원하며, 임의적인 자산 인출은 불가합니다.
                      </p>
                    </div>
                  </div>

                  {/* 금융 자산 관리 */}
                  <div className="flex gap-4 p-4 bg-slate-50 rounded-xl">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-semibold text-slate-900 mb-1">금융 자산을 관리해요</h4>
                      <p className="text-sm text-slate-600">
                        상속이 개시되면 대리인은 고인의 연금 계좌, 예적금, 주식 등 사전 설정된 금융 자산 목록을 확인합니다.
                        이를 통해 상속인들이 누락 없이 자산을 수령할 수 있도록 자산 가이드 역할을 수행합니다.
                      </p>
                    </div>
                  </div>

                  {/* 마지막 유언 확인 */}
                  <div className="flex gap-4 p-4 bg-slate-50 rounded-xl">
                    <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-semibold text-slate-900 mb-1">마지막 유언을 확인해요</h4>
                      <p className="text-sm text-slate-600">
                        요청인이 생전에 작성한 디지털 유서와 자산 배분 지침은 대리인에게만 전달됩니다.
                        법적 효력을 갖춘 마지막 뜻이 가족들에게 정확히 전달되도록 돕습니다.
                      </p>
                    </div>
                  </div>

                  {/* 주의사항 */}
                  <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
                    <div className="flex items-start gap-3">
                      <svg className="w-5 h-5 text-amber-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      <p className="text-sm text-amber-800">
                        대리인이 7일 이내 수락하지 않으면 요청이 만료되며, 설정된 상속 관리 계획이 취소됩니다.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {agentModalStep === 1 && (
                <div className="text-center py-8">
                  <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <svg className="w-10 h-10 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h4 className="text-xl font-bold text-slate-900 mb-2">대리인 요청 완료</h4>
                  <p className="text-slate-600">
                    유산 상속 대리인 요청이 완료되었습니다.
                    <br />
                    대리인이 7일 이내 수락하지 않으면 요청이 만료되며,
                    <br />
                    설정된 상속 관리 계획이 취소됩니다.
                  </p>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100">
              {agentModalStep === 0 ? (
                <div className="flex gap-3">
                  <button
                    onClick={() => setIsAgentModalOpen(false)}
                    className="flex-1 px-4 py-3 border border-slate-200 text-slate-700 font-medium rounded-lg hover:bg-slate-100 transition-colors"
                  >
                    취소
                  </button>
                  <button
                    onClick={() => setAgentModalStep(1)}
                    className="flex-1 px-4 py-3 bg-slate-700 text-white font-medium rounded-lg hover:bg-slate-800 transition-colors"
                  >
                    대리인 지정하기
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => { setIsAgentModalOpen(false); setAgentModalStep(0); }}
                  className="w-full px-4 py-3 bg-slate-700 text-white font-medium rounded-lg hover:bg-slate-800 transition-colors"
                >
                  확인
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Safe/Vault Modal */}
      {isSafeModalOpen && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="relative">
            {/* Close Button */}
            <button
              onClick={() => setIsSafeModalOpen(false)}
              className="absolute -top-12 right-0 text-white/80 hover:text-white transition-colors"
            >
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {!isSafeUnlocked ? (
              /* Locked Safe View */
              <div className="relative">
                {/* Safe Body */}
                <div
                  className="w-[400px] h-[320px] rounded-lg relative overflow-hidden"
                  style={{
                    background: 'linear-gradient(145deg, #4a4a4a 0%, #3d3d3d 50%, #2d2d2d 100%)',
                    boxShadow: 'inset 0 2px 4px rgba(255,255,255,0.1), 0 10px 40px rgba(0,0,0,0.5)',
                  }}
                >
                  {/* Shadow overlay */}
                  <div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                      background: 'linear-gradient(135deg, transparent 50%, rgba(0,0,0,0.3) 100%)',
                    }}
                  />

                  {/* Keypad Panel */}
                  <div
                    className="absolute left-8 top-1/2 -translate-y-1/2 w-[140px] rounded-lg p-3"
                    style={{
                      background: 'linear-gradient(180deg, #c0c0c0 0%, #a8a8a8 100%)',
                      boxShadow: '0 4px 8px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.5)',
                    }}
                  >
                    {/* LCD Display */}
                    <div
                      className={`w-full h-10 rounded mb-3 flex items-center justify-center font-mono text-xl tracking-widest ${safeError ? 'animate-pulse' : ''}`}
                      style={{
                        background: safeError ? '#ff6b6b' : '#90EE90',
                        boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.3)',
                        color: safeError ? '#8b0000' : '#006400',
                      }}
                    >
                      {safeError ? 'ERROR' : safePin.padEnd(4, '_').split('').join(' ')}
                    </div>

                    {/* Keypad Grid */}
                    <div className="grid grid-cols-3 gap-1.5">
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 'C', 0, '✓'].map((key) => (
                        <button
                          key={key}
                          onClick={() => {
                            if (safeError) {
                              setSafeError(false);
                              setSafePin('');
                              return;
                            }
                            if (key === 'C') {
                              setSafePin('');
                            } else if (key === '✓') {
                              handlePinVerify();
                            } else if (safePin.length < 4) {
                              setSafePin(prev => prev + key);
                            }
                          }}
                          className="w-10 h-10 rounded-lg text-sm font-bold transition-all active:scale-95"
                          style={{
                            background: key === '✓' ? 'linear-gradient(180deg, #4ade80 0%, #22c55e 100%)'
                              : key === 'C' ? 'linear-gradient(180deg, #f87171 0%, #ef4444 100%)'
                              : 'linear-gradient(180deg, #6b6b6b 0%, #4a4a4a 100%)',
                            color: 'white',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.2)',
                          }}
                        >
                          {key}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Handle */}
                  <div className="absolute right-12 top-1/2 -translate-y-1/2">
                    {/* Handle Base */}
                    <div
                      className="w-16 h-16 rounded-full flex items-center justify-center"
                      style={{
                        background: 'linear-gradient(145deg, #d0d0d0 0%, #a0a0a0 100%)',
                        boxShadow: '0 4px 8px rgba(0,0,0,0.4), inset 0 2px 4px rgba(255,255,255,0.3)',
                      }}
                    >
                      {/* Handle Lever */}
                      <div
                        className="w-12 h-6 rounded-full"
                        style={{
                          background: 'linear-gradient(180deg, #e0e0e0 0%, #b0b0b0 50%, #909090 100%)',
                          boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
                        }}
                      />
                    </div>
                  </div>

                  {/* Bolts */}
                  <div className="absolute top-4 left-4 w-3 h-3 rounded-full bg-slate-600 shadow-inner" />
                  <div className="absolute top-4 right-4 w-3 h-3 rounded-full bg-slate-600 shadow-inner" />
                  <div className="absolute bottom-4 left-4 w-3 h-3 rounded-full bg-slate-600 shadow-inner" />
                  <div className="absolute bottom-4 right-4 w-3 h-3 rounded-full bg-slate-600 shadow-inner" />
                </div>

                {/* Title */}
                <div className="text-center mt-6">
                  <h3 className="text-white text-xl font-bold">🔐 문서 금고</h3>
                  <p className="text-white/60 text-sm mt-1">비밀번호 4자리를 입력하세요 (힌트: 1234)</p>
                </div>
              </div>
            ) : (
              /* Unlocked Safe - Document List */
              <div
                className="w-[500px] rounded-xl overflow-hidden"
                style={{
                  background: 'linear-gradient(145deg, #4a4a4a 0%, #3d3d3d 50%, #2d2d2d 100%)',
                  boxShadow: '0 10px 40px rgba(0,0,0,0.5)',
                }}
              >
                {/* Safe Door Open Header */}
                <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">🔓</span>
                      <div>
                        <h3 className="text-white font-bold text-lg">문서 금고 열림</h3>
                        <p className="text-emerald-200 text-xs">{safeDocuments.length}개의 문서가 보관되어 있습니다</p>
                      </div>
                    </div>
                    <button
                      onClick={() => { setIsSafeUnlocked(false); setSafePin(''); }}
                      className="px-3 py-1.5 bg-white/20 hover:bg-white/30 text-white text-sm rounded-lg transition-colors"
                    >
                      잠금
                    </button>
                  </div>
                </div>

                {/* Document List */}
                <div className="p-4 max-h-[400px] overflow-y-auto">
                  {isLoadingDocs ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="w-8 h-8 border-2 border-white/20 border-t-emerald-400 rounded-full animate-spin" />
                      <span className="ml-3 text-white/60 text-sm">문서 복호화 중...</span>
                    </div>
                  ) : (
                  <div className="space-y-3">
                    {safeDocuments.map((doc) => (
                      <div
                        key={doc.id}
                        className="bg-white/10 hover:bg-white/15 rounded-lg p-4 transition-colors cursor-pointer group"
                      >
                        <div className="flex items-center gap-4">
                          <div className={`w-12 h-12 rounded-lg flex items-center justify-center text-2xl ${
                            doc.type === 'will' ? 'bg-purple-500/30' :
                            doc.type === 'insurance' ? 'bg-blue-500/30' :
                            doc.type === 'contract' ? 'bg-amber-500/30' :
                            doc.type === 'certificate' ? 'bg-emerald-500/30' : 'bg-slate-500/30'
                          }`}>
                            {doc.type === 'will' ? '📜' :
                             doc.type === 'insurance' ? '🛡️' :
                             doc.type === 'contract' ? '📋' :
                             doc.type === 'certificate' ? '📄' : '📁'}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-white font-medium truncate">{doc.name}</p>
                            <p className="text-white/50 text-sm">
                              {doc.type === 'will' ? '유언장' :
                               doc.type === 'insurance' ? '보험증권' :
                               doc.type === 'contract' ? '계약서' :
                               doc.type === 'certificate' ? '증명서' : '기타'} · {doc.size}
                            </p>
                          </div>
                          <div className="text-right flex flex-col items-end gap-1">
                            <p className="text-white/40 text-xs">{doc.uploadedAt}</p>
                            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button className="text-emerald-400 hover:text-emerald-300 text-sm font-medium">
                                다운로드
                              </button>
                              <button
                                onClick={(e) => { e.stopPropagation(); handleDeleteDocument(doc.id); }}
                                className="text-red-400 hover:text-red-300 text-sm font-medium"
                              >
                                삭제
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  )}

                  {/* Add Document Button */}
                  <button className="w-full mt-4 py-3 border-2 border-dashed border-white/20 hover:border-white/40 rounded-lg text-white/60 hover:text-white/80 transition-colors flex items-center justify-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    새 문서 추가
                  </button>
                </div>

                {/* Footer */}
                <div className="px-4 py-3 bg-black/20 border-t border-white/10">
                  <p className="text-white/40 text-xs text-center">
                    🔒 모든 문서는 AES-256 암호화로 안전하게 보관됩니다
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Asset Summary Report Modal */}
      {isReportModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden shadow-2xl">
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-600 to-purple-700 px-6 py-5 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">📋</span>
                  <div>
                    <h3 className="text-xl font-bold">자산요약보고서</h3>
                    <p className="text-purple-200 text-sm">2024년 1월 기준</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsReportModalOpen(false)}
                  className="w-8 h-8 rounded-lg bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Report Content */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
              {/* Summary Cards */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-blue-50 rounded-xl p-4 text-center">
                  <p className="text-blue-600 text-sm font-medium mb-1">총 자산</p>
                  <p className="text-2xl font-bold text-blue-700">4.8억원</p>
                </div>
                <div className="bg-emerald-50 rounded-xl p-4 text-center">
                  <p className="text-emerald-600 text-sm font-medium mb-1">순자산</p>
                  <p className="text-2xl font-bold text-emerald-700">4.2억원</p>
                </div>
                <div className="bg-amber-50 rounded-xl p-4 text-center">
                  <p className="text-amber-600 text-sm font-medium mb-1">예상 상속세</p>
                  <p className="text-2xl font-bold text-amber-700">3,200만원</p>
                </div>
              </div>

              {/* Asset Breakdown */}
              <div className="mb-6">
                <h4 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
                  <span className="w-1.5 h-5 bg-purple-500 rounded-full" />
                  자산 구성 현황
                </h4>
                <div className="space-y-3">
                  {[
                    { label: '예금/적금', value: '2억 1,600만원', percent: 45, color: 'bg-blue-500' },
                    { label: '주식/펀드', value: '1억 4,400만원', percent: 30, color: 'bg-purple-500' },
                    { label: '부동산', value: '9,600만원', percent: 20, color: 'bg-emerald-500' },
                    { label: '기타자산', value: '2,400만원', percent: 5, color: 'bg-amber-500' },
                  ].map((item) => (
                    <div key={item.label} className="bg-slate-50 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-slate-700 font-medium">{item.label}</span>
                        <span className="text-slate-900 font-semibold">{item.value}</span>
                      </div>
                      <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                        <div className={`h-full ${item.color} rounded-full`} style={{ width: `${item.percent}%` }} />
                      </div>
                      <p className="text-right text-xs text-slate-400 mt-1">{item.percent}%</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Connected Accounts */}
              <div className="mb-6">
                <h4 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
                  <span className="w-1.5 h-5 bg-blue-500 rounded-full" />
                  연동 계좌 현황
                </h4>
                <div className="bg-slate-50 rounded-xl p-4">
                  <div className="space-y-3">
                    {[
                      { bank: '신한은행', account: '***-****-1234', balance: '8,500만원', type: '입출금' },
                      { bank: 'KB국민은행', account: '***-****-5678', balance: '1억 2,000만원', type: '정기예금' },
                      { bank: '키움증권', account: '***-****-9012', balance: '1억 4,400만원', type: '주식' },
                    ].map((acc, i) => (
                      <div key={i} className="flex items-center justify-between py-2 border-b border-slate-200 last:border-0">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center font-bold text-slate-600 shadow-sm">
                            {acc.bank.charAt(0)}
                          </div>
                          <div>
                            <p className="font-medium text-slate-900">{acc.bank}</p>
                            <p className="text-xs text-slate-500">{acc.account} · {acc.type}</p>
                          </div>
                        </div>
                        <p className="font-semibold text-slate-900">{acc.balance}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Inheritance Info */}
              <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl p-5 text-white">
                <h4 className="font-semibold mb-4 flex items-center gap-2">
                  <span className="text-lg">⚖️</span>
                  상속 시뮬레이션 요약
                </h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-slate-400 mb-1">법정 상속인</p>
                    <p className="font-medium">배우자, 자녀 2명</p>
                  </div>
                  <div>
                    <p className="text-slate-400 mb-1">상속 공제</p>
                    <p className="font-medium">5억원 (일괄공제)</p>
                  </div>
                  <div>
                    <p className="text-slate-400 mb-1">과세표준</p>
                    <p className="font-medium">-2,000만원 (비과세)</p>
                  </div>
                  <div>
                    <p className="text-slate-400 mb-1">예상 상속세</p>
                    <p className="font-medium text-emerald-400">0원</p>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-white/10">
                  <p className="text-xs text-slate-400">
                    * 본 시뮬레이션은 참고용이며, 실제 세금은 전문가 상담이 필요합니다.
                  </p>
                </div>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
              <p className="text-xs text-slate-500">마지막 업데이트: 2024.01.28</p>
              <div className="flex gap-3">
                <button className="px-4 py-2 text-slate-600 hover:bg-slate-200 rounded-lg transition-colors text-sm font-medium">
                  PDF 다운로드
                </button>
                <button
                  onClick={() => setIsReportModalOpen(false)}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium"
                >
                  확인
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OwnerDashboardPage;
