'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { Header } from '@/components/ui/Header/Header';
import PinHeader from '@/components/features/pin/PinHeader';
import PinImageArea from '@/components/features/pin/PinImageArea';
import PinTags from '@/components/features/pin/PinTags';
import PinCoordCard from '@/components/features/pin/PinCoordCard';
import PinVerifySummary from '@/components/features/pin/PinVerifySummary';
import PinActions from '@/components/features/pin/PinActions';
import VerifyModal from '@/components/features/pin/VerifyModal';
import { getPinDetails, Pin, resolvePhotoUrl } from '@/api/pins';
import { createVerification } from '@/api/verifications';
import { formatRewardMessage } from '@/utils/reward';
import { formatDateTime } from '@/utils/date';
import styles from './page.module.css';

export default function PinPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = React.use(params);
  const id = resolvedParams.id;

  const [pin, setPin] = useState<Pin | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [verifyOpen, setVerifyOpen] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [verifyError, setVerifyError] = useState<string | null>(null);

  const loadPin = useCallback(async () => {
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
  }, [id]);

  useEffect(() => {
    if (id) {
      loadPin();
    }
  }, [id, loadPin]);

  const handleVerify = async (isStillThere: boolean, photo: File | null) => {
    try {
      setVerifying(true);
      setVerifyError(null);

      const result = await createVerification({ pinId: Number(id), isStillThere, photo });

      setVerifyOpen(false);
      const rewardMessage = formatRewardMessage(result.reward);
      alert(`${result.message}\n\n현재 신뢰도: ${result.reliability_score}${rewardMessage ? `\n\n${rewardMessage}` : ''}`);
      await loadPin(); // 갱신된 신뢰도와 인증 수를 다시 불러옵니다.
    } catch (err) {
      setVerifyError(err instanceof Error ? err.message : '인증에 실패했습니다.');
    } finally {
      setVerifying(false);
    }
  };

  const closeVerify = () => {
    setVerifyOpen(false);
    setVerifyError(null);
  };

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
      <PinVerifySummary
        reliabilityScore={pin.reliability_score}
        verificationCount={pin.verification_count}
        stillThereCount={pin.still_there_count}
        lastCheckedAt={pin.last_status_checked_at}
        createdAt={pin.created_at}
      />
      <PinActions onVerify={() => setVerifyOpen(true)} />

      {verifyOpen && (
        <VerifyModal
          pinTitle={pin.title}
          submitting={verifying}
          error={verifyError}
          onSubmit={handleVerify}
          onClose={closeVerify}
        />
      )}
    </main>
  );
}
