'use client';

import React from 'react';
import Link from 'next/link';
import { Badge } from '@/components/ui/Badge/Badge';
import styles from './HotSpotList.module.css';

export interface HotSpot {
  id: string | number;
  title: string;
  parentSpot: string;
  tag: string;
  searchCount?: number;
  pinsCount?: number;
  score?: number;
  growth?: string;
  avatar: string;
  updater: string;
  status: string;
}

interface HotSpotListProps {
  spots: HotSpot[];
}

export default function HotSpotList({ spots }: HotSpotListProps) {
  return (
    <section className={styles.section}>
      <div className={styles.sectionHeader}>
        <h2 className={styles.sectionTitle}>🔥 실시간 급상승 장소</h2>
        <span className={styles.sectionBadge}>LIVE</span>
      </div>

      <div className={styles.hotList}>
        {spots.map((spot, index) => {
          // 검색량 + 좌표 등록 개수 기반 점수 산출
          const calculatedScore = spot.score ?? ((spot.searchCount ?? 0) + (spot.pinsCount ?? 0));
          const scoreText = spot.growth || `급상승 +${calculatedScore}`;

          return (
            <Link
              key={spot.id}
              href={`/spot/${spot.id}`}
              className={styles.hotCardLink}
            >
              <div className={styles.hotCard}>
                <div className={styles.hotRank}>{index + 1}</div>
                <div className={styles.hotInfo}>
                  <div className={styles.spotHeader}>
                    <h3 className={styles.spotTitle}>{spot.title}</h3>
                    <span className={styles.spotParent}>{spot.parentSpot}</span>
                  </div>
                  <div className={styles.spotMeta}>
                    <Badge variant="experience">{spot.tag}</Badge>
                    <div className={styles.metricsWrapper}>
                      <span className={styles.growthText}>{scoreText}</span>
                    </div>
                  </div>

                  <div className={styles.liveStatus}>
                    <div
                      className={styles.userAvatar}
                      style={{ backgroundImage: `url(${spot.avatar})` }}
                    />
                    <span className={styles.statusText}>
                      <strong>{spot.updater}</strong>: {spot.status}
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

