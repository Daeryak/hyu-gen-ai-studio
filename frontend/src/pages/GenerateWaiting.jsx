// src/pages/GenerateWaiting.jsx
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
// import Header from '../Components/Header';
import './GenerateWaiting.css';

function GenerateWaiting() {
  const navigate = useNavigate();
  // const [status, setStatus] = useState("pending");

  // useEffect를 활용해 컴포넌트가 들어오면 local에서 jobId를 가져옴.
  // 없으면 다시 input 페이지로 보냄.
  useEffect(() => {
    const jobId = localStorage.getItem('jobId');
    if (!jobId) {
      alert('작업 ID가 없습니다. 다시 시도해주세요.');
      navigate('/generateinput');
      return;
    }

    // 3초마다 작업 상태 generate의 status를 호출해서 작업 상태 확인 (생성 완료됐는지)
    // ready가 되면 output 페이지로 이동
    const interval = setInterval(async () => {
      try {
        // status 조회
        const response = await fetch(`/api/generate/status?jobId=${jobId}`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error('상태 조회 실패, 상태 코드: ' + response.status);
        }
        console.log('폴링 응답:', data);

        // 작업 상태가 "ready"이면 output 페이지로 이동
        if (data.success && data.status === 'ready') {
          // clearInterval 후 output으로
          clearInterval(interval);
          navigate('/generateoutput');
        }
        // 작업 상태가 "error"이면 input 페이지로
        else if (data.success && data.status === 'error') {
          clearInterval(interval);
          alert('이미지 생성에 실패했습니다: ' + (data.errorMessage || ''));
          navigate('/generateinput');
        }
        // 계속 "pending"이면 그대로 대기
      } catch (err) {
        console.error('폴링 에러:', err);
      }
    }, 3000); // 3초마다 폴링

    return () => clearInterval(interval);
  }, [navigate]);

  return (
    <div style={styles.container}>
      {/* header 따로 <Header /> */}

      {/* 블러 원들>> 클래스명으로 교체 */}
      <div className="bg-left-top" />
      <div className="bg-right" />
      <div className="bg-left-bottom" />

      <main style={styles.main}>
        <h1 style={styles.title}>오늘의 하루를 그려내고 있어요..</h1>
        <p style={styles.description}>
          GEN.AI가 감정을 그려내는 동안,<br />
          잠시 눈을 감고 오늘 하루를 돌아보는 것은 어떨까요?
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
    backgroundColor: '#fdfdfd',
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
    color: '#333',
  },
  description: {
    fontSize: '1.3rem',
    color: '#555',
    lineHeight: 1.6,
    marginBottom: '2rem',
  },
  startButton: {
    backgroundColor: '#000',
    color: '#fff',
    padding: '0.8rem 1.5rem',
    fontSize: '1.1rem',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
  },
};

export default GenerateWaiting;