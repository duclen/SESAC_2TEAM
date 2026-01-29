/**
 * 상속 절차 통합 관리 시스템 타입 정의
 * Inheritance Management System TypeScript Types
 */

// ============================================
// Enums
// ============================================

export enum InheritanceType {
  SIMPLE_SUCCESSION = 'SIMPLE_SUCCESSION',      // 단순승계
  LIMITED_ACCEPTANCE = 'LIMITED_ACCEPTANCE',    // 한정승인
  RENUNCIATION = 'RENUNCIATION'                 // 상속포기
}

export enum InheritanceStatus {
  DRAFT = 'DRAFT',
  SUBMITTED = 'SUBMITTED',
  VERIFYING = 'VERIFYING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  REJECTED = 'REJECTED'
}

export enum InstitutionType {
  BANK = 'BANK',                    // 은행
  INSURANCE = 'INSURANCE',          // 보험
  SECURITIES = 'SECURITIES',        // 증권
  REAL_ESTATE = 'REAL_ESTATE',      // 부동산
  VEHICLE = 'VEHICLE',              // 차량
  TELECOM = 'TELECOM',              // 통신
  OTHER = 'OTHER'
}

export enum ApplicationStatus {
  PENDING = 'PENDING',
  SUBMITTED = 'SUBMITTED',
  VERIFYING = 'VERIFYING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  COMPLETED = 'COMPLETED'
}

export enum EKYCStatus {
  PENDING = 'PENDING',
  VERIFIED = 'VERIFIED',
  FAILED = 'FAILED'
}

export enum SignatureStatus {
  PENDING = 'PENDING',
  SIGNED = 'SIGNED',
  REJECTED = 'REJECTED'
}

export enum SignatureMethod {
  DIGITAL = 'DIGITAL',              // 공인인증서
  BIOMETRIC = 'BIOMETRIC',          // 생체인증
  VIDEO = 'VIDEO',                  // 영상확인
  REMOTE_NOTARY = 'REMOTE_NOTARY'   // 원격공증
}

export enum WorkflowType {
  SEQUENTIAL = 'SEQUENTIAL',        // 순차 서명
  PARALLEL = 'PARALLEL',            // 동시 서명
  CONDITIONAL = 'CONDITIONAL'       // 조건부 서명
}

export enum NotificationChannel {
  SMS = 'SMS',
  EMAIL = 'EMAIL',
  APP_PUSH = 'APP_PUSH'
}

export enum NotificationPriority {
  LOW = 'LOW',
  NORMAL = 'NORMAL',
  HIGH = 'HIGH',
  URGENT = 'URGENT'
}

export enum GovernmentDataType {
  DEATH_CERTIFICATE = 'DEATH_CERTIFICATE',      // 사망진단서
  FAMILY_REGISTER = 'FAMILY_REGISTER',          // 가족관계증명서
  BASIC_CERTIFICATE = 'BASIC_CERTIFICATE',      // 기본증명서
  REMOVAL_REGISTER = 'REMOVAL_REGISTER',        // 제적등본
  OTHER = 'OTHER'
}

// ============================================
// Interfaces
// ============================================

/**
 * 상속 케이스
 */
export interface InheritanceCase {
  caseId: number;
  caseNumber: string;

  // 피상속인 정보
  deceasedName: string;
  deceasedRegNo: string;              // 암호화된 주민번호
  deceasedDeathDate: string;          // ISO date
  deceasedDeathCertNo?: string;

  // 상속 유형
  inheritanceType: InheritanceType;
  inheritanceReason: 'DEATH' | 'MISSING' | 'COURT_ORDER';

  // 재산 정보
  totalAssets: number;
  totalLiabilities: number;
  netWorth: number;

  // 진행 상태
  status: InheritanceStatus;
  currentStep?: string;
  progressPercentage: number;

  // 일정
  submittedAt?: string;
  verifiedAt?: string;
  expectedCompletionDate?: string;
  completedAt?: string;

  // 담당자
  caseManagerId?: number;
  assignedAt?: string;

  // 감사
  createdAt: string;
  createdBy?: string;
  updatedAt: string;
  updatedBy?: string;
}

/**
 * 상속인
 */
export interface Heir {
  heirId: number;
  caseId: number;

  // 기본 정보
  heirName: string;
  heirRegNo: string;                  // 암호화
  heirPhone?: string;                 // 암호화
  heirEmail?: string;                 // 암호화
  heirAddress?: string;

  // 관계
  relationship: string;               // SPOUSE, CHILD, PARENT, SIBLING
  relationshipOrder?: number;         // 상속 순위

  // 상속 비율
  inheritanceRatio: number;           // 0-100 (%)
  inheritanceAmount?: number;

  // eKYC 본인인증
  ekycStatus: EKYCStatus;
  ekycVerifiedAt?: string;
  ekycMethod?: string;                // MOBILE, VIDEO, IN_PERSON
  ekycProvider?: string;              // PASS, KAKAO, NAVER

  // 서명 상태
  signatureStatus: SignatureStatus;
  signatureMethod?: string;
  signedAt?: string;

  // 대리인
  hasProxy: boolean;
  proxyName?: string;
  proxyRelationship?: string;
  proxyAuthorizationDoc?: string;

  // 상태
  isActive: boolean;
  consentStatus: 'PENDING' | 'CONSENTED' | 'DECLINED';
  consentedAt?: string;

  // 감사
  createdAt: string;
  updatedAt: string;
}

/**
 * 기관 신청 현황
 */
export interface InstitutionApplication {
  applicationId: number;
  caseId: number;

  // 기관 정보
  institutionType: InstitutionType;
  institutionCode?: string;
  institutionName: string;

  // 신청 정보
  applicationNumber?: string;
  assetType?: string;                 // ACCOUNT, POLICY, STOCK, PROPERTY, CAR
  assetIdentifier?: string;           // 암호화된 계좌번호 등
  assetValue?: number;

  // 처리 상태
  status: ApplicationStatus;
  submittedAt?: string;
  approvedAt?: string;
  completedAt?: string;

  // 지연 관리
  isDelayed: boolean;
  delayReason?: string;
  expectedCompletion?: string;

  // 에러 정보
  errorCode?: string;
  errorMessage?: string;
  retryCount: number;

  // 담당자
  institutionContact?: string;
  institutionPhone?: string;

  // 감사
  createdAt: string;
  updatedAt: string;
}

/**
 * 공적 데이터 연계
 */
export interface GovernmentDataFetch {
  fetchId: number;
  caseId: number;

  // 데이터 유형
  dataType: GovernmentDataType;
  apiProvider?: string;

  // 요청
  requestId?: string;
  requestedAt: string;
  requestParams?: Record<string, any>;

  // 응답
  status: 'PENDING' | 'SUCCESS' | 'FAILED';
  responseData?: Record<string, any>;
  fetchedAt?: string;

  // 에러
  errorCode?: string;
  errorMessage?: string;
  retryCount: number;

  // 파일
  filePath?: string;
  fileHash?: string;

  createdAt: string;
}

/**
 * 서류 관리
 */
export interface InheritanceDocument {
  documentId: number;
  caseId: number;
  heirId?: number;

  // 서류 정보
  documentType: string;
  documentName: string;
  documentCategory?: 'GOVERNMENT' | 'PERSONAL' | 'INSTITUTION';

  // 파일 정보
  filePath: string;
  fileName: string;
  fileSize?: number;
  fileType?: string;
  fileHash?: string;

  // 상태
  status: 'UPLOADED' | 'VERIFIED' | 'REJECTED' | 'EXPIRED';
  isRequired: boolean;
  isVerified: boolean;
  verifiedAt?: string;
  verifiedBy?: string;

  // 만료
  expiresAt?: string;
  isExpired: boolean;

  // 전자서명
  hasSignature: boolean;
  signatureHash?: string;
  signatureTimestamp?: string;

  // 감사
  uploadedAt: string;
  uploadedBy?: string;
}

/**
 * 전자서명 워크플로우
 */
export interface ESignatureWorkflow {
  workflowId: number;
  caseId: number;
  documentId?: number;

  // 워크플로우 정보
  workflowName: string;
  workflowType: WorkflowType;

  // 진행 상태
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'REJECTED' | 'EXPIRED';
  totalSigners: number;
  signedCount: number;

  // 일정
  startedAt?: string;
  deadline?: string;
  completedAt?: string;

  // 감사
  createdAt: string;
  createdBy?: string;
}

/**
 * 전자서명 기록
 */
export interface ESignatureRecord {
  signatureId: number;
  workflowId: number;
  heirId: number;

  // 서명 순서
  signingOrder: number;

  // 서명 정보
  signatureMethod: SignatureMethod;
  signatureData?: string;
  signatureHash?: string;
  signatureCertificate?: string;

  // 상태
  status: SignatureStatus;
  signedAt?: string;

  // 본인확인
  verificationMethod?: string;
  verificationProvider?: string;
  verifiedAt?: string;

  // 보안 감사
  ipAddress?: string;
  userAgent?: string;
  deviceInfo?: Record<string, any>;

  // 타임스탬프
  timestampToken?: string;
  timestampAuthority?: string;

  // 거부
  rejectionReason?: string;
  rejectedAt?: string;

  createdAt: string;
}

/**
 * 알림
 */
export interface Notification {
  notificationId: number;
  caseId?: number;
  heirId?: number;

  // 알림 정보
  notificationType: string;
  title: string;
  message: string;
  priority: NotificationPriority;

  // 발송 채널
  channel: NotificationChannel[];

  // 발송 상태
  status: 'PENDING' | 'SENT' | 'FAILED' | 'READ';
  sentAt?: string;
  readAt?: string;

  // 추가
  actionUrl?: string;
  metadata?: Record<string, any>;

  createdAt: string;
}

/**
 * 감사 로그
 */
export interface AuditLog {
  logId: number;
  caseId?: number;

  // 대상
  entityType: string;
  entityId: number;

  // 액션
  action: string;
  actionDescription?: string;

  // 변경 내용
  oldValue?: Record<string, any>;
  newValue?: Record<string, any>;

  // 사용자
  userId?: string;
  userName?: string;
  userRole?: string;

  // 접속 정보
  ipAddress?: string;
  userAgent?: string;
  sessionId?: string;

  createdAt: string;
}

/**
 * 필수 서류 템플릿
 */
export interface RequiredDocumentTemplate {
  templateId: number;
  inheritanceType: InheritanceType;
  documentType: string;
  documentName: string;
  isMandatory: boolean;
  description?: string;
}

// ============================================
// Request/Response DTOs
// ============================================

/**
 * 상속 케이스 생성 요청
 */
export interface CreateInheritanceCaseRequest {
  deceasedName: string;
  deceasedRegNo: string;
  deceasedDeathDate: string;
  deceasedDeathCertNo?: string;
  inheritanceType: InheritanceType;
  inheritanceReason?: 'DEATH' | 'MISSING' | 'COURT_ORDER';
}

/**
 * 상속인 추가 요청
 */
export interface AddHeirRequest {
  caseId: number;
  heirName: string;
  heirRegNo: string;
  heirPhone?: string;
  heirEmail?: string;
  relationship: string;
  inheritanceRatio: number;
}

/**
 * 기관 신청 요청
 */
export interface CreateInstitutionApplicationRequest {
  caseId: number;
  institutionType: InstitutionType;
  institutionName: string;
  assetType?: string;
  assetIdentifier?: string;
  assetValue?: number;
}

/**
 * 전자서명 워크플로우 생성 요청
 */
export interface CreateESignatureWorkflowRequest {
  caseId: number;
  documentId?: number;
  workflowName: string;
  workflowType: WorkflowType;
  heirIds: number[];
  deadline?: string;
}

/**
 * 서명 요청
 */
export interface SignDocumentRequest {
  workflowId: number;
  heirId: number;
  signatureMethod: SignatureMethod;
  signatureData?: string;
  verificationMethod?: string;
}

/**
 * 진행 상황 응답
 */
export interface InheritanceProgressResponse {
  case: InheritanceCase;
  heirs: Heir[];
  applications: InstitutionApplication[];
  documents: InheritanceDocument[];
  workflows: ESignatureWorkflow[];

  // 진행 요약
  summary: {
    totalSteps: number;
    completedSteps: number;
    progressPercentage: number;
    nextAction?: string;
    delayedApplications: number;
    pendingSignatures: number;
  };
}

/**
 * 알림 발송 요청
 */
export interface SendNotificationRequest {
  caseId?: number;
  heirId?: number;
  notificationType: string;
  title: string;
  message: string;
  priority?: NotificationPriority;
  channel: NotificationChannel[];
  actionUrl?: string;
}
