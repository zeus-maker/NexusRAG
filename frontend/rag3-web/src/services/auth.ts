import { Base64 } from 'js-base64';
import JSEncrypt from 'jsencrypt';
import {
  apiRequestRaw,
  setStoredAuth,
  setStoredUser,
  clearAuthStorage,
} from './http';

const RSA_PUBLIC_KEY =
  '-----BEGIN PUBLIC KEY-----MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEArq9XTUSeYr2+N1h3Afl/z8Dse/2yD0ZGrKwx+EEEcdsBLca9Ynmx3nIB5obmLlSfmskLpBo0UACBmB5rEjBp2Q2f3AG3Hjd4B+gNCG6BDaawuDlgANIhGnaTLrIqWrrcm4EMzJOnAOI1fgzJRsOOUEfaS318Eq9OVO3apEyCCt0lOQK6PuksduOjVxtltDav+guVAA068NrPYmRNabVKRNLJpL8w4D44sfth5RvZ3q9t+6RTArpEtc5sh5ChzvqPOzKGMXW83C95TxmXqpbK6olN4RevSfVjEAgCydH6HN6OhtOQEcnrU97r9H0iZOWwbw3pVrZiUkuRD1R56Wzs2wIDAQAB-----END PUBLIC KEY-----';

export interface RagflowUser {
  id: string;
  email: string;
  nickname: string;
  avatar?: string;
  access_token?: string;
}

function encryptPassword(password: string): string {
  const encryptor = new JSEncrypt();
  encryptor.setPublicKey(RSA_PUBLIC_KEY);
  const encrypted = encryptor.encrypt(Base64.encode(password));
  if (!encrypted) throw new Error('密码加密失败');
  return encrypted;
}

export async function login(email: string, password: string) {
  const { data, headers } = await apiRequestRaw<RagflowUser>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password: encryptPassword(password) }),
  });

  const authorization = headers.get('Authorization');
  if (authorization) setStoredAuth(authorization);

  const user = {
    name: data.nickname || email.split('@')[0],
    email: data.email || email,
    role: '知识库用户',
  };
  setStoredUser(user);
  return { user, ragflow: data };
}

export function logout() {
  clearAuthStorage();
}
