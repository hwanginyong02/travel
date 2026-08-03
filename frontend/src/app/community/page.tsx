'use client';

import React, { useEffect, useState } from 'react';
import { Header } from '@/components/ui/Header/Header';
import HotSpotList, { HotSpot } from '@/components/features/community/HotSpotList';
import TopReviewList, { TopReview } from '@/components/features/community/TopReviewList';
import { fetchCommunityData } from '@/api/community';
import styles from './page.module.css';

export default function CommunityPage() {
  const [spots, setSpots] = useState<HotSpot[]>([]);
  const [reviews, setReviews] = useState<TopReview[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function loadCommunity() {
      try {
        setLoading(true);
        const data = await fetchCommunityData();
        setSpots(data.trendingSpots || []);
        setReviews(data.topReviews || []);
      } catch (err) {
        console.warn('Backend API connection warning:', err);
        setSpots([]);
        setReviews([]);
      } finally {
        setLoading(false);
      }
    }

    loadCommunity();
  }, []);

  return (
    <main className={styles.main}>
      <Header title="그린 커뮤니티" showBack={true} />

      <div className={styles.container}>
        {loading ? (
          <p className={styles.loadingText}>커뮤니티 데이터를 불러오는 중...</p>
        ) : (
          <>
            <HotSpotList spots={spots} />
            <TopReviewList reviews={reviews} />
          </>
        )}
      </div>
    </main>
  );
}



