'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    // Ensure we check for stringified 'undefined' or 'null' values which can happen during failed token saves
    const hasValidToken = token && token !== 'undefined' && token !== 'null' && token.trim() !== '';
    const isAuthRoute = pathname === '/login' || pathname === '/register' || pathname.startsWith('/auth/callback');

    console.log(`[AuthGuard] Path: ${pathname}, HasToken: ${!!hasValidToken}, Token: ${token}`);

    if (!hasValidToken && !isAuthRoute) {
      // 1. 토큰이 없는데 인증이 필요한 페이지에 진입한 경우 -> 로그인 페이지로 이동
      router.push('/login');
    } else if (hasValidToken && isAuthRoute) {
      // 2. 이미 로그인된 상태에서 로그인/회원가입/콜백 페이지에 진입한 경우 -> 홈으로 강제 이동
      router.push('/');
    } else {
      // 3. 정상 인증 상태이거나, 비인증 상태에서 허용된 로그인 페이지 등인 경우
      setLoading(false);
    }
  }, [pathname, router]);


  const isAuthRoute = pathname === '/login' || pathname === '/register' || pathname.startsWith('/auth/callback');

  // 로딩 중이거나 인증되지 않은 경로인 경우 화면 렌더링 차단 (보안 유지)
  if (loading && !isAuthRoute) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#F7F5F0' }}>
        <p style={{ color: '#2A5C43', fontWeight: 600, fontSize: '15px' }}>인증 상태를 확인 중입니다...</p>
      </div>
    );
  }

  return <>{children}</>;
}
