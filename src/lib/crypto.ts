import crypto from 'crypto';
import { getData, saveData } from './store';

const ALGO = 'aes-256-gcm';
const IV_LEN = 16;
const TAG_LEN = 16;

export async function getOrCreateKey(): Promise<Buffer> {
  const data = await getData();
  if (data.encryptionKey) {
    return Buffer.from(data.encryptionKey, 'hex');
  }
  const key = crypto.randomBytes(32);
  data.encryptionKey = key.toString('hex');
  await saveData(data);
  return key;
}

export function encrypt(text: string, key: Buffer): { encrypted: string; iv: string } {
  const iv = crypto.randomBytes(IV_LEN);
  const cipher = crypto.createCipheriv(ALGO, key, iv);
  const encBuf = Buffer.concat([cipher.update(Buffer.from(text, 'utf8')), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return {
    encrypted: encBuf.toString('base64') + ':' + authTag.toString('base64'),
    iv: iv.toString('base64'),
  };
}

export function decrypt(encrypted: string, ivB64: string, key: Buffer): string {
  const [encB64, tagB64] = encrypted.split(':');
  const iv = Buffer.from(ivB64, 'base64');
  const authTag = Buffer.from(tagB64, 'base64');
  const encData = Buffer.from(encB64, 'base64');
  const decipher = crypto.createDecipheriv(ALGO, key, iv);
  decipher.setAuthTag(authTag);
  const decBuf = Buffer.concat([decipher.update(encData), decipher.final()]);
  return decBuf.toString('utf8');
}
