
export enum AccountCategory {
  CHECKING = 'Checking',
  SAVINGS = 'Savings',
  INVESTMENT = 'Investment',
  RETIREMENT = 'Retirement',
  REAL_ESTATE = 'Real Estate',
  OTHER = 'Other'
}

export interface Account {
  id: string;
  institution: string;
  name: string;
  balance: number;
  category: AccountCategory;
  lastSynced: string;
  mask: string;
}

export interface Heir {
  id: string;
  name: string;
  relationship: string;
  allocation: number; // percentage
  email: string;
  status: 'active' | 'pending' | 'verified';
}

export interface Document {
  id: string;
  name: string;
  type: string;
  uploadedAt: string;
  category: 'Legal' | 'Financial' | 'Health' | 'Personal';
}

export interface NetWorthHistory {
  month: string;
  value: number;
}
