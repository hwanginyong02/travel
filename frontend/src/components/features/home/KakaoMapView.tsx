'use client';

import React, { useEffect, useState } from 'react';
import { Map, MapMarker, useKakaoLoader } from 'react-kakao-maps-sdk';
import styles from './KakaoMapView.module.css';

export interface MapMarkerData {
  lat: number;
  lng: number;
  label: string;
}

export interface KakaoMapViewProps {
  center: { lat: number; lng: number };
  level?: number;
  markers?: MapMarkerData[];
}

export default function KakaoMapView({
  center,
  level = 5,
  markers = [],
}: KakaoMapViewProps) {
  const [isMounted, setIsMounted] = useState(false);

  const [loading, error] = useKakaoLoader({
    appkey: process.env.NEXT_PUBLIC_KAKAO_APP_KEY as string,
    libraries: ['services', 'clusterer'],
  });

  useEffect(() => {
    setIsMounted(true);
  }, []);

  return (
    <div className={styles.container}>
      {/* 로딩 상태 */}
      {(!isMounted || loading) && (
        <div className={styles.statusBox}>
          <div className={styles.spinner} />
          <span className={styles.loadingText}>지도를 불러오는 중입니다...</span>
        </div>
      )}

      {/* 에러 상태 */}
      {isMounted && !loading && error && (
        <div className={styles.statusBox}>
          <span className={styles.errorIcon}>⚠️</span>
          <span className={styles.errorText}>
            지도 로딩에 실패했습니다.
            <br />
            도메인 등록 및 카카오맵 API 키 활성화를 확인해주세요.
          </span>
        </div>
      )}

      {/* 정상 상태 */}
      {isMounted && !loading && !error && (
        <Map
          center={center}
          style={{ width: '100%', height: '100%' }}
          level={level}
        >
          {markers.map((marker, idx) => (
            <MapMarker
              key={`${marker.lat}-${marker.lng}-${idx}`}
              position={{ lat: marker.lat, lng: marker.lng }}
            >
              <div className={styles.markerLabel}>{marker.label}</div>
            </MapMarker>
          ))}
        </Map>
      )}
    </div>
  );
}
