import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button/Button';
import styles from './SpotRegisterFab.module.css';

interface SpotRegisterFabProps {
  spotId: string;
}

export const SpotRegisterFab: React.FC<SpotRegisterFabProps> = ({ spotId }) => {
  return (
    <div className={styles.fabContainer}>
      <Link href={`/pin/register?spotId=${spotId}`}>
        <Button variant="accent" className={styles.fab}>
          + 이 명소의 숨은 좌표 등록하기
        </Button>
      </Link>
    </div>
  );
};

export default SpotRegisterFab;
