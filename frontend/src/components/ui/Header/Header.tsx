'use client';

import React from 'react';
import styles from './Header.module.css';

interface HeaderProps {
  title: string;
  onBack?: () => void;
  showBack?: boolean;
  rightAction?: React.ReactNode;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  onBack,
  showBack = true,
  rightAction,
}) => {
  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      window.history.back();
    }
  };

  return (
    <header className={styles.header}>
      {showBack ? (
        <button onClick={handleBack} className={styles.backButton} aria-label="뒤로가기">
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
      ) : (
        <div className={styles.placeholder} />
      )}
      
      <h1 className={styles.title}>{title}</h1>
      
      {rightAction ? (
        <div className={styles.rightAction}>{rightAction}</div>
      ) : (
        <div className={styles.placeholder} />
      )}
    </header>
  );
};

export default Header;
