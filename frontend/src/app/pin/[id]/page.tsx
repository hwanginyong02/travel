'use client';

import React from 'react';
import { Header } from '@/components/ui/Header/Header';
import PinHeader from '@/components/features/pin/PinHeader';
import PinImageArea from '@/components/features/pin/PinImageArea';
import PinTags from '@/components/features/pin/PinTags';
import PinCoordCard from '@/components/features/pin/PinCoordCard';
import PinActions from '@/components/features/pin/PinActions';
import styles from './page.module.css';

export default function PinPage({ params }: { params: { id: string } }) {
  // 실제 서비스라면 params.id로 데이터를 패치할 것입니다. 여기서는 하드코딩 데이터를 활용합니다.
  const pinData = {
    title: "청계산 '산스장' 비밀 전망대",
    isVerified: true,
    experienceTags: ["#인생샷포인트", "#산스장"],
    cautionTags: ["#가파른경사"],
    coord: "37.4521° N, 127.0234° E",
    desc: "청계산 등산로 초입에서 약 20분 거리, 바위 쉼터 옆",
    date: "2024.08.15 11:30"
  };

  return (
    <main className={styles.main}>
      <Header title="숨은 좌표 상세" />
      <PinHeader title={pinData.title} />
      <PinImageArea isVerified={pinData.isVerified} />
      <PinTags experienceTags={pinData.experienceTags} cautionTags={pinData.cautionTags} />
      <PinCoordCard coord={pinData.coord} desc={pinData.desc} date={pinData.date} />
      <PinActions />
    </main>
  );
}
