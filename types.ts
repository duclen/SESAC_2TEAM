
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

// ============================================
// Extended Types for Inheritance System Integration
// ============================================

/**
 * Extended Account interface with CODEF integration
 * Maps to public.accnt_owner_info table
 */
export interface CodefAccount extends Account {
  ownerId?: number;                   // DB owner_id
  connectedId: string;                // CODEF connected_id
  organization: string;               // 기관코드
  accountNumber?: string;             // 암호화된 실제 계좌번호
  currency: string;                   // 통화 (KRW, USD, etc)
  availableAmount?: number;           // 출금 가능 금액
  syncStatus: 'PENDING' | 'SYNCING' | 'SYNCED' | 'FAILED';
  lastSyncedAt?: string;
  syncErrorMessage?: string;
}

/**
 * Extended Heir interface for inheritance management
 * Maps to public.inheritance_heir table
 */
export interface InheritanceHeir extends Heir {
  heirId?: number;                    // DB heir_id
  caseId?: number;                    // 상속 케이스 ID
  regNo?: string;                     // 주민번호 (암호화)
  phone?: string;                     // 전화번호 (암호화)
  address?: string;                   // 주소
  relationshipOrder?: number;         // 상속 순위
  inheritanceAmount?: number;         // 상속 예정 금액

  // eKYC & 서명
  ekycStatus: 'PENDING' | 'VERIFIED' | 'FAILED';
  ekycVerifiedAt?: string;
  signatureStatus: 'PENDING' | 'SIGNED' | 'REJECTED';
  signedAt?: string;

  // 동의 상태
  consentStatus: 'PENDING' | 'CONSENTED' | 'DECLINED';
  consentedAt?: string;
}

/**
 * Extended Document interface for inheritance documents
 * Maps to public.inheritance_document table
 */
export interface InheritanceDocument extends Document {
  documentId?: number;                // DB document_id
  caseId?: number;                    // 상속 케이스 ID
  heirId?: number;                    // 관련 상속인 ID
  filePath: string;                   // 파일 경로
  fileSize?: number;                  // 파일 크기 (bytes)
  fileHash?: string;                  // SHA-256 해시
  isRequired: boolean;                // 필수 여부
  isVerified: boolean;                // 검증 완료 여부
  verifiedAt?: string;
  expiresAt?: string;                 // 유효기간
  hasSignature: boolean;              // 전자서명 포함 여부
  signatureHash?: string;             // 서명 해시
}

/**
 * Institution (Financial Institution)
 */
export interface FinancialInstitution {
  institutionCode: string;            // 기관코드
  institutionName: string;            // 기관명
  institutionType: 'BANK' | 'INSURANCE' | 'SECURITIES' | 'REAL_ESTATE' | 'VEHICLE' | 'TELECOM' | 'OTHER';
  isActive: boolean;
}

/**
 * User Profile (extended for inheritance system)
 */
export interface UserProfile {
  userId: string;
  userName: string;
  email: string;
  phone?: string;
  role: 'USER' | 'HEIR' | 'ADMIN' | 'CASE_MANAGER';

  // 연결된 상속 케이스
  activeCaseId?: number;

  // eKYC 인증 여부
  isKycVerified: boolean;
  kycVerifiedAt?: string;
}

/**
 * Sync Status for account synchronization
 */
export interface SyncStatus {
  lastSyncAt?: string;
  nextSyncAt?: string;
  syncInProgress: boolean;
  syncError?: string;
  accountsSynced: number;
  accountsFailed: number;
}
