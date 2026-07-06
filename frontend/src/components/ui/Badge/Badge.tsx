import React from 'react';
import styles from './Badge.module.css';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'experience' | 'caution' | 'verified';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({ 
  children, 
  variant = 'experience',
  className
}) => {
  const classes = [
    styles.badge,
    styles[variant],
    className || ''
  ].join(' ').trim();

  return (
    <span className={classes}>
      {children}
    </span>
  );
};
