
import { Account, AccountCategory, Heir, Document, NetWorthHistory } from './types';

export const MOCK_ACCOUNTS: Account[] = [
  {
    id: '1',
    institution: '국세청',
    name: '종합소득세 환급금',
    balance: 2850000,
    category: AccountCategory.TAX,
    lastSynced: '2025-01-15T10:30:00Z',
    mask: '2024'
  },
  {
    id: '2',
    institution: '신한은행',
    name: '정기예금',
    balance: 150000000,
    category: AccountCategory.FINANCE,
    lastSynced: '2025-01-15T09:15:00Z',
    mask: '4521'
  },
  {
    id: '3',
    institution: '국토교통부',
    name: '서울시 강남구 아파트',
    balance: 1850000000,
    category: AccountCategory.BUILDING,
    lastSynced: '2025-01-10T16:45:00Z',
    mask: 'APT1'
  },
  {
    id: '4',
    institution: '건설근로자공제회',
    name: '퇴직공제금',
    balance: 45200000,
    category: AccountCategory.MUTUAL_AID,
    lastSynced: '2025-01-14T08:00:00Z',
    mask: '공제'
  },
  {
    id: '5',
    institution: '삼성생명',
    name: '연금보험',
    balance: 320000000,
    category: AccountCategory.PENSION,
    lastSynced: '2025-01-13T14:20:00Z',
    mask: '연금'
  },
  {
    id: '6',
    institution: '국민건강보험공단',
    name: '건강보험 환급금',
    balance: 580000,
    category: AccountCategory.HEALTH_INSURANCE,
    lastSynced: '2025-01-15T11:00:00Z',
    mask: '건강'
  },
  {
    id: '7',
    institution: '국민연금공단',
    name: '노령연금 수급권',
    balance: 89500000,
    category: AccountCategory.NATIONAL_PENSION,
    lastSynced: '2025-01-14T09:30:00Z',
    mask: '국연'
  },
  {
    id: '8',
    institution: '근로복지공단',
    name: '고용보험 미지급금',
    balance: 1250000,
    category: AccountCategory.EMPLOYMENT_INSURANCE,
    lastSynced: '2025-01-12T15:45:00Z',
    mask: '고용'
  },
  {
    id: '9',
    institution: '근로복지공단',
    name: '산재보험 유족급여',
    balance: 0,
    category: AccountCategory.INDUSTRIAL_ACCIDENT,
    lastSynced: '2025-01-12T15:50:00Z',
    mask: '산재'
  },
  {
    id: '10',
    institution: '국토교통부',
    name: '현대 그랜저 (2022년식)',
    balance: 35000000,
    category: AccountCategory.VEHICLE,
    lastSynced: '2025-01-10T10:00:00Z',
    mask: '12가3456'
  },
  {
    id: '11',
    institution: '해양수산부',
    name: '어선 (5톤급)',
    balance: 85000000,
    category: AccountCategory.FISHING_VESSEL,
    lastSynced: '2025-01-08T09:00:00Z',
    mask: '어선'
  },
  {
    id: '12',
    institution: '국토교통부',
    name: '경기도 용인시 농지',
    balance: 450000000,
    category: AccountCategory.LAND,
    lastSynced: '2025-01-10T16:50:00Z',
    mask: 'LAND'
  }
];

export const MOCK_HEIRS: Heir[] = [
  {
    id: 'h1',
    name: '김영희',
    relationship: '배우자',
    allocation: 50,
    email: 'younghee.kim@example.com',
    status: 'active'
  },
  {
    id: 'h2',
    name: '김민수',
    relationship: '장남',
    allocation: 25,
    email: 'minsu.kim@example.com',
    status: 'active'
  },
  {
    id: 'h3',
    name: '김지현',
    relationship: '차녀',
    allocation: 25,
    email: 'jihyun.kim@example.com',
    status: 'pending'
  }
];

export const MOCK_DOCUMENTS: Document[] = [
  {
    id: 'd1',
    name: '사망진단서',
    type: 'PDF',
    uploadedAt: '2025-01-10',
    category: 'Legal'
  },
  {
    id: 'd2',
    name: '가족관계증명서',
    type: 'PDF',
    uploadedAt: '2025-01-11',
    category: 'Legal'
  },
  {
    id: 'd3',
    name: '기본증명서',
    type: 'PDF',
    uploadedAt: '2025-01-11',
    category: 'Legal'
  },
  {
    id: 'd4',
    name: '재산세 과세증명서',
    type: 'PDF',
    uploadedAt: '2025-01-12',
    category: 'Financial'
  },
  {
    id: 'd5',
    name: '금융거래확인서',
    type: 'PDF',
    uploadedAt: '2025-01-13',
    category: 'Financial'
  },
  {
    id: 'd6',
    name: '유언장',
    type: 'PDF',
    uploadedAt: '2024-06-15',
    category: 'Legal'
  }
];

export const NET_WORTH_HISTORY: NetWorthHistory[] = [
  { month: '9월', value: 2850000000 },
  { month: '10월', value: 2920000000 },
  { month: '11월', value: 2980000000 },
  { month: '12월', value: 3010000000 },
  { month: '1월', value: 3029380000 }
];

export const CATEGORY_COLORS: Record<AccountCategory, string> = {
  // 기존 카테고리
  [AccountCategory.CHECKING]: '#3b82f6', // blue-500
  [AccountCategory.SAVINGS]: '#10b981', // emerald-500
  [AccountCategory.INVESTMENT]: '#8b5cf6', // violet-500
  [AccountCategory.RETIREMENT]: '#f59e0b', // amber-500
  [AccountCategory.REAL_ESTATE]: '#ef4444', // red-500
  [AccountCategory.OTHER]: '#94a3b8', // slate-400
  // 한국 상속 자산 카테고리
  [AccountCategory.TAX]: '#dc2626', // red-600
  [AccountCategory.FINANCE]: '#2563eb', // blue-600
  [AccountCategory.BUILDING]: '#7c3aed', // violet-600
  [AccountCategory.MUTUAL_AID]: '#059669', // emerald-600
  [AccountCategory.PENSION]: '#d97706', // amber-600
  [AccountCategory.HEALTH_INSURANCE]: '#0891b2', // cyan-600
  [AccountCategory.NATIONAL_PENSION]: '#4f46e5', // indigo-600
  [AccountCategory.EMPLOYMENT_INSURANCE]: '#9333ea', // purple-600
  [AccountCategory.INDUSTRIAL_ACCIDENT]: '#e11d48', // rose-600
  [AccountCategory.VEHICLE]: '#475569', // slate-600
  [AccountCategory.FISHING_VESSEL]: '#0284c7', // sky-600
  [AccountCategory.LAND]: '#16a34a', // green-600
};
