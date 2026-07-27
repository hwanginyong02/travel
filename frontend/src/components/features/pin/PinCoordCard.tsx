'use client';

import React from 'react';
import styles from './PinCoordCard.module.css';

interface PinCoordCardProps {
  coord: string;
  desc: string;
  date: string;
  isBlurred?: boolean;
  /** 촬영한 지 오래된 사진일 때 보여줄 안내. 최근 사진이면 전달하지 않습니다. */
  photoAgeNotice?: string | null;
}

export default function PinCoordCard({
  coord,
  desc,
  date,
  isBlurred = false,
  photoAgeNotice = null,
}: PinCoordCardProps) {
  return (
    <div className={styles.section}>
      <h3 className={styles.title}>세부 좌표</h3>
      <div className={styles.coordCard}>
        <div className={styles.miniMap}>지도</div>
        <div className={styles.coordInfo}>
          <p className={styles.coordText}>좌표: {coord}</p>
          <p className={styles.desc}>설명: {desc}</p>
          <p className={styles.date}>등록 시간: {date}</p>
        </div>
      </div>
      {photoAgeNotice && <p className={styles.ageNotice}>⏳ {photoAgeNotice}</p>}
      {isBlurred && (
        <p className={styles.blurNotice}>
          🌱 환경 민감 지역이라 좌표를 약 500m 단위로 흐리게 표기했습니다.
        </p>
      )}
    </div>
  );
}
