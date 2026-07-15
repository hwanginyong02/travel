import React from 'react';
import Link from 'next/link';
import { Badge } from '@/components/ui/Badge/Badge';
import styles from './RecommendSpots.module.css';

interface Spot {
  id: string;
  title: string;
  location: string;
  tag: string;
  pinsCount: number;
  image: string;
  description: string;
}

interface RecommendSpotsProps {
  spots: Spot[];
}

export function RecommendSpots({ spots }: RecommendSpotsProps) {
  return (
    <div className={styles.recommendSection}>
      <div className={styles.sectionHeader}>
        <h2 className={styles.sectionTitle}>🌿 추천 자연 경관</h2>
        <p className={styles.sectionSubtitle}>맑은 공기와 온전한 쉼이 있는 힐링 명소</p>
      </div>

      <div className={styles.spotGrid}>
        {spots.map((spot) => (
          <Link href={`/spot/${spot.id}`} key={spot.id} className={styles.spotCard}>
            <div
              className={styles.spotImage}
              style={{
                backgroundImage: `linear-gradient(to bottom, rgba(0,0,0,0) 50%, rgba(0,0,0,0.7) 100%), url(${spot.image})`,
              }}
            >
              <Badge variant="experience" className={styles.spotTagBadge}>
                {spot.tag}
              </Badge>
            </div>
            <div className={styles.spotInfo}>
              <h3 className={styles.spotTitle}>{spot.title}</h3>
              <p className={styles.spotLocation}>📍 {spot.location}</p>
              <div className={styles.spotMeta}>
                <span className={styles.pinsText}>
                  숨은 포인트 <strong>{spot.pinsCount}개</strong>
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
