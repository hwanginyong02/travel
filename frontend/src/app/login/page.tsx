'use client';

import React from 'react';
import { AuthLogo } from '@/components/features/auth/AuthLogo';
import { SocialLoginButtons } from '@/components/features/auth/SocialLoginButtons';
import styles from './page.module.css';

export default function LoginPage() {

  const handleGoogleLogin = () => {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '';
    const redirectUri = `${window.location.origin}/auth/callback/google`;
    const scope = 'openid email profile';
    const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=token&scope=${encodeURIComponent(scope)}`;
    window.location.href = googleAuthUrl;
  };

  const handleKakaoLogin = () => {
    const clientId = process.env.NEXT_PUBLIC_KAKAO_REST_API_KEY || '';
    const redirectUri = `${window.location.origin}/auth/callback/kakao`;
    const kakaoAuthUrl = `https://kauth.kakao.com/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code`;
    window.location.href = kakaoAuthUrl;
  };

  return (
    <main className={styles.main}>
      <div className={styles.container}>
        {/* 1. Auth Logo Component */}
        <AuthLogo />

        {/* 2. Social Login Buttons Component */}
        <SocialLoginButtons 
          onGoogleLogin={handleGoogleLogin} 
          onKakaoLogin={handleKakaoLogin} 
        />
      </div>
    </main>
  );
}
