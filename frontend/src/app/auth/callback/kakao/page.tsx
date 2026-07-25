'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { socialLogin } from '@/api/auth';

export default function KakaoCallback() {
  const router = useRouter();
  const [errorMsg, setErrorMsg] = useState<string>('');

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const code = searchParams.get('code');

    if (code) {
      const redirectUri = `${window.location.origin}/auth/callback/kakao`;

      socialLogin('kakao', undefined, code, redirectUri)
        .then((resp) => {
          if (resp.is_new) {
            localStorage.setItem('temp_token', resp.access_token);
            if (resp.social_nickname) {
              localStorage.setItem('social_nickname', resp.social_nickname);
            }
            router.push('/register');
          } else {
            localStorage.setItem('access_token', resp.access_token);
            router.push('/');
          }
        })
        .catch((err: any) => {
          console.error('Kakao login callback error:', err);
          setErrorMsg(err.message || '카카오 로그인 처리 중 에러가 발생했습니다.');
        });
    } else {
      router.push('/login');
    }
  }, [router]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#F7F5F0', padding: '20px', textAlign: 'center' }}>
      {errorMsg ? (
        <div>
          <p style={{ fontSize: '18px', fontWeight: 700, color: '#ef4444', marginBottom: '10px' }}>⚠️ 로그인 오류</p>
          <p style={{ fontSize: '14px', color: '#4b5563', whiteSpace: 'pre-wrap', marginBottom: '20px' }}>{errorMsg}</p>
          <button
            onClick={() => router.push('/login')}
            style={{ padding: '10px 20px', backgroundColor: '#1a1a1a', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}
          >
            로그인 화면으로 돌아가기
          </button>
        </div>
      ) : (
        <p style={{ fontSize: '16px', fontWeight: 600, color: '#2A5C43' }}>카카오 로그인을 처리 중입니다...</p>
      )}
    </div>
  );
}

