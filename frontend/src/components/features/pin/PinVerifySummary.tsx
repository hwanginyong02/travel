'use client';

import React from 'react';
import { Badge } from '@/components/ui/Badge/Badge';
import { formatRelativeTime, isStale } from '@/utils/date';
import styles from './PinVerifySummary.module.css';

interface PinVerifySummaryProps {
  reliabilityScore: number;
  verificationCount: number;
  stillThereCount: number;
  lastCheckedAt?: string | null;
  createdAt: string;
}

/** 신뢰도 점수를 사용자가 이해할 수 있는 상태 문구로 바꿉니다. */
function describeReliability(score: number, verificationCount: number) {
  if (score < 0) return { label: '없어졌을 수 있음', tone: styles.toneDanger };
  if (verificationCount === 0) return { label: '아직 인증 없음', tone: styles.toneNeutral };
  if (score >= 5) return { label: '많이 검증된 정보', tone: styles.toneGood };
  return { label: '검증 진행 중', tone: styles.toneNeutral };
}

export default function PinVerifySummary({
  reliabilityScore,
  verificationCount,
  stillThereCount,
  lastCheckedAt,
  createdAt,
}: PinVerifySummaryProps) {
  const { label, tone } = describeReliability(reliabilityScore, verificationCount);
  const notThereCount = verificationCount - stillThereCount;
  const checkedAt = lastCheckedAt || createdAt;
  const stale = isStale(checkedAt);

  return (
    <div className={styles.section}>
      <h3 className={styles.title}>신뢰도</h3>

      <div className={styles.scoreRow}>
        <span className={`${styles.score} ${tone}`}>{reliabilityScore}</span>
        <div className={styles.scoreMeta}>
          <span className={`${styles.stateLabel} ${tone}`}>{label}</span>
          <span className={styles.counts}>
            {verificationCount === 0
              ? '첫 방문 인증을 남겨보세요'
              : `👍 그대로예요 ${stillThereCount}명${notThereCount > 0 ? ` · 🚫 없어졌어요 ${notThereCount}명` : ''}`}
          </span>
        </div>
      </div>

      <div className={styles.footer}>
        <span className={styles.checkedAt}>마지막 확인: {formatRelativeTime(checkedAt)}</span>
        {stale && <Badge variant="caution">⚠️ 오래된 정보</Badge>}
      </div>
    </div>
  );
}
