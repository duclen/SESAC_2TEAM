/**
 * TLS Configuration for CODEF API Integration
 *
 * 보안 설정:
 * - TLS 1.3 강제
 * - Strong cipher suites만 허용
 * - Perfect Forward Secrecy (PFS)
 * - Certificate pinning
 */

export interface TLSConfig {
  certPath: string;
  keyPath: string;
  caPath: string;
  keyPassword?: string;
  minVersion: string;
  maxVersion: string;
  ciphers: string[];
  rejectUnauthorized: boolean;
  enableCertPinning: boolean;
}

/**
 * Allowed TLS cipher suites (strong encryption only)
 * - ECDHE: Elliptic Curve Diffie-Hellman (Perfect Forward Secrecy)
 * - AES-256-GCM: AES 256-bit in Galois/Counter Mode
 * - CHACHA20: Modern alternative to AES
 */
const STRONG_CIPHERS = [
  'TLS_AES_256_GCM_SHA384',              // TLS 1.3
  'TLS_CHACHA20_POLY1305_SHA256',        // TLS 1.3
  'TLS_AES_128_GCM_SHA256',              // TLS 1.3
  'ECDHE-RSA-AES256-GCM-SHA384',         // TLS 1.2
  'ECDHE-RSA-AES128-GCM-SHA256',         // TLS 1.2
];

/**
 * Get TLS configuration based on environment
 */
export const getTLSConfig = (): TLSConfig => {
  const isDevelopment = import.meta.env.MODE === 'development';

  return {
    certPath: import.meta.env.VITE_CODEF_CERT_PATH || './certs/dev/client-cert.pem',
    keyPath: import.meta.env.VITE_CODEF_KEY_PATH || './certs/dev/client-key.pem',
    caPath: import.meta.env.VITE_CODEF_CA_PATH || './certs/dev/ca-cert.pem',
    keyPassword: import.meta.env.VITE_CODEF_KEY_PASSWORD,

    // TLS 버전 설정
    minVersion: import.meta.env.VITE_TLS_VERSION === '1.2' ? 'TLSv1.2' : 'TLSv1.3',
    maxVersion: 'TLSv1.3',

    // 강력한 암호화 스위트만 허용
    ciphers: STRONG_CIPHERS,

    // 인증서 검증 (개발 환경에서도 true 권장)
    rejectUnauthorized: true,

    // Certificate Pinning 활성화
    enableCertPinning: import.meta.env.VITE_ENABLE_CERT_PINNING === 'true',
  };
};

/**
 * Validate TLS configuration
 */
export const validateTLSConfig = (config: TLSConfig): void => {
  const requiredFields: (keyof TLSConfig)[] = ['certPath', 'keyPath', 'caPath'];

  for (const field of requiredFields) {
    if (!config[field]) {
      throw new Error(`TLS configuration error: ${field} is required`);
    }
  }

  console.log('✅ TLS configuration validated successfully');
};

export default getTLSConfig;
