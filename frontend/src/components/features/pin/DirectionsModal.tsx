'use client';

import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button/Button';
import styles from './DirectionsModal.module.css';

interface DirectionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  destTitle: string;
  destLat: number;
  destLng: number;
}

export default function DirectionsModal({
  isOpen,
  onClose,
  destTitle,
  destLat,
  destLng,
}: DirectionsModalProps) {
  const [userLat, setUserLat] = useState<number | null>(null);
  const [userLng, setUserLng] = useState<number | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    if (typeof window !== 'undefined' && 'geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserLat(pos.coords.latitude);
          setUserLng(pos.coords.longitude);
        },
        (err) => {
          console.warn('Geolocation Error for Directions:', err);
        },
        { timeout: 5000, enableHighAccuracy: true }
      );
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const cleanedTitle = (destTitle || '')
    .replace(/^\[.*?\]\s*/, '')
    .trim() || '목적지';

  // 카카오 지도 공식 스키마 엔드포인트: map.kakao.com/link/...
  // (m.map.kakao.com/link/는 카카오 라우터 미지원으로 '존재하지 않는 URL' 오류가 발생하므로 map.kakao.com 사용)
  const kakaoMapRouteUrl = userLat && userLng
    ? `https://map.kakao.com/link/from/${encodeURIComponent('내 위치')},${userLat},${userLng}/to/${encodeURIComponent(cleanedTitle)},${destLat},${destLng}`
    : `https://map.kakao.com/link/to/${encodeURIComponent(cleanedTitle)},${destLat},${destLng}`;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        {/* 모달 헤더 */}
        <div className={styles.modalHeader}>
          <h3 className={styles.modalTitle}>길찾기</h3>
          <button type="button" className={styles.closeBtn} onClick={onClose}>
            ✕
          </button>
        </div>

        {/* 웹앱 내 카카오 지도 길안내 뷰어 */}
        <div className={styles.iframeContainer}>
          <iframe
            src={kakaoMapRouteUrl}
            className={styles.mapIframe}
            title="카카오 지도 길찾기"
            allow="geolocation"
          />
        </div>

        {/* 하단 단일 버튼 */}
        <div className={styles.modalFooter}>
          <Button
            variant="primary"
            fullWidth
            onClick={() => window.open(kakaoMapRouteUrl, '_blank')}
          >
            앱에서 보기
          </Button>
        </div>
      </div>
    </div>
  );
}
