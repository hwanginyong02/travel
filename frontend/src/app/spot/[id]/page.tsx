import React from 'react';
import Link from 'next/link';
import { Badge } from '@/components/ui/Badge/Badge';
import { Button } from '@/components/ui/Button/Button';
import styles from './page.module.css';

export default function SpotPage({ params }: { params: { id: string } }) {
  return (
    <main className={styles.main}>
      <div className={styles.imageHeader}>
        <h1>남산공원 (Namsan Park)</h1>
        <p>서울특별시 중구 회현동1가</p>
      </div>

      <div className={styles.content}>
        <h2>이 명소의 숨은 포인트 (75개)</h2>
        <div className={styles.filters}>
          <Badge>⭐ 인기순</Badge>
          <Badge>🕒 최신순</Badge>
          <Badge>📍 거리순</Badge>
        </div>

        <ul className={styles.pinList}>
          <li className={styles.pinCard}>
            <div className={styles.pinImage}>📸</div>
            <div className={styles.pinInfo}>
              <div className={styles.tags}>
                <Badge variant="experience">#야경명소</Badge>
                <Badge variant="experience">#연인과함께</Badge>
              </div>
              <p>User: 야경꾼 / 등록: 1일 전</p>
            </div>
            <Link href="/pin/1" className={styles.linkOverlay}></Link>
          </li>
          <li className={styles.pinCard}>
            <div className={styles.pinImage}>📸</div>
            <div className={styles.pinInfo}>
              <div className={styles.tags}>
                <Badge variant="experience">#조용한소</Badge>
                <Badge variant="experience">#물멍벤치</Badge>
              </div>
              <p>User: 힐링맨 / 등록: 5일 전</p>
            </div>
            <Link href="/pin/2" className={styles.linkOverlay}></Link>
          </li>
        </ul>
      </div>

      <div className={styles.fabContainer}>
        <Link href="/pin/register">
          <Button variant="accent" className={styles.fab}>+ 이 명소의 숨은 좌표 등록하기</Button>
        </Link>
      </div>
    </main>
  );
}
