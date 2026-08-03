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
  onSubmit: (isStillThere: boolean, photo: File | null, userLat?: number | null, userLng?: number | null) => void;
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
  const [locating, setLocating] = useState(false);

  const canSubmit = isStillThere !== null && !submitting && !locating;

  const handleSubmit = () => {
    if (isStillThere === null || submitting) return;

    setLocating(true);
    if (typeof window !== 'undefined' && 'geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLocating(false);
          onSubmit(isStillThere, photo, pos.coords.latitude, pos.coords.longitude);
        },
        (err) => {
          console.warn('Geolocation Error:', err);
          setLocating(false);
          onSubmit(isStillThere, photo, null, null);
        },
        { timeout: 5000, enableHighAccuracy: true }
      );
    } else {
      setLocating(false);
      onSubmit(isStillThere, photo, null, null);
    }
  };

  return (
    <div className={styles.overlay} onClick={submitting || locating ? undefined : onClose}>
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

        <div className={styles.photoUploadWrapper}>
          <PhotoUpload
            onChange={setPhoto}
            label="현장 사진 (선택 사항)"
            helperText={`* 현장 위치 GPS 기반으로 실시간 방문이 인증됩니다. 현장 사진 첨부는 선택 사항입니다.`}
          />
        </div>


        {error && <p className={styles.error}>{error}</p>}

        <div className={styles.actions}>
          <Button variant="outline" fullWidth onClick={onClose} disabled={submitting || locating}>
            취소
          </Button>
          <Button
            variant="primary"
            fullWidth
            onClick={handleSubmit}
            disabled={!canSubmit}
          >
            {locating ? '위치 측정 중...' : submitting ? '전송 중...' : '인증 완료'}
          </Button>
        </div>
      </div>
    </div>
  );
}

