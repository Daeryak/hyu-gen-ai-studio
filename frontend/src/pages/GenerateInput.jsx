import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
//import Header from '../Components/Header';
import {authService} from "../firebase.js";
import { onAuthStateChanged } from 'firebase/auth';

// 로컬 SVG 아이콘을 ReactComponent 형태로 불러오기
import { ReactComponent as JoyIcon } from '../joy.svg';
import { ReactComponent as SadnessIcon } from '../sadness.svg';
import { ReactComponent as AngerIcon } from '../anger.svg';
import { ReactComponent as SurpriseIcon } from '../surprise.svg';
import { ReactComponent as AnticipationIcon } from '../anticipation.svg';
import { ReactComponent as DisgustIcon } from '../disgust.svg';
import { ReactComponent as TrustIcon } from '../trust.svg';
import { ReactComponent as FearIcon } from '../fear.svg';

// 감정별 색상 (선택 시 텍스트 색으로 사용)
// 배경에는 투명도 0.2를 적용하기 위해 아래 색상의 RGB 값을 함께 정의합니다.
const EMOTION_COLORS = {
  joy:    { hex: '#FFCA00', rgb: '255, 202, 0'   },
  sadness:{ hex: '#50AAFF', rgb: '80, 170, 255' },
  anger:  { hex: '#DA3838', rgb: '218, 56, 56'  },
  surprise:{hex: '#A4E214', rgb: '164, 226, 20' },
  anticipation:{ hex: '#FF6A2A', rgb: '255, 106, 42' },
  disgust:{ hex: '#8E42A1', rgb: '142, 66, 161' },
  trust:  { hex: '#339E60', rgb: '51, 158, 96'  },
  fear:   { hex: '#383325', rgb: '56, 51, 37'   },
};

// EMOTION_CONFIG: 감정 키(key) -> { label, Icon component }
const EMOTION_CONFIG = {
  anger: {
    label: '화나요',
    Icon: AngerIcon,
  },
  anticipation: {
    label: '기대돼요',
    Icon: AnticipationIcon,
  },
  joy: {
    label: '기뻐요',
    Icon: JoyIcon,
  },
  surprise: {
    label: '놀라워요',
    Icon: SurpriseIcon,
  },
  trust: {
    label: '신뢰해요',
    Icon: TrustIcon,
  },
  sadness: {
    label: '슬퍼요',
    Icon: SadnessIcon,
  },
  disgust: {
    label: '역겨워요',
    Icon: DisgustIcon,
  },
  fear: {
    label: '두려워요',
    Icon: FearIcon,
  },
};


function GenerateInput() {
  const navigate = useNavigate();

  // 사용자 닉네임
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

  // 현재 날짜 (로컬 시간 사용) - 퍼블리싱 때문에 좀 바꿈
  // const [currentDate, setCurrentDate] = useState('');  
  const [monthDay, setMonthDay] = useState('');
  const [year, setYear] = useState('');
  // 컴포넌트 마운트 시 현재 날짜 초기화
  useEffect(() => {
    const now = new Date();
    // const options = { year: 'numeric', month: 'long', day: 'numeric' };
    // const formattedDate = now.toLocaleDateString('en-US', options);
    // setCurrentDate(formattedDate);
    // "May 31"
    const md = now.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
    // "2025"
    const yr = now.getFullYear().toString();
    setMonthDay(md);
    setYear(yr);
  }, []);

  // 감정 강도
  const [emotionLevel, setEmotionLevel] = useState(50);
  // 감정 종류 (멀티 선택 가능)
  const emotionKinds = ['anger', 'anticipation', 'joy', 'surprise', 'trust', 'sadness', 'disgust', 'fear'];
  const [selectedEmotions, setSelectedEmotions] = useState([]);
  // 감정 종류 체크박스 클릭 핸들러
  const handleEmotionCheck = (kind) => {
    if (selectedEmotions.includes(kind)) {
      setSelectedEmotions(selectedEmotions.filter((item) => item !== kind));
    } else {
      setSelectedEmotions([...selectedEmotions, kind]);
    }
  };

  // 텍스트 입력 (1500자 이내)
  const [userText, setUserText] = useState('');

  // 호버/활성 상태용 로컬 상태 추가
  const [isHoveredAnalyze, setIsHoveredAnalyze] = useState(false);
  const [isActiveAnalyze, setIsActiveAnalyze] = useState(false);
  // 분석하기 버튼 클릭 핸들러
  const handleAnalyze = async () => {
    console.log("handleAnalyze called");
    try {
      // 버튼을 클릭하면 active 상태를 잠깐 true로 두었다가 호출 직후 false로 되돌리기
      setIsActiveAnalyze(true);
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
      // if (!response.ok) {
      //   throw new Error('API 호출 실패, 상태 코드: ' + response.status);
      // }
      const result = await response.json();
      console.log('API 응답 JSON:', result);
      // 작업 요청에 대한 jobId를 받아 localStorage에 저장
      if (result.success && result.jobId) {
        localStorage.setItem('jobId', result.jobId);
        navigate('/generatewaiting');
      } else {
        throw new Error("작업 요청 실패");
       }
      setIsActiveAnalyze(false);
      alert('이미지 생성 요청 완료! 잠시 기다려주세요.');
    } catch (error) {
      setIsActiveAnalyze(false);
      console.error('분석 에러:', error.message);
      alert('분석 중 오류가 발생했습니다: ' + error.message);
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
          {/* <div style={styles.circlePlaceholder}></div> */}
          <div style={styles.archiverBox}>
            <h2 style={styles.archiverTitle}>Archiver —<br />{nickname}</h2>
            {/* <p style={styles.archiverDate}>{currentDate}</p> */}
            <p style={styles.archiverDate}>{monthDay},<br/>{year}'</p>
          </div>
          <div style={styles.emotionLevelBox}>
            <label style={styles.emotionLevelLabel}>감정의 강도: {emotionLevel}</label>
              {/* 트랙 전체 */}
              <div style={styles.sliderTrack}>
                {/* 채워진 부분 */}
                <div
                  style={{
                    ...styles.sliderFill,
                    width: `${emotionLevel}%`  // 퍼센트 만큼만 채움
                  }}
                />

                {/* 투명한 실제 슬라이더(thumb만 보이도록) */}
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={emotionLevel}
                  onChange={e => setEmotionLevel(e.target.value)}
                  style={styles.sliderInput}
                />
              </div>

              {/* 약해요/강해요 레이블 */}
              <div style={styles.rangeLabels}>
                <span>약해요</span>
                <span>강해요</span>
              </div>
            </div>
            {/* <input
              type="range"
              min="0"
              max="100"
              value={emotionLevel}
              onChange={(e) => setEmotionLevel(e.target.value)}
              style={styles.rangeInput}
            />
          </div> */}

     {/* 감정 종류 선택 버튼 */}
          <div style={styles.emotionKindsBox}>
            <div style={styles.emotionKindsList}>
              {emotionKinds.map((kind) => {
                const { label, Icon } = EMOTION_CONFIG[kind];
                const isSelected = selectedEmotions.includes(kind);
                const { hex, rgb } = EMOTION_COLORS[kind];

                return (
                  <button
                    key={kind}
                    type="button"
                    onClick={() => handleEmotionCheck(kind)}
                    style={{
                      ...styles.emotionButtonBase,
                      background: isSelected
                        ? `rgba(${rgb}, 0.2)`
                        : 'transparent',
                      color: isSelected ? hex : '#383325',
                      fontWeight: 400,
                      borderColor: '#383325',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.opacity = '0.5';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.opacity = '1';
                    }}
                  >
                    <span style={styles.emotionText}>{label}</span>
                    <Icon style={styles.emotionIcon} />
                  </button>
                );
              })}
            </div>
          </div>
          </section>

        {/* 오른쪽 영역 */}
        <section style={styles.rightSection}>
          <div style={styles.textBox}>
            <h3 style={styles.textBoxTitle}>
              모든 마음을 환영하니,<br />
              떠오르는대로 편하게 털어놔 주세요.
            </h3>
            <textarea
              style={{...styles.textArea, color: userText ? '#383325' : '#9e9e9e'}}
              placeholder="오늘 있었던 일이나 인상적이었던 기억, 혹은 지금 느껴지는 감정이나 생각을 말해주세요. 어떤 내용이라도 감정을 분석해드릴 수 있어요."
              maxLength={1500}
              value={userText}
              onChange={(e) => setUserText(e.target.value)}
            />
          </div>
          <div style={styles.analyzeBox}>
            {/* 이벤트 핸들러 연결: onMouseEnter, onMouseLeave, onMouseDown, onMouseUp */}
            <button
              style={{
                ...styles.analyzeButton,
                // 호버 상태가 true면 약간 투명하게 (opacity) 또는 그림자 추가
                opacity: isHoveredAnalyze ? 0.85 : 1,
                transform: isActiveAnalyze ? 'translateY(2px)' : 'translateY(0)',
                boxShadow: isActiveAnalyze
                  ? '0 0px 4px rgba(0,0,0,0.1)'         // 클릭했을 때 살짝 내부 그림자
                  : isHoveredAnalyze
                  ? '0 0px 10px rgba(0,0,0,0.1)'       // 호버 시 더 부드러운 그림자
                  : '0 0px 3px rgba(0,0,0,0.18)',         // 기본 그림자
              }}
              onMouseEnter={() => setIsHoveredAnalyze(true)}
              onMouseLeave={() => {
                setIsHoveredAnalyze(false);
                setIsActiveAnalyze(false); // 마우스를 떠나면 active도 false로 리셋
              }}
              onMouseDown={() => setIsActiveAnalyze(true)}
              onMouseUp={() => setIsActiveAnalyze(false)}
              onClick={handleAnalyze}
            >
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
    backgroundColor: '#fcfdff',
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
    // borderRight: '1px solid #eee',
    padding: '2rem',
    boxSizing: 'border-box',
    overflowY: 'auto',
  },
  rightSection: {
    position: 'relative',
    flex: 1,
    padding: '2rem',
    boxSizing: 'border-box',
    // overflowY: 'auto',
  },
  // 감정 종류 버튼 공통 (비선택 상태)
  emotionButtonBase: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '140px',
    height: '48px',
    padding: '10px 18px',
    gap: '6px',
    borderRadius: '55px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    background: 'transparent',
    border: '1.17px solid #383325',
    outline: 'none',
  },
  emotionText: {
    fontSize: '20px',
    fontWeight: 400,
    fontFamily: 'Pretendard, sans-serif',
    whiteSpace: 'nowrap',
  },
  emotionIcon: {
    width: '28px',
    height: '28px',
  },

  // =============================================================
  // archiver 선택하는 파트
  archiverBox: {
    // marginBottom: '2rem',
    position: 'absolute',
    top: '160px',
    left: '250px',
    display: 'flex',             // flex 컨테이너로 만들어서
    alignItems: 'baseline',      // 글자 기준선 맞추기
    gap: '200px',                // 제목과 날짜 간격
  },
  archiverTitle: {
    color: '#383325',
    fontSize: '32px',
    fontFamily: 'Work Sans, sans-serif',
    fontWeight: 600,
    lineHeight: '35px',
    wordWrap: 'break-word',
    margin: 0,
  },
  archiverDate: {
    margin: 0,                   // 상단 여백은 archiverBox에서
    color: '#383325',
    fontSize: '32px',
    fontFamily: 'Work Sans, sans-serif',
    fontWeight: 600,
    lineHeight: '35px',
    wordWrap: 'break-word',
  },

  // =============================================================
  //감정 강도 선택하는 파트
  emotionLevelBox: {
    // marginBottom: '2rem',
    position: 'absolute',
    top: '270px',   // 참고로 archiverBox(top:170px)
    left: '250px',  // archiverBox와 동일한 left 값
    width: '600px', // 위의 날짜와 대강 오른쪽 끝 맞추기
    fontsize: '32px',
  },
  emotionLevelLabel: {
    display: 'block', 
    marginBottom: '0.3rem',
    fontWeight: 500,
    fontSize: '22px',
    color: '#828282'
  },
  // 슬라이더 트랙 전체 (회색 배경)
  sliderTrack: {
    position: 'relative',
    top: '8px',
    width: '100%',
    height: '16px',
    background: '#EBEBEB',
    borderRadius: '22px',
    overflow: 'hidden',
  },
  // 채워진 부분 (그라데이션)
  sliderFill: {
    position: 'absolute',
    left: 0,
    top: 0,
    height: '100%',
    background: 'linear-gradient(270deg, #C9E5FF 6%, #FFF2BE 100%)',
    borderRadius: '22px',
  },
  // 실제 드래그 영역 (input thumb은 index.css에서 아예 안보이도록 투명처리하는 코드 갖고왔음)
  sliderInput: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: '100%',
    height: '100%',
    background: 'transparent',
    WebkitAppearance: 'none',
    appearance: 'none',
    outline: 'none',
    cursor: 'pointer',
  },
  // 슬라이더 밑 레이블 “약해요 / 강해요”
  rangeLabels: {
    display: 'flex',
    justifyContent: 'space-between',
    marginTop: '20px',
    fontSize: '0.9rem',
    color: '#999',
  },
  // rangeInput: {
  //   width: '100%',
  //   marginBottom: '0.5rem',
  // },

  // =============================================================
  // 감정 종류 선택
  emotionKindsBox: {
    // marginBottom: '2rem',
    position: 'absolute',
    top: '400px',   // 참고로 archiverBox(top:170px)
    left: '250px',  // archiverBox와 동일한 left 값
    width: '650px', // 위의 날짜와 대강 오른쪽 끝 맞추기
  },
  // emotionKindsLabel: {
  //   marginBottom: '0.5rem',
  //   fontWeight: 500,
  // },
  emotionKindsList: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '1rem',
  },
  // checkboxLabel: {
  //   display: 'flex',
  //   alignItems: 'center',
  //   gap: '0.3rem',
  //   fontSize: '0.95rem',
  // },
  // checkboxInput: {
  //   cursor: 'pointer',
  // },

  // =============================================================
  // 우측에 하루 느낌 입력하는 파트
  textBox: {
    position: 'absolute',
    top: '60px',
    right: '230px',
    // marginBottom: '2rem',
  },
  textBoxTitle: {
    // fontSize: '1rem',
    marginBottom: '0.5rem',
    fontSize: '22px',
    fontWeight: 600,
    color: '#383325',
    lineHeight: '32px',
  },
  textArea: {
    marginTop: '0.2rem',
    width: '600px',
    height: '480px',
    resize: 'vertical',
    fontFamily: 'Pretendard, sans-serif',
    fontSize: '16px',
    padding: '0.5rem',
    boxSizing: 'border-box',
    borderRadius: '25.2px',
    // color: '#9e9e9e',
    padding: '25px',
  },
  analyzeBox: {
    textAlign: 'right',
    // display: 'flex',
    // justifyContent: 'flex-end',
    // marginTop: '25px',     // 텍스트박스와 버튼 사이 간격
  },
  analyzeButton: {
    // display: 'inline-flex',
    position: 'absolute',
    right: '230px',
    top: '673px',
    height: 80,
    alignItems: 'center',
    justifyContent: 'center',
    padding: '7.23px 38.55px',            // 위/아래 7.23, 좌/우 38.55
    background: 'linear-gradient(270deg, #C9E5FF 6%, #FFF2BE 100%)',
    border: 'none',
    borderRadius: '25.2px',
    cursor: 'pointer',
    /* 텍스트 스타일 */
    fontFamily: 'Pretendard, sans-serif',
    fontSize: '24px',
    fontWeight: 600,
    lineHeight: '24px',
    color: '#383325',
    textTransform: 'none',
    gap: '9.64px',                        // 텍스트와 화살표 사이 간격
    transition: 'opacity 0.3s ease, box-shadow 0.5s ease, transform 0.3s ease',
  },
};

export default GenerateInput;
