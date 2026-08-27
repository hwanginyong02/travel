'use client';

import { useState, useEffect } from 'react';
import { Header } from '@/components/ui/Header/Header';
import { SearchBar } from '@/components/features/search/SearchBar';
import { RecommendSpots } from '@/components/features/search/RecommendSpots';
import { SearchResults } from '@/components/features/search/SearchResults';
import {
  searchSpots,
  getRecommendedSpots,
  TourSpot,
  RecommendedSpot,
  RecommendStrategy,
} from '@/api/spots';
import styles from './page.module.css';

const RECOMMEND_COUNT = 5;

type Coords = { lat: number; lng: number };

// Helper to map backend TourSpot to frontend Spot format
const mapBackendSpotToFrontend = (backendSpot: TourSpot | RecommendedSpot) => {
  let tag = '#자연';
  if (backendSpot.cat2 === 'A0101') tag = '#자연관광지';
  else if (backendSpot.cat2 === 'A0102') tag = '#관광자원';

  const location = backendSpot.overview
    ? (backendSpot.overview.length > 50 ? backendSpot.overview.slice(0, 50) + '...' : backendSpot.overview)
    : `위치: 위도 ${backendSpot.mapy.toFixed(4)}, 경도 ${backendSpot.mapx.toFixed(4)}`;

  return {
    id: String(backendSpot.id),
    title: backendSpot.title,
    location: location,
    tag: tag,
    pinsCount: backendSpot.pins_count,
    image: backendSpot.firstimage || 'https://images.unsplash.com/photo-1501854140801-50d01698950b?auto=format&fit=crop&w=400&q=80',
    description: backendSpot.overview || '상세 정보가 아직 등록되지 않았습니다.',
    reason: 'reason' in backendSpot ? backendSpot.reason : undefined,
    distanceText: 'distance_text' in backendSpot ? backendSpot.distance_text ?? undefined : undefined,
  };
};

export default function SearchPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [recommendSpots, setRecommendSpots] = useState<any[]>([]);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [strategy, setStrategy] = useState<RecommendStrategy>('random');
  const [coords, setCoords] = useState<Coords | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Ask for GPS separately so the permission dialog never blocks the first render.
  useEffect(() => {
    if (typeof window === 'undefined' || !navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCoords({ lat: position.coords.latitude, lng: position.coords.longitude });
      },
      () => {
        // 거부하거나 실패해도 그대로 둡니다. 백엔드가 위치 없이도 추천을 채웁니다.
      },
      { timeout: 5000, maximumAge: 300000 }
    );
  }, []);

  // Fetch recommendations. Runs once without coordinates, then again if GPS resolves.
  useEffect(() => {
    let cancelled = false;

    async function loadRecommendations() {
      // 좌표를 받아 다시 부르는 동안에는 이미 뜬 목록을 유지합니다.
      const isFirstLoad = recommendSpots.length === 0;
      try {
        if (isFirstLoad) setLoading(true);
        const data = await getRecommendedSpots(RECOMMEND_COUNT, coords);
        if (cancelled) return;
        setRecommendSpots(data.spots.map(mapBackendSpotToFrontend));
        setStrategy(data.strategy);
        setError(null);
      } catch (err: any) {
        if (cancelled) return;
        console.error("Failed to load recommended spots:", err);
        if (isFirstLoad) setError("명소 목록을 불러오는데 실패했습니다.");
      } finally {
        if (!cancelled && isFirstLoad) setLoading(false);
      }
    }

    loadRecommendations();
    return () => { cancelled = true; };
    // recommendSpots는 재조회 트리거가 아니라 첫 로딩 여부 판단에만 쓰므로 의존성에서 뺍니다.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [coords]);

  // Fetch search results on search query change
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      try {
        setLoading(true);
        const data = await searchSpots(searchQuery);
        const mapped = data.map(mapBackendSpotToFrontend);
        setSearchResults(mapped);
      } catch (err) {
        console.error("Search failed:", err);
      } finally {
        setLoading(false);
      }
    }, 300); // 300ms debounce

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  // 공백만 입력한 경우도 '검색 안 함'으로 취급해야 결과 없음 화면이 잘못 뜨지 않습니다.
  const isSearching = searchQuery.trim() !== '';

  return (
    <main className={styles.main}>
      <Header title="자연 명소 검색" />

      <div className={styles.container}>
        <SearchBar
          query={searchQuery}
          onQueryChange={setSearchQuery}
          onClear={() => setSearchQuery('')}
        />

        <div className={styles.content}>
          {loading && <p className={styles.loading}>명소 정보를 불러오는 중...</p>}
          {error && <p className={styles.error}>{error}</p>}

          {!loading && !error && (
            !isSearching ? (
              <RecommendSpots spots={recommendSpots} strategy={strategy} />
            ) : (
              <SearchResults query={searchQuery} results={searchResults} />
            )
          )}
        </div>
      </div>
    </main>
  );
}
