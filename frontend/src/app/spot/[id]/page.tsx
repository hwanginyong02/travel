'use client';

import React, { useState, useEffect } from 'react';
import { Header } from '@/components/ui/Header/Header';
import { SpotImageHeader } from '@/components/features/spot/SpotImageHeader';
import { SpotLocationCard } from '@/components/features/spot/SpotLocationCard';
import { SpotPinList } from '@/components/features/spot/SpotPinList';
import { SpotRegisterFab } from '@/components/features/spot/SpotRegisterFab';

import { getSpotDetails, TourSpot } from '@/api/spots';
import { getPinsBySpot, Pin, PinSort } from '@/api/pins';
import { formatTourApiText } from '@/utils/text';
import styles from './page.module.css';

export default function SpotPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = React.use(params);
  const id = resolvedParams.id;

  const [spot, setSpot] = useState<TourSpot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [pins, setPins] = useState<Pin[]>([]);
  const [pinSort, setPinSort] = useState<PinSort>('popular');
  const [pinsLoading, setPinsLoading] = useState(true);
  const [pinsError, setPinsError] = useState<string | null>(null);

  useEffect(() => {
    async function loadSpot() {
      try {
        setLoading(true);
        const data = await getSpotDetails(id);
        setSpot(data);
        setError(null);
      } catch (err) {
        console.error("Failed to load spot details:", err);
        setError("명소 정보를 불러오는데 실패했습니다.");
      } finally {
        setLoading(false);
      }
    }

    if (id) {
      loadSpot();
    }
  }, [id]);

  // 정렬이 바뀔 때마다 백엔드에 다시 요청합니다.
  useEffect(() => {
    if (!id) return;
    let active = true;

    async function loadPins() {
      try {
        setPinsLoading(true);
        const data = await getPinsBySpot(id, pinSort);
        if (!active) return;
        setPins(data);
        setPinsError(null);
      } catch (err) {
        if (!active) return;
        console.error("Failed to load pins:", err);
        setPinsError("숨은 포인트를 불러오는데 실패했습니다.");
      } finally {
        if (active) setPinsLoading(false);
      }
    }

    loadPins();
    return () => {
      active = false;
    };
  }, [id, pinSort]);


  if (loading) {
    return (
      <main className={styles.main}>
        <Header title="명소 상세" />
        <div className={styles.loadingContainer}>
          <p className={styles.loading}>명소 정보를 불러오는 중...</p>
        </div>
      </main>
    );
  }

  if (error || !spot) {
    return (
      <main className={styles.main}>
        <Header title="명소 상세" />
        <div className={styles.errorContainer}>
          <p className={styles.error}>{error || "명소를 찾을 수 없습니다."}</p>
        </div>
      </main>
    );
  }

  const categoryText = spot.cat2 === 'A0101' ? '자연관광지' : spot.cat2 === 'A0102' ? '관광자원' : '자연 명소';
  const addressText = `${categoryText} · 위도 ${spot.mapy.toFixed(4)}, 경도 ${spot.mapx.toFixed(4)}`;

  const introFields = [
    { label: '📞 문의 및 안내', value: formatTourApiText(spot.intro_info?.infocenter) },
    { label: '🚗 주차 시설', value: formatTourApiText(spot.intro_info?.parking) },
    { label: '📅 쉬는날', value: formatTourApiText(spot.intro_info?.restdate) },
    { label: '🕒 이용시간', value: formatTourApiText(spot.intro_info?.usetime) },
    { label: '👶 유모차 대여', value: formatTourApiText(spot.intro_info?.chkbabycarriage) },
  ].filter(f => f.value && f.value.trim() && f.value.trim() !== '없음' && f.value.trim() !== '0');

  const formattedOverview = formatTourApiText(spot.overview);

  return (
    <main className={styles.main}>
      <Header title="명소 상세" />

      <SpotImageHeader
        title={spot.title}
        address={addressText}
        imageUrl={spot.firstimage}
      />

      {/* Description section */}
      <div className={styles.descriptionSection}>
        <h3 className={styles.sectionTitle}>🌿 명소 소개</h3>
        <p className={styles.descriptionText}>
          {formattedOverview || "상세 정보가 아직 등록되지 않았습니다."}
        </p>

        {/* Detailed Intro Info List */}
        {introFields.length > 0 && (
          <div className={styles.introInfoWrapper}>
            <div className={styles.infoList}>
              {introFields.map((field, idx) => (
                <div key={idx} className={styles.infoRow}>
                  <div className={styles.infoLabel}>
                    <strong>{field.label}</strong>
                  </div>
                  <div className={styles.infoValue}>
                    {field.value}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 명소 세부 위치 및 길 찾기 섹션 */}
      <SpotLocationCard
        title={spot.title}
        latitude={spot.mapy}
        longitude={spot.mapx}
      />

      <SpotPinList

        totalCount={spot.pins_count}
        pins={pins}
        sort={pinSort}
        onSortChange={setPinSort}
        loading={pinsLoading}
        error={pinsError}
      />

      <SpotRegisterFab spotId={String(spot.id)} />
    </main>
  );
}

