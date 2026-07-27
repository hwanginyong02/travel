import { Reward } from '@/api/gamification';

/**
 * 핀 등록·방문 인증 직후 보여줄 보상 안내 문구를 만듭니다.
 * 획득 포인트가 없으면 빈 문자열을 돌려주므로 그대로 이어 붙여도 안전합니다.
 */
export function formatRewardMessage(reward: Reward | undefined | null): string {
  if (!reward || reward.points_awarded <= 0) return '';

  const lines = [`🏅 ${reward.points_awarded} P 획득! (누적 ${reward.total_points.toLocaleString()} P · 레벨 ${reward.level})`];

  if (reward.new_badges.length > 0) {
    const names = reward.new_badges.map((badge) => `${badge.icon} ${badge.name}`).join(', ');
    lines.push(`새 뱃지를 획득했습니다: ${names}`);
  }

  return lines.join('\n');
}
