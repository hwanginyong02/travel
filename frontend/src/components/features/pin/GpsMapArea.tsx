'use client';

import React from 'react';
import styles from './GpsMapArea.module.css';

export default function GpsMapArea() {
  return (
    <div className={styles.section}>
      <h3>3. 세부 좌표 (자동 입력)</h3>
      <div className={styles.miniMap}>
        📍 GPS 기반 자동 측정 (지도 영역)
      </div>
      <p className={styles.helperText}>* 환경 민감 지역은 좌표가 반경 500m 단위로 흐리게 표기될 수 있습니다.</p>
    </div>
  );
}
