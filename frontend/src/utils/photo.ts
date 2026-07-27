import { formatDateTime } from './date';

/** 이 기간이 지난 사진은 현재 상태를 담보하지 못합니다. 백엔드 PHOTO_MAX_AGE_DAYS와 같은 값입니다. */
export const PHOTO_MAX_AGE_DAYS = 14;

export function photoAgeDays(takenAt: string | undefined | null): number | null {
  if (!takenAt) return null;

  const target = new Date(takenAt);
  if (Number.isNaN(target.getTime())) return null;

  return (Date.now() - target.getTime()) / (24 * 60 * 60 * 1000);
}

/**
 * 사진이 언제 찍혔는지, 지금과 다를 수 있는지 알려주는 문구를 만듭니다.
 * 자연 명소는 계절에 따라 모습이 크게 바뀌므로 촬영 시점을 함께 보여줘야
 * 사용자가 정보를 어느 정도 믿을지 스스로 판단할 수 있습니다.
 *
 * 최근 사진이거나 촬영 시각이 없으면 null을 반환합니다(표시할 경고가 없음).
 */
export function formatPhotoAgeNotice(takenAt: string | undefined | null): string | null {
  const age = photoAgeDays(takenAt);
  if (age === null || age <= PHOTO_MAX_AGE_DAYS) return null;

  return `${formatDateTime(takenAt)} 촬영 · ${describeAge(age)} 사진이라 지금은 다를 수 있습니다`;
}

function describeAge(days: number): string {
  if (days < 30) return `${Math.floor(days)}일 전`;

  const months = Math.floor(days / 30);
  if (months < 12) return `약 ${months}개월 전`;

  return `약 ${Math.floor(months / 12)}년 전`;
}
