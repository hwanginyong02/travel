'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/ui/Header/Header';
import DirectionsModal from '@/components/features/pin/DirectionsModal';
import { fetchCommunityFeed, FeedPinItem } from '@/api/community';
import styles from './page.module.css';

export default function CommunityFeedPage() {
  const router = useRouter();
  const [mode, setMode] = useState<'random' | 'latest'>('random');
  const [feedItems, setFeedItems] = useState<FeedPinItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 좋아요 상태 관리 (로컬 UI)
  const [likedPins, setLikedPins] = useState<Record<number, boolean>>({});

  // 길찾기 모달 관리
  const [activeNavPin, setActiveNavPin] = useState<{ title: string; lat: number; lng: number } | null>(null);

  useEffect(() => {
    let active = true;

    async function loadFeed() {
      try {
        setLoading(true);
        const items = await fetchCommunityFeed(mode);
        if (!active) return;
        setFeedItems(items);
        setError(null);
      } catch (err) {
        if (!active) return;
        console.error('Failed to load community feed:', err);
        setError('피드 데이터를 불러오는데 실패했습니다.');
      } finally {
        if (active) setLoading(false);
      }
    }

    loadFeed();
    return () => {
      active = false;
    };
  }, [mode]);

  const toggleLike = (pinId: number) => {
    setLikedPins((prev) => ({
      ...prev,
      [pinId]: !prev[pinId],
    }));
  };

  return (
    <main className={styles.main}>
      <Header title="쉼표 탐색 피드" showBack={true} />

      <div className={styles.container}>
        {/* 모드 필터 (랜덤 탐색 vs 최신순) */}
        <div className={styles.filterRow}>
          <span className={styles.filterTitle}>✨ 쉼표 피드 탐색</span>
          <div className={styles.filterPills}>
            <button
              className={`${styles.filterPill} ${mode === 'random' ? styles.activePill : ''}`}
              onClick={() => setMode('random')}
            >
              🎲 랜덤 탐색
            </button>
            <button
              className={`${styles.filterPill} ${mode === 'latest' ? styles.activePill : ''}`}
              onClick={() => setMode('latest')}
            >
              ⚡ 최신순
            </button>
          </div>
        </div>

        {loading && <p className={styles.stateText}>인스타그램 피드를 불러오는 중...</p>}
        {error && <p className={styles.stateText}>{error}</p>}

        {!loading && !error && feedItems.length === 0 && (
          <p className={styles.stateText}>등록된 쉼표 피드가 아직 없습니다.</p>
        )}

        {!loading && !error && (
          <div className={styles.feedList}>
            {feedItems.map((item) => {
              const isLiked = likedPins[item.id] || false;

              return (
                <article key={item.id} className={styles.feedCard}>
                  {/* 카드의 작성자 정보 헤더 */}
                  <div className={styles.cardHeader}>
                    <div className={styles.authorMeta}>
                      <div
                        className={styles.authorAvatar}
                        style={{ backgroundImage: `url(${item.userAvatar})` }}
                      />
                      <div className={styles.authorInfo}>
                        <div className={styles.nameRow}>
                          <span className={styles.authorName}>{item.userName}</span>
                          <span className={styles.levelBadge}>Lv.{item.userLevel}</span>
                        </div>
                        <span className={styles.postDate}>{item.createdAt}</span>
                      </div>
                    </div>

                    {item.spotId ? (
                      <Link href={`/spot/${item.spotId}`} className={styles.spotPill}>
                        📍 {item.spotName}
                      </Link>
                    ) : (
                      <span className={styles.spotPill}>📍 {item.spotName}</span>
                    )}
                  </div>

                  {/* 피드 고화질 대표 미디어 */}
                  <div
                    className={styles.cardMedia}
                    style={{ backgroundImage: `url(${item.photoUrl})` }}
                    onClick={() => router.push(`/pin/${item.id}`)}
                  >
                    <span className={styles.mediaOverlay}>터치하여 상세보기</span>
                  </div>

                  {/* 액션 버튼 행 (좋아요, 인증수, 신뢰도, 길찾기) */}
                  <div className={styles.actionRow}>
                    <div className={styles.leftActions}>
                      <button
                        className={`${styles.likeBtn} ${isLiked ? styles.liked : ''}`}
                        onClick={() => toggleLike(item.id)}
                      >
                        {isLiked ? '❤️' : '🤍'} {isLiked ? '추천됨' : '좋아요'}
                      </button>

                      <div className={styles.badgeGroup}>
                        <span className={styles.verifiedBadge}>👍 {item.verifiedCount}명 인증</span>
                        <span className={styles.scoreBadge}>💯 {item.reliabilityScore}점</span>
                      </div>
                    </div>

                    <button
                      className={styles.directionsBtn}
                      onClick={() =>
                        setActiveNavPin({
                          title: item.title,
                          lat: item.latitude,
                          lng: item.longitude,
                        })
                      }
                    >
                      🧭 길 찾기
                    </button>
                  </div>

                  {/* 본문 타이틀 & 설명 */}
                  <div className={styles.cardContent}>
                    <Link href={`/pin/${item.id}`} className={styles.pinTitleLink}>
                      <h3 className={styles.pinTitle}>{item.title}</h3>
                    </Link>

                    {item.tags.length > 0 && (
                      <div className={styles.tagRow}>
                        {item.tags.map((t, idx) => (
                          <span key={idx} className={styles.tagPill}>
                            {t}
                          </span>
                        ))}
                      </div>
                    )}

                    <p className={styles.pinDesc}>{item.description}</p>

                    <Link href={`/pin/${item.id}`} className={styles.detailLink}>
                      자세히 보기 & 현장 인증하기 &gt;
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>

      {/* 길찾기 모달 */}
      <DirectionsModal
        isOpen={Boolean(activeNavPin)}
        onClose={() => setActiveNavPin(null)}
        destTitle={activeNavPin?.title || ''}
        destLat={activeNavPin?.lat || 0}
        destLng={activeNavPin?.lng || 0}
      />
    </main>
  );
}
