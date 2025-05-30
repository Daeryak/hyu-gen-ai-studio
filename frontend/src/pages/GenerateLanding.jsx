import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
// import Header from '../Components/Header';
import './GenerateLanding.css';

function GenerateLanding() {
  const navigate = useNavigate();

  // 마운트 시 2초 뒤 자동 이동
  useEffect(() => {
    const timer = setTimeout(() => {
      navigate('/generateinput');
    }, 2000);

  // 언마운트 시 타이머 해제
    return () => clearTimeout(timer);
  }, [navigate]);

  // const handleStartClick = () => {
  //   navigate('/generateinput');
  // };

  return (
    <div style={styles.container}>
      <div>
        {/*header 따로 <Header />*/}
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

      {/* 블러 원들>> 클래스명으로 교체 */}
      <div className="bg-left-top" />
      <div className="bg-right" />
      <div className="bg-left-bottom" />

      <main style={styles.main}>
        <h1 style={styles.title}>당신의 감정을 마주할 준비가 되셨나요?</h1>
        <p style={styles.description}>
          무엇이든 편하게 말해 주세요.<br />
          어려울 것 없어요, 모든 이야기를 환영합니다.
        </p>
      </main>
    </div>
  );
}

const HEADER_HEIGHT = 60;

const styles = {
  container: {
    position: 'relative',
    minHeight: '100vh',
    margin: 0,
    padding: 0,
    fontFamily: 'Pretendard, sans-serif',
    letterSpacing: '-0.02em',
    overflow: 'hidden',
    backgroundColor: '#fcfdff',
  },
  main: {
    position: 'relative',
    zIndex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100vh',
    textAlign: 'center',
    padding: '2rem',
  },
  title: {
    fontSize: '2.5rem',
    marginBottom: '1rem',
    color: '#383325',
  },
  description: {
    fontSize: '1.3rem',
    color: '#383325',
    lineHeight: 1.6,
    marginBottom: '2rem',
  },
  // startButton: {
  //   backgroundColor: '#000',
  //   color: '#fff',
  //   padding: '0.8rem 1.5rem',
  //   fontSize: '1.1rem',
  //   border: 'none',
  //   borderRadius: '4px',
  //   cursor: 'pointer',
  // },
};

export default GenerateLanding;