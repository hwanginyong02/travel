import React from 'react';
import styles from './PrivacyConsent.module.css';

interface PrivacyConsentProps {
  agreeTerms: boolean;
  agreeAge: boolean;
  onChangeTerms: (checked: boolean) => void;
  onChangeAge: (checked: boolean) => void;
}

export const PrivacyConsent: React.FC<PrivacyConsentProps> = ({
  agreeTerms,
  agreeAge,
  onChangeTerms,
  onChangeAge,
}) => {
  return (
    <div className={styles.consentSection}>
      <div className={styles.consentBox}>
        <p className={styles.consentInfoTitle}>🛡️ 개인정보 수집 및 이용 고지</p>
        <ul className={styles.consentInfoList}>
          <li><strong>수집 항목:</strong> 닉네임, 성별, 연령대</li>
          <li><strong>이용 목적:</strong> 개인별 자연 맞춤형 명소 추천</li>
          <li><strong>보유 및 이용 기간:</strong> 회원 탈퇴 시 즉시 영구 파기</li>
        </ul>
      </div>

      <div className={styles.checkboxWrapper}>
        <input
          type="checkbox"
          id="agreeTerms"
          checked={agreeTerms}
          onChange={(e) => onChangeTerms(e.target.checked)}
          className={styles.checkbox}
        />
        <label htmlFor="agreeTerms" className={styles.checkboxLabel}>
          개인정보 수집 및 이용 동의 (필수)
        </label>
      </div>

      <div className={styles.checkboxWrapper}>
        <input
          type="checkbox"
          id="agreeAge"
          checked={agreeAge}
          onChange={(e) => onChangeAge(e.target.checked)}
          className={styles.checkbox}
        />
        <label htmlFor="agreeAge" className={styles.checkboxLabel}>
          만 14세 이상 이용 동의 (필수)
        </label>
      </div>
    </div>
  );
};

export default PrivacyConsent;
