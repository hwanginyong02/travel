'use client';

import React from 'react';
import Link from 'next/link';
import { Badge } from '@/components/ui/Badge/Badge';
import { Pin, PinSort, resolvePhotoUrl } from '@/api/pins';
import { formatRelativeTime, isStale } from '@/utils/date';
import styles from './SpotPinList.module.css';

interface SpotPinListProps {
  totalCount: number;
  pins: Pin[];
  sort: PinSort;
  onSortChange: (sort: PinSort) => void;
  loading?: boolean;
  error?: string | null;
}

const SORT_OPTIONS: { label: string; value: PinSort }[] = [
  { label: '⭐ 인기순', value: 'popular' },
  { label: '🕒 최신순', value: 'latest' },
];

export const SpotPinList: React.FC<SpotPinListProps> = ({
  totalCount,
  pins,
  sort,
  onSortChange,
  loading = false,
  error = null,
}) => {
  return (
    <div className={styles.content}>
      <h2 className={styles.heading}>이 명소의 숨은 포인트 ({totalCount}개)</h2>

      <div className={styles.filters}>
        {SORT_OPTIONS.map((option) => (
          <Badge
            key={option.value}
            onClick={() => onSortChange(option.value)}
            className={sort === option.value ? styles.activeFilter : styles.inactiveFilter}
          >
            {option.label}
          </Badge>
        ))}
      </div>

      {loading && <p className={styles.stateText}>숨은 포인트를 불러오는 중...</p>}
      {!loading && error && <p className={styles.errorText}>{error}</p>}
      {!loading && !error && pins.length === 0 && (
        <p className={styles.stateText}>
          아직 등록된 숨은 좌표가 없습니다.
          <br />
          첫 발견자가 되어보세요!
        </p>
      )}

      <ul className={styles.pinList}>
        {pins.map((pin) => {
          const photo = pin.photos[0];
          const verified = pin.photos.some((p) => p.is_validated);
          const stale = isStale(pin.last_status_checked_at || pin.created_at);

          return (
            <li key={pin.id} className={styles.pinCard}>
              {photo ? (
                <div
                  className={styles.pinImage}
                  style={{ backgroundImage: `url(${resolvePhotoUrl(photo.photo_url)})` }}
                />
              ) : (
                <div className={styles.pinImage}>📸</div>
              )}

              <div className={styles.pinInfo}>
                <p className={styles.pinTitle}>{pin.title}</p>

                <div className={styles.tags}>
                  {verified && <Badge variant="verified">✓ 검증됨</Badge>}
                  {stale && <Badge variant="caution">⚠️ 오래된 정보</Badge>}
                  {pin.tags.map((tag) => (
                    <Badge key={tag.id} variant={tag.is_danger ? 'caution' : 'experience'}>
                      #{tag.name}
                    </Badge>
                  ))}
                </div>

                <p className={styles.meta}>
                  {pin.user?.nickname || '알 수 없음'} · {formatRelativeTime(pin.created_at)}
                  {' · '}신뢰도 {pin.reliability_score}
                  {pin.verification_count > 0 && ` · 👍 ${pin.still_there_count}명 확인`}
                </p>
              </div>

              <Link
                href={`/pin/${pin.id}`}
                className={styles.linkOverlay}
                aria-label={`${pin.title} 상세보기`}
              />
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default SpotPinList;
