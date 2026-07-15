'use client';

import React from 'react';
import { Header } from '@/components/ui/Header/Header';
import { Button } from '@/components/ui/Button/Button';
import PhotoUpload from '@/components/features/pin/PhotoUpload';
import TagSelector from '@/components/features/pin/TagSelector';
import GpsMapArea from '@/components/features/pin/GpsMapArea';
import styles from './page.module.css';

export default function PinRegisterPage() {
  const handleRegister = () => {
    alert('핀 등록 신청이 접수되었습니다! 정밀 위치 검증 알고리즘 가동 후 지도에 표출됩니다.');
    window.history.back();
  };

  return (
    <main className={styles.main}>
      <Header title="숨은 좌표 등록" />
      
      <PhotoUpload />
      <TagSelector />
      <GpsMapArea />

      <div className={styles.bottomBar}>
        <Button variant="primary" fullWidth onClick={handleRegister}>
          + 이 숨은 좌표 등록하기
        </Button>
      </div>
    </main>
  );
}
