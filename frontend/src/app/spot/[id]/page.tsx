'use client';

import React from 'react';
import { Header } from '@/components/ui/Header/Header';
import { SpotImageHeader } from '@/components/features/spot/SpotImageHeader';
import { SpotPinList } from '@/components/features/spot/SpotPinList';
import { SpotRegisterFab } from '@/components/features/spot/SpotRegisterFab';
import styles from './page.module.css';

const SPOT_PINS = [
  {
    id: '1',
    tags: ['#야경명소', '#연인과함께'],
    user: '야경꾼',
    registeredAt: '1일 전',
  },
  {
    id: '2',
    tags: ['#조용한소', '#물멍벤치'],
    user: '힐링맨',
    registeredAt: '5일 전',
  },
];

export default function SpotPage({ params }: { params: { id: string } }) {
  return (
    <main className={styles.main}>
      <Header title="명소 상세" />

      <SpotImageHeader
        title="남산공원 (Namsan Park)"
        address="서울특별시 중구 회현동1가"
      />

      <SpotPinList
        spotId={params.id}
        totalCount={75}
        pins={SPOT_PINS}
      />

      <SpotRegisterFab spotId={params.id} />
    </main>
  );
}
