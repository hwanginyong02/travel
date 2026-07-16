import React from 'react';
import styles from './AgeGroupSelector.module.css';

interface AgeGroupSelectorProps {
  ageGroup: string;
  onChangeAgeGroup: (ageGroup: string) => void;
}

export const AgeGroupSelector: React.FC<AgeGroupSelectorProps> = ({
  ageGroup,
  onChangeAgeGroup,
}) => {
  return (
    <div className={styles.fieldSection}>
      <label className={styles.label}>연령대</label>
      <select
        value={ageGroup}
        onChange={(e) => onChangeAgeGroup(e.target.value)}
        className={styles.select}
      >
        <option value="">선택해주세요</option>
        <option value="10대">10대</option>
        <option value="20대">20대</option>
        <option value="30대">30대</option>
        <option value="40대">40대</option>
        <option value="50대 이상">50대 이상</option>
      </select>
    </div>
  );
};

export default AgeGroupSelector;
