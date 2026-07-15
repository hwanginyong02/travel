import React from 'react';
import { Badge } from '@/components/ui/Badge/Badge';
import styles from './HotSpotList.module.css';

interface HotSpot {
  id: string;
  title: string;
  parentSpot: string;
  tag: string;
  growth: string;
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
        <h2 className={styles.sectionTitle}>🔥 실시간 급상승 쉼표</h2>
        <span className={styles.sectionBadge}>LIVE</span>
      </div>

      <div className={styles.hotList}>
        {spots.map((spot, index) => (
          <div key={spot.id} className={styles.hotCard}>
            <div className={styles.hotRank}>{index + 1}</div>
            <div className={styles.hotInfo}>
              <div className={styles.spotHeader}>
                <h3 className={styles.spotTitle}>{spot.title}</h3>
                <span className={styles.spotParent}>{spot.parentSpot}</span>
              </div>
              <div className={styles.spotMeta}>
                <Badge variant="experience">{spot.tag}</Badge>
                <span className={styles.growthText}>{spot.growth}</span>
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
        ))}
      </div>
    </section>
  );
}
