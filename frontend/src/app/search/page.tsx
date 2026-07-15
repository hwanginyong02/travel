'use client';

import React, { useState } from 'react';
import { Header } from '@/components/ui/Header/Header';
import { SearchBar } from '@/components/features/search/SearchBar';
import { RecommendSpots } from '@/components/features/search/RecommendSpots';
import { SearchResults } from '@/components/features/search/SearchResults';
import styles from './page.module.css';

// 추천 자연 명소 더미 데이터 (검색하지 않았을 때 노출)
const RECOMMEND_SPOTS = [
  {
    id: 'namsan',
    title: '남산공원 (Namsan Park)',
    location: '서울특별시 중구 회현동1가',
    tag: '#물멍벤치',
    pinsCount: 75,
    image: 'https://images.unsplash.com/photo-1540959733332-eab4deceeaf7?auto=format&fit=crop&w=400&q=80',
    description: '서울 중심부에 위치한 역사적이고 문화적인 공원으로, 야경과 가벼운 하이킹으로 유명합니다.',
  },
  {
    id: 'bukhansan',
    title: '북한산국립공원',
    location: '서울특별시 강북구 우이동',
    tag: '#피톤치드',
    pinsCount: 142,
    image: 'https://images.unsplash.com/photo-1501854140801-50d01698950b?auto=format&fit=crop&w=400&q=80',
    description: '거대한 바위 봉우리와 맑은 계곡이 흐르는 도심 속 거대 자연 쉼터입니다.',
  },
  {
    id: 'cheonggyesan',
    title: '청계산',
    location: '서울특별시 서초구 원지동',
    tag: '#산스장',
    pinsCount: 58,
    image: 'https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?auto=format&fit=crop&w=400&q=80',
    description: '깔딱고개와 매봉이 유명하며, 등산로 초입에 숨겨진 힐링 명당이 많습니다.',
  },
  {
    id: 'hangang',
    title: '뚝섬한강공원',
    location: '서울특별시 광진구 자양동',
    tag: '#인생샷포인트',
    pinsCount: 93,
    image: 'https://images.unsplash.com/photo-1505232987724-ca875508a735?auto=format&fit=crop&w=400&q=80',
    description: '탁 트인 한강을 보며 돗자리를 펴고 노을을 감상하기에 가장 완벽한 장소입니다.',
  },
];

export default function SearchPage() {
  const [searchQuery, setSearchQuery] = useState('');

  // 검색어 입력에 따른 필터링 결과
  const filteredSpots = RECOMMEND_SPOTS.filter(
    (spot) =>
      spot.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      spot.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      spot.tag.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <main className={styles.main}>
      {/* 뒤로가기 버튼이 탑재된 공통 Header */}
      <Header title="자연 명소 검색" />

      <div className={styles.container}>
        {/* 검색 바 */}
        <SearchBar
          query={searchQuery}
          onQueryChange={setSearchQuery}
          onClear={() => setSearchQuery('')}
        />

        <div className={styles.content}>
          {searchQuery === '' ? (
            /* 검색어가 없을 때: 추천 자연 경관 테마 표출 */
            <RecommendSpots spots={RECOMMEND_SPOTS} />
          ) : (
            /* 검색어가 있을 때: 검색 결과 표출 */
            <SearchResults query={searchQuery} results={filteredSpots} />
          )}
        </div>
      </div>
    </main>
  );
}
