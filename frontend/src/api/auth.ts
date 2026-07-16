import { apiFetch } from './client';

export interface TokenResponse {
  access_token: string;
  token_type: string;
  is_new: boolean;
  social_nickname?: string;
}

export interface NicknameCheckResponse {
  available: boolean;
  message: string;
}

export interface UserProfile {
  id: number;
  nickname: string;
  email?: string;
  gender?: string;
  age_group?: string;
  profile_image?: string;
  level: number;
  points: number;
}

export async function socialLogin(
  provider: string,
  accessToken?: string,
  code?: string,
  redirectUri?: string
): Promise<TokenResponse> {
  return apiFetch<TokenResponse>('/api/auth/social', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      provider,
      access_token: accessToken,
      code,
      redirect_uri: redirectUri,
    }),
  });
}


export async function register(
  token: string,
  nickname: string,
  gender: string,
  ageGroup: string
): Promise<TokenResponse> {
  return apiFetch<TokenResponse>('/api/auth/register', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ nickname, gender, age_group: ageGroup }),
  });
}

export async function checkNickname(nickname: string): Promise<NicknameCheckResponse> {
  return apiFetch<NicknameCheckResponse>(`/api/auth/check-nickname?nickname=${encodeURIComponent(nickname)}`);
}

export async function getMyProfile(token: string): Promise<UserProfile> {
  return apiFetch<UserProfile>('/api/auth/me', {
    headers: { 'Authorization': `Bearer ${token}` },
  });
}

export async function withdrawAccount(token: string): Promise<{ message: string }> {
  return apiFetch<{ message: string }>('/api/auth/withdraw', {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${token}` },
  });
}

