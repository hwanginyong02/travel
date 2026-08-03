'use client';

import React from 'react';
import { Map, MapMarker, useKakaoLoader } from 'react-kakao-maps-sdk';
import styles from './PinCoordCard.module.css';

interface PinCoordCardProps {
  latitude: number;
  longitude: number;
  spotTitle?: string;
  isBlurred?: boolean;
}

export default function PinCoordCard({
  latitude,
  longitude,
  spotTitle = '숨은 좌표',
  isBlurred = false,
}: PinCoordCardProps) {
  const [mapLoading, mapError] = useKakaoLoader({
    appkey: process.env.NEXT_PUBLIC_KAKAO_APP_KEY as string,
  });

  return (
    <div className={styles.section}>
      <h3 className={styles.title}>📍 세부 위치</h3>
      
      <div className={styles.mapWrapper}>
        {!mapLoading && !mapError ? (
          <Map
            center={{ lat: latitude, lng: longitude }}
            style={{ width: '100%', height: '280px', borderRadius: '16px' }}
            level={3}
          >
            <MapMarker position={{ lat: latitude, lng: longitude }}>
              <div className={styles.markerOverlay}>
                📍 {spotTitle}
              </div>
            </MapMarker>
          </Map>
        ) : (
          <div className={styles.mapFallback}>
            <span>🗺️ {mapError ? '카카오 지도를 로드할 수 없습니다.' : '지도를 불러오는 중...'}</span>
          </div>
        )}
      </div>

      {isBlurred && (
        <p className={styles.blurNotice}>
          🌱 환경 민감 지역이라 좌표를 약 500m 단위로 보호 표기했습니다.
        </p>
      )}
    </div>
  );
}


