import React from 'react';
import { Badge } from '@/components/ui/Badge/Badge';
import { Button } from '@/components/ui/Button/Button';
import styles from './page.module.css';

export default function PinPage({ params }: { params: { id: string } }) {
  return (
    <main className={styles.main}>
      <header className={styles.header}>
        <h2>청계산 '산스장' 비밀 전망대</h2>
      </header>

      <div className={styles.imageArea}>
        <div className={styles.verifiedBadge}>
          <Badge variant="verified">✓ 검증 완료</Badge>
        </div>
        <div className={styles.dummyImage}>📸 전망대 뷰 사진</div>
      </div>

      <div className={styles.section}>
        <h3>경험 태그</h3>
        <div className={styles.tags}>
          <Badge variant="experience">#인생샷포인트</Badge>
          <Badge variant="experience">#산스장</Badge>
        </div>
        
        <h3 style={{ marginTop: '16px' }}>주의 태그</h3>
        <div className={styles.tags}>
          <Badge variant="caution">#가파른경사</Badge>
        </div>
      </div>

      <div className={styles.section}>
        <h3>세부 좌표</h3>
        <div className={styles.coordCard}>
          <div className={styles.miniMap}>지도</div>
          <div className={styles.coordInfo}>
            <p className={styles.coordText}>좌표: 37.4521° N, 127.0234° E</p>
            <p className={styles.desc}>설명: 청계산 등산로 초입에서 약 20분 거리, 바위 쉼터 옆</p>
            <p className={styles.date}>등록 시간: 2024.08.15 11:30</p>
          </div>
        </div>
      </div>

      <div className={styles.actionButtons}>
        <Button variant="outline" fullWidth>🧭 길 찾기</Button>
        <Button variant="primary" fullWidth>✓ 인증하기</Button>
      </div>
    </main>
  );
}
