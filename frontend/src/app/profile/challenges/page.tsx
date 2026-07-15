import React from 'react';
import { Header } from '@/components/ui/Header/Header';
import styles from './page.module.css';

// 챌린지 상세 가상 데이터
const CHALLENGE_LIST = [
  {
    id: 1,
    title: '이번 달 단풍 좌표 10곳 인증',
    category: '시즌별 챌린지',
    reward: '단풍마스터 뱃지 + 500 P',
    progress: '7/10 달성 중',
    progressValue: 70,
    desc: '단풍이 피기 시작하는 10월 한 달 동안, 가을 경치가 좋은 산악 및 숲길 코스의 핀들을 10회 이상 직접 방문하고 GPS가 일치하는 사진을 통해 상태를 업로드해 인증하세요.',
    endDate: '마감: 2026.10.31',
    isCompleted: false,
  },
  {
    id: 2,
    title: '새로운 산스장 핀 등록',
    category: '일일 미션',
    reward: '150 P',
    progress: '완료',
    progressValue: 100,
    desc: '야외 체육시설(일명 산스장)이 있는 등산로 상의 정확한 명당 좌표를 오늘 안으로 사진과 함께 신규 등록해 주세요. 등록 즉시 EXIF 데이터 분석 검증이 실행됩니다.',
    endDate: '마감: 오늘 23:59',
    isCompleted: true,
  },
  {
    id: 3,
    title: '계곡 물 맑음 현황 보고',
    category: '일일 미션',
    reward: '50 P',
    progress: '0/1 달성 중',
    progressValue: 0,
    desc: '주변에 있는 계곡물 물멍 핀 중 최근 1주일간 컨디션 리포트가 올라오지 않은 핀을 찾아, "지금 물 수위와 혼잡도"를 리포트해 주세요.',
    endDate: '마감: 오늘 23:59',
    isCompleted: false,
  },
];

export default function ChallengesPage() {
  const completedChallenges = CHALLENGE_LIST.filter(c => c.isCompleted);
  const activeChallenges = CHALLENGE_LIST.filter(c => !c.isCompleted);

  return (
    <main className={styles.main}>
      <Header title="진행 챌린지 & 미션" />
      
      <div className={styles.container}>
        <div className={styles.introCard}>
          <h3>🌱 친환경 챌린지 시스템</h3>
          <p>공모전 챌린지에 참여하면 자연 훼손 방지에 앞장설 뿐 아니라 더 높은 힐링 등급과 뱃지를 얻을 수 있습니다.</p>
        </div>

        {/* 1. 진행 중인 챌린지 */}
        <section className={styles.challengeSection}>
          <h4 className={styles.sectionSubtitle}>🏃 진행 중인 챌린지 ({activeChallenges.length})</h4>
          <div className={styles.challengeList}>
            {activeChallenges.map((item) => (
              <div key={item.id} className={styles.challengeCard}>
                <div className={styles.cardHeader}>
                  <span className={styles.categoryBadge}>{item.category}</span>
                  <span className={`${styles.statusLabel} ${styles.pending}`}>진행 중</span>
                </div>
                
                <h4 className={styles.title}>{item.title}</h4>
                <p className={styles.desc}>{item.desc}</p>
                
                <div className={styles.progressSection}>
                  <div className={styles.progressInfo}>
                    <span className={styles.progressText}>진행도: {item.progress}</span>
                    <span className={styles.rewardText}>보상: {item.reward}</span>
                  </div>
                  <div className={styles.barContainer}>
                    <div 
                      className={styles.barFill} 
                      style={{ 
                        width: `${item.progressValue}%`, 
                        backgroundColor: 'var(--color-deep-forest)'
                      }} 
                    />
                  </div>
                </div>

                <div className={styles.cardFooter}>
                  <span className={styles.endDate}>{item.endDate}</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 2. 완료한 챌린지 */}
        <section className={styles.challengeSection}>
          <h4 className={styles.sectionSubtitle}>✅ 완료한 챌린지 ({completedChallenges.length})</h4>
          <div className={styles.challengeList}>
            {completedChallenges.map((item) => (
              <div key={item.id} className={`${styles.challengeCard} ${styles.completedCard}`}>
                <div className={styles.cardHeader}>
                  <span className={styles.categoryBadge}>{item.category}</span>
                  <span className={`${styles.statusLabel} ${styles.completed}`}>완료</span>
                </div>
                
                <h4 className={styles.title}>{item.title}</h4>
                <p className={styles.desc}>{item.desc}</p>
                
                <div className={styles.progressSection}>
                  <div className={styles.progressInfo}>
                    <span className={styles.progressText}>진행도: {item.progress}</span>
                    <span className={styles.rewardText}>보상: {item.reward}</span>
                  </div>
                  <div className={styles.barContainer}>
                    <div 
                      className={styles.barFill} 
                      style={{ 
                        width: `${item.progressValue}%`, 
                        backgroundColor: 'var(--color-vibrant-emerald)'
                      }} 
                    />
                  </div>
                </div>

                <div className={styles.cardFooter}>
                  <span className={styles.endDate}>{item.endDate}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
