import React from 'react';
import styles from './GenderSelector.module.css';

interface GenderSelectorProps {
  gender: string;
  onSelectGender: (gender: string) => void;
}

export const GenderSelector: React.FC<GenderSelectorProps> = ({
  gender,
  onSelectGender,
}) => {
  return (
    <div className={styles.fieldSection}>
      <label className={styles.label}>성별</label>
      <div className={styles.chipContainer}>
        <button
          type="button"
          className={`${styles.chip} ${gender === 'male' ? styles.chipSelected : ''}`}
          onClick={() => onSelectGender('male')}
        >
          남성
        </button>
        <button
          type="button"
          className={`${styles.chip} ${gender === 'female' ? styles.chipSelected : ''}`}
          onClick={() => onSelectGender('female')}
        >
          여성
        </button>
      </div>
    </div>
  );
};

export default GenderSelector;
