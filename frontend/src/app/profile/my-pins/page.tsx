'use client';

import React from 'react';
import { Header } from '@/components/ui/Header/Header';
import PinList from '@/components/features/profile/PinList';

// 내 등록 핀 가상 상세 데이터
const MY_PIN_LIST = [
  {
    id: 1,
    title: '북한산 비밀 바위',
    location: '북한산국립공원 백운대 방면 코스 중간',
    tag: '#인생샷포인트',
    date: '2026.07.14',
    image: 'https://images.unsplash.com/photo-1501854140801-50d01698950b?auto=format&fit=crop&w=400&q=80',
    verifications: 15,
  },
  {
    id: 2,
    title: '청계산 계곡 벤치',
    location: '청계산 원터골 등산로 옆 계곡 쉼터',
    tag: '#물멍벤치',
    date: '2026.07.10',
    image: 'https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?auto=format&fit=crop&w=400&q=80',
    verifications: 28,
  },
  {
    id: 3,
    title: '남산 타워 전망 포인트',
    location: '남산공원 순환로 우측 숲길 100m 앞',
    tag: '#야경명소',
    date: '2026.07.05',
    image: 'https://images.unsplash.com/photo-1540959733332-eab4deceeaf7?auto=format&fit=crop&w=400&q=80',
    verifications: 42,
  },
];

export default function MyPinsPage() {
  return (
    <main>
      <Header title="내가 등록한 핀" />
      <PinList pins={MY_PIN_LIST} totalCount={52} />
    </main>
  );
}
