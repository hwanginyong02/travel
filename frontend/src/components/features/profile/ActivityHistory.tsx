'use client';

import React from 'react';
import Link from 'next/link';
import styles from './ActivityHistory.module.css';

interface PinPhotoData {
  id: number;
  image: string;
  title: string;
}

interface ActivityHistoryProps {
  pinsCount: number;
  pinsPhotos: PinPhotoData[];
  points: number;
  recentSpot?: {
    id: string;
    image: string;
    title: string;
    location: string;
  };
}

export const ActivityHistory: React.FC<ActivityHistoryProps> = ({
  pinsCount,
  pinsPhotos,
  points,
  recentSpot,
}) => {
  return (
    <section className={styles.section}>
      <h3 className={styles.sectionTitle}>내 활동 내역</h3>
      
      <div className={styles.activityList}>
        {/* 내가 등록한 핀 */}
        <Link href="/profile/my-pins" className={styles.activityItemLink}>
          <div className={styles.activityItem}>
            <div className={styles.activityHeader}>
              <div className={styles.activityIconCircle}>🏆</div>
              <span className={styles.activityTitle}>내가 등록한 핀 ({pinsCount}개)</span>
              <span className={styles.itemArrow}>⟩</span>
            </div>
            <div className={styles.registeredPhotos}>
              {pinsPhotos.map((pin) => (
                <div 
                  key={pin.id} 
                  className={styles.photoThumb}
                  style={{ backgroundImage: `url(${pin.image})` }}
                  title={pin.title}
                />
              ))}
            </div>
          </div>
        </Link>

        {/* 획득한 포인트 */}
        <Link href="/profile/points" className={styles.activityItemLink}>
          <div className={styles.activityItem}>
            <div className={styles.activityHeader}>
              <div className={`${styles.activityIconCircle} ${styles.pointIcon}`}>P</div>
              <div className={styles.pointInfo}>
                <span className={styles.activityTitle}>획득한 포인트 ({points.toLocaleString()} P)</span>
                <p className={styles.activitySubText}>다른 사람의 방문 인증으로 획득</p>
              </div>
              <span className={styles.itemArrow}>⟩</span>
            </div>
          </div>
        </Link>

        {/* 최근 방문 장소 */}
        {recentSpot ? (
          <Link href={`/spot/${recentSpot.id}`} className={styles.recentSpotLink}>
            <div className={styles.recentSpotCard}>
              <div 
                className={styles.recentSpotImage}
                style={{ backgroundImage: `url(${recentSpot.image})` }}
              />
              <div className={styles.recentSpotInfo}>
                <span className={styles.recentSpotLabel}>최근 방문 장소</span>
                <h4 className={styles.recentSpotTitle}>{recentSpot.title}</h4>
                <p className={styles.recentSpotLocation}>{recentSpot.location}</p>
              </div>
              <span className={styles.spotArrow}>⟩</span>
            </div>
          </Link>
        ) : (
          <div className={styles.emptyRecentSpotCard}>
            <div className={styles.emptySpotIcon}>📍</div>
            <div className={styles.recentSpotInfo}>
              <span className={styles.recentSpotLabel}>최근 방문 장소</span>
              <p className={styles.emptySpotText}>아직 없네요! 새로운 여행을 떠나볼까요?</p>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
