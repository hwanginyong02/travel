'use client';

import React from 'react';
import styles from './PointsHistory.module.css';

interface PointHistoryItem {
  id: number;
  type: string;
  spot: string;
  points: string;
  date: string;
  desc: string;
}

interface PointsHistoryProps {
  items: PointHistoryItem[];
}

export default function PointsHistory({ items }: PointsHistoryProps) {
  return (
    <section className={styles.historySection}>
      <h3 className={styles.sectionTitle}>적립 히스토리</h3>

      {items.length === 0 && (
        <p className={styles.emptyText}>
          아직 적립 내역이 없습니다. 숨은 좌표를 등록하거나 다른 사람의 핀을 인증해 보세요!
        </p>
      )}

      <div className={styles.historyList}>
        {items.map((item) => (
          <div key={item.id} className={styles.historyCard}>
            <div className={styles.historyHeader}>
              <span className={styles.historyType}>{item.type}</span>
              <span className={styles.historyPoints}>{item.points}</span>
            </div>
            <h4 className={styles.historySpot}>{item.spot}</h4>
            <p className={styles.historyDesc}>{item.desc}</p>
            <span className={styles.historyDate}>{item.date}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
