'use client';

import React, { useState } from 'react';
import { Badge } from '@/components/ui/Badge/Badge';
import styles from './TagSelector.module.css';

const DEFAULT_TAGS = ['#물멍벤치', '#피톤치드', '#인생샷포인트', '#조용한곳'];

export default function TagSelector() {
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [customTag, setCustomTag] = useState('');

  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter((t) => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && customTag.trim()) {
      const formatted = customTag.startsWith('#') ? customTag.trim() : `#${customTag.trim()}`;
      if (!selectedTags.includes(formatted)) {
        setSelectedTags([...selectedTags, formatted]);
      }
      setCustomTag('');
    }
  };

  return (
    <div className={styles.section}>
      <h3>2. 경험 태그 선택 (다중 선택)</h3>
      <div className={styles.tags}>
        {DEFAULT_TAGS.map((tag) => {
          const isSelected = selectedTags.includes(tag);
          return (
            <div 
              key={tag} 
              onClick={() => toggleTag(tag)} 
              className={`${styles.tagWrapper} ${isSelected ? styles.selected : ''}`}
            >
              <Badge variant="experience">{tag}</Badge>
            </div>
          );
        })}
        {selectedTags.filter(t => !DEFAULT_TAGS.includes(t)).map((tag) => (
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
        placeholder="직접 입력 후 Enter(선택)" 
        value={customTag}
        onChange={(e) => setCustomTag(e.target.value)}
        onKeyDown={handleKeyPress}
        className={styles.input} 
      />
    </div>
  );
}
