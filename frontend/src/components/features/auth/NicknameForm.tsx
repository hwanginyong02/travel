import React from 'react';
import styles from './NicknameForm.module.css';

interface NicknameFormProps {
  nickname: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onCheck: () => void;
  isAvailable: boolean;
  message: string;
}

export const NicknameForm: React.FC<NicknameFormProps> = ({
  nickname,
  onChange,
  onCheck,
  isAvailable,
  message,
}) => {
  return (
    <div className={styles.fieldSection}>
      <label className={styles.label}>사용할 닉네임</label>
      <div className={styles.nicknameWrapper}>
        <input
          type="text"
          value={nickname}
          onChange={onChange}
          placeholder="닉네임 입력"
          className={styles.input}
          maxLength={20}
        />
        <button
          type="button"
          onClick={onCheck}
          className={styles.checkBtn}
        >
          중복확인
        </button>
      </div>
      {message && (
        <p className={isAvailable ? styles.successText : styles.errorText}>
          {message}
        </p>
      )}
    </div>
  );
};

export default NicknameForm;
