import React from 'react';
import { Badge } from '@/components/ui/Badge/Badge';
import styles from './page.module.css';

export default function MyPage() {
  return (
    <main className={styles.main}>
      <div className={styles.profileCard}>
        <div className={styles.avatar}>👦</div>
        <div className={styles.profileInfo}>
          <h2>힐링맨</h2>
          <p>레벨 8</p>
        </div>
        <div className={styles.points}>
          <Badge variant="caution">1,250 P</Badge>
        </div>
      </div>

      <div className={styles.section}>
        <h3>나의 뱃지 쇼케이스</h3>
        <div className={styles.badgeGrid}>
          <div className={styles.badgeItem}>
            <div className={styles.badgeCircle}>🥇</div>
            <span>첫 발견자</span>
          </div>
          <div className={styles.badgeItem}>
            <div className={styles.badgeCircle}>🎖️</div>
            <span>지역 마스터</span>
          </div>
        </div>
      </div>

      <div className={styles.section}>
        <h3>챌린지 현황판</h3>
        <div className={styles.challengeCard}>
          <p className={styles.challengeTitle}>시즌별 챌린지: "이번 달 단풍 좌표 10곳 인증"</p>
          <div className={styles.progressBar}>
            <div className={styles.progressFill} style={{ width: '70%' }}></div>
          </div>
          <p className={styles.progressText}>7/10 달성 중</p>
        </div>
      </div>

      <div className={styles.section}>
        <h3>내 활동 내역</h3>
        <p className={styles.activityCount}>내가 등록한 핀 (52개)</p>
        <div className={styles.activityPhotos}>
          <div className={styles.photo}>🏞️</div>
          <div className={styles.photo}>🏕️</div>
          <div className={styles.photo}>🌅</div>
        </div>
      </div>
    </main>
  );
}
