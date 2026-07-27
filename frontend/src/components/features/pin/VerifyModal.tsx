'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/Button/Button';
import PhotoUpload from './PhotoUpload';
import { PHOTO_MAX_AGE_DAYS } from '@/utils/photo';
import styles from './VerifyModal.module.css';

interface VerifyModalProps {
  pinTitle: string;
  submitting: boolean;
  error: string | null;
  onSubmit: (isStillThere: boolean, photo: File | null) => void;
  onClose: () => void;
}

export default function VerifyModal({
  pinTitle,
  submitting,
  error,
  onSubmit,
  onClose,
}: VerifyModalProps) {
  const [isStillThere, setIsStillThere] = useState<boolean | null>(null);
  const [photo, setPhoto] = useState<File | null>(null);

  const canSubmit = isStillThere !== null && !submitting;

  return (
    <div className={styles.overlay} onClick={submitting ? undefined : onClose}>
      <div className={styles.sheet} onClick={(e) => e.stopPropagation()}>
        <h3 className={styles.title}>지금도 그대로인가요?</h3>
        <p className={styles.subtitle}>{pinTitle}</p>

        <div className={styles.choices}>
          <button
            type="button"
            onClick={() => setIsStillThere(true)}
            className={`${styles.choice} ${isStillThere === true ? styles.choiceYes : ''}`}
          >
            <span className={styles.choiceIcon}>👍</span>
            <span className={styles.choiceLabel}>그대로예요</span>
          </button>
          <button
            type="button"
            onClick={() => setIsStillThere(false)}
            className={`${styles.choice} ${isStillThere === false ? styles.choiceNo : ''}`}
          >
            <span className={styles.choiceIcon}>🚫</span>
            <span className={styles.choiceLabel}>없어졌어요</span>
          </button>
        </div>

        {/* 사진 없이도 인증 기록은 남지만, 검증되지 않으면 신뢰도와 포인트에는 반영되지 않습니다. */}
        <PhotoUpload
          onChange={setPhoto}
          label="현장 사진"
          helperText={`* 최근 ${PHOTO_MAX_AGE_DAYS}일 이내에 현장에서 찍은 원본 사진(GPS 포함)을 첨부해야 신뢰도와 포인트에 반영됩니다.`}
        />

        {error && <p className={styles.error}>{error}</p>}

        <div className={styles.actions}>
          <Button variant="outline" fullWidth onClick={onClose} disabled={submitting}>
            취소
          </Button>
          <Button
            variant="primary"
            fullWidth
            onClick={() => isStillThere !== null && onSubmit(isStillThere, photo)}
            disabled={!canSubmit}
          >
            {submitting ? '전송 중...' : '인증 완료'}
          </Button>
        </div>
      </div>
    </div>
  );
}
