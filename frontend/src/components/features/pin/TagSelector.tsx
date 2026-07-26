'use client';

import React, { useState } from 'react';
import { Badge } from '@/components/ui/Badge/Badge';
import styles from './TagSelector.module.css';

const DEFAULT_TAGS = ['#물멍벤치', '#피톤치드', '#인생샷포인트', '#조용한곳'];
const MAX_TAGS = 10;

interface TagSelectorProps {
  selectedTags: string[];
  onChange: (tags: string[]) => void;
}

export default function TagSelector({ selectedTags, onChange }: TagSelectorProps) {
  const [customTag, setCustomTag] = useState('');
  const isFull = selectedTags.length >= MAX_TAGS;

  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      onChange(selectedTags.filter((t) => t !== tag));
    } else if (!isFull) {
      onChange([...selectedTags, tag]);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== 'Enter' || !customTag.trim()) return;
    e.preventDefault();

    const formatted = customTag.startsWith('#') ? customTag.trim() : `#${customTag.trim()}`;
    if (!selectedTags.includes(formatted) && !isFull) {
      onChange([...selectedTags, formatted]);
    }
    setCustomTag('');
  };

  const customTags = selectedTags.filter((t) => !DEFAULT_TAGS.includes(t));

  return (
    <div className={styles.section}>
      <h3>2. 경험 태그 선택 (다중 선택)</h3>
      <div className={styles.tags}>
        {DEFAULT_TAGS.map((tag) => (
          <div
            key={tag}
            onClick={() => toggleTag(tag)}
            className={`${styles.tagWrapper} ${selectedTags.includes(tag) ? styles.selected : ''}`}
          >
            <Badge variant="experience">{tag}</Badge>
          </div>
        ))}
        {customTags.map((tag) => (
          <div
            key={tag}
            onClick={() => toggleTag(tag)}
            className={`${styles.tagWrapper} ${styles.selected}`}
          >
            <Badge variant="experience">{tag}</Badge>
          </div>
        ))}
      </div>
      <input
        type="text"
        placeholder={isFull ? `태그는 최대 ${MAX_TAGS}개까지 선택할 수 있습니다` : '직접 입력 후 Enter(선택)'}
        value={customTag}
        onChange={(e) => setCustomTag(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={isFull}
        className={styles.input}
      />
      <p className={styles.helperText}>* 절벽·계곡 등 위험 지형이 설명에 포함되면 주의 태그가 자동으로 붙습니다.</p>
    </div>
  );
}
