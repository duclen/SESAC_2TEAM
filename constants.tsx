
import { Account, AccountCategory, Heir, Document, NetWorthHistory } from './types';

export const MOCK_ACCOUNTS: Account[] = [
  {
    id: '1',
    institution: 'Chase Bank',
    name: 'Premier Plus Checking',
    balance: 12450.50,
    category: AccountCategory.CHECKING,
    lastSynced: '2024-05-15T10:30:00Z',
    mask: '4452'
  },
  {
    id: '2',
    institution: 'Vanguard',
    name: 'Total Stock Market Index',
    balance: 245000.75,
    category: AccountCategory.INVESTMENT,
    lastSynced: '2024-05-15T09:15:00Z',
    mask: '8812'
  },
  {
    id: '3',
    institution: 'Fidelity',
    name: 'Rollover IRA',
    balance: 185000.00,
    category: AccountCategory.RETIREMENT,
    lastSynced: '2024-05-14T16:45:00Z',
    mask: '0091'
  },
  {
    id: '4',
    institution: 'Marcus by Goldman',
    name: 'High Yield Savings',
    balance: 45000.00,
    category: AccountCategory.SAVINGS,
    lastSynced: '2024-05-15T08:00:00Z',
    mask: '2214'
  },
  {
    id: '5',
    institution: 'Primary Residence',
    name: 'Family Home',
    balance: 650000.00,
    category: AccountCategory.REAL_ESTATE,
    lastSynced: '2024-01-01T00:00:00Z',
    mask: 'HOME'
  }
];

export const MOCK_HEIRS: Heir[] = [
  {
    id: 'h1',
    name: 'Sarah Johnson',
    relationship: 'Daughter',
    allocation: 40,
    email: 'sarah.j@example.com',
    status: 'active'
  },
  {
    id: 'h2',
    name: 'Michael Johnson',
    relationship: 'Son',
    allocation: 40,
    email: 'mike.j@example.com',
    status: 'active'
  },
  {
    id: 'h3',
    name: 'The Nature Conservancy',
    relationship: 'Charity',
    allocation: 20,
    email: 'donations@nature.org',
    status: 'pending'
  }
];

export const MOCK_DOCUMENTS: Document[] = [
  {
    id: 'd1',
    name: 'Last Will and Testament',
    type: 'PDF',
    uploadedAt: '2023-11-12',
    category: 'Legal'
  },
  {
    id: 'd2',
    name: 'Living Trust Agreement',
    type: 'PDF',
    uploadedAt: '2023-11-12',
    category: 'Legal'
  },
  {
    id: 'd3',
    name: 'Life Insurance Policy - MetLife',
    type: 'PDF',
    uploadedAt: '2024-02-05',
    category: 'Financial'
  },
  {
    id: 'd4',
    name: 'Power of Attorney',
    type: 'PDF',
    uploadedAt: '2023-11-15',
    category: 'Legal'
  }
];

export const NET_WORTH_HISTORY: NetWorthHistory[] = [
  { month: 'Jan', value: 980000 },
  { month: 'Feb', value: 1010000 },
  { month: 'Mar', value: 1050000 },
  { month: 'Apr', value: 1085000 },
  { month: 'May', value: 1137451 }
];

export const CATEGORY_COLORS: Record<AccountCategory, string> = {
  [AccountCategory.CHECKING]: '#3b82f6', // blue-500
  [AccountCategory.SAVINGS]: '#10b981', // emerald-500
  [AccountCategory.INVESTMENT]: '#8b5cf6', // violet-500
  [AccountCategory.RETIREMENT]: '#f59e0b', // amber-500
  [AccountCategory.REAL_ESTATE]: '#ef4444', // red-500
  [AccountCategory.OTHER]: '#94a3b8', // slate-400
};
