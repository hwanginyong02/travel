'use client';

import React from 'react';
import { Button } from '@/components/ui/Button/Button';
import styles from './PinActions.module.css';

interface PinActionsProps {
  onVerify: () => void;
  onNavigate?: () => void;
}

export default function PinActions({ onVerify, onNavigate }: PinActionsProps) {
  const handleNavigate = () => {
    if (onNavigate) {
      onNavigate();
    } else {
      // 길 찾기(카카오맵·네이버지도) 연동은 아직 구현 전입니다.
      alert('길찾기 연동은 준비 중입니다.');
    }
  };

  return (
    <div className={styles.actionButtons}>
      <Button variant="outline" fullWidth onClick={handleNavigate}>🧭 길 찾기</Button>
      <Button variant="primary" fullWidth onClick={onVerify}>✓ 인증하기</Button>
    </div>
  );
}
