import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Header from '../Components/Header';
import BackgroundCycler from '../Components/BackgroundCycler';

function LandingHome() {
  const navigate = useNavigate();

  const handleStartClick = () => {
    navigate('/generate');
  };

  return (
    <div style={styles.container}>
      {/* 오른쪽 배경 이미지. 자동 변환. */}
      <BackgroundCycler />

      {/* 헤더 (투명 배경) */}
      <div>
        <Header />
      </div>
      {/* <header style={styles.header}>
        <div style={styles.logo}>
          <Link to='/' style={styles.logoLink}>GEN.AI</Link>
        </div>
        <nav style={styles.nav}>
          <a style={styles.navLink} href="#!">My Archive</a>
          <a style={styles.navLink} href="#!">My Home</a>
          <a style={styles.navLink} href="/generate">Create</a>
          <a style={styles.navLink} href="#!">Login</a>
        </nav>
      </header> */}

      {/* 본문 영역 */}
      <div style={styles.mainArea}>
        <div style={styles.leftSection}>
          <h1 style={styles.title}>
            당신의 하루를<br />
            색과 결의 형태로<br />
            기록해 드립니다
          </h1>

          {/* 서브텍스트 박스 */}
          <div style={styles.subtitleBox}>
            <p style={styles.subtitle}>
              생성형 AI 기반 감정 인식 그래픽 스튜디오 <strong>GEN.AI</strong>에서는<br />
              감정을 새로운 방식으로 해석하고 기록합니다.<br />
              당신의 문장 속에 담긴 당신의 하루와 감정을<br />
              색과 결 속에 담아 한 편의 이미지로 변환합니다.<br />
              보이지 않던 감정의 변화를 시각적으로 마주하며,<br />
              보다 풍부한 감정의 지평을 경험하도록 이끕니다.<br />
              스스로를 돌아보는 여정을 <strong>GEN.AI</strong>와 함께 시작해 보세요.
            </p>
          </div>

          <button style={styles.startButton} onClick={handleStartClick}>
            지금 시작하기
          </button>
        </div>
      </div>
    </div>
  );
}

const HEADER_HEIGHT = 60;
const LEFT_RATIO = 712;
const RIGHT_RATIO = 800;
const TOTAL_RATIO = LEFT_RATIO + RIGHT_RATIO; // 1512

const styles = {
  container: {
    position: 'relative',
    height: '100vh', // 화면 높이
    margin: 0,
    padding: 0,
    fontFamily: 'Pretendard, sans-serif',
    letterSpacing: '-0.02em',
    backgroundColor: '#fff',
    overflow: 'hidden',
  },
  // bgImage: {
  //   position: 'absolute',
  //   top: 0,
  //   left: `${(LEFT_RATIO / TOTAL_RATIO) * 100}%`, // 약 47%
  //   right: 0,
  //   bottom: 0,
  //   background: 'url("/images/ref-1-example.jpg") no-repeat center/cover',
  //   zIndex: 0,
  // },
  mainArea: {
    position: 'absolute',
    top: `${HEADER_HEIGHT}px`, // 헤더 바로 아래
    left: 0,
    right: 0,
    bottom: 0,
    display: 'flex',
    zIndex: 1,
  },
  leftSection: {
    width: `${(LEFT_RATIO / TOTAL_RATIO) * 100}%`, // 약 47%
    backgroundColor: '#fff',
    boxSizing: 'border-box',
    overflowY: 'auto',
    padding: '3rem 0 7rem 2rem', // 상단 3rem, 우측 0, 하단 7rem (약 112px), 좌측 2rem
    position: 'relative',
  },
  title: {
    fontSize: '3rem',         // 글자 크기 증가
    lineHeight: 1.6,
    margin: 0,
    marginTop: '40px',        // 약간 아래로 내림
    marginLeft: '100px',      // 좌측 여백 100px
    marginBottom: '1rem',
    color: '#222',
    fontWeight: 700,
  },
  subtitleBox: {
    marginTop: '124px',       // 타이틀보다 124px 아래
    marginRight: '80px',      // 오른쪽 여백 80px
    textAlign: 'right',       // 우측 정렬
  },
  subtitle: {
    fontSize: '1.12rem',      // 글자 크기 증가
    color: '#555',
    lineHeight: 1.8,
    margin: 0,
    marginBottom: '1rem',     // 문단 간 간격
  },
  startButton: {
    display: 'block',
    marginTop: '2rem',
    marginRight: '80px',      // 오른쪽 여백 80px
    marginLeft: 'auto',       // 오른쪽 정렬 효과
    padding: '0.8rem 1.5rem',
    fontSize: '1.25rem',      // 버튼 폰트 크기 증가
    backgroundColor: '#000',
    color: '#fff',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
  },
};

export default LandingHome;