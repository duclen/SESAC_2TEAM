import { getAuthState } from './authService';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

export interface BankAccount {
  fintech_use_num: string;
  account_alias: string;
  bank_code_std: string;
  bank_code_sub: string;
  bank_name: string;
  account_num_masked: string;
  account_holder_name: string;
  account_type: string;
  inquiry_agree_yn: string;
  inquiry_agree_dtime: string;
  transfer_agree_yn: string;
  transfer_agree_dtime: string;
}

export interface AccountListResponse {
  api_tran_id: string;
  api_tran_dtm: string;
  rsp_code: string;
  rsp_message: string;
  user_name: string;
  res_cnt: string;
  res_list: BankAccount[];
}

export interface AccountBalance {
  fintech_use_num: string;
  balance_amt: string;
  available_amt: string;
  account_type: string;
  product_name: string;
  bank_name: string;
}

export interface AccountBalanceResponse {
  api_tran_id: string;
  rsp_code: string;
  rsp_message: string;
  bank_name: string;
  balance_amt: string;
  available_amt: string;
  product_name: string;
}

// 계좌 목록 조회
export const getAccountList = async (): Promise<AccountListResponse> => {
  const authState = getAuthState();

  if (!authState.accessToken || !authState.userInfo?.user_seq_no) {
    throw new Error('인증 정보가 없습니다. 다시 로그인해주세요.');
  }

  const params = new URLSearchParams({
    access_token: authState.accessToken,
    user_seq_no: authState.userInfo.user_seq_no,
  });

  const response = await fetch(`${API_BASE_URL}/api/account/list?${params}`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || '계좌 목록 조회 실패');
  }

  return response.json();
};

// 계좌 잔액 조회
export const getAccountBalance = async (fintechUseNum: string): Promise<AccountBalanceResponse> => {
  const authState = getAuthState();

  if (!authState.accessToken) {
    throw new Error('인증 정보가 없습니다. 다시 로그인해주세요.');
  }

  const params = new URLSearchParams({
    access_token: authState.accessToken,
    fintech_use_num: fintechUseNum,
  });

  const response = await fetch(`${API_BASE_URL}/api/account/balance?${params}`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || '잔액 조회 실패');
  }

  return response.json();
};

// 모든 계좌의 잔액 조회
export const getAllAccountBalances = async (accounts: BankAccount[]): Promise<Map<string, AccountBalanceResponse>> => {
  const balances = new Map<string, AccountBalanceResponse>();

  await Promise.all(
    accounts.map(async (account) => {
      try {
        const balance = await getAccountBalance(account.fintech_use_num);
        balances.set(account.fintech_use_num, balance);
      } catch (error) {
        console.error(`잔액 조회 실패: ${account.bank_name}`, error);
      }
    })
  );

  return balances;
};

// 은행 코드를 이름으로 변환
export const getBankName = (bankCode: string): string => {
  const bankNames: Record<string, string> = {
    '001': 'KDB산업은행',
    '002': 'IBK기업은행',
    '003': 'KB국민은행',
    '004': 'NH농협',
    '005': '외환은행',
    '007': '수협',
    '008': '수출입은행',
    '011': 'NH농협',
    '012': '지역농축협',
    '020': '우리은행',
    '023': 'SC제일은행',
    '027': '한국씨티은행',
    '031': '대구은행',
    '032': '부산은행',
    '034': '광주은행',
    '035': '제주은행',
    '037': '전북은행',
    '039': '경남은행',
    '045': '새마을금고',
    '048': '신협',
    '050': '저축은행',
    '052': '모건스탠리',
    '054': 'HSBC',
    '055': '도이치뱅크',
    '057': '제이피모건',
    '058': '미즈호은행',
    '059': '미쓰비시UFJ',
    '060': 'BOA',
    '061': 'BNP파리바',
    '062': '중국공상은행',
    '063': '중국은행',
    '064': '산림조합',
    '065': '대화은행',
    '066': '교통은행',
    '067': '중국건설은행',
    '071': '우체국',
    '076': '신용보증기금',
    '077': '기술보증기금',
    '081': 'KEB하나은행',
    '088': '신한은행',
    '089': 'K뱅크',
    '090': '카카오뱅크',
    '092': '토스뱅크',
    '094': '서울보증보험',
    '103': 'SBI저축은행',
  };

  return bankNames[bankCode] || `은행(${bankCode})`;
};
