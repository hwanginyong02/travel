'use client';

import React from 'react';
import { Header } from '@/components/ui/Header/Header';
import BadgeList from '@/components/features/profile/BadgeList';
import styles from './page.module.css';

// 뱃지 정보 가상 데이터 (해금 완료 & 미해금 목록)
const BADGE_LIST = [
  { 
    id: 1, 
    icon: '⛺', 
    name: '첫 발견자 (Pioneer)', 
    date: '획득일: 2026.06.12', 
    desc: '아무도 등록하지 않은 자연 속 숨은 미시 좌표 1호 핀을 성공적으로 발굴해 냈을 때 수여받는 개척자 뱃지입니다.', 
    isLocked: false 
  },
  { 
    id: 2, 
    icon: '🌲', 
    name: '지역 마스터 (Local Master)', 
    date: '획득일: 2026.06.30', 
    desc: '한 행정구역(예: 서울시 중구) 안의 자연 명소 핀을 5개 이상 신규 발굴하거나 직접 상태 보고를 마쳤을 때 수여받습니다.', 
    isLocked: false 
  },
  { 
    id: 3, 
    icon: '⛰️', 
    name: '산악인 (Explorer)', 
    date: '획득일: 2026.07.10', 
    desc: '산(Mountain) 카테고리 태그로 지정된 숨은 명당 핀을 10개 이상 방문 인증했을 때 주어지는 뱃지입니다.', 
    isLocked: false 
  },
  { 
    id: 4, 
    icon: '🌊', 
    name: '물멍 고수 (Water Meditation)', 
    date: '-', 
    desc: '물소리가 들리는 계곡, 강, 바다 벤치 핀을 5회 이상 방문하여 조용함을 입증해 주신 평화주의 유저용 뱃지입니다.', 
    isLocked: true,
    progress: '3/5 달성 중' 
  },
  { 
    id: 5, 
    icon: '📸', 
    name: '내셔널 지오그래픽 (Photographer)', 
    date: '-', 
    desc: '직접 사진을 첨부한 핀 중 GPS(EXIF) 정보 검증이 완료된 신뢰도 100% 핀을 20개 이상 유지했을 때 지급됩니다.', 
    isLocked: true,
    progress: '12/20 달성 중' 
  },
];

export default function BadgesPage() {
  return (
    <main className={styles.main}>
      <Header title="나의 뱃지 쇼케이스" />
      <BadgeList badges={BADGE_LIST} />
    </main>
  );
}
