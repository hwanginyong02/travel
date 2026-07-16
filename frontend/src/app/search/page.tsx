'use client';

import React, { useState, useEffect } from 'react';
import { Header } from '@/components/ui/Header/Header';
import { SearchBar } from '@/components/features/search/SearchBar';
import { RecommendSpots } from '@/components/features/search/RecommendSpots';
import { SearchResults } from '@/components/features/search/SearchResults';
import { searchSpots, TourSpot } from '@/api/spots';
import styles from './page.module.css';

// Helper to map backend TourSpot to frontend Spot format
const mapBackendSpotToFrontend = (backendSpot: TourSpot) => {
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
  };
};

export default function SearchPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [recommendSpots, setRecommendSpots] = useState<any[]>([]);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch initial recommendations (5 random spots)
  useEffect(() => {
    async function loadInitial() {
      try {
        setLoading(true);
        const data = await searchSpots('', 5, true);
        const mapped = data.map(mapBackendSpotToFrontend);
        setRecommendSpots(mapped);
        setError(null);
      } catch (err: any) {

        console.error("Failed to load initial spots:", err);
        setError("명소 목록을 불러오는데 실패했습니다.");
      } finally {
        setLoading(false);
      }
    }
    loadInitial();
  }, []);

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
            searchQuery === '' ? (
              <RecommendSpots spots={recommendSpots} />
            ) : (
              <SearchResults query={searchQuery} results={searchResults} />
            )
          )}
        </div>
      </div>
    </main>
  );
}

