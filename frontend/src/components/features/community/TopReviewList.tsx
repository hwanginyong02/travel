'use client';

import React from 'react';
import Link from 'next/link';
import { Badge } from '@/components/ui/Badge/Badge';
import styles from './TopReviewList.module.css';

export interface TopReview {
  id: string | number;
  pinId?: string | number;
  spotName: string;
  user: string;
  avatar: string;
  photo: string;
  content: string;
  tag: string;
  verifiedCount: number;
  createdAt: string;
}

interface TopReviewListProps {
  reviews: TopReview[];
}

const RANK_BADGES = ['🥇 1위', '🥈 2위', '🥉 3위'];

export default function TopReviewList({ reviews }: TopReviewListProps) {
  // 인증을 많이 받은 순으로 정렬 후 상위 3개만 표출
  const sortedTop3 = [...reviews]
    .sort((a, b) => b.verifiedCount - a.verifiedCount)
    .slice(0, 3);

  return (
    <section className={styles.section}>
      <div className={styles.sectionHeader}>
        <h2 className={styles.sectionTitle}>💚 이달의 명예로운 쉼표</h2>
      </div>

      <div className={styles.reviewList}>
        {sortedTop3.map((review, index) => {
          const targetPinId = review.pinId || review.id;
          const rankLabel = RANK_BADGES[index] || `${index + 1}위`;

          return (
            <Link
              key={review.id}
              href={`/pin/${targetPinId}`}
              className={styles.reviewCardLink}
            >
              <div className={styles.reviewCard}>
                {/* 작성자 정보 및 우측 상단 뱃지 묶음 */}
                <div className={styles.reviewUserRow}>
                  <div
                    className={styles.reviewAvatar}
                    style={{ backgroundImage: `url(${review.avatar})` }}
                  />
                  <div className={styles.reviewUserMeta}>
                    <span className={styles.reviewUsername}>{review.user}</span>
                    <span className={styles.reviewDate}>
                      {review.createdAt} • {review.spotName}
                    </span>
                  </div>

                  {/* 우측 상단 인증 수 + 순위 뱃지 가로 나란히 정렬 */}
                  <div className={styles.rightBadgeGroup}>
                    <Badge variant="verified" className={styles.verifiedCountBadge}>
                      👍 {review.verifiedCount}명 인증
                    </Badge>
                    <div className={styles.honorRankBadge}>
                      {rankLabel}
                    </div>
                  </div>
                </div>

                {/* 리뷰 사진 */}
                {review.photo && (
                  <div
                    className={styles.reviewPhoto}
                    style={{ backgroundImage: `url(${review.photo})` }}
                  />
                )}

                {/* 리뷰 내용 */}
                <div className={styles.reviewBody}>
                  <Badge variant="experience" className={styles.reviewTag}>
                    {review.tag}
                  </Badge>
                  <p className={styles.reviewText}>{review.content}</p>
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {/* 인스타그램 스타일 피드 탐색으로 이동하는 '더 탐색하기' 버튼 */}
      <div className={styles.moreActionWrapper}>
        <Link href="/community/feed" className={styles.moreFeedBtn}>
          더 탐색하기 ✨
        </Link>
      </div>
    </section>
  );
}
