import React from 'react';
import { Badge } from '@/components/ui/Badge/Badge';
import { Button } from '@/components/ui/Button/Button';
import styles from './page.module.css';

export default function PinRegisterPage() {
  return (
    <main className={styles.main}>
      <header className={styles.header}>
        <h2>[핀 등록] 숨은 좌표 등록하기</h2>
      </header>

      <div className={styles.section}>
        <h3>1. 현장 사진 첨부 (필수)</h3>
        <div className={styles.uploadArea}>
          <span className={styles.cameraIcon}>📷</span>
          <p>현장에서 즉시 촬영하거나<br/>앨범에서 사진 업로드</p>
        </div>
        <p className={styles.helperText}>* 업로드 시 사진 메타데이터(EXIF)를 읽어 위치 일치 여부를 검증합니다.</p>
      </div>

      <div className={styles.section}>
        <h3>2. 경험 태그 선택 (다중 선택)</h3>
        <div className={styles.tags}>
          <Badge variant="experience">#물멍벤치</Badge>
          <Badge variant="experience">#피톤치드</Badge>
          <Badge variant="experience">#인생샷포인트</Badge>
          <Badge variant="experience">#조용한곳</Badge>
        </div>
        <input type="text" placeholder="직접 입력(선택)" className={styles.input} />
      </div>

      <div className={styles.section}>
        <h3>3. 세부 좌표 (자동 입력)</h3>
        <div className={styles.miniMap}>
          📍 GPS 기반 자동 측정 (지도 영역)
        </div>
        <p className={styles.helperText}>* 환경 민감 지역은 좌표가 반경 500m 단위로 흐리게 표기될 수 있습니다.</p>
      </div>

      <div className={styles.bottomBar}>
        <Button variant="primary" fullWidth>+ 이 숨은 좌표 등록하기</Button>
      </div>
    </main>
  );
}
