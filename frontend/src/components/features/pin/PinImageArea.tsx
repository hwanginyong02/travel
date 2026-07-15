'use client';

import React from 'react';
import { Badge } from '@/components/ui/Badge/Badge';
import styles from './PinImageArea.module.css';

interface PinImageAreaProps {
  isVerified?: boolean;
  dummyText?: string;
  imageUrl?: string;
}

export default function PinImageArea({ isVerified = true, dummyText = '📸 전망대 뷰 사진', imageUrl }: PinImageAreaProps) {
  return (
    <div className={styles.imageArea}>
      {isVerified && (
        <div className={styles.verifiedBadge}>
          <Badge variant="verified">✓ 검증 완료</Badge>
        </div>
      )}
      {imageUrl ? (
        <div className={styles.image} style={{ backgroundImage: `url(${imageUrl})` }} />
      ) : (
        <div className={styles.dummyImage}>{dummyText}</div>
      )}
    </div>
  );
}
