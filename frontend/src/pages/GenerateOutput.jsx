// src/pages/GenerateOutput.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { authService } from '../firebase.js';

function GenerateOutput() {
  const navigate = useNavigate();
  // 1) 로그인 상태에서 얻은 닉네임
  const [nickname, setNickname] = useState('');
  // 2) 생성된 이미지 URL
  const [imageUrl, setImageUrl] = useState(null);
  // 3) 다이어리 메타: 프롬프트, 제목, 설명
  const [userText, setUserText] = useState('');
  const [title, setTitle] = useState('Untitled');
  const [description, setDescription] = useState('');
  // 4) 날짜 포맷: 줄바꿈용 3줄과 single 문자열
  const [dateLines, setDateLines] = useState({
    line1: '',
    line2: '',
    line3: '',
    single: ''
  });

  // A) 로그인 상태 구독 및 닉네임 세팅
  // 로그인되지 않으면 /login 으로 리다이렉트
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(authService, (user) => {
      if (user) {
        setNickname(user.displayName || user.email.split('@')[0]);
      } else {
        navigate('/login');
      }
    });
    return () => unsubscribe();
  }, [navigate]);

  // B) jobId 기반으로 status 조회 → imageUrl 세팅 + diary 메타 조회
  // 실패 시 (/generateinput)로 리다이렉트
  useEffect(() => {
    const jobId = localStorage.getItem('jobId');
    if (!jobId) {
      alert('생성된 이미지가 없습니다. 다시 시도해주세요.');
      navigate('/generateinput');
      return;
    }

    const fetchAll = async () => {
      const res  = await fetch(`/api/generate/status?jobId=${jobId}`);
      const json = await res.json();

      if (!json.success) throw new Error(json.error || "상태조회 실패");

      if (json.status === "ready") {
        setImageUrl(json.imageUrl);

        // diary 메타 데이터가 있으면 세팅
        if (json.diary) {
          const d = json.diary;
          setUserText(d.userText || "");
          setTitle(d.title || "Untitled");
          setDescription(d.description || "");

          // updatedAt 파싱 및 직접 포맷팅
          if (d.updatedAt) {
            // Firestore Timestamp이 _seconds/_nanoseconds로 오는 경우 처리
            const secs = d.updatedAt.seconds ?? d.updatedAt._seconds;
            const dt = secs
              ? new Date(secs * 1000)
              : (typeof d.updatedAt === "string"
                  ? new Date(d.updatedAt)
                  : (d.updatedAt.toDate
                      ? d.updatedAt.toDate()
                      : new Date(d.updatedAt)));

            // 유효한 날짜인지 확인
            if (!isNaN(dt.getTime())) {
              // 직접 포맷팅
              const monthNames = [
                "January","February","March","April","May","June",
                "July","August","September","October","November","December"
              ];
              const month = monthNames[dt.getMonth()];
              const day   = dt.getDate();
              const year  = dt.getFullYear();
              let   hr    = dt.getHours();
              // const hr    = dt.getHours();
              const min   = dt.getMinutes().toString().padStart(2, '0');
              const ampm  = hr >= 12 ? "PM" : "AM";
              hr = hr % 12 || 12;

              // 줄바꿈 3줄용과 single용 문자열 생성
              setDateLines({
                line1: `${month} ${day}`,
                line2: `${year}`,
                line3: `${hr}:${min} ${ampm}`,
                single: `${month} ${day}, ${year}, ${hr}:${min} ${ampm}`
              });
            } else {
              console.warn("유효하지 않은 일자:", d.updatedAt);
            }
          }
        }
      } else if (json.status === "error") {
        alert("실패: " + (json.errorMessage || ""));
        navigate('/generateinput');
      } else {
        // pending 이면 2초 후 재시도
        setTimeout(fetchAll, 2000);
      }
    };

    fetchAll().catch(err => {
      console.error(err);
      navigate('/generateinput');
    });
  }, [navigate]);

  // D) 로딩 상태: imageUrl 아직 세팅되지 않음
  if (!imageUrl) {
    return (
      <div style={styles.loading}>
        <p>이미지 로딩 중...</p>
      </div>
    );
  }

  // E) 렌더링: 좌측 텍스트, 우측 이미지
  return (
    <div style={styles.container}>
      <div style={styles.leftPane}>
        {/* 1) userText */}
        <div style={styles.promptBlock}>
          <p style={styles.promptText}>{userText}</p>
        </div>

        {/* 2) Archiver + Date */}
        <div style={styles.userInfoRow}>
          <div style={styles.nicknameText}>
            Archiver —<br />{nickname}
          </div>
          <div style={styles.dateText}>
            {dateLines.line1},<br/>
            {dateLines.line2},<br/>
            {dateLines.line3}
          </div>
        </div>

        {/* 3) Title */}
        <div style={styles.titleBlock}>
          <div style={styles.titleText}>{title}</div>
        </div>

        {/* 4) By + nickname */}
        <p style={styles.byText}>By {nickname}</p>

        {/* 5) On + date */}
        <p style={styles.onText}>On {dateLines.single}</p>

        {/* 6) Description */}
        <div style={styles.descriptionBlock}>
          <p style={styles.descriptionText}>{description}</p>
        </div>
      </div>

      {/* 우측 이미지 */}
      <div style= {{...styles.rightPane, backgroundImage: `url(${imageUrl})`}}>
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    height: '100vh',
    fontFamily: 'Pretendard, sans-serif'
  },
  loading: {
    display: 'flex',
    height: '100vh',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: 'Pretendard, sans-serif'
  },

  leftPane: {
    width: '50%',
    flex: 1,
    padding: '32px',
    marginRight: '80px',
    boxSizing: 'border-box',  // rightPane과 80px 띄우기
    display: 'flex',
    flexDirection: 'column'
  },

  // 1) userText
  promptBlock: {
    marginTop: '100px',
    alignSelf: 'flex-end',
    width: '500px',
    maxHeight: '140px',
    overflow: 'hidden',
    marginBottom: '60px'
  },
  promptText: {
    fontSize: '18px',
    fontWeight: 500,
    lineHeight: '24px',
    textAlign: 'right',
    color: 'var(--neutral-neutral-1-main-text, #555555)'
  },

  // 2) Archiver + Date
  userInfoRow: {
    display: 'flex',
    justifyContent: 'flex-end', // 오른쪽 정렬
    gap: '360px', // 둘 사이의 갭
    marginBottom: '80px'
  },
  nicknameText: {
    whiteSpace: 'pre-line',
    fontSize: '36px',
    fontWeight: 700,
    lineHeight: '40px',
    color: 'var(--neutral-neutral-1-main-text, #222222)'
  },
  dateText: {
    whiteSpace: 'pre-line',
    fontSize: '36px',
    fontWeight: 700,
    lineHeight: '48px',
    textAlign: 'right',
    color: 'var(--neutral-neutral-1-main-text, #222222)'
  },

  // 3) Diary Title
  titleBlock: {
    display: 'flex',
    justifyContent: 'flex-end',
    marginTop: '40px',
    marginBottom: '24px'
  },
  titleText: {
    fontSize: '32px',
    fontWeight: 600,
    lineHeight: '24px',
    textAlign: 'right',
    color: 'var(--neutral-neutral-1-main-text, #222222)'
  },

  // 4) By
  byText: {
    margin: 0,
    fontSize: '16px',
    fontWeight: 500,
    textAlign: 'right',
    color: '#777',
    marginBottom: '4px'
  },
  // 5) On
  onText: {
    margin: 0,
    fontSize: '16px',
    fontWeight: 500,
    textAlign: 'right',
    color: '#777',
    marginBottom: '24px'
  },

  // 6) Description
  descriptionBlock: {
    width: '700px',          // 고정 너비
    alignSelf: 'flex-end',   // 오른쪽 끝 정렬
    maxHeight: '200px',
    overflowY: 'auto',       // 내용 넘치면 안에서 스크롤
    marginBottom: '100px'    // 아래 여백
  },
  descriptionText: {
    fontSize: '16px',
    fontWeight: 500,
    lineHeight: '24px',
    textAlign: 'right',
    color: 'var(--neutral-neutral-1-main-text, #555)'
  },

  // 우측 이미지
  rightPane: {
    width: '50%',      // 부모 container의 50%
    height: '100vh',     // 화면 높이 꽉 채우기
    backgroundSize: 'cover',       // 영역 꽉 채우며 잘라내기
    backgroundPosition: 'center',  // 중앙 기준 크롭
    backgroundRepeat: 'no-repeat'  // 반복 금지
    // overflow: 'hidden',  // 넘치는 부분 잘라내기
    // display: 'flex',
    // alignItems: 'center',
    // justifyContent: 'center',
    // position: 'relative', // 절대 위치로 꽉 채워야겠음
    // background: '#ffffff'
  }
  // image: {
  //   position: 'absolute',
  //   top: 0,
  //   left: 0,
  //   height: '100%',      // 항상 부모 높이(100vh) 꽉 채우기
  //   width: 'auto',       // 원본 비율 유지하면서
  //   minWidth: '100%',    // 가로는 최소 부모 폭(800px) 이상 보장
  //   objectFit: 'cover',  // 넘치는 부분은 잘라내기
  //   objectPosition: 'center center'  // 중앙 기준으로 크롭
  // }
};

export default GenerateOutput;