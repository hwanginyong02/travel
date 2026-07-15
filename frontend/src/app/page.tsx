'use client';

import React from 'react';
import styles from './page.module.css';
import MapSearchHeader from '@/components/features/home/MapSearchHeader';
import KakaoMapView from '@/components/features/home/KakaoMapView';

const DEFAULT_CENTER = { lat: 37.566826, lng: 126.978656 };

const DEFAULT_MARKERS = [
  { lat: 37.566826, lng: 126.978656, label: '서울 시청' },
];

export default function Home() {
  return (
    <main className={styles.main}>
      <MapSearchHeader placeholder="자연 명소 검색..." />

      <div className={styles.mapContainer}>
        <KakaoMapView
          center={DEFAULT_CENTER}
          level={5}
          markers={DEFAULT_MARKERS}
        />
      </div>
    </main>
  );
}
