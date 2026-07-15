'use client';

import React from 'react';
import styles from './PinList.module.css';

interface PinItem {
  id: number;
  title: string;
  location: string;
  tag: string;
  date: string;
  image: string;
  verifications: number;
}

interface PinListProps {
  pins: PinItem[];
  totalCount?: number;
}

export default function PinList({ pins, totalCount }: PinListProps) {
  const count = totalCount ?? pins.length;

  return (
    <div className={styles.container}>
      <div className={styles.metaSummary}>
        <span className={styles.totalText}>
          총 <strong>{count}개</strong>의 핀을 발굴하셨습니다.
        </span>
      </div>

      <div className={styles.pinList}>
        {pins.map((pin) => (
          <div key={pin.id} className={styles.pinCard}>
            <div
              className={styles.pinImage}
              style={{ backgroundImage: `url(${pin.image})` }}
            />
            <div className={styles.pinInfo}>
              <div className={styles.pinHeader}>
                <h3 className={styles.pinTitle}>{pin.title}</h3>
                <span className={styles.pinTag}>{pin.tag}</span>
              </div>
              <p className={styles.pinLocation}>📍 {pin.location}</p>
              <div className={styles.pinFooter}>
                <span className={styles.pinDate}>등록일: {pin.date}</span>
                <span className={styles.pinVerifications}>✓ {pin.verifications}명 인증함</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
