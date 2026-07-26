'use client';

import React from 'react';
import styles from './PinInfoForm.module.css';

const TITLE_MAX = 60;
const DESCRIPTION_MAX = 1000;

interface PinInfoFormProps {
  title: string;
  description: string;
  onTitleChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
}

export default function PinInfoForm({
  title,
  description,
  onTitleChange,
  onDescriptionChange,
}: PinInfoFormProps) {
  return (
    <div className={styles.section}>
      <h3>4. 이 좌표 소개 (필수)</h3>

      <input
        type="text"
        value={title}
        maxLength={TITLE_MAX}
        onChange={(e) => onTitleChange(e.target.value)}
        placeholder="예) 물소리가 잘 들리는 나무 아래 벤치"
        className={styles.input}
      />
      <p className={styles.counter}>{title.length} / {TITLE_MAX}</p>

      <textarea
        value={description}
        maxLength={DESCRIPTION_MAX}
        onChange={(e) => onDescriptionChange(e.target.value)}
        placeholder="찾아가는 길, 좋았던 시간대, 주의할 점 등을 적어주세요."
        rows={4}
        className={styles.textarea}
      />
      <p className={styles.counter}>{description.length} / {DESCRIPTION_MAX}</p>
    </div>
  );
}
