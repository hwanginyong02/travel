'use client';

import React from 'react';
import styles from './ProfileCard.module.css';

interface ProfileCardProps {
  nickname: string;
  level: number;
  progressPercent: number;
  avatarUrl: string;
}

export const ProfileCard: React.FC<ProfileCardProps> = ({
  nickname,
  level,
  progressPercent,
  avatarUrl,
}) => {
  return (
    <div className={styles.profileCard}>
      <div 
        className={styles.avatar} 
        style={{ backgroundImage: `url(${avatarUrl})` }} 
      />
      <div className={styles.profileInfo}>
        <div className={styles.nameRow}>
          <h2 className={styles.nickname}>{nickname}</h2>
        </div>
        <div className={styles.levelSection}>
          <span className={styles.levelText}>레벨 {level}</span>
          <div className={styles.levelProgressBar}>
            <div className={styles.levelProgressFill} style={{ width: `${progressPercent}%` }}></div>
          </div>
        </div>
      </div>
    </div>
  );
};
