'use client';

import React from 'react';
import styles from './PinHeader.module.css';

interface PinHeaderProps {
  title: string;
}

export default function PinHeader({ title }: PinHeaderProps) {
  return (
    <header className={styles.header}>
      <h2>{title}</h2>
    </header>
  );
}
