import React from 'react';
import styles from './SpotImageHeader.module.css';

interface SpotImageHeaderProps {
  title: string;
  address: string;
}

export const SpotImageHeader: React.FC<SpotImageHeaderProps> = ({ title, address }) => {
  return (
    <div className={styles.imageHeader}>
      <h2 className={styles.title}>{title}</h2>
      <p className={styles.address}>{address}</p>
    </div>
  );
};

export default SpotImageHeader;
