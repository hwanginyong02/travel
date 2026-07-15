'use client';

import React from 'react';
import styles from './SearchBar.module.css';

interface SearchBarProps {
  query: string;
  onQueryChange: (q: string) => void;
  onClear: () => void;
}

export function SearchBar({ query, onQueryChange, onClear }: SearchBarProps) {
  return (
    <div className={styles.searchBarWrapper}>
      <span className={styles.searchIcon}>🔍</span>
      <input
        type="text"
        placeholder="자연 명소, 태그, 주소 검색..."
        value={query}
        onChange={(e) => onQueryChange(e.target.value)}
        className={styles.searchInput}
      />
      {query && (
        <button className={styles.clearButton} onClick={onClear}>
          ✕
        </button>
      )}
    </div>
  );
}
