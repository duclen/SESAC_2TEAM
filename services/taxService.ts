const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

// 상속세 계산 입력 타입
export interface TaxCalculationInput {
  total_assets: number;
  children?: number;
  elderly?: number;
  minors?: number[];
  disabled?: number[];
  spouse_inherited?: number;
  financial_assets?: number;
  housing_deduction?: number;
  funeral_cost?: number;
  debts?: number;
}

// 공제 내역 타입
export interface Deductions {
  basic_or_personal: number;
  spouse: number;
  financial: number;
  housing: number;
  funeral: number;
  debts: number;
  total: number;
}

// 상속세 계산 결과 타입
export interface TaxCalculationResult {
  total_assets: number;
  taxable_base: number;
  tax: number;
  rate: number;
  deductions: Deductions;
}

// 상속인 타입
export interface HeirAllocation {
  name: string;
  inherited_assets: number;
}

// 세액 안분 결과 타입
export interface AllocatedHeir {
  name: string;
  inherited_assets: number;
  ratio: number;
  allocated_tax: number;
}

export interface AllocationResult {
  total_tax: number;
  allocated: AllocatedHeir[];
}

// 상속세 계산 API
export const calculateInheritanceTax = async (
  input: TaxCalculationInput
): Promise<TaxCalculationResult> => {
  const response = await fetch(`${API_BASE_URL}/inheritance-tax/calculate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || '상속세 계산 실패');
  }

  return response.json();
};

// 세액 안분 API
export const allocateTax = async (
  total_tax: number,
  heirs: HeirAllocation[]
): Promise<AllocationResult> => {
  const response = await fetch(`${API_BASE_URL}/inheritance-tax/allocate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ total_tax, heirs }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || '세액 안분 실패');
  }

  return response.json();
};
