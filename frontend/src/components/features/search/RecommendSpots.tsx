import React from 'react';
import Link from 'next/link';
import { Badge } from '@/components/ui/Badge/Badge';
import type { RecommendStrategy } from '@/api/spots';
import styles from './RecommendSpots.module.css';

interface Spot {
  id: string;
  title: string;
  location: string;
  tag: string;
  pinsCount: number;
  image: string;
  description: string;
  /** "#물멍벤치 좋아하시죠" 처럼 왜 추천됐는지 설명하는 문구 */
  reason?: string;
  /** "3.2km" — 현재 위치를 알 때만 내려옵니다 */
  distanceText?: string;
}

interface RecommendSpotsProps {
  spots: Spot[];
  strategy?: RecommendStrategy;
}

/** 추천 근거에 따라 섹션 문구를 바꿔, 개인화가 되고 있다는 걸 드러냅니다. */
const SECTION_COPY: Record<RecommendStrategy, { title: string; subtitle: string }> = {
  personal: {
    title: '🌿 회원님을 위한 쉼표',
    subtitle: '다녀오신 곳의 취향을 바탕으로 골랐어요',
  },
  cohort: {
    title: '🌿 또래가 많이 찾은 쉼표',
    subtitle: '비슷한 연령대 이용자들이 다녀온 힐링 명소',
  },
  nearby: {
    title: '🌿 지금 가까운 쉼표',
    subtitle: '내 위치에서 멀지 않은 자연 명소',
  },
  popular: {
    title: '🌿 요즘 뜨는 쉼표',
    subtitle: '많은 이용자가 찾고 있는 힐링 명소',
  },
  random: {
    title: '🌿 추천 자연 경관',
    subtitle: '맑은 공기와 온전한 쉼이 있는 힐링 명소',
  },
};

export function RecommendSpots({ spots, strategy = 'random' }: RecommendSpotsProps) {
  const copy = SECTION_COPY[strategy] ?? SECTION_COPY.random;

  return (
    <div className={styles.recommendSection}>
      <div className={styles.sectionHeader}>
        <h2 className={styles.sectionTitle}>{copy.title}</h2>
        <p className={styles.sectionSubtitle}>{copy.subtitle}</p>
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
              {spot.reason && <p className={styles.spotReason}>{spot.reason}</p>}
              <h3 className={styles.spotTitle}>{spot.title}</h3>
              <p className={styles.spotLocation}>📍 {spot.location}</p>
              <div className={styles.spotMeta}>
                <span className={styles.pinsText}>
                  숨은 포인트 <strong>{spot.pinsCount}개</strong>
                </span>
                {spot.distanceText && (
                  <span className={styles.distanceText}>{spot.distanceText}</span>
                )}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
