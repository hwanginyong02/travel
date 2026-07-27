'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/ui/Header/Header';
import PointsSummary from '@/components/features/profile/PointsSummary';
import PointsHistory from '@/components/features/profile/PointsHistory';
import { getPointHistory, PointHistory } from '@/api/gamification';
import { formatDateTime } from '@/utils/date';

export default function PointsPage() {
  const router = useRouter();
  const [history, setHistory] = useState<PointHistory | null>(null);

  useEffect(() => {
    if (!localStorage.getItem('access_token')) {
      router.push('/login');
      return;
    }

    getPointHistory()
      .then(setHistory)
      .catch((err) => console.error('Failed to get point history:', err));
  }, [router]);

  const items = (history?.items || []).map((item) => ({
    id: item.id,
    type: item.label,
    spot: item.pin_title || '전체 활동',
    points: `${item.amount >= 0 ? '+' : ''}${item.amount} P`,
    date: formatDateTime(item.created_at),
    desc: item.description,
  }));

  return (
    <main>
      <Header title="획득 포인트 내역" />
      <PointsSummary
        total={history?.total_points ?? 0}
        description="포인트를 모아 쉼터 보수 참여 뱃지나 특별 기프티콘으로 교환할 수 있습니다."
      />
      <PointsHistory items={items} />
    </main>
  );
}
