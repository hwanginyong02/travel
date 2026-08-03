'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/ui/Header/Header';
import PointsSummary from '@/components/features/profile/PointsSummary';
import PointsHistory from '@/components/features/profile/PointsHistory';
import { getPointHistory, PointHistory } from '@/api/gamification';
import { formatDateTime } from '@/utils/date';
import styles from './page.module.css';

export default function PointsPage() {
  const router = useRouter();
  const [history, setHistory] = useState<PointHistory | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!localStorage.getItem('access_token')) {
      router.push('/login');
      return;
    }

    setLoading(true);
    getPointHistory()
      .then(setHistory)
      .catch((err) => console.error('Failed to get point history:', err))
      .finally(() => setLoading(false));
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
    <main className={styles.main}>
      <Header title="획득 포인트 내역" showBack={true} />
      
      <div className={styles.container}>
        {loading ? (
          <p className={styles.loadingText}>포인트 적립 내역을 불러오는 중...</p>
        ) : (
          <>
            <PointsSummary
              total={history?.total_points ?? 0}
              description="포인트를 모아 쉼터 보수 참여 뱃지나 특별 기프티콘으로 교환할 수 있습니다."
            />
            <PointsHistory items={items} />
          </>
        )}
      </div>
    </main>
  );
}
