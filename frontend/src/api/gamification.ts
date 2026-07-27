import { apiFetch, authHeader } from './client';

export interface BadgeBrief {
  code?: string;
  name: string;
  icon: string;
}

/** 핀 등록·방문 인증 직후 받는 보상 결과 */
export interface Reward {
  points_awarded: number;
  total_points: number;
  level: number;
  new_badges: BadgeBrief[];
}

export interface BadgeProgress {
  code: string;
  name: string;
  description: string;
  icon: string;
  goal: number;
  current: number;
  is_unlocked: boolean;
  awarded_at?: string | null;
}

export interface PointTransaction {
  id: number;
  amount: number;
  reason: string;
  label: string;
  description: string;
  pin_id?: number | null;
  pin_title?: string | null;
  created_at: string;
}

export interface PointHistory {
  total_points: number;
  level: number;
  items: PointTransaction[];
}

export interface RecentPin {
  id: number;
  title: string;
  photo_url?: string | null;
}

export interface RecentSpot {
  id: number;
  title: string;
  firstimage?: string | null;
  mapx: number;
  mapy: number;
}

export interface ProfileSummary {
  nickname: string;
  profile_image?: string | null;
  points: number;
  level: number;
  progress_percent: number;
  points_to_next_level: number;
  pins_count: number;
  verifications_count: number;
  badges: BadgeProgress[];
  recent_pins: RecentPin[];
  recent_spot?: RecentSpot | null;
}

export async function getProfileSummary(): Promise<ProfileSummary> {
  return apiFetch<ProfileSummary>('/api/gamification/me', { headers: authHeader() });
}

export async function getBadges(): Promise<BadgeProgress[]> {
  return apiFetch<BadgeProgress[]>('/api/gamification/badges', { headers: authHeader() });
}

export async function getPointHistory(limit: number = 50): Promise<PointHistory> {
  return apiFetch<PointHistory>(`/api/gamification/points?limit=${limit}`, { headers: authHeader() });
}
