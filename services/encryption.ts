/**
 * AES-256-GCM 암호화 서비스
 * 브라우저 Web Crypto API 기반
 */

const ALGORITHM = 'AES-GCM';
const KEY_LENGTH = 256;
const IV_LENGTH = 12; // GCM 권장 IV 길이

// 암호화 키 (실제 운영에서는 환경변수 또는 안전한 키 관리 시스템 사용)
const ENCRYPTION_KEY_BASE = 'sangsokit-secure-key-2024-legacy';

/**
 * 문자열을 ArrayBuffer로 변환
 */
function stringToArrayBuffer(str: string): ArrayBuffer {
  const encoder = new TextEncoder();
  return encoder.encode(str).buffer;
}

/**
 * ArrayBuffer를 문자열로 변환
 */
function arrayBufferToString(buffer: ArrayBuffer): string {
  const decoder = new TextDecoder();
  return decoder.decode(buffer);
}

/**
 * ArrayBuffer를 Base64 문자열로 변환
 */
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * Base64 문자열을 ArrayBuffer로 변환
 */
function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

/**
 * 암호화 키 생성 (PBKDF2 기반)
 */
async function deriveKey(password: string): Promise<CryptoKey> {
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    stringToArrayBuffer(password),
    'PBKDF2',
    false,
    ['deriveKey']
  );

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: stringToArrayBuffer('sangsokit-salt-2024'),
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: ALGORITHM, length: KEY_LENGTH },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * 데이터 암호화
 * @param plaintext 암호화할 평문
 * @param customKey 사용자 정의 키 (옵션)
 * @returns Base64 인코딩된 암호문 (IV + 암호문)
 */
export async function encrypt(plaintext: string, customKey?: string): Promise<string> {
  const key = await deriveKey(customKey || ENCRYPTION_KEY_BASE);
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));

  const encrypted = await crypto.subtle.encrypt(
    { name: ALGORITHM, iv },
    key,
    stringToArrayBuffer(plaintext)
  );

  // IV + 암호문을 결합
  const combined = new Uint8Array(iv.length + encrypted.byteLength);
  combined.set(iv, 0);
  combined.set(new Uint8Array(encrypted), iv.length);

  return arrayBufferToBase64(combined.buffer);
}

/**
 * 데이터 복호화
 * @param encryptedData Base64 인코딩된 암호문
 * @param customKey 사용자 정의 키 (옵션)
 * @returns 복호화된 평문
 */
export async function decrypt(encryptedData: string, customKey?: string): Promise<string> {
  const key = await deriveKey(customKey || ENCRYPTION_KEY_BASE);
  const combined = new Uint8Array(base64ToArrayBuffer(encryptedData));

  // IV와 암호문 분리
  const iv = combined.slice(0, IV_LENGTH);
  const encrypted = combined.slice(IV_LENGTH);

  const decrypted = await crypto.subtle.decrypt(
    { name: ALGORITHM, iv },
    key,
    encrypted
  );

  return arrayBufferToString(decrypted);
}

/**
 * 객체 암호화 (JSON 직렬화 후 암호화)
 */
export async function encryptObject<T>(obj: T, customKey?: string): Promise<string> {
  const json = JSON.stringify(obj);
  return encrypt(json, customKey);
}

/**
 * 암호화된 객체 복호화
 */
export async function decryptObject<T>(encryptedData: string, customKey?: string): Promise<T> {
  const json = await decrypt(encryptedData, customKey);
  return JSON.parse(json) as T;
}

/**
 * 해시 생성 (SHA-256)
 */
export async function hash(data: string): Promise<string> {
  const hashBuffer = await crypto.subtle.digest('SHA-256', stringToArrayBuffer(data));
  return arrayBufferToBase64(hashBuffer);
}

/**
 * PIN 검증용 해시 비교
 */
export async function verifyPin(inputPin: string, storedHash: string): Promise<boolean> {
  const inputHash = await hash(inputPin);
  return inputHash === storedHash;
}

/**
 * 안전한 랜덤 문자열 생성
 */
export function generateSecureId(length: number = 32): string {
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}
