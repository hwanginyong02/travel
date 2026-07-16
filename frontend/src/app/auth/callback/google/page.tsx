'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { socialLogin } from '@/api/auth';

export default function GoogleCallback() {
  const router = useRouter();

  useEffect(() => {
    const hash = window.location.hash;
    if (hash) {
      const params = new URLSearchParams(hash.substring(1));
      const accessToken = params.get('access_token');

      if (accessToken) {
        socialLogin('google', accessToken)
          .then((resp) => {
            if (resp.is_new) {
              // 신규 회원이면 회원가입 데이터 임시 보관 후 회원가입창 이동
              localStorage.setItem('temp_token', resp.access_token);
              if (resp.social_nickname) {
                localStorage.setItem('social_nickname', resp.social_nickname);
              }
              router.push('/register');
            } else {
              // 기존 회원이면 로그인 처리 후 홈 이동
              localStorage.setItem('access_token', resp.access_token);
              router.push('/');
            }
          })
          .catch((err) => {
            console.error('Google login callback error:', err);
            router.push('/login?error=auth_failed');
          });
      } else {
        router.push('/login?error=no_token');
      }
    } else {
      router.push('/login');
    }
  }, [router]);

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#F7F5F0' }}>
      <p style={{ fontSize: '16px', fontWeight: 600, color: '#2A5C43' }}>구글 로그인을 처리 중입니다...</p>
    </div>
  );
}
