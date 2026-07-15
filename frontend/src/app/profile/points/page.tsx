'use client';

import React from 'react';
import { Header } from '@/components/ui/Header/Header';
import PointsSummary from '@/components/features/profile/PointsSummary';
import PointsHistory from '@/components/features/profile/PointsHistory';

// 포인트 적립 내역 가상 데이터
const POINT_HISTORY = [
  { id: 1, type: '인증 획득', spot: '청계산 비밀전망대', points: '+50 P', date: '2026.07.14', desc: '다른 유저가 등록한 핀 방문 인증 완료' },
  { id: 2, type: '핀 등록 보상', spot: '북한산 비밀 바위', points: '+100 P', date: '2026.07.14', desc: '새로운 숨은 핀 발굴 보상' },
  { id: 3, type: '피드백 보상', spot: '뚝섬한강공원 3호 쉼터', points: '+20 P', date: '2026.07.12', desc: '해당 핀 정보의 "아직 그대로인가요?" 설문 투표' },
  { id: 4, type: '인증 획득', spot: '남산 타워 전망 포인트', points: '+50 P', date: '2026.07.11', desc: '다른 유저가 등록한 핀 방문 인증 완료' },
  { id: 5, type: '일일 미션 달성', spot: '새로운 산스장 핀 등록', points: '+200 P', date: '2026.07.10', desc: '일일 미션 완료 추가 보너스' },
];

export default function PointsPage() {
  return (
    <main>
      <Header title="획득 포인트 내역" />
      <PointsSummary
        total={1250}
        description="포인트를 모아 쉼터 보수 참여 뱃지나 특별 기프티콘으로 교환할 수 있습니다."
      />
      <PointsHistory items={POINT_HISTORY} />
    </main>
  );
}
