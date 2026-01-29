-- ============================================
-- Table: public.accnt_owner_info
-- 계좌 소유자 정보 테이블 (Account Owner Information)
-- CODEF OpenBanking API 연동용
-- ============================================

-- Drop existing objects if needed
DROP TABLE IF EXISTS public.accnt_owner_info CASCADE;

-- Create sequence for ID
CREATE SEQUENCE IF NOT EXISTS public.accnt_owner_info_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

-- ============================================
-- Main Table: accnt_owner_info
-- ============================================
CREATE TABLE public.accnt_owner_info (
    -- Primary Key
    owner_id            BIGINT DEFAULT nextval('public.accnt_owner_info_seq') PRIMARY KEY,

    -- CODEF 연동 정보
    connected_id        VARCHAR(64) NOT NULL,           -- CODEF 연결 ID (커넥티드아이디)
    organization        VARCHAR(10) NOT NULL,           -- 기관코드 (예: 0020 = KB국민은행)

    -- 계좌 소유자 기본 정보
    owner_name          VARCHAR(100) NOT NULL,          -- 소유자 성명
    owner_reg_no        VARCHAR(256),                   -- 주민등록번호 (암호화 저장)
    owner_phone         VARCHAR(256),                   -- 전화번호 (암호화 저장)
    owner_email         VARCHAR(256),                   -- 이메일 (암호화 저장)

    -- 계좌 정보
    account_num         VARCHAR(256) NOT NULL,          -- 계좌번호 (암호화 저장)
    account_num_masked  VARCHAR(50),                    -- 마스킹된 계좌번호 (표시용)
    account_name        VARCHAR(100),                   -- 계좌명 (예: 급여통장)
    account_type        VARCHAR(20) NOT NULL,           -- 계좌 유형 (CHECKING, SAVINGS, etc)
    currency            VARCHAR(3) DEFAULT 'KRW',       -- 통화 코드 (KRW, USD, etc)

    -- 잔액 정보
    balance_amt         DECIMAL(18, 2) DEFAULT 0,       -- 현재 잔액
    available_amt       DECIMAL(18, 2) DEFAULT 0,       -- 출금 가능 금액
    hold_amt            DECIMAL(18, 2) DEFAULT 0,       -- 출금 정지 금액
    last_balance_update TIMESTAMP WITH TIME ZONE,       -- 마지막 잔액 조회 시간

    -- 금융기관 정보
    bank_code           VARCHAR(10),                    -- 은행 코드
    bank_name           VARCHAR(50),                    -- 은행명 (예: KB국민은행)
    branch_code         VARCHAR(10),                    -- 지점 코드
    branch_name         VARCHAR(50),                    -- 지점명

    -- 동기화 상태
    sync_status         VARCHAR(20) DEFAULT 'PENDING',  -- PENDING, SYNCING, SYNCED, FAILED
    last_synced_at      TIMESTAMP WITH TIME ZONE,       -- 마지막 동기화 시간
    sync_error_msg      TEXT,                           -- 동기화 실패 시 에러 메시지
    sync_retry_count    INTEGER DEFAULT 0,              -- 동기화 재시도 횟수

    -- TLS 인증 정보
    cert_serial_no      VARCHAR(100),                   -- 사용된 인증서 시리얼 번호
    cert_issued_at      TIMESTAMP WITH TIME ZONE,       -- 인증서 발급일
    cert_expires_at     TIMESTAMP WITH TIME ZONE,       -- 인증서 만료일

    -- 감사 정보 (Audit)
    is_active           BOOLEAN DEFAULT TRUE,           -- 활성 상태
    created_at          TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by          VARCHAR(50),                    -- 생성자
    updated_at          TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_by          VARCHAR(50),                    -- 수정자
    deleted_at          TIMESTAMP WITH TIME ZONE,       -- 소프트 삭제 시간
    deleted_by          VARCHAR(50),                    -- 삭제자

    -- Constraints
    CONSTRAINT uk_accnt_owner_connected_account UNIQUE (connected_id, account_num),
    CONSTRAINT chk_account_type CHECK (account_type IN ('CHECKING', 'SAVINGS', 'INVESTMENT', 'RETIREMENT', 'REAL_ESTATE', 'OTHER')),
    CONSTRAINT chk_sync_status CHECK (sync_status IN ('PENDING', 'SYNCING', 'SYNCED', 'FAILED')),
    CONSTRAINT chk_currency CHECK (currency ~ '^[A-Z]{3}$')
);

-- ============================================
-- Indexes
-- ============================================

-- 자주 조회되는 컬럼에 인덱스 추가
CREATE INDEX idx_accnt_owner_connected_id ON public.accnt_owner_info(connected_id);
CREATE INDEX idx_accnt_owner_organization ON public.accnt_owner_info(organization);
CREATE INDEX idx_accnt_owner_bank_code ON public.accnt_owner_info(bank_code);
CREATE INDEX idx_accnt_owner_account_type ON public.accnt_owner_info(account_type);
CREATE INDEX idx_accnt_owner_sync_status ON public.accnt_owner_info(sync_status);
CREATE INDEX idx_accnt_owner_is_active ON public.accnt_owner_info(is_active) WHERE is_active = TRUE;
CREATE INDEX idx_accnt_owner_created_at ON public.accnt_owner_info(created_at DESC);

-- 부분 인덱스: 실패한 동기화만
CREATE INDEX idx_accnt_owner_sync_failed ON public.accnt_owner_info(sync_status, sync_retry_count)
    WHERE sync_status = 'FAILED';

-- ============================================
-- Comments
-- ============================================

COMMENT ON TABLE public.accnt_owner_info IS '계좌 소유자 정보 테이블 - CODEF OpenBanking API 연동';

COMMENT ON COLUMN public.accnt_owner_info.owner_id IS '계좌 소유자 고유 ID (PK)';
COMMENT ON COLUMN public.accnt_owner_info.connected_id IS 'CODEF 커넥티드아이디 - 계정 연결 식별자';
COMMENT ON COLUMN public.accnt_owner_info.organization IS 'CODEF 기관코드 (예: 0020=KB국민, 0088=신한)';
COMMENT ON COLUMN public.accnt_owner_info.owner_name IS '계좌 소유자 성명';
COMMENT ON COLUMN public.accnt_owner_info.owner_reg_no IS '주민등록번호 (AES-256 암호화)';
COMMENT ON COLUMN public.accnt_owner_info.account_num IS '계좌번호 (AES-256 암호화)';
COMMENT ON COLUMN public.accnt_owner_info.account_num_masked IS '마스킹 계좌번호 (예: 123-***-456)';
COMMENT ON COLUMN public.accnt_owner_info.account_type IS '계좌 유형: CHECKING, SAVINGS, INVESTMENT, RETIREMENT, REAL_ESTATE, OTHER';
COMMENT ON COLUMN public.accnt_owner_info.balance_amt IS '현재 잔액 (원화 기준)';
COMMENT ON COLUMN public.accnt_owner_info.sync_status IS '동기화 상태: PENDING, SYNCING, SYNCED, FAILED';
COMMENT ON COLUMN public.accnt_owner_info.cert_serial_no IS 'TLS 클라이언트 인증서 시리얼 번호';

-- ============================================
-- Trigger: 자동 updated_at 갱신
-- ============================================

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_accnt_owner_info_updated_at
    BEFORE UPDATE ON public.accnt_owner_info
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- 기관코드 참조 테이블 (Optional)
-- ============================================

DROP TABLE IF EXISTS public.codef_organization CASCADE;

CREATE TABLE public.codef_organization (
    org_code        VARCHAR(10) PRIMARY KEY,
    org_name        VARCHAR(50) NOT NULL,
    org_name_en     VARCHAR(50),
    org_type        VARCHAR(20),                -- BANK, SECURITIES, CARD, INSURANCE
    is_active       BOOLEAN DEFAULT TRUE,
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE public.codef_organization IS 'CODEF 금융기관 코드 참조 테이블';

-- 주요 은행 코드 삽입
INSERT INTO public.codef_organization (org_code, org_name, org_name_en, org_type) VALUES
    ('0002', '한국산업은행', 'KDB', 'BANK'),
    ('0003', '기업은행', 'IBK', 'BANK'),
    ('0004', 'KB국민은행', 'KB Kookmin', 'BANK'),
    ('0007', '수협은행', 'Suhyup', 'BANK'),
    ('0011', 'NH농협은행', 'NH Bank', 'BANK'),
    ('0020', '우리은행', 'Woori', 'BANK'),
    ('0023', 'SC제일은행', 'SC First Bank', 'BANK'),
    ('0027', '한국씨티은행', 'Citibank Korea', 'BANK'),
    ('0031', '대구은행', 'Daegu Bank', 'BANK'),
    ('0032', '부산은행', 'Busan Bank', 'BANK'),
    ('0034', '광주은행', 'Kwangju Bank', 'BANK'),
    ('0035', '제주은행', 'Jeju Bank', 'BANK'),
    ('0037', '전북은행', 'Jeonbuk Bank', 'BANK'),
    ('0039', '경남은행', 'Kyongnam Bank', 'BANK'),
    ('0045', '새마을금고', 'MG', 'BANK'),
    ('0048', '신협', 'Credit Union', 'BANK'),
    ('0050', '상호저축은행', 'Savings Bank', 'BANK'),
    ('0081', '하나은행', 'Hana Bank', 'BANK'),
    ('0088', '신한은행', 'Shinhan Bank', 'BANK'),
    ('0089', 'K뱅크', 'K Bank', 'BANK'),
    ('0090', '카카오뱅크', 'Kakao Bank', 'BANK'),
    ('0092', '토스뱅크', 'Toss Bank', 'BANK');

-- ============================================
-- 권한 설정 (필요시)
-- ============================================

-- GRANT SELECT, INSERT, UPDATE, DELETE ON public.accnt_owner_info TO your_app_user;
-- GRANT USAGE, SELECT ON SEQUENCE public.accnt_owner_info_seq TO your_app_user;
-- GRANT SELECT ON public.codef_organization TO your_app_user;

-- ============================================
-- 완료 메시지
-- ============================================

DO $$
BEGIN
    RAISE NOTICE '✅ Table public.accnt_owner_info created successfully';
    RAISE NOTICE '✅ Table public.codef_organization created with % records', (SELECT COUNT(*) FROM public.codef_organization);
END $$;
