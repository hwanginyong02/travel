'use client';

import React from 'react';
import { Button } from '@/components/ui/Button/Button';
import styles from './PinActions.module.css';

interface PinActionsProps {
  onNavigate?: () => void;
  onVerify?: () => void;
}

export default function PinActions({ onNavigate, onVerify }: PinActionsProps) {
  const handleNavigate = () => {
    if (onNavigate) {
      onNavigate();
    } else {
      alert('길찾기 안내를 시작합니다.');
    }
  };

  const handleVerify = () => {
    if (onVerify) {
      onVerify();
    } else {
      alert('방문 인증이 완료되었습니다! 50 P가 적립되었습니다.');
    }
  };

  return (
    <div className={styles.actionButtons}>
      <Button variant="outline" fullWidth onClick={handleNavigate}>🧭 길 찾기</Button>
      <Button variant="primary" fullWidth onClick={handleVerify}>✓ 인증하기</Button>
    </div>
  );
}
