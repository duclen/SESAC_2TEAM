/**
 * CODEF API Configuration
 *
 * CODEF (Korea Financial Telecommunications & Clearings Institute)
 * 금융결제원 오픈뱅킹 API 설정
 */

export interface CodefConfig {
  apiUrl: string;
  clientId: string;
  clientSecret: string;
  organization: string;
  timeout: number;
  version: string;
}

/**
 * Get CODEF API configuration based on environment
 */
export const getCodefConfig = (): CodefConfig => {
  const apiUrl = import.meta.env.VITE_CODEF_API_URL;
  const clientId = import.meta.env.VITE_CODEF_CLIENT_ID;
  const clientSecret = import.meta.env.VITE_CODEF_CLIENT_SECRET;
  const organization = import.meta.env.VITE_CODEF_ORGANIZATION;

  if (!apiUrl || !clientId || !clientSecret) {
    throw new Error(
      'CODEF configuration error: Missing required environment variables. ' +
      'Please check VITE_CODEF_API_URL, VITE_CODEF_CLIENT_ID, and VITE_CODEF_CLIENT_SECRET'
    );
  }

  return {
    apiUrl,
    clientId,
    clientSecret,
    organization: organization || '',
    timeout: parseInt(import.meta.env.VITE_API_TIMEOUT || '30000', 10),
    version: 'v1',
  };
};

/**
 * Validate CODEF configuration
 */
export const validateCodefConfig = (config: CodefConfig): void => {
  if (!config.apiUrl.startsWith('https://')) {
    throw new Error('CODEF API URL must use HTTPS protocol');
  }

  if (!config.clientId || !config.clientSecret) {
    throw new Error('CODEF client credentials are required');
  }

  console.log('✅ CODEF configuration validated successfully');
};

export default getCodefConfig;
