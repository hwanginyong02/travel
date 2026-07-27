import { BadgeProgress } from '@/api/gamification';

/**
 * 뱃지 code를 BadgeShowcase가 쓰는 원형 배경 스타일 이름으로 바꿉니다.
 * 정의에 없는 code는 기본 스타일로 떨어뜨려 새 뱃지를 추가해도 화면이 깨지지 않게 합니다.
 */
const SHOWCASE_CLASS_BY_CODE: Record<string, string> = {
  PIONEER: 'pioneerBadge',
  LOCAL_MASTER: 'localMasterBadge',
};

export function badgeShowcaseClass(code: string): string {
  return SHOWCASE_CLASS_BY_CODE[code] || 'activeBadge';
}

/** '3/5 달성 중', 완료면 '완료' 형태의 진행 문구를 만듭니다. */
export function badgeProgressText(badge: BadgeProgress): string {
  if (badge.is_unlocked) return '획득 완료';
  return `${badge.current}/${badge.goal} 달성 중`;
}

export function badgeProgressPercent(badge: BadgeProgress): number {
  if (badge.is_unlocked) return 100;
  if (badge.goal <= 0) return 0;
  return Math.min(Math.round((badge.current / badge.goal) * 100), 100);
}

/**
 * 챌린지 현황판에 올릴 항목을 고릅니다.
 * 아직 못 받은 뱃지를 진행률이 높은 순으로 먼저 보여주고,
 * 도전할 게 남지 않았으면 이미 획득한 뱃지로 채웁니다.
 */
export function toChallengeItems(badges: BadgeProgress[], limit: number) {
  const locked = badges
    .filter((badge) => !badge.is_unlocked)
    .sort((a, b) => badgeProgressPercent(b) - badgeProgressPercent(a));

  const unlocked = badges.filter((badge) => badge.is_unlocked);
  const picked = [...locked, ...unlocked].slice(0, limit);

  return picked.map((badge) => ({
    category: badge.is_unlocked ? '달성 완료' : '도전 중인 뱃지',
    progressText: badgeProgressText(badge),
    name: `"${badge.name}"`,
    progressPercent: badgeProgressPercent(badge),
    isCompleted: badge.is_unlocked,
  }));
}
