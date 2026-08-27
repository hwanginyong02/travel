import { apiFetch, authHeader } from './client';

export interface TourSpot {
  id: number;
  title: string;
  mapx: number;
  mapy: number;
  firstimage?: string;
  overview?: string;
  cat1?: string;
  cat2?: string;
  cat3?: string;
  contenttypeid?: number;
  pins_count: number;
  created_at: string;
  intro_info?: Record<string, any>;


}

export interface SearchBounds {
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
}

export async function searchSpots(
  query: string = '', 
  limit: number = 1000, 
  random?: boolean, 
  cat3?: string,
  bounds?: SearchBounds
): Promise<TourSpot[]> {
  const params = new URLSearchParams();
  if (query) params.append('search', query);
  if (limit) params.append('limit', String(limit));
  if (random) params.append('random', 'true');
  if (cat3) params.append('cat3', cat3);
  
  if (bounds) {
    params.append('min_lat', String(bounds.minLat));
    params.append('max_lat', String(bounds.maxLat));
    params.append('min_lng', String(bounds.minLng));
    params.append('max_lng', String(bounds.maxLng));
  }
  
  const queryString = params.toString() ? `?${params.toString()}` : '';
  return apiFetch<TourSpot[]>(`/api/spots${queryString}`);
}





export async function getSpotDetails(id: string | number): Promise<TourSpot> {
  return apiFetch<TourSpot>(`/api/spots/${id}`);
}

/** 어떤 근거로 추천됐는지. 화면 문구를 바꾸는 데 씁니다. */
export type RecommendStrategy = 'personal' | 'cohort' | 'nearby' | 'popular' | 'random';

export interface RecommendedSpot extends Omit<TourSpot, 'created_at'> {
  /** "#물멍벤치 좋아하시죠" 처럼 카드에 표시할 추천 이유 */
  reason: string;
  score: number;
  distance_text?: string | null;
}

export interface RecommendList {
  strategy: RecommendStrategy;
  spots: RecommendedSpot[];
}

/**
 * 검색 화면의 기본 목록을 사용자 맞춤으로 받아옵니다.
 * 로그인하지 않았거나 좌표가 없어도 백엔드가 단계적으로 물러서며 항상 결과를 채웁니다.
 */
export async function getRecommendedSpots(
  limit: number = 5,
  coords?: { lat: number; lng: number } | null
): Promise<RecommendList> {
  const params = new URLSearchParams({ limit: String(limit) });
  if (coords) {
    params.append('lat', String(coords.lat));
    params.append('lng', String(coords.lng));
  }

  // 비로그인도 허용되는 엔드포인트라 토큰이 없으면 헤더 없이 그대로 호출합니다.
  return apiFetch<RecommendList>(`/api/spots/recommend?${params.toString()}`, {
    headers: authHeader(),
  });
}
