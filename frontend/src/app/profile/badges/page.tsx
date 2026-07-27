'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/ui/Header/Header';
import BadgeList from '@/components/features/profile/BadgeList';
import { BadgeProgress, getBadges } from '@/api/gamification';
import { badgeProgressText } from '@/utils/badge';
import { formatDateTime } from '@/utils/date';
import styles from './page.module.css';

export default function BadgesPage() {
  const router = useRouter();
  const [badges, setBadges] = useState<BadgeProgress[]>([]);

  useEffect(() => {
    if (!localStorage.getItem('access_token')) {
      router.push('/login');
      return;
    }

    getBadges()
      .then(setBadges)
      .catch((err) => console.error('Failed to get badges:', err));
  }, [router]);

  const items = badges.map((badge, index) => ({
    id: index,
    icon: badge.icon,
    name: badge.name,
    date: badge.awarded_at ? `획득일: ${formatDateTime(badge.awarded_at)}` : '-',
    desc: badge.description,
    isLocked: !badge.is_unlocked,
    progress: badgeProgressText(badge),
  }));

  return (
    <main className={styles.main}>
      <Header title="나의 뱃지 쇼케이스" />
      <BadgeList badges={items} />
    </main>
  );
}
