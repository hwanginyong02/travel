'use client';

import React, { useEffect, useState } from 'react';
import { Header } from '@/components/ui/Header/Header';
import PinHeader from '@/components/features/pin/PinHeader';
import PinImageArea from '@/components/features/pin/PinImageArea';
import PinTags from '@/components/features/pin/PinTags';
import PinCoordCard from '@/components/features/pin/PinCoordCard';
import PinActions from '@/components/features/pin/PinActions';
import { getPinDetails, Pin, resolvePhotoUrl } from '@/api/pins';
import { formatDateTime } from '@/utils/date';
import styles from './page.module.css';

export default function PinPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = React.use(params);
  const id = resolvedParams.id;

  const [pin, setPin] = useState<Pin | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadPin() {
      try {
        setLoading(true);
        const data = await getPinDetails(id);
        setPin(data);
        setError(null);
      } catch (err) {
        console.error('Failed to load pin details:', err);
        setError('숨은 좌표 정보를 불러오는데 실패했습니다.');
      } finally {
        setLoading(false);
      }
    }

    if (id) {
      loadPin();
    }
  }, [id]);

  if (loading) {
    return (
      <main className={styles.main}>
        <Header title="숨은 좌표 상세" />
        <p className={styles.stateText}>숨은 좌표를 불러오는 중...</p>
      </main>
    );
  }

  if (error || !pin) {
    return (
      <main className={styles.main}>
        <Header title="숨은 좌표 상세" />
        <p className={styles.errorText}>{error || '숨은 좌표를 찾을 수 없습니다.'}</p>
      </main>
    );
  }

  const photo = pin.photos[0];
  const isVerified = pin.photos.some((p) => p.is_validated);
  const experienceTags = pin.tags.filter((t) => !t.is_danger).map((t) => `#${t.name}`);
  const cautionTags = pin.tags.filter((t) => t.is_danger).map((t) => `#${t.name}`);

  const latDirection = pin.latitude >= 0 ? 'N' : 'S';
  const lngDirection = pin.longitude >= 0 ? 'E' : 'W';
  const coord = `${Math.abs(pin.latitude).toFixed(6)}° ${latDirection}, ${Math.abs(pin.longitude).toFixed(6)}° ${lngDirection}`;

  return (
    <main className={styles.main}>
      <Header title="숨은 좌표 상세" />
      <PinHeader title={pin.title} />
      <PinImageArea
        isVerified={isVerified}
        imageUrl={photo ? resolvePhotoUrl(photo.photo_url) : undefined}
      />
      <PinTags experienceTags={experienceTags} cautionTags={cautionTags} />
      <PinCoordCard
        coord={coord}
        desc={pin.description}
        date={formatDateTime(pin.created_at)}
        isBlurred={pin.is_blurred}
      />
      <PinActions />
    </main>
  );
}
