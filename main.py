from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import RedirectResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import httpx
import os
from dotenv import load_dotenv
from urllib.parse import urlencode

# 환경 변수 로드
load_dotenv()

app = FastAPI()

# CORS 설정 (Vite 개발 서버용)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:3000",
        "http://192.168.56.1:3000",
        "http://192.168.101.11:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 환경 변수에서 설정 로드
CLIENT_ID = os.getenv("CLIENT_ID")
CLIENT_SECRET = os.getenv("CLIENT_SECRET")
REDIRECT_URI = os.getenv("REDIRECT_URI", "http://localhost:5173/callback")
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")

# 금결원 API 엔드포인트 (실제 URL로 변경 필요)
AUTH_BASE_URL = os.getenv("AUTH_BASE_URL", "https://testapi.openbanking.or.kr")
AUTHORIZE_URL = f"{AUTH_BASE_URL}/oauth/2.0/authorize"
TOKEN_URL = f"{AUTH_BASE_URL}/oauth/2.0/token"


class TokenRequest(BaseModel):
    code: str


@app.get("/")
async def root():
    return {"message": "금결원 OAuth2.0 인증 서버"}


@app.get("/api/auth/login")
async def login():
    """
    (1) 사용자를 금결원 인증 서버로 리다이렉트
    """
    if not CLIENT_ID:
        raise HTTPException(status_code=500, detail="CLIENT_ID가 설정되지 않았습니다")
    
    params = {
        "response_type": "code",
        "client_id": CLIENT_ID,
        "redirect_uri": REDIRECT_URI,
        "scope": "login inquiry transfer",  # login 필수
        "state": "12345678901234567890123456789012",  # 32자리 랜덤 문자열
        "auth_type": "0",  # 0: 최초인증, 1: 재인증, 2: 간편인증
    }

    auth_url = f"{AUTHORIZE_URL}?{urlencode(params)}"
    print(f"=== 생성된 인증 URL ===")
    print(f"CLIENT_ID: {CLIENT_ID}")
    print(f"REDIRECT_URI: {REDIRECT_URI}")
    print(f"AUTH_URL: {auth_url}")
    return {"auth_url": auth_url}


@app.post("/api/auth/token")
async def get_token(token_request: TokenRequest):
    """
    (4) code를 받아서 금결원 토큰 서버에 access_token 요청
    """
    if not CLIENT_ID or not CLIENT_SECRET:
        raise HTTPException(
            status_code=500, 
            detail="CLIENT_ID 또는 CLIENT_SECRET이 설정되지 않았습니다"
        )
    
    # 토큰 요청 데이터
    data = {
        "grant_type": "authorization_code",
        "client_id": CLIENT_ID,
        "client_secret": CLIENT_SECRET,
        "code": token_request.code,
        "redirect_uri": REDIRECT_URI,
    }
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                TOKEN_URL,
                data=data,
                headers={
                    "Content-Type": "application/x-www-form-urlencoded",
                }
            )
            
            if response.status_code != 200:
                raise HTTPException(
                    status_code=response.status_code,
                    detail=f"토큰 발급 실패: {response.text}"
                )
            
            token_data = response.json()
            return token_data
            
    except httpx.RequestError as e:
        raise HTTPException(
            status_code=500,
            detail=f"토큰 요청 중 오류 발생: {str(e)}"
        )


@app.get("/api/auth/refresh")
async def refresh_token(refresh_token: str):
    """
    Refresh Token을 사용하여 새로운 Access Token 발급
    """
    if not CLIENT_ID or not CLIENT_SECRET:
        raise HTTPException(
            status_code=500,
            detail="CLIENT_ID 또는 CLIENT_SECRET이 설정되지 않았습니다"
        )
    
    data = {
        "grant_type": "refresh_token",
        "client_id": CLIENT_ID,
        "client_secret": CLIENT_SECRET,
        "refresh_token": refresh_token,
    }
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                TOKEN_URL,
                data=data,
                headers={
                    "Content-Type": "application/x-www-form-urlencoded",
                }
            )
            
            if response.status_code != 200:
                raise HTTPException(
                    status_code=response.status_code,
                    detail=f"토큰 갱신 실패: {response.text}"
                )
            
            return response.json()
            
    except httpx.RequestError as e:
        raise HTTPException(
            status_code=500,
            detail=f"토큰 갱신 중 오류 발생: {str(e)}"
        )


@app.get("/api/user/info")
async def get_user_info(access_token: str):
    """
    Access Token을 사용하여 사용자 정보 조회 (예시)
    """
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{AUTH_BASE_URL}/v2.0/user/me",
                headers={
                    "Authorization": f"Bearer {access_token}"
                }
            )
            
            if response.status_code != 200:
                raise HTTPException(
                    status_code=response.status_code,
                    detail=f"사용자 정보 조회 실패: {response.text}"
                )
            
            return response.json()
            
    except httpx.RequestError as e:
        raise HTTPException(
            status_code=500,
            detail=f"사용자 정보 조회 중 오류 발생: {str(e)}"
        )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
