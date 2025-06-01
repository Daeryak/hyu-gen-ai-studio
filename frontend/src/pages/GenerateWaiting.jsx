// src/pages/GenerateWaiting.jsx
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getFirestore, doc, onSnapshot } from 'firebase/firestore';
import { getApp } from 'firebase/app';
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
    
    console.log('요청 보낼 jobId:', jobId);

    // generate의 status를 호출해서 작업 상태 확인 (생성 완료됐는지)
    // ready가 되면 output 페이지로 이동

    // // 상태 확인을 한 번만 수행하도록 변경함
    // fetch(`/api/generate/status?jobId=${jobId}`)
    //     .then(async (response) => {
    //       if (!response.ok) {
    //         throw new Error('상태 조회 실패, 상태 코드: ' + response.status);
    //       }
    //       const data = await response.json();
    //       console.log('status response:', data);

    //       if (data.success && data.status === 'error') {
    //         // 에러 상태일 때만 input 페이지로
    //         alert('이미지 생성에 실패했습니다: ' + (data.errorMessage || ''));
    //         navigate('/generateinput');
    //       } else {
    //         // ready이든 pending 이든 일단 결과 페이지로 이동
    //         // output 컴포넌트에서 imageUrl 또는 diaries 메타를 폴링/페치하도록 처리
    //         navigate('/generateoutput');
    //       }
    //     })
    //     .catch((err) => {
    //       console.error('상태 확인 중 오류:', err);
    //       alert('상태 확인에 실패했습니다. 네트워크를 확인해주세요.');
    //       navigate('/generateinput');
    //     });

    // Firestore 인스턴스 가져오기
    const db = getFirestore(getApp());
    const jobDoc = doc(db, 'jobs', jobId);

    // 실시간 리스너 등록
    const unsubscribe = onSnapshot(jobDoc, (snapshot) => {
      if (!snapshot.exists()) {
        console.warn('존재하지 않는 Job 문서:', jobId);
        return;
      }
      const { status, errorMessage } = snapshot.data();

      if (status === 'ready') {
        unsubscribe();
        navigate('/generateoutput');
      } else if (status === 'error') {
        unsubscribe();
        alert('이미지 생성 error: ' + (errorMessage || ''));
        navigate('/generateinput');
      }
      // status가 'pending' 이면 그냥 대기
    }, (err) => {
      console.error('상태:', err);
      alert('상태 확인 실패');
      navigate('/generateinput');
    });

    // 리스너 정리
    return () => unsubscribe();
  }, [navigate]);

  return (
    <div style={styles.container}>
      {/* header 따로 <Header /> */}

      {/* 블러 원들>> 클래스명으로 교체 */}
      <div className="bg-left-top" />
      <div className="bg-right" />
      <div className="bg-left-bottom" />

      <main style={styles.main}>
        <h1 style={styles.title}>당신의 마음을 그려내고 있어요..</h1>
        <p style={styles.description}>
          자세하게 관찰하고 분석하는 중이에요.<br />
          마음을 그려내기까지 시간이 조금 걸려요. 잠시 기다려주세요.
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