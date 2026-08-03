'use client';

import React, { useState } from 'react';
import { Map, MapMarker, useKakaoLoader } from 'react-kakao-maps-sdk';
import { Button } from '@/components/ui/Button/Button';
import DirectionsModal from '@/components/features/pin/DirectionsModal';
import styles from './SpotLocationCard.module.css';

interface SpotLocationCardProps {
  title: string;
  latitude: number;
  longitude: number;
}

export function SpotLocationCard({ title, latitude, longitude }: SpotLocationCardProps) {
  const [directionsOpen, setDirectionsOpen] = useState(false);

  const [mapLoading, mapError] = useKakaoLoader({
    appkey: process.env.NEXT_PUBLIC_KAKAO_APP_KEY as string,
  });

  return (
    <div className={styles.section}>
      <h3 className={styles.title}>📍 명소 위치</h3>

      <div className={styles.mapWrapper}>
        {!mapLoading && !mapError ? (
          <Map
            center={{ lat: latitude, lng: longitude }}
            style={{ width: '100%', height: '240px', borderRadius: '16px' }}
            level={4}
          >
            <MapMarker position={{ lat: latitude, lng: longitude }}>
              <div className={styles.markerOverlay}>
                📍 {title}
              </div>
            </MapMarker>
          </Map>
        ) : (
          <div className={styles.mapFallback}>
            <span>🗺️ {mapError ? '카카오 지도를 로드할 수 없습니다.' : '지도를 불러오는 중...'}</span>
          </div>
        )}
      </div>

      <div className={styles.actionWrapper}>
        <Button
          variant="outline"
          fullWidth
          onClick={() => setDirectionsOpen(true)}
        >
          🧭 길 찾기
        </Button>
      </div>

      {/* 실시간 길찾기 모달 */}
      <DirectionsModal
        isOpen={directionsOpen}
        onClose={() => setDirectionsOpen(false)}
        destTitle={title}
        destLat={latitude}
        destLng={longitude}
      />
    </div>
  );
}
