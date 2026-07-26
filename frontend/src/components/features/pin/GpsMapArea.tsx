'use client';

import React from 'react';
import { Button } from '@/components/ui/Button/Button';
import { Coordinates } from '@/hooks/useGeolocation';
import styles from './GpsMapArea.module.css';

interface GpsMapAreaProps {
  coords: Coordinates | null;
  accuracy: number | null;
  loading: boolean;
  error: string | null;
  onRefresh: () => void;
}

export default function GpsMapArea({ coords, accuracy, loading, error, onRefresh }: GpsMapAreaProps) {
  return (
    <div className={styles.section}>
      <h3>3. 세부 좌표 (자동 입력)</h3>

      <div className={styles.miniMap}>
        {loading && '📡 GPS로 현재 위치를 측정하는 중...'}
        {!loading && error && <span className={styles.errorText}>⚠️ {error}</span>}
        {!loading && !error && coords && (
          <div className={styles.coordBox}>
            <span className={styles.coordText}>
              📍 {coords.lat.toFixed(6)}° N, {coords.lng.toFixed(6)}° E
            </span>
            {accuracy !== null && (
              <span className={styles.accuracyText}>측정 정확도 약 {Math.round(accuracy)}m</span>
            )}
          </div>
        )}
        {!loading && !error && !coords && '위치를 아직 측정하지 않았습니다.'}
      </div>

      <div className={styles.refreshRow}>
        <Button variant="outline" onClick={onRefresh} disabled={loading}>
          {loading ? '측정 중...' : '📍 현재 위치 다시 측정'}
        </Button>
      </div>

      <p className={styles.helperText}>* 환경 민감 지역은 좌표가 반경 500m 단위로 흐리게 표기될 수 있습니다.</p>
    </div>
  );
}
