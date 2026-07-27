'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/ui/Header/Header';
import ChallengeCard from '@/components/features/profile/ChallengeCard';
import { BadgeProgress, getBadges } from '@/api/gamification';
import { badgeProgressPercent, badgeProgressText } from '@/utils/badge';
import { formatDateTime } from '@/utils/date';
import styles from './page.module.css';

export default function ChallengesPage() {
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

  const toCardProps = (badge: BadgeProgress) => ({
    category: `${badge.icon} 뱃지 챌린지`,
    title: badge.name,
    description: badge.description,
    progressText: badgeProgressText(badge),
    progressPercent: badgeProgressPercent(badge),
    rewardText: `${badge.name} 뱃지`,
    footerText: badge.awarded_at ? `획득일: ${formatDateTime(badge.awarded_at)}` : '상시 진행',
    isCompleted: badge.is_unlocked,
  });

  const activeChallenges = badges.filter((badge) => !badge.is_unlocked);
  const completedChallenges = badges.filter((badge) => badge.is_unlocked);

  return (
    <main className={styles.main}>
      <Header title="진행 챌린지 & 미션" />

      <div className={styles.container}>
        <div className={styles.introCard}>
          <h3>🌱 친환경 챌린지 시스템</h3>
          <p>공모전 챌린지에 참여하면 자연 훼손 방지에 앞장설 뿐 아니라 더 높은 힐링 등급과 뱃지를 얻을 수 있습니다.</p>
        </div>

        {/* 1. 진행 중인 챌린지 */}
        <section className={styles.challengeSection}>
          <h4 className={styles.sectionSubtitle}>🏃 진행 중인 챌린지 ({activeChallenges.length})</h4>
          <div className={styles.challengeList}>
            {activeChallenges.map((badge) => (
              <ChallengeCard key={badge.code} {...toCardProps(badge)} />
            ))}
          </div>
        </section>

        {/* 2. 완료한 챌린지 */}
        <section className={styles.challengeSection}>
          <h4 className={styles.sectionSubtitle}>✅ 완료한 챌린지 ({completedChallenges.length})</h4>
          <div className={styles.challengeList}>
            {completedChallenges.map((badge) => (
              <ChallengeCard key={badge.code} {...toCardProps(badge)} />
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
