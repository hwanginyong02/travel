import { apiFetch, authHeader } from './client';
import { Reward } from './gamification';

export interface PinTag {
  id: number;
  name: string;
  is_danger: boolean;
}

export interface PinPhoto {
  id: number;
  photo_url: string;
  exif_taken_at?: string;
  is_validated: boolean;
}

export interface PinAuthor {
  id: number;
  nickname: string;
  profile_image?: string;
}

export interface Pin {
  id: number;
  tour_spot_id: number;
  tour_spot_title?: string | null;
  title: string;
  description: string;
  latitude: number;
  longitude: number;
  is_blurred: boolean;
  reliability_score: number;
  verification_count: number;
  still_there_count: number;
  created_at: string;
  last_status_checked_at?: string;
  user?: PinAuthor;
  tags: PinTag[];
  photos: PinPhoto[];
}

export interface PinCreateResult {
  pin: Pin;
  exif_validated: boolean;
  validation_message: string;
  reward?: Reward;
  photo_taken_at?: string | null;
  is_photo_recent: boolean;
}

/** 좌표는 보내지 않습니다. 서버가 사진의 EXIF에서 직접 읽습니다. */
export interface PinCreateInput {
  tourSpotId: number;
  title: string;
  description: string;
  tags: string[];
  photo: File;
}

/** 등록 전 사진 검사 결과 */
export interface PhotoExifPreview {
  can_register: boolean;
  has_gps: boolean;
  is_recent: boolean;
  latitude?: number | null;
  longitude?: number | null;
  taken_at?: string | null;
  age_days?: number | null;
  distance_m?: number | null;
  message: string;
}

export type PinSort = 'popular' | 'latest';

export async function createPin(input: PinCreateInput): Promise<PinCreateResult> {
  const form = new FormData();
  form.append('tour_spot_id', String(input.tourSpotId));
  form.append('title', input.title);
  form.append('description', input.description);
  form.append('tags', JSON.stringify(input.tags));
  form.append('photo', input.photo);

  return apiFetch<PinCreateResult>('/api/pins', {
    method: 'POST',
    headers: authHeader(),
    body: form,
  });
}

/**
 * 사진을 고른 직후 등록 가능 여부를 미리 확인합니다.
 * 제출한 뒤에야 'GPS가 없어 등록 불가'를 알게 되는 일을 막기 위한 사전 검사입니다.
 */
export async function previewPhotoExif(
  photo: File,
  tourSpotId: number
): Promise<PhotoExifPreview> {
  const form = new FormData();
  form.append('tour_spot_id', String(tourSpotId));
  form.append('photo', photo);

  return apiFetch<PhotoExifPreview>('/api/pins/preview-exif', {
    method: 'POST',
    headers: authHeader(),
    body: form,
  });
}

export async function getPinsBySpot(
  tourSpotId: number | string,
  sort: PinSort = 'popular',
  limit: number = 50
): Promise<Pin[]> {
  const params = new URLSearchParams({
    tour_spot_id: String(tourSpotId),
    sort,
    limit: String(limit),
  });
  return apiFetch<Pin[]>(`/api/pins?${params.toString()}`);
}

export async function getPinDetails(id: string | number): Promise<Pin> {
  return apiFetch<Pin>(`/api/pins/${id}`);
}

/** 로그인한 사용자가 등록한 핀 목록을 최신순으로 가져옵니다. */
export async function getMyPins(limit: number = 50): Promise<Pin[]> {
  return apiFetch<Pin[]>(`/api/pins/me?limit=${limit}`, { headers: authHeader() });
}

/** 사진 URL은 백엔드가 상대 경로로 내려주므로 절대 URL로 바꿔줍니다. */
export function resolvePhotoUrl(photoUrl: string): string {
  if (/^https?:\/\//.test(photoUrl)) return photoUrl;
  const base = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
  return `${base}${photoUrl}`;
}
