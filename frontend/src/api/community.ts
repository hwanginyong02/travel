import { apiFetch } from './client';
import { HotSpot } from '@/components/features/community/HotSpotList';
import { TopReview } from '@/components/features/community/TopReviewList';

export interface RawTrendingSpot {
  id: number;
  title: string;
  parent_spot: string;
  tag: string;
  search_count: number;
  pins_count: number;
  score: number;
  growth: string;
  avatar: string;
  updater: string;
  status: string;
}

export interface RawHonorPin {
  id: string;
  pin_id: number;
  spot_name: string;
  user: string;
  avatar: string;
  photo: string;
  content: string;
  tag: string;
  verified_count: number;
  created_at: string;
}

export interface CommunityResponse {
  trending_spots: RawTrendingSpot[];
  top_reviews: RawHonorPin[];
}

export interface CommunityData {
  trendingSpots: HotSpot[];
  topReviews: TopReview[];
}

export interface FeedPinItem {
  id: number;
  title: string;
  description: string;
  spotId: number;
  spotName: string;
  userName: string;
  userAvatar: string;
  userLevel: number;
  photoUrl: string;
  tags: string[];
  verifiedCount: number;
  reliabilityScore: number;
  latitude: number;
  longitude: number;
  createdAt: string;
}

export async function fetchCommunityData(): Promise<CommunityData> {
  const data = await apiFetch<CommunityResponse>('/api/community');

  const trendingSpots: HotSpot[] = data.trending_spots.map((item) => ({
    id: item.id,
    title: item.title,
    parentSpot: item.parent_spot,
    tag: item.tag,
    searchCount: item.search_count,
    pinsCount: item.pins_count,
    score: item.score,
    growth: item.growth,
    avatar: item.avatar,
    updater: item.updater,
    status: item.status,
  }));

  const topReviews: TopReview[] = data.top_reviews.map((item) => ({
    id: item.id,
    pinId: item.pin_id,
    spotName: item.spot_name,
    user: item.user,
    avatar: item.avatar,
    photo: item.photo,
    content: item.content,
    tag: item.tag,
    verifiedCount: item.verified_count,
    createdAt: item.created_at,
  }));

  return { trendingSpots, topReviews };
}

export async function fetchCommunityFeed(mode: 'random' | 'latest' = 'random'): Promise<FeedPinItem[]> {
  const items = await apiFetch<any[]>(`/api/community/feed?mode=${mode}`);
  return items.map((item) => ({
    id: item.id,
    title: item.title,
    description: item.description,
    spotId: item.spot_id,
    spotName: item.spot_name,
    userName: item.user_name,
    userAvatar: item.user_avatar,
    userLevel: item.user_level,
    photoUrl: item.photo_url,
    tags: item.tags || [],
    verifiedCount: item.verified_count || 0,
    reliabilityScore: item.reliability_score ?? 100,
    latitude: item.latitude,
    longitude: item.longitude,
    createdAt: item.created_at,
  }));
}
