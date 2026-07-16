'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { checkNickname, register } from '@/api/auth';
import { NicknameForm } from '@/components/features/auth/NicknameForm';
import { GenderSelector } from '@/components/features/auth/GenderSelector';
import { AgeGroupSelector } from '@/components/features/auth/AgeGroupSelector';
import { PrivacyConsent } from '@/components/features/auth/PrivacyConsent';
import styles from './page.module.css';

export default function RegisterPage() {
  const router = useRouter();
  const [tempToken, setTempToken] = useState<string>('');
  const [nickname, setNickname] = useState<string>('');
  const [isNicknameChecked, setIsNicknameChecked] = useState<boolean>(false);
  const [isNicknameAvailable, setIsNicknameAvailable] = useState<boolean>(false);
  const [nicknameMessage, setNicknameMessage] = useState<string>('');
  const [gender, setGender] = useState<string>('');
  const [ageGroup, setAgeGroup] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [agreeTerms, setAgreeTerms] = useState<boolean>(false);
  const [agreeAge, setAgreeAge] = useState<boolean>(false);

  useEffect(() => {
    // 소셜 로그인 완료 후 발급된 임시 회원가입용 토큰과 닉네임 정보를 로컬 스토리지에서 추출
    const token = localStorage.getItem('temp_token');
    const socialNick = localStorage.getItem('social_nickname');

    if (!token) {
      // 임시 토큰이 없으면 로그인 페이지로 강제 리다이렉트
      router.push('/login');
      return;
    }

    setTempToken(token);
    if (socialNick) {
      setNickname(socialNick);
    }
  }, [router]);

  // 닉네임 변경 시 중복 확인 체크 상태 초기화
  const handleNicknameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNickname(e.target.value);
    setIsNicknameChecked(false);
    setIsNicknameAvailable(false);
    setNicknameMessage('');
  };

  // 닉네임 중복 확인
  const handleCheckNickname = async () => {
    if (!nickname.trim()) {
      setNicknameMessage('닉네임을 입력해주세요.');
      return;
    }

    try {
      const resp = await checkNickname(nickname);
      setIsNicknameChecked(true);
      setIsNicknameAvailable(resp.available);
      setNicknameMessage(resp.message);
    } catch (err) {
      console.error('Failed to check nickname:', err);
      setNicknameMessage('닉네임 확인 중 오류가 발생했습니다.');
    }
  };

  // 회원가입 제출
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isNicknameAvailable) {
      setErrorMessage('닉네임 중복 확인이 필요합니다.');
      return;
    }
    if (!gender) {
      setErrorMessage('성별을 선택해주세요.');
      return;
    }
    if (!ageGroup) {
      setErrorMessage('연령대를 선택해주세요.');
      return;
    }
    if (!agreeTerms || !agreeAge) {
      setErrorMessage('필수 이용 동의 항목에 체크해야 합니다.');
      return;
    }

    try {
      setLoading(true);
      setErrorMessage('');

      const resp = await register(tempToken, nickname, gender, ageGroup);

      // 회원가입 성공 시 정식 토큰 저장 후 메인페이지로 이동
      localStorage.setItem('access_token', resp.access_token);
      localStorage.removeItem('temp_token');
      localStorage.removeItem('social_nickname');

      router.push('/');
    } catch (err: any) {
      console.error('Registration failed:', err);
      setErrorMessage(err.message || '회원가입 처리 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className={styles.main}>
      <div className={styles.container}>
        <div className={styles.header}>
          <h1 className={styles.title}>환영합니다!</h1>
          <p className={styles.subtitle}>간단한 회원 정보를 입력해주세요</p>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          {/* 1. Nickname Form Component */}
          <NicknameForm
            nickname={nickname}
            onChange={handleNicknameChange}
            onCheck={handleCheckNickname}
            isAvailable={isNicknameAvailable}
            message={nicknameMessage}
          />

          {/* 2. Gender Selector Component */}
          <GenderSelector
            gender={gender}
            onSelectGender={setGender}
          />

          {/* 3. Age Group Selector Component */}
          <AgeGroupSelector
            ageGroup={ageGroup}
            onChangeAgeGroup={setAgeGroup}
          />

          {/* 4. Privacy Consent Component */}
          <PrivacyConsent
            agreeTerms={agreeTerms}
            agreeAge={agreeAge}
            onChangeTerms={setAgreeTerms}
            onChangeAge={setAgreeAge}
          />

          {errorMessage && <p className={styles.mainErrorText}>{errorMessage}</p>}

          {/* 5. Submit Button */}
          <button
            type="submit"
            className={styles.submitBtn}
            disabled={loading || !isNicknameAvailable || !gender || !ageGroup || !agreeTerms || !agreeAge}
          >
            {loading ? '가입 중...' : '시작하기'}
          </button>
        </form>
      </div>
    </main>
  );
}
