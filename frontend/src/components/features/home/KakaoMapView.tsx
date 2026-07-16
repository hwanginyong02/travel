'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Map, MapMarker, MarkerClusterer, CustomOverlayMap, useKakaoLoader } from 'react-kakao-maps-sdk';
import { useRouter } from 'next/navigation';
import styles from './KakaoMapView.module.css';

export interface MapMarkerData {
  id: number;
  lat: number;
  lng: number;
  label: string;
}

export interface KakaoMapViewProps {
  center: { lat: number; lng: number };
  level?: number;
  markers?: MapMarkerData[];
  onBoundsChange?: (bounds: { minLat: number; maxLat: number; minLng: number; maxLng: number }) => void;
}

export default function KakaoMapView({
  center,
  level = 5,
  markers = [],
  onBoundsChange,
}: KakaoMapViewProps) {
  const [isMounted, setIsMounted] = useState(false);
  const [map, setMap] = useState<any>(null);
  const [standaloneIds, setStandaloneIds] = useState<Set<number>>(new Set());
  const router = useRouter();


  const [loading, error] = useKakaoLoader({
    appkey: process.env.NEXT_PUBLIC_KAKAO_APP_KEY as string,
    libraries: ['services', 'clusterer'],
  });

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Correct center offset shift caused by container layout resize on initial load
  useEffect(() => {
    if (map && typeof window !== 'undefined' && (window as any).kakao && (window as any).kakao.maps) {
      const timer = setTimeout(() => {
        map.relayout();
        map.setCenter(new (window as any).kakao.maps.LatLng(center.lat, center.lng));
        recalcStandalone();
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [map, center]);

  // Calculate which markers are standalone (not near any other marker in screen pixels).
  // This mirrors what MarkerClusterer does internally: markers within `gridSize` pixels
  // of each other get grouped. We replicate that check to know which markers are isolated.
  const recalcStandalone = useCallback(() => {
    if (!map || typeof window === 'undefined' || !(window as any).kakao?.maps) return;

    const projection = map.getProjection();
    if (!projection) return;

    const gridSize = 60; // kakao MarkerClusterer default gridSize

    // Convert every marker's lat/lng to pixel position on the map container
    const pixelPositions = markers.map(m => {
      const latlng = new (window as any).kakao.maps.LatLng(m.lat, m.lng);
      const pixel = projection.containerPointFromCoords(latlng);
      return { id: m.id, x: pixel.x, y: pixel.y };
    });

    // Find which markers have at least one neighbor within gridSize pixels
    const clusteredIds = new Set<number>();
    for (let i = 0; i < pixelPositions.length; i++) {
      for (let j = i + 1; j < pixelPositions.length; j++) {
        const dx = pixelPositions[i].x - pixelPositions[j].x;
        const dy = pixelPositions[i].y - pixelPositions[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < gridSize) {
          clusteredIds.add(pixelPositions[i].id);
          clusteredIds.add(pixelPositions[j].id);
        }
      }
    }

    // Standalone = markers NOT in any cluster
    const standalone = new Set<number>();
    markers.forEach(m => {
      if (!clusteredIds.has(m.id)) {
        standalone.add(m.id);
      }
    });

    setStandaloneIds(standalone);
  }, [map, markers]);

  const handleBoundsChange = useCallback(() => {
    if (!map) return;
    const bounds = map.getBounds();
    const sw = bounds.getSouthWest();
    const ne = bounds.getNorthEast();
    if (onBoundsChange) {
      onBoundsChange({
        minLat: sw.getLat(),
        maxLat: ne.getLat(),
        minLng: sw.getLng(),
        maxLng: ne.getLng(),
      });
    }
  }, [map, onBoundsChange]);

  // Recalculate standalone markers whenever map or markers change
  useEffect(() => {
    recalcStandalone();
  }, [recalcStandalone]);

  // Trigger bounds change on map initialize/mount
  useEffect(() => {
    if (map) {
      handleBoundsChange();
    }
  }, [map, handleBoundsChange]);

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
          onCreate={(m) => {
            setMap(m);
          }}
          onZoomChanged={() => {
            recalcStandalone();
            handleBoundsChange();
          }}
          onDragEnd={() => {
            recalcStandalone();
            handleBoundsChange();
          }}
        >
          <MarkerClusterer
            averageCenter={true}
            minLevel={6}
          >
            {markers.map((marker, idx) => (
              <MapMarker
                key={`marker-${marker.id}-${idx}`}
                position={{ lat: marker.lat, lng: marker.lng }}
                clickable={true}
                onClick={() => router.push(`/spot/${marker.id}`)}
              />
            ))}
          </MarkerClusterer>

          {/* 클러스터에 속하지 않고 혼자 떨어져 있는 마커만 말풍선 표시 */}
          {markers
            .filter(m => standaloneIds.has(m.id))
            .map((marker) => (
              <CustomOverlayMap
                key={`label-${marker.id}`}
                position={{ lat: marker.lat, lng: marker.lng }}
                yAnchor={2.1}
              >
                <div
                  className={styles.markerLabel}
                  onClick={() => router.push(`/spot/${marker.id}`)}
                >
                  <span className={styles.markerTitle}>{marker.label}</span>
                </div>
              </CustomOverlayMap>
            ))}
        </Map>
      )}
    </div>
  );
}

