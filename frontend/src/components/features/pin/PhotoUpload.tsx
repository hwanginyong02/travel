'use client';

import React, { useEffect, useRef, useState } from 'react';
import styles from './PhotoUpload.module.css';

const DEFAULT_HELPER_TEXT = '* 업로드 시 사진 메타데이터(EXIF)를 읽어 위치 일치 여부를 검증합니다.';

interface PhotoUploadProps {
  onChange: (file: File | null) => void;
  /** 핀 등록과 방문 인증에서 문구만 달리 쓰기 위한 옵션 */
  label?: string;
  helperText?: string;
}

export default function PhotoUpload({
  onChange,
  label = '1. 현장 사진 첨부 (필수)',
  helperText = DEFAULT_HELPER_TEXT,
}: PhotoUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // 미리보기용 object URL은 교체/언마운트 시 해제해야 메모리가 새지 않습니다.
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;

    setPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return file ? URL.createObjectURL(file) : null;
    });

    onChange(file);
  };

  const handleReset = () => {
    if (inputRef.current) inputRef.current.value = '';
    setPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
    onChange(null);
  };

  return (
    <div className={styles.section}>
      <h3>{label}</h3>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileChange}
        className={styles.hiddenInput}
      />

      {previewUrl ? (
        <div
          className={styles.uploadedPreview}
          style={{ backgroundImage: `url(${previewUrl})` }}
          onClick={handleReset}
        >
          <div className={styles.removeOverlay}>사진 변경하기</div>
        </div>
      ) : (
        <div className={styles.uploadArea} onClick={() => inputRef.current?.click()}>
          <span className={styles.cameraIcon}>📷</span>
          <p>현장에서 즉시 촬영하거나<br />앨범에서 사진 업로드</p>
        </div>
      )}

      <p className={styles.helperText}>{helperText}</p>
    </div>
  );
}
