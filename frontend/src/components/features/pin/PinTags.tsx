'use client';

import React from 'react';
import { Badge } from '@/components/ui/Badge/Badge';
import styles from './PinTags.module.css';

interface PinTagsProps {
  experienceTags: string[];
  cautionTags: string[];
}

export default function PinTags({ experienceTags, cautionTags }: PinTagsProps) {
  return (
    <div className={styles.section}>
      <h3 className={styles.title}>경험 태그</h3>
      <div className={styles.tags}>
        {experienceTags.map((tag) => (
          <Badge key={tag} variant="experience">{tag}</Badge>
        ))}
      </div>
      
      {cautionTags.length > 0 && (
        <>
          <h3 className={styles.title} style={{ marginTop: '16px' }}>주의 태그</h3>
          <div className={styles.tags}>
            {cautionTags.map((tag) => (
              <Badge key={tag} variant="caution">{tag}</Badge>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
