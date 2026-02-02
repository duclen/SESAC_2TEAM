/**
 * 문서 금고 서비스
 * AES-256 암호화로 문서를 안전하게 저장/조회
 */

import {
  encrypt,
  decrypt,
  encryptObject,
  decryptObject,
  hash,
  verifyPin,
  generateSecureId,
} from './encryption';

// 문서 타입 정의
export interface SafeDocument {
  id: string;
  name: string;
  type: 'will' | 'insurance' | 'contract' | 'certificate' | 'other';
  uploadedAt: string;
  size: string;
  content?: string; // 암호화된 내용
}

// 금고 상태
interface SafeState {
  isUnlocked: boolean;
  pinHash: string | null;
  documents: SafeDocument[];
  lastAccessedAt: string | null;
}

const STORAGE_KEY = 'sangsokit_safe_data';
const PIN_HASH_KEY = 'sangsokit_safe_pin';

/**
 * 로컬 스토리지에서 암호화된 금고 데이터 조회
 */
async function loadSafeData(): Promise<SafeDocument[]> {
  try {
    const encrypted = localStorage.getItem(STORAGE_KEY);
    if (!encrypted) return [];

    const documents = await decryptObject<SafeDocument[]>(encrypted);
    return documents;
  } catch (error) {
    console.error('금고 데이터 로드 실패:', error);
    return [];
  }
}

/**
 * 금고 데이터를 암호화하여 로컬 스토리지에 저장
 */
async function saveSafeData(documents: SafeDocument[]): Promise<void> {
  try {
    const encrypted = await encryptObject(documents);
    localStorage.setItem(STORAGE_KEY, encrypted);
  } catch (error) {
    console.error('금고 데이터 저장 실패:', error);
    throw new Error('문서 저장에 실패했습니다');
  }
}

/**
 * PIN 설정
 */
export async function setPin(pin: string): Promise<void> {
  const pinHash = await hash(pin);
  localStorage.setItem(PIN_HASH_KEY, pinHash);
}

/**
 * PIN 검증
 */
export async function checkPin(inputPin: string): Promise<boolean> {
  const storedHash = localStorage.getItem(PIN_HASH_KEY);

  // PIN이 설정되지 않은 경우 기본 PIN (1234) 사용
  if (!storedHash) {
    return inputPin === '1234';
  }

  return verifyPin(inputPin, storedHash);
}

/**
 * PIN 설정 여부 확인
 */
export function isPinSet(): boolean {
  return localStorage.getItem(PIN_HASH_KEY) !== null;
}

/**
 * 문서 목록 조회 (복호화)
 */
export async function getDocuments(): Promise<SafeDocument[]> {
  return loadSafeData();
}

/**
 * 문서 추가 (암호화 저장)
 */
export async function addDocument(
  doc: Omit<SafeDocument, 'id' | 'uploadedAt'>
): Promise<SafeDocument> {
  const documents = await loadSafeData();

  const newDoc: SafeDocument = {
    ...doc,
    id: generateSecureId(16),
    uploadedAt: new Date().toISOString().split('T')[0],
  };

  // 문서 내용 암호화
  if (newDoc.content) {
    newDoc.content = await encrypt(newDoc.content);
  }

  documents.push(newDoc);
  await saveSafeData(documents);

  return newDoc;
}

/**
 * 문서 삭제
 */
export async function deleteDocument(id: string): Promise<void> {
  const documents = await loadSafeData();
  const filtered = documents.filter(doc => doc.id !== id);
  await saveSafeData(filtered);
}

/**
 * 문서 내용 조회 (복호화)
 */
export async function getDocumentContent(id: string): Promise<string | null> {
  const documents = await loadSafeData();
  const doc = documents.find(d => d.id === id);

  if (!doc?.content) return null;

  try {
    return await decrypt(doc.content);
  } catch (error) {
    console.error('문서 복호화 실패:', error);
    return null;
  }
}

/**
 * 금고 초기화 (모든 데이터 삭제)
 */
export function resetSafe(): void {
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(PIN_HASH_KEY);
}

/**
 * 금고 내보내기 (암호화된 백업)
 */
export async function exportSafe(exportPin: string): Promise<string> {
  const documents = await loadSafeData();
  return encryptObject(documents, exportPin);
}

/**
 * 금고 가져오기 (백업 복원)
 */
export async function importSafe(encryptedBackup: string, importPin: string): Promise<void> {
  try {
    const documents = await decryptObject<SafeDocument[]>(encryptedBackup, importPin);
    await saveSafeData(documents);
  } catch (error) {
    throw new Error('백업 복원에 실패했습니다. PIN을 확인해주세요.');
  }
}
