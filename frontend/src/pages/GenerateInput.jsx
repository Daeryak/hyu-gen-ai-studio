import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

//import Header from '../Components/Header';
import {authService} from "../firebase.js";
import { onAuthStateChanged } from 'firebase/auth';

function GenerateInput() {
  const navigate = useNavigate();

  // (임시) 사용자 닉네임 (추후 구글 로그인 후 불러오기 )
  const [nickname, setNickname] = useState("");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(authService, (user) => {
      if (user) {
        setNickname(user.displayName || user.email.split("@")[0] || 'User');
      } else {
        setNickname('Guest');
      }
    });
    return () => unsubscribe();
  }, []);



  // 현재 날짜 (로컬 시간 사용)
  const [currentDate, setCurrentDate] = useState('');

  // 감정 강도
  const [emotionLevel, setEmotionLevel] = useState(50);

  // 감정 종류 (멀티 선택 가능)
  const emotionKinds = ['joy', 'sadness', 'anger', 'surprise', 'anticipation', 'disgust', 'trust', 'fear'];
  const [selectedEmotions, setSelectedEmotions] = useState([]);

  // 텍스트 입력 (1500자 이내)
  const [userText, setUserText] = useState('');

  // 컴포넌트 마운트 시 현재 날짜 초기화
  useEffect(() => {
    const now = new Date();
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    const formattedDate = now.toLocaleDateString('en-US', options);
    setCurrentDate(formattedDate);
  }, []);

  // 감정 종류 체크박스 클릭 핸들러
  const handleEmotionCheck = (kind) => {
    if (selectedEmotions.includes(kind)) {
      setSelectedEmotions(selectedEmotions.filter((item) => item !== kind));
    } else {
      setSelectedEmotions([...selectedEmotions, kind]);
    }
  };

  // 분석하기 버튼 클릭 핸들러
  const handleAnalyze = async () => {
    console.log("handleAnalyze called");
    try {
      // 전송할 데이터 구성
      const dataToSend = {
        userText,
        emotionLevel,
        selectedEmotions,
      };
      console.log('전송할 데이터:', dataToSend);

      // 새로 만든 우리 모델 API 엔드포인트 호출
      // 그러면 firebase.json의 rewrites 설정에 따라 functions의 exports.api 함수로 전달
      // 인증된 사용자만 호출할 수 있도록
      const idToken = await authService.currentUser.getIdToken();
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`
        },
        body: JSON.stringify(dataToSend),
      });
      console.log('fetch 호출 후, response.status:', response.status);

      if (!response.ok) {
        throw new Error('API 호출 실패, 상태 코드: ' + response.status);
      }

      const result = await response.json();
      console.log('API 응답 JSON:', result);

      // 작업 요청에 대한 jobId를 받아 localStorage에 저장
      if (result.success && result.jobId) {
        localStorage.setItem('jobId', result.jobId);
        navigate('/generatewaiting');
      } else {
        throw new Error("작업 요청 실패");
       }
      alert('이미지 생성 요청 완료! (콘솔에서 결과 확인)');
    } catch (error) {
      console.error('분석 에러:', error);
      alert('분석 중 오류가 발생했습니다: ' + error.message);
      navigate('/generatewaiting');
    }
  };

  return (
    <div style={styles.container}>
      {/* 헤더 */}
      <div>
        {/*header 따로 <Header />*/}
        
      </div>
      <main style={styles.main}>
        {/* 왼쪽 영역 */}
        <section style={styles.leftSection}>
          <div style={styles.circlePlaceholder}></div>
          <div style={styles.archiverBox}>
            <h2 style={styles.archiverTitle}>Archiver — {nickname}</h2>
            <p style={styles.archiverDate}>{currentDate}</p>
          </div>
          <div style={styles.emotionLevelBox}>
            <label style={styles.emotionLevelLabel}>감정 강도: {emotionLevel}</label>
            <input
              type="range"
              min="0"
              max="100"
              value={emotionLevel}
              onChange={(e) => setEmotionLevel(e.target.value)}
              style={styles.rangeInput}
            />
          </div>
          <div style={styles.emotionKindsBox}>
            <p style={styles.emotionKindsLabel}>감정 종류:</p>
            <div style={styles.emotionKindsList}>
              {emotionKinds.map((kind) => (
                <label key={kind} style={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={selectedEmotions.includes(kind)}
                    onChange={() => handleEmotionCheck(kind)}
                    style={styles.checkboxInput}
                  />
                  {kind}
                </label>
              ))}
            </div>
          </div>
        </section>

        {/* 오른쪽 영역 */}
        <section style={styles.rightSection}>
          <div style={styles.textBox}>
            <h3 style={styles.textBoxTitle}>지금 기분이 어떠신가요?</h3>
            <textarea
              style={styles.textArea}
              placeholder="1500자 이내 자유 서술..."
              maxLength={1500}
              value={userText}
              onChange={(e) => setUserText(e.target.value)}
            />
          </div>
          <div style={styles.analyzeBox}>
            <button style={styles.analyzeButton} onClick={handleAnalyze}>
              분석하기 &rarr;
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}

const HEADER_HEIGHT = 60;

const styles = {
  container: {
    position: 'relative',
    minHeight: '100vh',
    fontFamily: 'Pretendard, sans-serif',
    letterSpacing: '-0.02em',
    backgroundColor: '#fff',
    margin: 0,
    padding: '0 6rem',
    overflow: 'hidden',
  },
  main: {
    display: 'flex',
    flexDirection: 'row',
    marginTop: HEADER_HEIGHT,
    height: `calc(100vh - ${HEADER_HEIGHT}px)`,
  },
  leftSection: {
    flex: 1,
    borderRight: '1px solid #eee',
    padding: '2rem',
    boxSizing: 'border-box',
    overflowY: 'auto',
  },
  rightSection: {
    flex: 1,
    padding: '2rem',
    boxSizing: 'border-box',
    overflowY: 'auto',
  },
  circlePlaceholder: {
    width: '80px',
    height: '80px',
    borderRadius: '50%',
    backgroundColor: '#eee',
    marginBottom: '1rem',
  },
  archiverBox: {
    marginBottom: '2rem',
  },
  archiverTitle: {
    fontSize: '1.2rem',
    fontWeight: 600,
    margin: 0,
    marginBottom: '0.3rem',
  },
  archiverDate: {
    margin: 0,
    fontSize: '0.9rem',
    color: '#666',
  },
  emotionLevelBox: {
    marginBottom: '2rem',
  },
  emotionLevelLabel: {
    display: 'block',
    marginBottom: '0.3rem',
    fontWeight: 500,
  },
  rangeInput: {
    width: '100%',
    marginBottom: '0.5rem',
  },
  emotionKindsBox: {
    marginBottom: '2rem',
  },
  emotionKindsLabel: {
    marginBottom: '0.5rem',
    fontWeight: 500,
  },
  emotionKindsList: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '0.5rem',
  },
  checkboxLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.3rem',
    fontSize: '0.95rem',
  },
  checkboxInput: {
    cursor: 'pointer',
  },
  textBox: {
    marginBottom: '2rem',
  },
  textBoxTitle: {
    fontSize: '1rem',
    marginBottom: '0.5rem',
    fontWeight: 600,
  },
  textArea: {
    width: '100%',
    height: '200px',
    resize: 'vertical',
    fontSize: '0.95rem',
    padding: '0.5rem',
    boxSizing: 'border-box',
  },
  analyzeBox: {
    textAlign: 'right',
  },
  analyzeButton: {
    padding: '0.6rem 1.2rem',
    fontSize: '1rem',
    backgroundColor: '#000',
    color: '#fff',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
  },
};

export default GenerateInput;
