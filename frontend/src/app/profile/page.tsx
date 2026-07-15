'use client';

import React from 'react';
import { Header } from '@/components/ui/Header/Header';
import { ProfileCard } from '@/components/features/profile/ProfileCard';
import { BadgeShowcase } from '@/components/features/profile/BadgeShowcase';
import { ChallengeBoard } from '@/components/features/profile/ChallengeBoard';
import { ActivityHistory } from '@/components/features/profile/ActivityHistory';
import { AccountActions } from '@/components/features/profile/AccountActions';
import styles from './page.module.css';

// 내 등록 핀 더미 이미지 데이터
const REGISTERED_PINS = [
  { id: 1, image: 'https://images.unsplash.com/photo-1501854140801-50d01698950b?auto=format&fit=crop&w=150&q=80', title: '북한산 비밀 바위' },
  { id: 2, image: 'https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?auto=format&fit=crop&w=150&q=80', title: '청계산 계곡 벤치' },
  { id: 3, image: 'https://images.unsplash.com/photo-1540959733332-eab4deceeaf7?auto=format&fit=crop&w=150&q=80', title: '남산 타워 전망 포인트' },
  { id: 4, image: 'https://images.unsplash.com/photo-1505232987724-ca875508a735?auto=format&fit=crop&w=150&q=80', title: '한강 노을 명당' },
  { id: 5, image: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=150&q=80', title: '아차산 해맞이 쉼터' },
];

// 보유 뱃지 더미 데이터
const BADGES = [
  { icon: '⛺', name: '첫 발견자(Pioneer)', className: 'pioneerBadge' },
  { icon: '🌲', name: '지역 마스터(Local Master)', className: 'localMasterBadge' },
  { icon: '⛰️', name: '산악인(Explorer)', className: 'activeBadge' },
];

// 진행 챌린지 더미 데이터
const CHALLENGES = [
  {
    category: '시즌별 챌린지',
    progressText: '7/10 달성 중',
    name: '"이번 달 단풍 좌표 10곳 인증"',
    progressPercent: 70,
  },
  {
    category: '일일 미션',
    progressText: '완료',
    name: '"새로운 산스장 핀 등록"',
    progressPercent: 100,
    isCompleted: true,
  },
];

// 최근 방문 장소 더미 데이터
const RECENT_SPOT = {
  id: 'namsan',
  image: 'https://images.unsplash.com/photo-1540959733332-eab4deceeaf7?auto=format&fit=crop&w=300&q=80',
  title: '남산공원',
  location: '서울특별시 중구 회현동1가',
};

export default function MyActivityPage() {
  const handleLogout = () => {
    alert('로그아웃 되었습니다.');
  };

  const handleWithdraw = () => {
    if (confirm('정말로 탈퇴하시겠습니까? 적립된 포인트와 발굴 정보가 모두 영구 삭제됩니다.')) {
      alert('회원 탈퇴 처리가 완료되었습니다.');
    }
  };

  return (
    <main className={styles.main}>
      {/* 1. Header (Boundary Component) */}
      <Header title="내 활동 및 챌린지" />

      <div className={styles.container}>
        {/* 2. Profile Card (Feature Component) */}
        <ProfileCard 
          nickname="힐링맨" 
          level={8} 
          progressPercent={80} 
          avatarUrl="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&q=80"
        />

        {/* 3. Badge Showcase (Feature Component) */}
        <BadgeShowcase badges={BADGES} />

        {/* 4. Challenge Board (Feature Component) */}
        <ChallengeBoard challenges={CHALLENGES} />

        {/* 5. Activity History (Feature Component) */}
        <ActivityHistory 
          pinsCount={52} 
          pinsPhotos={REGISTERED_PINS} 
          points={1250} 
          recentSpot={RECENT_SPOT}
        />

        {/* 6. Account Actions (Feature Component) */}
        <AccountActions 
          onLogout={handleLogout} 
          onWithdraw={handleWithdraw} 
        />
      </div>
    </main>
  );
}
