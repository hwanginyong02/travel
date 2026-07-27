'use client';

import React, { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Header } from '@/components/ui/Header/Header';
import { Button } from '@/components/ui/Button/Button';
import PhotoUpload from '@/components/features/pin/PhotoUpload';
import TagSelector from '@/components/features/pin/TagSelector';
import PinExifStatus from '@/components/features/pin/PinExifStatus';
import PinInfoForm from '@/components/features/pin/PinInfoForm';
import { createPin, previewPhotoExif, PhotoExifPreview } from '@/api/pins';
import { formatRewardMessage } from '@/utils/reward';
import styles from './page.module.css';

const PHOTO_HELPER_TEXT =
  '* 위치 정보(GPS)가 담긴 원본 사진이 필요합니다. 찍은 위치가 곧 핀 좌표가 됩니다.';

function PinRegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const spotId = Number(searchParams.get('spotId'));

  const [photo, setPhoto] = useState<File | null>(null);
  const [preview, setPreview] = useState<PhotoExifPreview | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);

  const [tags, setTags] = useState<string[]>([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 사진을 고른 즉시 EXIF를 확인합니다. 제출한 뒤에야 등록 불가를 알게 되면 안 되기 때문입니다.
  const handlePhotoChange = async (file: File | null) => {
    setPhoto(file);
    setPreview(null);
    setPreviewError(null);
    setError(null);

    if (!file) return;

    try {
      setPreviewLoading(true);
      setPreview(await previewPhotoExif(file, spotId));
    } catch (err) {
      setPreviewError(err instanceof Error ? err.message : '사진을 확인하지 못했습니다.');
    } finally {
      setPreviewLoading(false);
    }
  };

  const canSubmit =
    Boolean(photo && preview?.can_register && title.trim() && description.trim()) && !submitting;

  const handleRegister = async () => {
    if (!photo) return;

    try {
      setSubmitting(true);
      setError(null);

      const result = await createPin({
        tourSpotId: spotId,
        title: title.trim(),
        description: description.trim(),
        tags,
        photo,
      });

      const status = result.exif_validated ? '✅ 검증 완료' : '⚠️ 미검증';
      const rewardMessage = formatRewardMessage(result.reward);
      alert(
        `핀이 등록되었습니다.\n\n${status}\n${result.validation_message}` +
          (rewardMessage ? `\n\n${rewardMessage}` : '')
      );
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

      <PhotoUpload onChange={handlePhotoChange} helperText={PHOTO_HELPER_TEXT} />
      <TagSelector selectedTags={tags} onChange={setTags} />
      <PinExifStatus preview={preview} loading={previewLoading} error={previewError} />
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
            위치 정보가 있는 사진 · 제목 · 설명을 모두 입력하면 등록할 수 있습니다.
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
