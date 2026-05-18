import { NextRequest } from 'next/server';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { getData, saveData } from './store';

const tokenCache = new Map<string, true>();

export function getTokenFromRequest(req: NextRequest): string | undefined {
  let token = req.cookies.get("admin_token")?.value;
  if (!token) {
    const auth = req.headers.get("authorization");
    if (auth?.startsWith("Bearer ")) token = auth.slice(7);
  }
  return token;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  if (!hash) return false;
  return bcrypt.compare(password, hash);
}

export async function createSessionToken(): Promise<string> {
  const token = uuidv4();
  tokenCache.set(token, true);
  const data = await getData();
  data.adminToken = token;
  await saveData(data);
  return token;
}

export async function validateSessionToken(token: string): Promise<boolean> {
  if (!token) return false;
  if (tokenCache.has(token)) return true;
  const data = await getData();
  const valid = data.adminToken === token;
  if (valid) tokenCache.set(token, true);
  return valid;
}

export async function clearSessionToken(): Promise<void> {
  const data = await getData();
  data.adminToken = "";
  await saveData(data);
  tokenCache.clear();
}
