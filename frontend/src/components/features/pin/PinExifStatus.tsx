'use client';

import React from 'react';
import { Map, MapMarker, useKakaoLoader } from 'react-kakao-maps-sdk';
import { PhotoExifPreview } from '@/api/pins';
import { formatDateTime } from '@/utils/date';
import styles from './PinExifStatus.module.css';

interface PinExifStatusProps {
  preview: PhotoExifPreview | null;
  loading: boolean;
  error: string | null;
}

/**
 * 사진에서 읽어낸 촬영 위치와 시각을 보여줍니다.
 * 핀 좌표는 이 EXIF 좌표가 그대로 쓰이므로, 등록 전에 사용자가 확인할 수 있어야 합니다.
 */
export default function PinExifStatus({ preview, loading, error }: PinExifStatusProps) {
  const [mapLoading, mapError] = useKakaoLoader({
    appkey: process.env.NEXT_PUBLIC_KAKAO_APP_KEY as string,
  });

  const hasCoords =
    preview?.latitude !== null &&
    preview?.latitude !== undefined &&
    preview?.longitude !== null &&
    preview?.longitude !== undefined;

  return (
    <div className={styles.section}>
      <h3>3. 촬영 위치 (사진에서 자동 인식)</h3>

      {loading && <div className={styles.statusBox}>📡 사진의 위치 정보를 읽는 중...</div>}

      {!loading && error && <div className={`${styles.statusBox} ${styles.error}`}>⚠️ {error}</div>}

      {!loading && !error && !preview && (
        <div className={styles.statusBox}>사진을 첨부하면 촬영 위치를 읽어옵니다.</div>
      )}

      {!loading && !error && preview && !preview.can_register && (
        <div className={`${styles.statusBox} ${styles.error}`}>⚠️ {preview.message}</div>
      )}

      {!loading && !error && preview?.can_register && (
        <>
          {hasCoords && (
            <div className={styles.miniMap}>
              {(mapLoading || mapError) && (
                <div className={styles.statusBox}>
                  {mapError ? '지도를 불러오지 못했습니다.' : '지도를 불러오는 중...'}
                </div>
              )}
              {!mapLoading && !mapError && (
                <Map
                  center={{ lat: preview.latitude as number, lng: preview.longitude as number }}
                  style={{ width: '100%', height: '100%' }}
                  level={3}
                  draggable={false}
                  zoomable={false}
                >
                  <MapMarker
                    position={{ lat: preview.latitude as number, lng: preview.longitude as number }}
                  />
                </Map>
              )}
            </div>
          )}

          <div className={styles.coordBox}>
            <span className={styles.coordText}>
              📍 {(preview.latitude as number).toFixed(6)}° N, {(preview.longitude as number).toFixed(6)}° E
            </span>
            {preview.taken_at && (
              <span className={styles.takenAtText}>촬영 {formatDateTime(preview.taken_at)}</span>
            )}
          </div>

          {preview.is_recent ? (
            <p className={styles.validText}>✅ {preview.message}</p>
          ) : (
            <p className={styles.warnText}>🟡 {preview.message} 포인트는 일부만 지급됩니다.</p>
          )}
        </>
      )}

      <p className={styles.helperText}>
        * 핀 좌표는 사진을 찍은 위치로 저장됩니다. 환경 민감 지역은 반경 500m 단위로 흐리게 표기될 수 있습니다.
      </p>
    </div>
  );
}
