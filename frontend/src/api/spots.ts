import { apiFetch } from './client';

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
