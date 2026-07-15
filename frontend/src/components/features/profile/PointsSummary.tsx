'use client';

import React from 'react';
import styles from './PointsSummary.module.css';

interface PointsSummaryProps {
  total: number;
  description: string;
}

export default function PointsSummary({ total, description }: PointsSummaryProps) {
  return (
    <div className={styles.pointsSummaryCard}>
      <div className={styles.summaryLabel}>현재 사용 가능한 힐링 포인트</div>
      <div className={styles.summaryValue}>{total.toLocaleString()} P</div>
      <p className={styles.summarySub}>{description}</p>
    </div>
  );
}
