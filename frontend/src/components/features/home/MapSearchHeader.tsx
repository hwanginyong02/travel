'use client';

import React from 'react';
import styles from './MapSearchHeader.module.css';

interface MapSearchHeaderProps {
  selectedTag: string;
  onSelectTag: (tag: string) => void;
}

const CATEGORY_TAGS = [
  { label: '🌿 전체', value: 'all' },
  { label: '⛰️ 산', value: 'A01010400' },
  { label: '🌊 계곡', value: 'A01010900' },
  { label: '🏖️ 해수욕장/해변', value: 'A01011200' },
  { label: '🏝️ 섬', value: 'A01011300' },
  { label: '🌳 자연휴양림', value: 'A01010600' },
];


export default function MapSearchHeader({
  selectedTag,
  onSelectTag,
}: MapSearchHeaderProps) {
  return (
    <div className={styles.tagContainer}>
      {CATEGORY_TAGS.map((tag) => (
        <button
          key={tag.value}
          onClick={() => onSelectTag(tag.value)}
          className={`${styles.tagChip} ${
            selectedTag === tag.value ? styles.tagChipActive : ''
          }`}
        >
          {tag.label}
        </button>
      ))}
    </div>
  );
}



