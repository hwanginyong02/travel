'use client';

import React, { useEffect, useState } from 'react';
import { Map, MapMarker, useKakaoLoader } from 'react-kakao-maps-sdk';
import styles from './page.module.css';

export default function Home() {
  const [isMounted, setIsMounted] = useState(false);

  // 카카오맵 스크립트를 클라이언트에서 안전하게 로드
  const [loading, error] = useKakaoLoader({
    appkey: process.env.NEXT_PUBLIC_KAKAO_APP_KEY as string,
    libraries: ['services', 'clusterer'],
  });

  useEffect(() => {
    setIsMounted(true);
  }, []);

  return (
    <main className={styles.main}>
      <header className={styles.header}>
        <input type="text" placeholder="자연 명소 검색..." className={styles.searchInput} />
      </header>

      <div className={styles.mapContainer}>
        {(!isMounted || loading) && (
          <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center' }}>
            지도를 불러오는 중입니다...
          </div>
        )}

        {error && (
          <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', color: 'red' }}>
            지도 로딩 실패 (도메인 등록 및 카카오맵 활성화를 확인해주세요)
          </div>
        )}

        {isMounted && !loading && !error && (
          <Map
            center={{ lat: 37.566826, lng: 126.978656 }} // 서울시청 기본 좌표
            style={{ width: '100%', height: '100%' }}
            level={5}
          >
            <MapMarker position={{ lat: 37.566826, lng: 126.978656 }}>
              <div style={{ padding: "5px", color: "#000", fontSize: "12px", borderRadius: "4px" }}>
                서울 시청
              </div>
            </MapMarker>
          </Map>
        )}
      </div>
    </main>
  );
}
