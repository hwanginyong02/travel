'use client';

import React, { useState, useEffect } from 'react';
import styles from './page.module.css';
import MapSearchHeader from '@/components/features/home/MapSearchHeader';
import KakaoMapView, { MapMarkerData } from '@/components/features/home/KakaoMapView';
import { searchSpots } from '@/api/spots';

const DEFAULT_CENTER = { lat: 37.566826, lng: 126.978656 };

export default function Home() {
  const [center, setCenter] = useState(DEFAULT_CENTER);
  const [markers, setMarkers] = useState<MapMarkerData[]>([]);
  const [selectedTag, setSelectedTag] = useState('all');
  const [level, setLevel] = useState(7);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);


  const [currentBounds, setCurrentBounds] = useState<{ minLat: number; maxLat: number; minLng: number; maxLng: number } | null>(null);

  // Fetch user's current GPS position on mount
  useEffect(() => {
    if (typeof window !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          console.log("User GPS Location:", latitude, longitude);
          const coords = { lat: latitude, lng: longitude };
          setCenter(coords);
          setUserLocation(coords);
        },
        (error) => {
          console.warn("GPS access denied/failed, falling back to Seoul City Hall:", error);
          setCenter(DEFAULT_CENTER);
        },
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
      );
    }
  }, []);

  // Fetch spots when selectedTag or currentBounds changes
  useEffect(() => {
    let active = true;
    
    async function loadMapSpots() {
      const boundsParams = currentBounds || undefined;
      try {
        const cat3Filter = selectedTag === 'all' ? undefined : selectedTag;
        
        // 지도 영역 경계를 기반으로 최대 1000개 명소를 가져옵니다.
        const spots = await searchSpots('', 1000, false, cat3Filter, boundsParams);
        
        if (!active) return;
        
        const mapped = spots.map(spot => ({
          id: spot.id,
          lat: spot.mapy,
          lng: spot.mapx,
          label: spot.title,
        }));

        setMarkers(mapped);
      } catch (err) {
        console.error("Failed to load spots for map:", err);
      }
    }

    // 300ms 디바운스를 적용하여 조작(줌/드래그)이 끝난 뒤에 한번에 호출하도록 처리
    const timer = setTimeout(() => {
      loadMapSpots();
    }, 300);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [selectedTag, currentBounds]);

  // Compass click handler to re-center to user's location
  const handleCompassClick = () => {
    if (userLocation) {
      setCenter({ ...userLocation });
    } else {
      if (typeof window !== 'undefined' && navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const { latitude, longitude } = position.coords;
            const coords = { lat: latitude, lng: longitude };
            setCenter(coords);
            setUserLocation(coords);
          },
          () => {
            setCenter(DEFAULT_CENTER);
          }
        );
      } else {
        setCenter(DEFAULT_CENTER);
      }
    }
  };

  return (
    <main className={styles.main}>
      <MapSearchHeader 
        selectedTag={selectedTag}
        onSelectTag={setSelectedTag}
      />

      <div className={styles.mapContainer}>
        {/* Floating Compass Button (SVG Needle) */}
        <button 
          onClick={handleCompassClick} 
          className={styles.compassBtn}
          title="내 위치 정렬"
        >
          <svg viewBox="0 0 100 100" width="100%" height="100%">
            <polygon points="50,10 60,50 50,42" fill="#ef4444" />
            <polygon points="50,10 40,50 50,42" fill="#dc2626" />
            <polygon points="50,90 60,50 50,58" fill="#e5e7eb" />
            <polygon points="50,90 40,50 50,58" fill="#d1d5db" />
          </svg>
        </button>

        {/* Floating Zoom Controls (+/-) */}
        <div className={styles.zoomControls}>
          <button 
            onClick={() => setLevel(prev => Math.max(1, prev - 1))} 
            className={styles.zoomBtn}
            title="확대"
          >
            +
          </button>
          <button 
            onClick={() => setLevel(prev => Math.min(14, prev + 1))} 
            className={styles.zoomBtn}
            title="축소"
          >
            −
          </button>
        </div>


        <KakaoMapView
          center={center}
          level={level}
          markers={markers}
          onBoundsChange={setCurrentBounds}
        />
      </div>
    </main>
  );
}


