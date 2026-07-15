'use client';

import React from 'react';
import Link from 'next/link';
import styles from './ChallengeBoard.module.css';

interface ChallengeData {
  category: string;
  progressText: string;
  name: string;
  progressPercent: number;
  isCompleted?: boolean;
}

interface ChallengeBoardProps {
  challenges: ChallengeData[];
}

export const ChallengeBoard: React.FC<ChallengeBoardProps> = ({ challenges }) => {
  return (
    <section className={styles.section}>
      <h3 className={styles.sectionTitle}>챌린지 현황판</h3>
      
      <Link href="/profile/challenges" className={styles.cardLink}>
        <div className={styles.challengeContainer}>
          <div className={styles.cardHeaderWithArrow}>
            <div />
            <span className={styles.itemArrow}>⟩</span>
          </div>
          
          {challenges.map((challenge, index) => (
            <div 
              key={index} 
              className={styles.challengeCard} 
              style={{ marginTop: index > 0 ? '16px' : '0px' }}
            >
              <div className={styles.challengeHeader}>
                <span className={styles.challengeBadge}>{challenge.category}</span>
                <span className={`${styles.challengeProgressText} ${challenge.isCompleted ? styles.completed : ''}`}>
                  {challenge.progressText}
                </span>
              </div>
              <p className={styles.challengeName}>{challenge.name}</p>
              <div className={styles.progressBar}>
                <div 
                  className={styles.progressFill} 
                  style={{ 
                    width: `${challenge.progressPercent}%`,
                    backgroundColor: challenge.isCompleted ? 'var(--color-vibrant-emerald)' : 'var(--color-vibrant-emerald)'
                  }} 
                />
              </div>
            </div>
          ))}
        </div>
      </Link>
    </section>
  );
};
