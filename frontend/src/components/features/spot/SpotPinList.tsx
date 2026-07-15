'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Badge } from '@/components/ui/Badge/Badge';
import styles from './SpotPinList.module.css';

interface SpotPin {
  id: string;
  tags: string[];
  user: string;
  registeredAt: string;
}

interface SpotPinListProps {
  spotId: string;
  totalCount: number;
  pins: SpotPin[];
}

const SORT_OPTIONS = [
  { label: '⭐ 인기순', value: 'popular' },
  { label: '🕒 최신순', value: 'latest' },
  { label: '📍 거리순', value: 'distance' },
];

export const SpotPinList: React.FC<SpotPinListProps> = ({ spotId, totalCount, pins }) => {
  const [activeSort, setActiveSort] = useState('popular');

  return (
    <div className={styles.content}>
      <h2 className={styles.heading}>이 명소의 숨은 포인트 ({totalCount}개)</h2>

      <div className={styles.filters}>
        {SORT_OPTIONS.map((option) => (
          <Badge
            key={option.value}
            onClick={() => setActiveSort(option.value)}
            className={activeSort === option.value ? styles.activeFilter : styles.inactiveFilter}
          >
            {option.label}
          </Badge>
        ))}
      </div>

      <ul className={styles.pinList}>
        {pins.map((pin) => (
          <li key={pin.id} className={styles.pinCard}>
            <div className={styles.pinImage}>📸</div>
            <div className={styles.pinInfo}>
              <div className={styles.tags}>
                {pin.tags.map((tag) => (
                  <Badge key={tag} variant="experience">
                    {tag}
                  </Badge>
                ))}
              </div>
              <p className={styles.meta}>
                User: {pin.user} / 등록: {pin.registeredAt}
              </p>
            </div>
            <Link href={`/pin/${pin.id}`} className={styles.linkOverlay} aria-label={`핀 ${pin.id} 상세보기`} />
          </li>
        ))}
      </ul>
    </div>
  );
};

export default SpotPinList;
