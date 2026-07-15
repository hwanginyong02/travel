'use client';

import React from 'react';
import styles from './AccountActions.module.css';

interface AccountActionsProps {
  onLogout: () => void;
  onWithdraw: () => void;
}

export const AccountActions: React.FC<AccountActionsProps> = ({
  onLogout,
  onWithdraw,
}) => {
  return (
    <section className={styles.section}>
      <div className={styles.accountActionContainer}>
        <button className={styles.logoutButton} onClick={onLogout}>
          로그아웃
        </button>
        <div className={styles.divider} />
        <button className={styles.withdrawButton} onClick={onWithdraw}>
          회원탈퇴
        </button>
      </div>
    </section>
  );
};
