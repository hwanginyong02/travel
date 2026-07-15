'use client';

import React from 'react';
import Link from 'next/link';
import styles from './BadgeShowcase.module.css';

interface BadgeData {
  icon: string;
  name: string;
  className: string;
}

interface BadgeShowcaseProps {
  badges: BadgeData[];
}

export const BadgeShowcase: React.FC<BadgeShowcaseProps> = ({ badges }) => {
  return (
    <section className={styles.section}>
      <h3 className={styles.sectionTitle}>나의 뱃지 쇼케이스</h3>
      <Link href="/profile/badges" className={styles.cardLink}>
        <div className={styles.badgeShowcaseCard}>
          <div className={styles.cardHeaderWithArrow}>
            <div />
            <span className={styles.itemArrow}>⟩</span>
          </div>
          <div className={styles.badgeList}>
            {badges.map((badge, index) => (
              <div key={index} className={styles.badgeItem}>
                <div className={`${styles.badgeCircle} ${styles[badge.className]}`}>
                  {badge.icon}
                </div>
                <span className={styles.badgeName}>{badge.name}</span>
              </div>
            ))}
          </div>
        </div>
      </Link>
    </section>
  );
};
