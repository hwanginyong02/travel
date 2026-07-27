'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/ui/Header/Header';
import { ProfileCard } from '@/components/features/profile/ProfileCard';
import { BadgeShowcase } from '@/components/features/profile/BadgeShowcase';
import { ChallengeBoard } from '@/components/features/profile/ChallengeBoard';
import { ActivityHistory } from '@/components/features/profile/ActivityHistory';
import { AccountActions } from '@/components/features/profile/AccountActions';
import { withdrawAccount } from '@/api/auth';
import { getProfileSummary, ProfileSummary } from '@/api/gamification';
import { resolvePhotoUrl } from '@/api/pins';
import { badgeShowcaseClass, toChallengeItems } from '@/utils/badge';
import styles from './page.module.css';

export default function MyActivityPage() {
  const router = useRouter();
  const [summary, setSummary] = useState<ProfileSummary | null>(null);
  const [token, setToken] = useState<string>('');

  useEffect(() => {
    const accessToken = localStorage.getItem('access_token');
    if (!accessToken) {
      router.push('/login');
      return;
    }
    setToken(accessToken);

    getProfileSummary()
      .then(setSummary)
      .catch((err) => {
        console.error('Failed to get profile summary:', err);
        // 토큰 오류 시 로그인창 이동
        localStorage.removeItem('access_token');
        router.push('/login');
      });
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    alert('로그아웃 되었습니다.');
    router.push('/login');
  };

  const handleWithdraw = async () => {
    if (confirm('정말로 탈퇴하시겠습니까? 적립된 포인트와 발굴 정보가 모두 영구 삭제됩니다.')) {
      try {
        await withdrawAccount(token);
        localStorage.removeItem('access_token');
        alert('회원 탈퇴 처리가 완료되었습니다.');
        router.push('/login');
      } catch (err) {
        console.error('Withdrawal failed:', err);
        alert('회원 탈퇴 처리 중 오류가 발생했습니다.');
      }
    }
  };

  if (!summary) {
    return (
      <main className={styles.main}>
        <Header title="내 활동 및 챌린지" />
        <div className={styles.container} style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '300px' }}>
          <p style={{ color: 'var(--color-deep-forest)', fontWeight: 600 }}>프로필 정보를 불러오고 있습니다...</p>
        </div>
      </main>
    );
  }

  const unlockedBadges = summary.badges
    .filter((badge) => badge.is_unlocked)
    .map((badge) => ({
      icon: badge.icon,
      name: badge.name,
      className: badgeShowcaseClass(badge.code),
    }));

  const recentPinPhotos = summary.recent_pins
    .filter((pin) => pin.photo_url)
    .map((pin) => ({
      id: pin.id,
      image: resolvePhotoUrl(pin.photo_url as string),
      title: pin.title,
    }));

  const recentSpot = summary.recent_spot
    ? {
        id: String(summary.recent_spot.id),
        image: summary.recent_spot.firstimage || '',
        title: summary.recent_spot.title,
        location: `위도 ${summary.recent_spot.mapy.toFixed(4)}, 경도 ${summary.recent_spot.mapx.toFixed(4)}`,
      }
    : undefined;

  return (
    <main className={styles.main}>
      {/* 1. Header (Boundary Component) */}
      <Header title="내 활동 및 챌린지" />

      <div className={styles.container}>
        {/* 2. Profile Card (Feature Component) */}
        <ProfileCard
          nickname={summary.nickname}
          level={summary.level}
          progressPercent={summary.progress_percent}
          avatarUrl={summary.profile_image || '/icon/male.png'}
        />

        {/* 3. Badge Showcase (Feature Component) */}
        <BadgeShowcase badges={unlockedBadges} />

        {/* 4. Challenge Board — 도전 중인 뱃지의 진행도를 챌린지로 보여줍니다. */}
        <ChallengeBoard challenges={toChallengeItems(summary.badges, 2)} />

        {/* 5. Activity History (Feature Component) */}
        <ActivityHistory
          pinsCount={summary.pins_count}
          pinsPhotos={recentPinPhotos}
          points={summary.points}
          recentSpot={recentSpot}
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
