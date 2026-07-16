import React from 'react';
import styles from './SocialLoginButtons.module.css';

interface SocialLoginButtonsProps {
  onGoogleLogin: () => void;
  onKakaoLogin: () => void;
}

export const SocialLoginButtons: React.FC<SocialLoginButtonsProps> = ({
  onGoogleLogin,
  onKakaoLogin,
}) => {
  return (
    <div className={styles.buttonArea}>
      <button className={styles.googleBtn} onClick={onGoogleLogin}>
        <svg className={styles.btnIcon} viewBox="0 0 24 24" width="20" height="20">
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
        </svg>
        Google 계정으로 로그인
      </button>
      <button className={styles.kakaoBtn} onClick={onKakaoLogin}>
        <svg className={styles.btnIcon} viewBox="0 0 24 24" width="20" height="20">
          <path d="M12 3C6.48 3 2 6.58 2 10.94c0 2.8 1.86 5.27 4.66 6.67-.15.56-.96 3.6-.99 3.83 0 0-.02.17.09.23.11.07.24.01.24.01.32-.04 3.7-2.44 4.28-2.85.55.08 1.13.12 1.72.12 5.52 0 10-3.58 10-7.94S17.52 3 12 3z" fill="#3C1E1E"/>
        </svg>
        Kakao 계정으로 로그인
      </button>
    </div>
  );
};

export default SocialLoginButtons;
