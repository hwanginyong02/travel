/**
 * 등록 시각을 '3시간 전' 같은 상대 표현으로 바꿉니다.
 * 자연 명소 정보는 금방 낡기 때문에 목록에서 최신성을 빠르게 판단할 수 있어야 합니다.
 */
export function formatRelativeTime(isoDate: string | undefined | null): string {
  if (!isoDate) return '';

  const target = new Date(isoDate);
  if (Number.isNaN(target.getTime())) return '';

  const diffSeconds = Math.floor((Date.now() - target.getTime()) / 1000);
  if (diffSeconds < 60) return '방금 전';

  const diffMinutes = Math.floor(diffSeconds / 60);
  if (diffMinutes < 60) return `${diffMinutes}분 전`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}시간 전`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 30) return `${diffDays}일 전`;

  const diffMonths = Math.floor(diffDays / 30);
  if (diffMonths < 12) return `${diffMonths}개월 전`;

  return `${Math.floor(diffMonths / 12)}년 전`;
}

/** 'YYYY.MM.DD HH:mm' 형태로 표시합니다. */
export function formatDateTime(isoDate: string | undefined | null): string {
  if (!isoDate) return '';

  const target = new Date(isoDate);
  if (Number.isNaN(target.getTime())) return '';

  const pad = (n: number) => String(n).padStart(2, '0');
  return `${target.getFullYear()}.${pad(target.getMonth() + 1)}.${pad(target.getDate())} ${pad(target.getHours())}:${pad(target.getMinutes())}`;
}

/** 마지막 갱신이 STALE_DAYS 이상 지났으면 '오래된 정보'로 봅니다. */
export const STALE_DAYS = 180;

export function isStale(isoDate: string | undefined | null): boolean {
  if (!isoDate) return false;
  const target = new Date(isoDate);
  if (Number.isNaN(target.getTime())) return false;
  return Date.now() - target.getTime() > STALE_DAYS * 24 * 60 * 60 * 1000;
}
