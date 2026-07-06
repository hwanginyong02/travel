import React from 'react';
import styles from './page.module.css';

export default function Home() {
  return (
    <main className={styles.main}>
      <header className={styles.header}>
        <input type="text" placeholder="자연 명소 검색..." className={styles.searchInput} />
      </header>
      
      <div className={styles.mapContainer}>
        <div className={styles.dummyMap}>
          🗺️ 베이스 맵 영역 (카카오맵 / 네이버지도)
          <div className={styles.dummyMarker} style={{ top: '30%', left: '40%' }}>북한산 국립공원</div>
          <div className={styles.dummyMarker} style={{ top: '60%', left: '60%' }}>남산공원</div>
        </div>
      </div>
    </main>
  );
}
