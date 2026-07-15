import React from 'react';
import styles from './Badge.module.css';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'experience' | 'caution' | 'verified';
  onClick?: () => void;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  onClick,
  className = '',
}) => {
  const badgeClass = `${styles.badge} ${styles[variant]} ${onClick ? styles.interactive : ''} ${className}`;
  return (
    <span onClick={onClick} className={badgeClass}>
      {children}
    </span>
  );
};
export default Badge;
