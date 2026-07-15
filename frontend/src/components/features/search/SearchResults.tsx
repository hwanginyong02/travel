import React from 'react';
import Link from 'next/link';
import { Badge } from '@/components/ui/Badge/Badge';
import styles from './SearchResults.module.css';

interface Spot {
  id: string;
  title: string;
  location: string;
  tag: string;
  pinsCount: number;
  image: string;
  description: string;
}

interface SearchResultsProps {
  query: string;
  results: Spot[];
}

export function SearchResults({ query, results }: SearchResultsProps) {
  return (
    <div className={styles.searchResultSection}>
      <h2 className={styles.resultTitle}>
        🔍 '{query}' 검색 결과 ({results.length}건)
      </h2>

      {results.length > 0 ? (
        <div className={styles.spotList}>
          {results.map((spot) => (
            <Link href={`/spot/${spot.id}`} key={spot.id} className={styles.spotRowCard}>
              <div
                className={styles.spotRowImage}
                style={{ backgroundImage: `url(${spot.image})` }}
              />
              <div className={styles.spotRowInfo}>
                <div className={styles.titleRow}>
                  <h3 className={styles.spotRowTitle}>{spot.title}</h3>
                  <Badge variant="experience">{spot.tag}</Badge>
                </div>
                <p className={styles.spotRowLocation}>📍 {spot.location}</p>
                <p className={styles.spotRowDesc}>{spot.description}</p>
                <div className={styles.spotRowMeta}>
                  <span>
                    숨은 포인트 <strong>{spot.pinsCount}개</strong>
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className={styles.noResult}>
          <span className={styles.noResultIcon}>🍃</span>
          <p>일치하는 자연 명소를 찾지 못했어요.</p>
          <p className={styles.noResultSub}>검색어를 다르게 입력하거나 쉼표를 넣어보세요.</p>
        </div>
      )}
    </div>
  );
}
