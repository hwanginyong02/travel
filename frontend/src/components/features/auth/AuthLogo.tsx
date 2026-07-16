import React from 'react';
import styles from './AuthLogo.module.css';

interface AuthLogoProps {
  subtitle?: string;
}

export const AuthLogo: React.FC<AuthLogoProps> = ({ subtitle }) => {
  return (
    <div className={styles.logoArea}>
      <div className={styles.logoIcon}>
        <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M24 4C18 4 8 14 8 24C8 30 12 36 16 40L24 48L32 40C36 36 40 30 40 24C40 14 30 4 24 4Z" fill="#2A5C43" />
          <path d="M24 14C20 14 16 18 16 22C16 26 20 30 24 34C28 30 32 26 32 22C32 18 28 14 24 14Z" fill="#4CAF50" />
          <circle cx="24" cy="22" r="4" fill="white" />
        </svg>
      </div>
      <h1 className={styles.appName}>산따라 강따라</h1>
      {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
    </div>
  );
};

export default AuthLogo;
