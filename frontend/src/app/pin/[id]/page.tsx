'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/ui/Header/Header';
import { Button } from '@/components/ui/Button/Button';
import PinHeader from '@/components/features/pin/PinHeader';
import PinImageArea from '@/components/features/pin/PinImageArea';
import PinTags from '@/components/features/pin/PinTags';
import PinCoordCard from '@/components/features/pin/PinCoordCard';
import PinVerifySummary from '@/components/features/pin/PinVerifySummary';
import PinActions from '@/components/features/pin/PinActions';
import VerifyModal from '@/components/features/pin/VerifyModal';
import DirectionsModal from '@/components/features/pin/DirectionsModal';
import { getPinDetails, Pin, resolvePhotoUrl } from '@/api/pins';
import { createVerification, getVerifications, Verification } from '@/api/verifications';
import { formatRewardMessage } from '@/utils/reward';
import { formatPhotoAgeNotice } from '@/utils/photo';
import { formatDateTime } from '@/utils/date';
import styles from './page.module.css';

type TabType = 'map' | 'description' | 'verify';

export default function PinPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const resolvedParams = React.use(params);
  const id = resolvedParams.id;

  const [pin, setPin] = useState<Pin | null>(null);
  const [verificationsList, setVerificationsList] = useState<Verification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<TabType>('map');
  const [directionsOpen, setDirectionsOpen] = useState(false);
  const [verifyOpen, setVerifyOpen] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [verifyError, setVerifyError] = useState<string | null>(null);

  const loadPin = useCallback(async () => {
    try {
      setLoading(true);
      const [pinData, vList] = await Promise.all([
        getPinDetails(id),
        getVerifications(id).catch(() => []),
      ]);
      setPin(pinData);
      setVerificationsList(vList);
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

  const openVerifyModal = () => {
    // 로그인 여부 확인
    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
    if (!token) {
      if (confirm('인증 참여를 위해 로그인이 필요합니다.\n로그인 페이지로 이동하시겠습니까?')) {
        router.push('/login');
      }
      return;
    }
    setVerifyError(null);
    setVerifyOpen(true);
  };

  const handleNavigate = () => {
    if (!pin) return;
    setDirectionsOpen(true);
  };


  const handleVerify = async (

    isStillThere: boolean,
    photo: File | null,
    userLat?: number | null,
    userLng?: number | null
  ) => {
    try {
      setVerifying(true);
      setVerifyError(null);

      const result = await createVerification({
        pinId: Number(id),
        isStillThere,
        photo,
        userLatitude: userLat,
        userLongitude: userLng,
      });

      setVerifyOpen(false);
      const rewardMessage = formatRewardMessage(result.reward);
      alert(`✅ ${result.message}\n\n현재 신뢰도: ${result.reliability_score}${rewardMessage ? `\n\n${rewardMessage}` : ''}`);
      await loadPin(); // 갱신된 신뢰도 및 인증 사진 다시 로드
      setActiveTab('verify'); // 인증 완료 후 인증 탭으로 이동하여 결과 및 사진 확인
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : '인증 처리에 실패했습니다.';
      setVerifyError(errMsg);
      alert(`⚠️ 인증 불가 안내:\n${errMsg}`);
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
        <Header title="숨은 좌표 상세" showBack={true} />
        <p className={styles.stateText}>숨은 좌표를 불러오는 중...</p>
      </main>
    );
  }

  if (error || !pin) {
    return (
      <main className={styles.main}>
        <Header title="숨은 좌표 상세" showBack={true} />
        <p className={styles.errorText}>{error || '숨은 좌표를 찾을 수 없습니다.'}</p>
      </main>
    );
  }

  const photo = pin.photos[0];
  const isVerified = pin.photos.some((p) => p.is_validated);
  const experienceTags = pin.tags.filter((t) => !t.is_danger).map((t) => `#${t.name}`);
  const cautionTags = pin.tags.filter((t) => t.is_danger).map((t) => `#${t.name}`);

  // 인증 참여 유저들의 현장 사진 목록 구성
  const verificationPhotoItems = verificationsList
    .filter((v) => v.photo_url)
    .map((v) => ({
      photoUrl: resolvePhotoUrl(v.photo_url!),
      user: v.user?.nickname || '인증 유저',
      createdAt: formatDateTime(v.created_at),
    }));

  return (
    <main className={styles.main}>
      <Header title="숨은 좌표 상세" showBack={true} />
      <PinHeader title={pin.title} />

      <PinImageArea
        isVerified={isVerified}
        imageUrl={photo ? resolvePhotoUrl(photo.photo_url) : undefined}
      />

      {/* 3개 탭 네비게이션 */}
      <div className={styles.tabsContainer}>
        <button
          type="button"
          className={`${styles.tabButton} ${activeTab === 'map' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('map')}
        >
          📍 세부 위치
        </button>
        <button
          type="button"
          className={`${styles.tabButton} ${activeTab === 'description' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('description')}
        >
          📝 설명
        </button>
        <button
          type="button"
          className={`${styles.tabButton} ${activeTab === 'verify' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('verify')}
        >
          💚 인증 ({pin.verification_count})
        </button>
      </div>

      {/* 탭 1: 세부 위치 (카카오 지도 단독 노출) */}
      {activeTab === 'map' && (
        <div className={styles.tabContent}>
          <PinCoordCard
            latitude={pin.latitude}
            longitude={pin.longitude}
            spotTitle={pin.title}
            isBlurred={pin.is_blurred}
          />
        </div>
      )}

      {/* 탭 2: 설명 */}
      {activeTab === 'description' && (
        <div className={styles.tabContent}>
          <PinTags experienceTags={experienceTags} cautionTags={cautionTags} />
          
          <div className={styles.descriptionBox}>
            <h4 className={styles.descriptionTitle}>🌿 쉼표 상세 안내</h4>
            <p className={styles.descriptionBody}>{pin.description}</p>

            <div className={styles.metaRow}>
              <span>📅 최초 등록: {formatDateTime(pin.created_at)}</span>
              {pin.user?.nickname && <span>👤 작성자: {pin.user.nickname}</span>}
              {formatPhotoAgeNotice(photo?.exif_taken_at) && (
                <span>⏳ {formatPhotoAgeNotice(photo?.exif_taken_at)}</span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 탭 3: 인증 (인증 현황 및 유저 등록 현장 사진 갤러리) */}
      {activeTab === 'verify' && (
        <div className={styles.tabContent}>
          <PinVerifySummary
            reliabilityScore={pin.reliability_score}
            verificationCount={pin.verification_count}
            stillThereCount={pin.still_there_count}
            lastCheckedAt={pin.last_status_checked_at}
            createdAt={pin.created_at}
            verificationPhotos={verificationPhotoItems}
          />
        </div>
      )}

      {/* 하단 전 탭 공통 고정 액션 버튼 */}
      <PinActions onVerify={openVerifyModal} onNavigate={handleNavigate} />


      {/* 인증 모달 */}
      {verifyOpen && (
        <VerifyModal
          pinTitle={pin.title}
          submitting={verifying}
          error={verifyError}
          onSubmit={handleVerify}
          onClose={closeVerify}
        />
      )}

      {/* 실시간 길찾기 모달 (웹앱 내 출발지=내위치 카카오지도 연동) */}
      <DirectionsModal
        isOpen={directionsOpen}
        onClose={() => setDirectionsOpen(false)}
        destTitle={pin.title}
        destLat={pin.latitude}
        destLng={pin.longitude}
      />
    </main>
  );
}




