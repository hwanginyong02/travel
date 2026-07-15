'use client';

import React from 'react';
import styles from './MapSearchHeader.module.css';

interface MapSearchHeaderProps {
  placeholder?: string;
}

export default function MapSearchHeader({
  placeholder = '자연 명소 검색...',
}: MapSearchHeaderProps) {
  return (
    <header className={styles.header}>
      <div className={styles.logo}>
        <span className={styles.logoIcon}>🌿</span>
        <span>TravelNature</span>
      </div>

      <div className={styles.searchWrapper}>
        <span className={styles.searchIcon}>🔍</span>
        <input
          type="text"
          placeholder={placeholder}
          className={styles.searchInput}
        />
      </div>
    </header>
  );
}
