'use client';

import React from 'react';
import styles from './ChallengeCard.module.css';

interface ChallengeCardProps {
  category: string;
  title: string;
  description: string;
  progressText: string;
  progressPercent: number;
  rewardText: string;
  footerText: string;
  isCompleted: boolean;
}

/** 뱃지 달성 현황 하나를 챌린지 카드 형태로 보여줍니다. */
export default function ChallengeCard({
  category,
  title,
  description,
  progressText,
  progressPercent,
  rewardText,
  footerText,
  isCompleted,
}: ChallengeCardProps) {
  const stateClass = isCompleted ? styles.completed : styles.pending;

  return (
    <div className={`${styles.challengeCard} ${isCompleted ? styles.completedCard : ''}`}>
      <div className={styles.cardHeader}>
        <span className={styles.categoryBadge}>{category}</span>
        <span className={`${styles.statusLabel} ${stateClass}`}>{isCompleted ? '완료' : '진행 중'}</span>
      </div>

      <h4 className={styles.title}>{title}</h4>
      <p className={styles.desc}>{description}</p>

      <div className={styles.progressSection}>
        <div className={styles.progressInfo}>
          <span className={styles.progressText}>진행도: {progressText}</span>
          <span className={styles.rewardText}>보상: {rewardText}</span>
        </div>
        <div className={styles.barContainer}>
          <div className={`${styles.barFill} ${stateClass}`} style={{ width: `${progressPercent}%` }} />
        </div>
      </div>

      <div className={styles.cardFooter}>
        <span className={styles.endDate}>{footerText}</span>
      </div>
    </div>
  );
}
