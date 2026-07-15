'use client';

import React, { useState } from 'react';
import styles from './PhotoUpload.module.css';

export default function PhotoUpload() {
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);

  const handleUploadClick = () => {
    // 목업 업로드 동작
    alert('EXIF 위치 데이터가 포함된 가을 등산로 사진 업로드 테스트 완료!');
    setSelectedPhoto('https://images.unsplash.com/photo-1501854140801-50d01698950b?auto=format&fit=crop&w=400&q=80');
  };

  return (
    <div className={styles.section}>
      <h3>1. 현장 사진 첨부 (필수)</h3>
      {selectedPhoto ? (
        <div 
          className={styles.uploadedPreview} 
          style={{ backgroundImage: `url(${selectedPhoto})` }}
          onClick={() => setSelectedPhoto(null)}
        >
          <div className={styles.removeOverlay}>사진 변경하기</div>
        </div>
      ) : (
        <div className={styles.uploadArea} onClick={handleUploadClick}>
          <span className={styles.cameraIcon}>📷</span>
          <p>현장에서 즉시 촬영하거나<br/>앨범에서 사진 업로드</p>
        </div>
      )}
      <p className={styles.helperText}>* 업로드 시 사진 메타데이터(EXIF)를 읽어 위치 일치 여부를 검증합니다.</p>
    </div>
  );
}
