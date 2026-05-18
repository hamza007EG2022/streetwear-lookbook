import { NextRequest } from 'next/server';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { getData, saveData } from './store';

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
  const data = await getData();
  data.adminToken = token;
  await saveData(data);
  return token;
}

export async function validateSessionToken(token: string): Promise<boolean> {
  if (!token) return false;
  const data = await getData();
  return data.adminToken === token;
}

export async function clearSessionToken(): Promise<void> {
  const data = await getData();
  data.adminToken = "";
  await saveData(data);
}
