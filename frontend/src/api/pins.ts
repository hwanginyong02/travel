import { apiFetch, authHeader } from './client';

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
  title: string;
  description: string;
  latitude: number;
  longitude: number;
  is_blurred: boolean;
  reliability_score: number;
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
}

export interface PinCreateInput {
  tourSpotId: number;
  title: string;
  description: string;
  latitude: number;
  longitude: number;
  tags: string[];
  photo: File;
}

export type PinSort = 'popular' | 'latest';

export async function createPin(input: PinCreateInput): Promise<PinCreateResult> {
  const form = new FormData();
  form.append('tour_spot_id', String(input.tourSpotId));
  form.append('title', input.title);
  form.append('description', input.description);
  form.append('latitude', String(input.latitude));
  form.append('longitude', String(input.longitude));
  form.append('tags', JSON.stringify(input.tags));
  form.append('photo', input.photo);

  return apiFetch<PinCreateResult>('/api/pins', {
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

/** 사진 URL은 백엔드가 상대 경로로 내려주므로 절대 URL로 바꿔줍니다. */
export function resolvePhotoUrl(photoUrl: string): string {
  if (/^https?:\/\//.test(photoUrl)) return photoUrl;
  const base = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
  return `${base}${photoUrl}`;
}
