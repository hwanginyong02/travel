import React from 'react';
import styles from './SpotImageHeader.module.css';

interface SpotImageHeaderProps {
  title: string;
  address: string;
  imageUrl?: string;
}

export const SpotImageHeader: React.FC<SpotImageHeaderProps> = ({ title, address, imageUrl }) => {
  const style = imageUrl ? {
    backgroundImage: `linear-gradient(to bottom, rgba(0,0,0,0.1) 40%, rgba(0,0,0,0.7) 100%), url(${imageUrl})`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
  } : {};

  return (
    <div className={styles.imageHeader} style={style}>
      <h2 className={styles.title}>{title}</h2>
      <p className={styles.address}>{address}</p>
    </div>
  );
};


export default SpotImageHeader;
