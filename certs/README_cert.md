# 인증서 관리 (Certificate Management)

이 디렉토리는 보안 인증서를 저장하는 곳입니다. **절대 Git에 커밋하지 마세요.**

## 📁 디렉토리 구조

```
certs/
├── dev/                    # 개발 환경 인증서
│   ├── codef/             # CODEF API 인증서
│   │   ├── client-cert.pem
│   │   ├── client-key.pem
│   │   └── ca-cert.pem
│   └── ekyc/              # eKYC 인증서
│       ├── pass-cert.pem          # PASS 인증
│       ├── pass-key.pem
│       ├── kakao-cert.pem         # 카카오 인증
│       ├── kakao-key.pem
│       ├── naver-cert.pem         # 네이버 인증
│       └── naver-key.pem
├── prod/                   # 프로덕션 환경 인증서
│   ├── codef/
│   └── ekyc/
└── README.md              # 이 파일
```

## 🔐 eKYC 인증서 종류

### 1. PASS (SKT, KT, LG U+)
- **발급 기관**: 이동통신 3사 공동
- **용도**: 휴대폰 본인인증, 전자서명
- **파일**: `pass-cert.pem`, `pass-key.pem`

### 2. 카카오 인증
- **발급 기관**: 카카오
- **용도**: 카카오톡 기반 본인인증
- **파일**: `kakao-cert.pem`, `kakao-key.pem`

### 3. 네이버 인증
- **발급 기관**: 네이버
- **용도**: 네이버 계정 기반 본인인증
- **파일**: `naver-cert.pem`, `naver-key.pem`




## 📋 인증서 발급 절차

### PASS 인증서
1. PASS 사업자 등록: https://www.sktelecom.com/pass
2. 개발자 콘솔에서 API 키 발급
3. 클라이언트 인증서 다운로드
4. `certs/dev/ekyc/` 또는 `certs/prod/ekyc/`에 저장

### 카카오 인증서
1. 카카오 개발자 센터: https://developers.kakao.com
2. 애플리케이션 생성
3. 인증 API 활성화
4. REST API 키 및 인증서 발급

### 네이버 인증서
1. 네이버 개발자 센터: https://developers.naver.com
2. 애플리케이션 등록
3. 본인인증 API 신청
4. Client ID, Secret 및 인증서 발급

## 🔧 인증서 설치

### 1. 인증서 파일 복사
```bash
# 개발 환경
cp /path/to/downloaded/pass-cert.pem certs/dev/ekyc/
cp /path/to/downloaded/pass-key.pem certs/dev/ekyc/

# 프로덕션 환경
cp /path/to/production/pass-cert.pem certs/prod/ekyc/
cp /path/to/production/pass-key.pem certs/prod/ekyc/
```

### 2. 권한 설정 (Linux/Mac)
```bash
chmod 600 certs/dev/ekyc/*.pem
chmod 600 certs/prod/ekyc/*.pem
```

### 3. 환경변수 설정
`.env.local` 파일에 인증서 경로 추가:
```env
# eKYC 인증서 경로
VITE_EKYC_PASS_CERT_PATH=./certs/dev/ekyc/pass-cert.pem
VITE_EKYC_PASS_KEY_PATH=./certs/dev/ekyc/pass-key.pem
VITE_EKYC_KAKAO_CERT_PATH=./certs/dev/ekyc/kakao-cert.pem
VITE_EKYC_KAKAO_KEY_PATH=./certs/dev/ekyc/kakao-key.pem
```

## ⚠️ 보안 주의사항

### 1. Git 커밋 금지
- `.gitignore`에 `certs/` 폴더가 등록되어 있음
- **절대로** 인증서 파일을 Git에 추가하지 마세요

### 2. 권한 관리
- 인증서 파일은 `600` (소유자만 읽기/쓰기) 권한 설정
- 개인키는 암호화된 상태로 저장

### 3. 만료일 관리
- 인증서 만료일을 주기적으로 확인
- DB `accnt_owner_info.cert_expires_at` 컬럼에서 추적
- 만료 30일 전 알림 발송

### 4. 프로덕션 환경
- 프로덕션 인증서는 AWS Secrets Manager 또는 Azure Key Vault 사용 권장
- 환경변수로 인증서 경로 대신 시크릿 ID 참조

## 🧪 인증서 테스트

```bash
# 인증서 유효성 검증
openssl x509 -in certs/dev/ekyc/pass-cert.pem -text -noout

# 인증서 만료일 확인
openssl x509 -in certs/dev/ekyc/pass-cert.pem -noout -enddate

# 개인키와 인증서 매칭 확인
openssl x509 -noout -modulus -in certs/dev/ekyc/pass-cert.pem | openssl md5
openssl rsa -noout -modulus -in certs/dev/ekyc/pass-key.pem | openssl md5
# 두 해시값이 동일해야 함
```

## 📦 Docker 환경에서 사용

```dockerfile
# Dockerfile
COPY certs/prod/ekyc /app/certs/prod/ekyc
RUN chmod 600 /app/certs/prod/ekyc/*.pem
```

## 🔄 인증서 갱신 프로세스

1. **만료 예정 알림 수신** (30일 전)
2. **새 인증서 발급** (발급 기관 포털)
3. **개발 환경에서 테스트**
4. **프로덕션 배포** (무중단 배포)
5. **이전 인증서 백업** (90일 보관)

## 📞 문제 해결

### 인증서 파일을 찾을 수 없음
```
Error: ENOENT: no such file or directory, open 'certs/dev/ekyc/pass-cert.pem'
```
→ 인증서 파일이 올바른 위치에 있는지 확인

### 권한 오류
```
Error: EACCES: permission denied
```
→ `chmod 600` 명령으로 권한 설정

### 인증서 만료
```
Error: certificate has expired
```
→ 새 인증서 발급 및 교체

## 🔗 관련 문서

- [CODEF API 문서](https://developer.codef.io/)
- [PASS 개발자 가이드](https://www.sktelecom.com/pass/developers)
- [카카오 인증 API](https://developers.kakao.com/docs/latest/ko/kakaologin/common)
- [네이버 로그인 API](https://developers.naver.com/docs/login/api/)
