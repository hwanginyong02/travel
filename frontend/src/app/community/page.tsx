'use client';

import React from 'react';
import { Header } from '@/components/ui/Header/Header';
import HotSpotList from '@/components/features/community/HotSpotList';
import TopReviewList from '@/components/features/community/TopReviewList';
import styles from './page.module.css';

// 1. 실시간 급상승 자연 명소
const HOT_SPOTS = [
  {
    id: 'cheonggyesan',
    title: '청계산 비밀전망대',
    parentSpot: '청계산',
    tag: '#산스장',
    growth: '+142%',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=80&q=80',
    updater: '힐링맨',
    status: '지금 공기 맑음(산들바람)',
  },
  {
    id: 'namsan',
    title: '남산 타워 노을 벤치',
    parentSpot: '남산공원',
    tag: '#인생샷포인트',
    growth: '+98%',
    avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=80&q=80',
    updater: '야경꾼',
    status: '노을 10분 전(조용함)',
  },
  {
    id: 'bukhansan',
    title: '북한산 백운대 바위 밑 쉼터',
    parentSpot: '북한산국립공원',
    tag: '#피톤치드',
    growth: '+76%',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=80&q=80',
    updater: '꽃길만걷자',
    status: '안개 걷힘(맑음)',
  },
];

// 2. 이달의 최다 공감(인증) 리뷰
const TOP_REVIEWS = [
  {
    id: 'review-1',
    spotName: '청계산 비밀전망대',
    user: '지리덕후',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=80&q=80',
    photo: 'https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?auto=format&fit=crop&w=300&q=80',
    content:
      '매봉 올라가는 깔딱고개 중간에 옆 길로 빠지면 나오는 바위 터입니다. 여기 벤치에 앉아서 물 마시면 도심 빌딩숲이 한눈에 보여요! 강력 추천!',
    tag: '#물멍벤치',
    verifiedCount: 105,
    createdAt: '2일 전',
  },
  {
    id: 'review-2',
    spotName: '뚝섬한강공원 3호 쉼터',
    user: '한강수배자',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=80&q=80',
    photo: 'https://images.unsplash.com/photo-1505232987724-ca875508a735?auto=format&fit=crop&w=300&q=80',
    content:
      '배달존 2번 근처 나무 우측으로 50m만 더 오시면 사람 한명도 없는 작은 언덕벤치 있습니다. 한강 대교 아치에 해 걸릴 때 사진 찍으면 감성 끝내줍니다.',
    tag: '#인생샷포인트',
    verifiedCount: 98,
    createdAt: '5일 전',
  },
];

export default function CommunityPage() {
  return (
    <main className={styles.main}>
      {/* 뒤로가기 버튼이 보이도록 showBack={true} 로 수정 */}
      <Header title="그린 커뮤니티" showBack={true} />

      <div className={styles.container}>
        <HotSpotList spots={HOT_SPOTS} />
        <TopReviewList reviews={TOP_REVIEWS} />
      </div>
    </main>
  );
}
