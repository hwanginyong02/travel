'use client';

import React from 'react';
import styles from './PinCoordCard.module.css';

interface PinCoordCardProps {
  coord: string;
  desc: string;
  date: string;
}

export default function PinCoordCard({ coord, desc, date }: PinCoordCardProps) {
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
    </div>
  );
}
