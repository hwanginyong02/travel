'use client';

import React, { useState } from 'react';
import { Badge } from '@/components/ui/Badge/Badge';
import { Button } from '@/components/ui/Button/Button';
import { formatRelativeTime, isStale } from '@/utils/date';
import styles from './PinVerifySummary.module.css';

interface VerificationPhotoItem {
  photoUrl: string;
  user?: string;
  createdAt?: string;
}

interface PinVerifySummaryProps {
  reliabilityScore: number;
  verificationCount: number;
  stillThereCount: number;
  lastCheckedAt?: string | null;
  createdAt: string;
  verificationPhotos?: VerificationPhotoItem[];
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
  verificationPhotos = [],
}: PinVerifySummaryProps) {
  const [allPhotosModalOpen, setAllPhotosModalOpen] = useState(false);
  const { label, tone } = describeReliability(reliabilityScore, verificationCount);
  const notThereCount = verificationCount - stillThereCount;
  const checkedAt = lastCheckedAt || createdAt;
  const stale = isStale(checkedAt);

  const latestPhoto = verificationPhotos.length > 0 ? verificationPhotos[0] : null;

  return (
    <div className={styles.section}>
      {/* 1. 신뢰도 점수 및 현황 */}
      <h3 className={styles.title}>📊 신뢰도 점수</h3>

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

      {/* 2. 인증 사진첩 (최신 사진 1장 + 더 보기 버튼) */}
      <div className={styles.gallerySection}>
        <h4 className={styles.galleryTitle}>📸 인증 사진첩</h4>

        {latestPhoto ? (
          <div className={styles.singlePhotoContainer}>
            <div className={styles.latestPhotoCard}>
              <div
                className={styles.latestPhotoImg}
                style={{ backgroundImage: `url(${latestPhoto.photoUrl})` }}
              />
              <div className={styles.photoOverlayInfo}>
                <span>최신 인증 사진</span>
                {latestPhoto.user && <span>{latestPhoto.user}님</span>}
              </div>
            </div>

            <button
              type="button"
              className={styles.morePhotosBtn}
              onClick={() => setAllPhotosModalOpen(true)}
            >
              사진 더 보기 ({verificationPhotos.length}장) &gt;
            </button>
          </div>
        ) : (
          <div className={styles.emptyGallery}>
            📷 아직 사진이 없네요.
          </div>
        )}
      </div>

      {/* 전체 사진 모달 팝업 */}
      {allPhotosModalOpen && (
        <div className={styles.modalOverlay} onClick={() => setAllPhotosModalOpen(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h4>📸 방문 인증 사진 전체보기 ({verificationPhotos.length}장)</h4>
              <button
                type="button"
                className={styles.closeBtn}
                onClick={() => setAllPhotosModalOpen(false)}
              >
                ✕
              </button>
            </div>
            <div className={styles.modalPhotoGrid}>
              {verificationPhotos.map((item, idx) => (
                <div key={idx} className={styles.modalPhotoCard}>
                  <div
                    className={styles.modalPhotoImg}
                    style={{ backgroundImage: `url(${item.photoUrl})` }}
                  />
                  <div className={styles.modalPhotoMeta}>
                    <span className={styles.modalPhotoUser}>{item.user || '인증 유저'}님</span>
                    {item.createdAt && <span className={styles.modalPhotoDate}>{item.createdAt}</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
