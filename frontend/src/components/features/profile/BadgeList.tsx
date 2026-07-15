'use client';

import React from 'react';
import styles from './BadgeList.module.css';

interface BadgeItem {
  id: number;
  icon: string;
  name: string;
  date?: string;
  desc: string;
  isLocked: boolean;
  progress?: string;
}

interface BadgeListProps {
  badges: BadgeItem[];
}

export default function BadgeList({ badges }: BadgeListProps) {
  const unlockedBadges = badges.filter((b) => !b.isLocked);
  const lockedBadges = badges.filter((b) => b.isLocked);

  return (
    <div className={styles.container}>
      {/* 상단 인트로 */}
      <div className={styles.showcaseIntro}>
        <h3>🏆 명예의 전당</h3>
        <p>자연 쉼터를 발굴하고 인증하며 획득한 등급 뱃지들입니다.</p>
      </div>

      {/* 1. 해금한 뱃지 섹션 */}
      <section className={styles.badgeSection}>
        <h4 className={styles.sectionSubtitle}>🔓 획득한 뱃지 ({unlockedBadges.length})</h4>
        <div className={styles.badgeGridList}>
          {unlockedBadges.map((badge) => (
            <div key={badge.id} className={styles.badgeCard}>
              <div className={styles.badgeVisual}>
                <div className={styles.badgeCircle}>{badge.icon}</div>
                <span className={`${styles.statusLabel} ${styles.acquired}`}>획득 완료</span>
              </div>
              <div className={styles.badgeContent}>
                <h4 className={styles.badgeName}>{badge.name}</h4>
                <span className={styles.badgeDate}>{badge.date}</span>
                <p className={styles.badgeDesc}>{badge.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 2. 해금하지 않은 뱃지 섹션 */}
      <section className={styles.badgeSection}>
        <h4 className={styles.sectionSubtitle}>🔒 도전 중인 뱃지 ({lockedBadges.length})</h4>
        <div className={styles.badgeGridList}>
          {lockedBadges.map((badge) => (
            <div key={badge.id} className={`${styles.badgeCard} ${styles.locked}`}>
              <div className={styles.badgeVisual}>
                <div className={styles.badgeCircle}>{badge.icon}</div>
                <span className={`${styles.statusLabel} ${styles.progress}`}>{badge.progress}</span>
              </div>
              <div className={styles.badgeContent}>
                <h4 className={styles.badgeName}>{badge.name}</h4>
                <p className={styles.badgeDesc}>{badge.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
