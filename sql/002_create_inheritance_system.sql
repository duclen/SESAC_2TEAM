-- ============================================
-- 상속 절차 통합 관리 시스템 (Inheritance Management System)
-- ============================================
-- 기능:
-- 1. 원스톱 온라인 신청 (통합 신청서)
-- 2. 공적 데이터 자동 연계
-- 3. 조회 및 진행상황 트래킹
-- 4. 비대면 제출 (전자서명 및 동의)
-- 5. 보안·컴플라이언스
-- ============================================

-- ============================================
-- 1. 상속 케이스 (Inheritance Case)
-- ============================================

DROP TABLE IF EXISTS public.inheritance_case CASCADE;
DROP SEQUENCE IF EXISTS public.inheritance_case_seq CASCADE;

CREATE SEQUENCE public.inheritance_case_seq START WITH 1 INCREMENT BY 1;

CREATE TABLE public.inheritance_case (
    case_id                 BIGINT DEFAULT nextval('public.inheritance_case_seq') PRIMARY KEY,
    case_number             VARCHAR(50) UNIQUE NOT NULL,        -- 사건번호 (예: IH-2026-0001)

    -- 피상속인 (사망자) 정보
    deceased_name           VARCHAR(100) NOT NULL,
    deceased_reg_no         VARCHAR(256) NOT NULL,              -- 주민번호 (암호화)
    deceased_death_date     DATE NOT NULL,                      -- 사망일
    deceased_death_cert_no  VARCHAR(50),                        -- 사망진단서번호

    -- 상속 유형
    inheritance_type        VARCHAR(20) NOT NULL,               -- SIMPLE_SUCCESSION, LIMITED_ACCEPTANCE, RENUNCIATION
    inheritance_reason      VARCHAR(20) DEFAULT 'DEATH',        -- DEATH, MISSING, COURT_ORDER

    -- 상속재산 개요
    total_assets            DECIMAL(18, 2) DEFAULT 0,           -- 총 자산
    total_liabilities       DECIMAL(18, 2) DEFAULT 0,           -- 총 부채
    net_worth               DECIMAL(18, 2) GENERATED ALWAYS AS (total_assets - total_liabilities) STORED,

    -- 진행 상태
    status                  VARCHAR(30) NOT NULL DEFAULT 'DRAFT', -- DRAFT, SUBMITTED, VERIFYING, PROCESSING, COMPLETED, REJECTED
    current_step            VARCHAR(50),                        -- 현재 진행 단계
    progress_percentage     INTEGER DEFAULT 0,                  -- 진행률 (0-100)

    -- 일정 정보
    submitted_at            TIMESTAMP WITH TIME ZONE,           -- 접수일시
    verified_at             TIMESTAMP WITH TIME ZONE,           -- 검증완료일시
    expected_completion_date DATE,                              -- 예상 완료일
    completed_at            TIMESTAMP WITH TIME ZONE,           -- 완료일시

    -- 담당자 정보
    case_manager_id         BIGINT,                             -- 담당 매니저 ID
    assigned_at             TIMESTAMP WITH TIME ZONE,           -- 배정일시

    -- 감사
    created_at              TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by              VARCHAR(50),
    updated_at              TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_by              VARCHAR(50),

    CONSTRAINT chk_inheritance_type CHECK (inheritance_type IN ('SIMPLE_SUCCESSION', 'LIMITED_ACCEPTANCE', 'RENUNCIATION')),
    CONSTRAINT chk_inheritance_status CHECK (status IN ('DRAFT', 'SUBMITTED', 'VERIFYING', 'PROCESSING', 'COMPLETED', 'REJECTED')),
    CONSTRAINT chk_progress_range CHECK (progress_percentage BETWEEN 0 AND 100)
);

CREATE INDEX idx_inheritance_case_status ON public.inheritance_case(status);
CREATE INDEX idx_inheritance_case_type ON public.inheritance_case(inheritance_type);
CREATE INDEX idx_inheritance_case_submitted ON public.inheritance_case(submitted_at DESC);

COMMENT ON TABLE public.inheritance_case IS '상속 케이스 마스터 테이블';
COMMENT ON COLUMN public.inheritance_case.inheritance_type IS 'SIMPLE_SUCCESSION(단순승계), LIMITED_ACCEPTANCE(한정승인), RENUNCIATION(상속포기)';

-- ============================================
-- 2. 상속인 정보 (Heirs)
-- ============================================

DROP TABLE IF EXISTS public.inheritance_heir CASCADE;
DROP SEQUENCE IF EXISTS public.inheritance_heir_seq CASCADE;

CREATE SEQUENCE public.inheritance_heir_seq START WITH 1 INCREMENT BY 1;

CREATE TABLE public.inheritance_heir (
    heir_id                 BIGINT DEFAULT nextval('public.inheritance_heir_seq') PRIMARY KEY,
    case_id                 BIGINT NOT NULL REFERENCES public.inheritance_case(case_id) ON DELETE CASCADE,

    -- 상속인 기본 정보
    heir_name               VARCHAR(100) NOT NULL,
    heir_reg_no             VARCHAR(256) NOT NULL,              -- 주민번호 (암호화)
    heir_phone              VARCHAR(256),                       -- 전화번호 (암호화)
    heir_email              VARCHAR(256),                       -- 이메일 (암호화)
    heir_address            TEXT,                               -- 주소

    -- 관계 정보
    relationship            VARCHAR(50) NOT NULL,               -- SPOUSE, CHILD, PARENT, SIBLING, etc.
    relationship_order      INTEGER,                            -- 상속 순위 (1순위, 2순위 등)

    -- 상속 비율
    inheritance_ratio       DECIMAL(5, 2) NOT NULL,             -- 상속 비율 (%)
    inheritance_amount      DECIMAL(18, 2),                     -- 상속 예정 금액

    -- 본인인증 (eKYC)
    ekyc_status             VARCHAR(20) DEFAULT 'PENDING',      -- PENDING, VERIFIED, FAILED
    ekyc_verified_at        TIMESTAMP WITH TIME ZONE,
    ekyc_method             VARCHAR(30),                        -- MOBILE, VIDEO, IN_PERSON
    ekyc_provider           VARCHAR(50),                        -- PASS, KAKAO, NAVER, etc.

    -- 서명 상태
    signature_status        VARCHAR(20) DEFAULT 'PENDING',      -- PENDING, SIGNED, REJECTED
    signature_method        VARCHAR(30),                        -- DIGITAL, BIOMETRIC, VIDEO
    signed_at               TIMESTAMP WITH TIME ZONE,

    -- 대리인 정보
    has_proxy               BOOLEAN DEFAULT FALSE,
    proxy_name              VARCHAR(100),
    proxy_relationship      VARCHAR(50),
    proxy_authorization_doc VARCHAR(500),                       -- 위임장 문서 경로

    -- 상태
    is_active               BOOLEAN DEFAULT TRUE,
    consent_status          VARCHAR(20) DEFAULT 'PENDING',      -- PENDING, CONSENTED, DECLINED
    consented_at            TIMESTAMP WITH TIME ZONE,

    -- 감사
    created_at              TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at              TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT chk_heir_ratio CHECK (inheritance_ratio BETWEEN 0 AND 100),
    CONSTRAINT chk_ekyc_status CHECK (ekyc_status IN ('PENDING', 'VERIFIED', 'FAILED')),
    CONSTRAINT chk_signature_status CHECK (signature_status IN ('PENDING', 'SIGNED', 'REJECTED'))
);

CREATE INDEX idx_heir_case ON public.inheritance_heir(case_id);
CREATE INDEX idx_heir_ekyc_status ON public.inheritance_heir(ekyc_status);
CREATE INDEX idx_heir_signature_status ON public.inheritance_heir(signature_status);

COMMENT ON TABLE public.inheritance_heir IS '상속인 정보 및 본인인증/서명 상태';

-- ============================================
-- 3. 기관 신청 현황 (Institution Applications)
-- ============================================

DROP TABLE IF EXISTS public.institution_application CASCADE;
DROP SEQUENCE IF EXISTS public.institution_application_seq CASCADE;

CREATE SEQUENCE public.institution_application_seq START WITH 1 INCREMENT BY 1;

CREATE TABLE public.institution_application (
    application_id          BIGINT DEFAULT nextval('public.institution_application_seq') PRIMARY KEY,
    case_id                 BIGINT NOT NULL REFERENCES public.inheritance_case(case_id) ON DELETE CASCADE,

    -- 기관 정보
    institution_type        VARCHAR(30) NOT NULL,               -- BANK, INSURANCE, SECURITIES, REAL_ESTATE, VEHICLE, TELECOM
    institution_code        VARCHAR(20),
    institution_name        VARCHAR(100) NOT NULL,

    -- 신청 정보
    application_number      VARCHAR(100),                       -- 기관 측 접수번호
    asset_type              VARCHAR(50),                        -- ACCOUNT, POLICY, STOCK, PROPERTY, CAR, etc.
    asset_identifier        VARCHAR(256),                       -- 계좌번호, 증권번호 등 (암호화)
    asset_value             DECIMAL(18, 2),                     -- 자산 가액

    -- 처리 상태
    status                  VARCHAR(30) DEFAULT 'PENDING',      -- PENDING, SUBMITTED, VERIFYING, APPROVED, REJECTED, COMPLETED
    submitted_at            TIMESTAMP WITH TIME ZONE,
    approved_at             TIMESTAMP WITH TIME ZONE,
    completed_at            TIMESTAMP WITH TIME ZONE,

    -- 지연/오류 관리
    is_delayed              BOOLEAN DEFAULT FALSE,
    delay_reason            TEXT,
    expected_completion     DATE,

    -- 에러 정보
    error_code              VARCHAR(50),
    error_message           TEXT,
    retry_count             INTEGER DEFAULT 0,

    -- 담당자
    institution_contact     VARCHAR(100),                       -- 기관 담당자
    institution_phone       VARCHAR(50),

    -- 감사
    created_at              TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at              TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT chk_institution_type CHECK (institution_type IN ('BANK', 'INSURANCE', 'SECURITIES', 'REAL_ESTATE', 'VEHICLE', 'TELECOM', 'OTHER')),
    CONSTRAINT chk_application_status CHECK (status IN ('PENDING', 'SUBMITTED', 'VERIFYING', 'APPROVED', 'REJECTED', 'COMPLETED'))
);

CREATE INDEX idx_institution_case ON public.institution_application(case_id);
CREATE INDEX idx_institution_type ON public.institution_application(institution_type);
CREATE INDEX idx_institution_status ON public.institution_application(status);
CREATE INDEX idx_institution_delayed ON public.institution_application(is_delayed) WHERE is_delayed = TRUE;

COMMENT ON TABLE public.institution_application IS '다기관(은행·보험·증권·부동산 등) 일괄 접수 현황';

-- ============================================
-- 4. 공적 데이터 연계 (Government Data Integration)
-- ============================================

DROP TABLE IF EXISTS public.government_data_fetch CASCADE;
DROP SEQUENCE IF EXISTS public.government_data_fetch_seq CASCADE;

CREATE SEQUENCE public.government_data_fetch_seq START WITH 1 INCREMENT BY 1;

CREATE TABLE public.government_data_fetch (
    fetch_id                BIGINT DEFAULT nextval('public.government_data_fetch_seq') PRIMARY KEY,
    case_id                 BIGINT NOT NULL REFERENCES public.inheritance_case(case_id) ON DELETE CASCADE,

    -- 데이터 유형
    data_type               VARCHAR(50) NOT NULL,               -- DEATH_CERTIFICATE, FAMILY_REGISTER, BASIC_CERTIFICATE, REMOVAL_REGISTER
    api_provider            VARCHAR(50),                        -- 정부24, 대법원, 행안부 등

    -- 요청 정보
    request_id              VARCHAR(100),                       -- API 요청 ID
    requested_at            TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    request_params          JSONB,                              -- 요청 파라미터 (JSON)

    -- 응답 정보
    status                  VARCHAR(20) DEFAULT 'PENDING',      -- PENDING, SUCCESS, FAILED
    response_data           JSONB,                              -- 응답 데이터 (JSON)
    fetched_at              TIMESTAMP WITH TIME ZONE,

    -- 에러 정보
    error_code              VARCHAR(50),
    error_message           TEXT,
    retry_count             INTEGER DEFAULT 0,

    -- 파일 정보 (PDF 변환)
    file_path               VARCHAR(500),                       -- 저장 경로
    file_hash               VARCHAR(128),                       -- SHA-256 해시 (위변조 방지)

    -- 감사
    created_at              TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT chk_gov_data_type CHECK (data_type IN ('DEATH_CERTIFICATE', 'FAMILY_REGISTER', 'BASIC_CERTIFICATE', 'REMOVAL_REGISTER', 'OTHER')),
    CONSTRAINT chk_gov_status CHECK (status IN ('PENDING', 'SUCCESS', 'FAILED'))
);

CREATE INDEX idx_gov_data_case ON public.government_data_fetch(case_id);
CREATE INDEX idx_gov_data_type ON public.government_data_fetch(data_type);
CREATE INDEX idx_gov_data_status ON public.government_data_fetch(status);

COMMENT ON TABLE public.government_data_fetch IS '공적 데이터 API 연동 이력 (사망확인, 가족관계, 기본증명 등)';

-- ============================================
-- 5. 서류 관리 (Document Management)
-- ============================================

DROP TABLE IF EXISTS public.inheritance_document CASCADE;
DROP SEQUENCE IF EXISTS public.inheritance_document_seq CASCADE;

CREATE SEQUENCE public.inheritance_document_seq START WITH 1 INCREMENT BY 1;

CREATE TABLE public.inheritance_document (
    document_id             BIGINT DEFAULT nextval('public.inheritance_document_seq') PRIMARY KEY,
    case_id                 BIGINT NOT NULL REFERENCES public.inheritance_case(case_id) ON DELETE CASCADE,
    heir_id                 BIGINT REFERENCES public.inheritance_heir(heir_id) ON DELETE SET NULL,

    -- 서류 정보
    document_type           VARCHAR(50) NOT NULL,               -- DEATH_CERT, ID_CARD, FAMILY_REG, CONSENT_FORM, etc.
    document_name           VARCHAR(200) NOT NULL,
    document_category       VARCHAR(30),                        -- GOVERNMENT, PERSONAL, INSTITUTION

    -- 파일 정보
    file_path               VARCHAR(500) NOT NULL,
    file_name               VARCHAR(255) NOT NULL,
    file_size               BIGINT,                             -- bytes
    file_type               VARCHAR(20),                        -- PDF, JPG, PNG
    file_hash               VARCHAR(128),                       -- SHA-256 해시

    -- 상태
    status                  VARCHAR(20) DEFAULT 'UPLOADED',     -- UPLOADED, VERIFIED, REJECTED, EXPIRED
    is_required             BOOLEAN DEFAULT TRUE,
    is_verified             BOOLEAN DEFAULT FALSE,
    verified_at             TIMESTAMP WITH TIME ZONE,
    verified_by             VARCHAR(50),

    -- 만료 정보
    expires_at              DATE,                               -- 유효기간
    is_expired              BOOLEAN GENERATED ALWAYS AS (expires_at < CURRENT_DATE) STORED,

    -- 전자서명 정보
    has_signature           BOOLEAN DEFAULT FALSE,
    signature_hash          VARCHAR(128),                       -- 전자서명 해시
    signature_timestamp     TIMESTAMP WITH TIME ZONE,           -- 서명 타임스탬프

    -- 감사
    uploaded_at             TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    uploaded_by             VARCHAR(50),

    CONSTRAINT chk_doc_status CHECK (status IN ('UPLOADED', 'VERIFIED', 'REJECTED', 'EXPIRED'))
);

CREATE INDEX idx_doc_case ON public.inheritance_document(case_id);
CREATE INDEX idx_doc_heir ON public.inheritance_document(heir_id);
CREATE INDEX idx_doc_type ON public.inheritance_document(document_type);
CREATE INDEX idx_doc_status ON public.inheritance_document(status);
CREATE INDEX idx_doc_expired ON public.inheritance_document(is_expired) WHERE is_expired = TRUE;

COMMENT ON TABLE public.inheritance_document IS '상속 관련 서류 관리 (업로드, 검증, 전자서명)';

-- ============================================
-- 6. 전자서명 워크플로우 (E-Signature Workflow)
-- ============================================

DROP TABLE IF EXISTS public.esignature_workflow CASCADE;
DROP SEQUENCE IF EXISTS public.esignature_workflow_seq CASCADE;

CREATE SEQUENCE public.esignature_workflow_seq START WITH 1 INCREMENT BY 1;

CREATE TABLE public.esignature_workflow (
    workflow_id             BIGINT DEFAULT nextval('public.esignature_workflow_seq') PRIMARY KEY,
    case_id                 BIGINT NOT NULL REFERENCES public.inheritance_case(case_id) ON DELETE CASCADE,
    document_id             BIGINT REFERENCES public.inheritance_document(document_id) ON DELETE SET NULL,

    -- 워크플로우 정보
    workflow_name           VARCHAR(200) NOT NULL,
    workflow_type           VARCHAR(30) NOT NULL,               -- SEQUENTIAL, PARALLEL, CONDITIONAL

    -- 진행 상태
    status                  VARCHAR(30) DEFAULT 'PENDING',      -- PENDING, IN_PROGRESS, COMPLETED, REJECTED, EXPIRED
    total_signers           INTEGER NOT NULL,
    signed_count            INTEGER DEFAULT 0,

    -- 일정
    started_at              TIMESTAMP WITH TIME ZONE,
    deadline                TIMESTAMP WITH TIME ZONE,
    completed_at            TIMESTAMP WITH TIME ZONE,

    -- 감사
    created_at              TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by              VARCHAR(50),

    CONSTRAINT chk_workflow_type CHECK (workflow_type IN ('SEQUENTIAL', 'PARALLEL', 'CONDITIONAL')),
    CONSTRAINT chk_workflow_status CHECK (status IN ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'REJECTED', 'EXPIRED'))
);

CREATE INDEX idx_esign_workflow_case ON public.esignature_workflow(case_id);
CREATE INDEX idx_esign_workflow_status ON public.esignature_workflow(status);

COMMENT ON TABLE public.esignature_workflow IS '다중 전자서명 워크플로우 (순차/동시 서명 지원)';

-- ============================================
-- 7. 전자서명 기록 (E-Signature Records)
-- ============================================

DROP TABLE IF EXISTS public.esignature_record CASCADE;
DROP SEQUENCE IF EXISTS public.esignature_record_seq CASCADE;

CREATE SEQUENCE public.esignature_record_seq START WITH 1 INCREMENT BY 1;

CREATE TABLE public.esignature_record (
    signature_id            BIGINT DEFAULT nextval('public.esignature_record_seq') PRIMARY KEY,
    workflow_id             BIGINT NOT NULL REFERENCES public.esignature_workflow(workflow_id) ON DELETE CASCADE,
    heir_id                 BIGINT NOT NULL REFERENCES public.inheritance_heir(heir_id) ON DELETE CASCADE,

    -- 서명 순서
    signing_order           INTEGER NOT NULL,                   -- 서명 순서 (순차 서명용)

    -- 서명 정보
    signature_method        VARCHAR(30) NOT NULL,               -- DIGITAL, BIOMETRIC, VIDEO, REMOTE_NOTARY
    signature_data          TEXT,                               -- 서명 이미지 base64 또는 경로
    signature_hash          VARCHAR(128),                       -- SHA-256 해시
    signature_certificate   TEXT,                               -- 공인인증서 정보

    -- 상태
    status                  VARCHAR(20) DEFAULT 'PENDING',      -- PENDING, SIGNED, REJECTED, EXPIRED
    signed_at               TIMESTAMP WITH TIME ZONE,

    -- 본인확인
    verification_method     VARCHAR(30),                        -- MOBILE, VIDEO, IN_PERSON
    verification_provider   VARCHAR(50),
    verified_at             TIMESTAMP WITH TIME ZONE,

    -- IP 및 디바이스 정보 (보안 감사)
    ip_address              INET,
    user_agent              TEXT,
    device_info             JSONB,

    -- 타임스탬프 (위변조 방지)
    timestamp_token         TEXT,                               -- RFC 3161 타임스탬프
    timestamp_authority     VARCHAR(100),                       -- TSA (Time Stamping Authority)

    -- 거부 사유
    rejection_reason        TEXT,
    rejected_at             TIMESTAMP WITH TIME ZONE,

    -- 감사
    created_at              TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT chk_esign_method CHECK (signature_method IN ('DIGITAL', 'BIOMETRIC', 'VIDEO', 'REMOTE_NOTARY')),
    CONSTRAINT chk_esign_status CHECK (status IN ('PENDING', 'SIGNED', 'REJECTED', 'EXPIRED'))
);

CREATE INDEX idx_esign_record_workflow ON public.esignature_record(workflow_id);
CREATE INDEX idx_esign_record_heir ON public.esignature_record(heir_id);
CREATE INDEX idx_esign_record_status ON public.esignature_record(status);
CREATE INDEX idx_esign_record_signed_at ON public.esignature_record(signed_at DESC);

COMMENT ON TABLE public.esignature_record IS '전자서명 기록 (타임스탬프, IP, 디바이스 정보 포함)';

-- ============================================
-- 8. 알림 (Notifications)
-- ============================================

DROP TABLE IF EXISTS public.notification CASCADE;
DROP SEQUENCE IF EXISTS public.notification_seq CASCADE;

CREATE SEQUENCE public.notification_seq START WITH 1 INCREMENT BY 1;

CREATE TABLE public.notification (
    notification_id         BIGINT DEFAULT nextval('public.notification_seq') PRIMARY KEY,
    case_id                 BIGINT REFERENCES public.inheritance_case(case_id) ON DELETE CASCADE,
    heir_id                 BIGINT REFERENCES public.inheritance_heir(heir_id) ON DELETE CASCADE,

    -- 알림 정보
    notification_type       VARCHAR(30) NOT NULL,               -- STATUS_CHANGE, SIGNATURE_REQUEST, DOCUMENT_REQUIRED, DEADLINE, etc.
    title                   VARCHAR(200) NOT NULL,
    message                 TEXT NOT NULL,
    priority                VARCHAR(20) DEFAULT 'NORMAL',       -- LOW, NORMAL, HIGH, URGENT

    -- 발송 채널
    channel                 VARCHAR(20)[] NOT NULL,             -- ['SMS', 'EMAIL', 'APP_PUSH']

    -- 발송 상태
    status                  VARCHAR(20) DEFAULT 'PENDING',      -- PENDING, SENT, FAILED, READ
    sent_at                 TIMESTAMP WITH TIME ZONE,
    read_at                 TIMESTAMP WITH TIME ZONE,

    -- 추가 데이터
    action_url              VARCHAR(500),                       -- 액션 링크 (예: 서명 페이지)
    metadata                JSONB,                              -- 추가 메타데이터

    -- 감사
    created_at              TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT chk_notif_priority CHECK (priority IN ('LOW', 'NORMAL', 'HIGH', 'URGENT')),
    CONSTRAINT chk_notif_status CHECK (status IN ('PENDING', 'SENT', 'FAILED', 'READ'))
);

CREATE INDEX idx_notif_case ON public.notification(case_id);
CREATE INDEX idx_notif_heir ON public.notification(heir_id);
CREATE INDEX idx_notif_status ON public.notification(status);
CREATE INDEX idx_notif_created ON public.notification(created_at DESC);

COMMENT ON TABLE public.notification IS '알림 관리 (문자/이메일/앱푸시)';

-- ============================================
-- 9. 감사 로그 (Audit Log)
-- ============================================

DROP TABLE IF EXISTS public.audit_log CASCADE;
DROP SEQUENCE IF EXISTS public.audit_log_seq CASCADE;

CREATE SEQUENCE public.audit_log_seq START WITH 1 INCREMENT BY 1;

CREATE TABLE public.audit_log (
    log_id                  BIGINT DEFAULT nextval('public.audit_log_seq') PRIMARY KEY,

    -- 대상 정보
    case_id                 BIGINT,
    entity_type             VARCHAR(50) NOT NULL,               -- CASE, HEIR, DOCUMENT, SIGNATURE, etc.
    entity_id               BIGINT NOT NULL,

    -- 액션 정보
    action                  VARCHAR(50) NOT NULL,               -- CREATE, UPDATE, DELETE, SIGN, VERIFY, etc.
    action_description      TEXT,

    -- 변경 내용
    old_value               JSONB,                              -- 변경 전 값
    new_value               JSONB,                              -- 변경 후 값

    -- 사용자 정보
    user_id                 VARCHAR(50),
    user_name               VARCHAR(100),
    user_role               VARCHAR(30),

    -- 접속 정보
    ip_address              INET,
    user_agent              TEXT,
    session_id              VARCHAR(100),

    -- 감사
    created_at              TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_audit_case ON public.audit_log(case_id);
CREATE INDEX idx_audit_entity ON public.audit_log(entity_type, entity_id);
CREATE INDEX idx_audit_action ON public.audit_log(action);
CREATE INDEX idx_audit_created ON public.audit_log(created_at DESC);
CREATE INDEX idx_audit_user ON public.audit_log(user_id);

COMMENT ON TABLE public.audit_log IS '전체 시스템 감사 로그 (개인정보 최소 처리, 가명처리)';

-- ============================================
-- Triggers: 자동 updated_at 갱신
-- ============================================

CREATE TRIGGER trg_inheritance_case_updated_at
    BEFORE UPDATE ON public.inheritance_case
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trg_inheritance_heir_updated_at
    BEFORE UPDATE ON public.inheritance_heir
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trg_institution_application_updated_at
    BEFORE UPDATE ON public.institution_application
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- 초기 데이터: 상속 유형별 필수 서류 매핑
-- ============================================

DROP TABLE IF EXISTS public.required_document_template CASCADE;

CREATE TABLE public.required_document_template (
    template_id             SERIAL PRIMARY KEY,
    inheritance_type        VARCHAR(20) NOT NULL,
    document_type           VARCHAR(50) NOT NULL,
    document_name           VARCHAR(200) NOT NULL,
    is_mandatory            BOOLEAN DEFAULT TRUE,
    description             TEXT,

    CONSTRAINT uk_template_type_doc UNIQUE (inheritance_type, document_type)
);

INSERT INTO public.required_document_template (inheritance_type, document_type, document_name, is_mandatory, description) VALUES
    -- 단순승계 (SIMPLE_SUCCESSION)
    ('SIMPLE_SUCCESSION', 'DEATH_CERT', '사망진단서', TRUE, '피상속인의 사망을 증명하는 서류'),
    ('SIMPLE_SUCCESSION', 'FAMILY_REG', '가족관계증명서', TRUE, '상속인 관계 확인용'),
    ('SIMPLE_SUCCESSION', 'CONSENT_FORM', '상속동의서', TRUE, '전체 상속인 동의'),
    ('SIMPLE_SUCCESSION', 'ID_CARD', '신분증', TRUE, '상속인 본인확인용'),

    -- 한정승인 (LIMITED_ACCEPTANCE)
    ('LIMITED_ACCEPTANCE', 'DEATH_CERT', '사망진단서', TRUE, '피상속인 사망 증명'),
    ('LIMITED_ACCEPTANCE', 'FAMILY_REG', '가족관계증명서', TRUE, '상속인 관계 확인'),
    ('LIMITED_ACCEPTANCE', 'COURT_APPLICATION', '한정승인 심판청구서', TRUE, '법원 제출용'),
    ('LIMITED_ACCEPTANCE', 'ASSET_LIST', '상속재산목록', TRUE, '자산 및 부채 목록'),
    ('LIMITED_ACCEPTANCE', 'ID_CARD', '신분증', TRUE, '상속인 본인확인'),

    -- 상속포기 (RENUNCIATION)
    ('RENUNCIATION', 'DEATH_CERT', '사망진단서', TRUE, '피상속인 사망 증명'),
    ('RENUNCIATION', 'FAMILY_REG', '가족관계증명서', TRUE, '상속인 관계 확인'),
    ('RENUNCIATION', 'COURT_APPLICATION', '상속포기 심판청구서', TRUE, '법원 제출용'),
    ('RENUNCIATION', 'ID_CARD', '신분증', TRUE, '상속인 본인확인');

COMMENT ON TABLE public.required_document_template IS '상속 유형별 필수 서류 템플릿';

-- ============================================
-- 완료 메시지
-- ============================================

DO $$
BEGIN
    RAISE NOTICE '✅ Inheritance Management System schema created successfully';
    RAISE NOTICE '   - inheritance_case (상속 케이스)';
    RAISE NOTICE '   - inheritance_heir (상속인 정보)';
    RAISE NOTICE '   - institution_application (기관 신청 현황)';
    RAISE NOTICE '   - government_data_fetch (공적 데이터 연계)';
    RAISE NOTICE '   - inheritance_document (서류 관리)';
    RAISE NOTICE '   - esignature_workflow (전자서명 워크플로우)';
    RAISE NOTICE '   - esignature_record (전자서명 기록)';
    RAISE NOTICE '   - notification (알림)';
    RAISE NOTICE '   - audit_log (감사 로그)';
    RAISE NOTICE '   - required_document_template (필수 서류 템플릿)';
END $$;
