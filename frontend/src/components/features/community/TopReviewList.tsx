import React from 'react';
import { Badge } from '@/components/ui/Badge/Badge';
import styles from './TopReviewList.module.css';

interface TopReview {
  id: string;
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

export default function TopReviewList({ reviews }: TopReviewListProps) {
  return (
    <section className={styles.section}>
      <h2 className={styles.sectionTitle}>💚 이달의 명예로운 쉼표</h2>
      <div className={styles.reviewList}>
        {reviews.map((review) => (
          <div key={review.id} className={styles.reviewCard}>
            {/* 작성자 정보 */}
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
              <Badge variant="verified" className={styles.verifiedCountBadge}>
                👍 {review.verifiedCount}명 인증
              </Badge>
            </div>

            {/* 리뷰 사진 */}
            <div
              className={styles.reviewPhoto}
              style={{ backgroundImage: `url(${review.photo})` }}
            />

            {/* 리뷰 내용 */}
            <div className={styles.reviewBody}>
              <Badge variant="experience" className={styles.reviewTag}>
                {review.tag}
              </Badge>
              <p className={styles.reviewText}>{review.content}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
