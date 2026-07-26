'use client';

import React, { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Header } from '@/components/ui/Header/Header';
import { Button } from '@/components/ui/Button/Button';
import PhotoUpload from '@/components/features/pin/PhotoUpload';
import TagSelector from '@/components/features/pin/TagSelector';
import GpsMapArea from '@/components/features/pin/GpsMapArea';
import PinInfoForm from '@/components/features/pin/PinInfoForm';
import { createPin } from '@/api/pins';
import { useGeolocation } from '@/hooks/useGeolocation';
import styles from './page.module.css';

function PinRegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const spotId = Number(searchParams.get('spotId'));

  const { coords, accuracy, loading: gpsLoading, error: gpsError, refresh } = useGeolocation();

  const [photo, setPhoto] = useState<File | null>(null);
  const [tags, setTags] = useState<string[]>([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = Boolean(photo && coords && title.trim() && description.trim()) && !submitting;

  const handleRegister = async () => {
    if (!photo || !coords) return;

    try {
      setSubmitting(true);
      setError(null);

      const result = await createPin({
        tourSpotId: spotId,
        title: title.trim(),
        description: description.trim(),
        latitude: coords.lat,
        longitude: coords.lng,
        tags,
        photo,
      });

      const status = result.exif_validated ? '✅ 검증 완료' : '⚠️ 미검증';
      alert(`핀이 등록되었습니다.\n\n${status}\n${result.validation_message}`);
      router.push(`/pin/${result.pin.id}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : '핀 등록에 실패했습니다.';
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  if (!spotId) {
    return (
      <main className={styles.main}>
        <Header title="숨은 좌표 등록" />
        <p className={styles.error}>등록할 명소를 찾을 수 없습니다. 명소 상세 화면에서 다시 시도해주세요.</p>
      </main>
    );
  }

  return (
    <main className={styles.main}>
      <Header title="숨은 좌표 등록" />

      <PhotoUpload onChange={setPhoto} />
      <TagSelector selectedTags={tags} onChange={setTags} />
      <GpsMapArea
        coords={coords}
        accuracy={accuracy}
        loading={gpsLoading}
        error={gpsError}
        onRefresh={refresh}
      />
      <PinInfoForm
        title={title}
        description={description}
        onTitleChange={setTitle}
        onDescriptionChange={setDescription}
      />

      {error && <p className={styles.error}>{error}</p>}

      <div className={styles.bottomBar}>
        {!canSubmit && !submitting && (
          <p className={styles.requirement}>
            사진 · 현재 위치 · 제목 · 설명을 모두 입력하면 등록할 수 있습니다.
          </p>
        )}
        <Button variant="primary" fullWidth onClick={handleRegister} disabled={!canSubmit}>
          {submitting ? '등록 중...' : '+ 이 숨은 좌표 등록하기'}
        </Button>
      </div>
    </main>
  );
}

export default function PinRegisterPage() {
  // useSearchParams는 Suspense 경계 안에서만 사용할 수 있습니다.
  return (
    <Suspense fallback={<Header title="숨은 좌표 등록" />}>
      <PinRegisterForm />
    </Suspense>
  );
}
