'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styles from './BottomNavigation.module.css';

export const BottomNavigation: React.FC = () => {
  const pathname = usePathname();

  const navItems = [
    { name: 'Home', path: '/', icon: '🏠' },
    { name: 'Search', path: '/search', icon: '🔍' },
    { name: 'My Activity', path: '/mypage', icon: '📊' },
    { name: 'Profile', path: '/profile', icon: '👤' },
  ];

  return (
    <nav className={styles.nav}>
      {navItems.map((item) => {
        const isActive = pathname === item.path || (item.path !== '/' && pathname.startsWith(item.path));
        return (
          <Link key={item.name} href={item.path} className={`${styles.item} ${isActive ? styles.active : ''}`}>
            <span className={styles.icon}>{item.icon}</span>
            <span>{item.name}</span>
          </Link>
        );
      })}
    </nav>
  );
};
