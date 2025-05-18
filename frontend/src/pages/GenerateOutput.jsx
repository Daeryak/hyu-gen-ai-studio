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
  // 3) 다이어리 메타: 프롬프트, 제목, 설명, 업데이트 날짜
  const [userText, setUserText] = useState('');
  const [title, setTitle] = useState('Untitled');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');

  // (A) 로그인 상태 구독 및 닉네임 세팅
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

  // (B) 1차: jobId 기반으로 status 조회 → imageUrl 세팅
  // 실패 시 (/generateinput)로 리다이렉트
  useEffect(() => {
    const jobId = localStorage.getItem('jobId');
    if (!jobId) {
      alert('생성된 이미지가 없습니다. 다시 시도해주세요.');
      navigate('/generateinput');
      return;
    }
    async function fetchStatus() {
      try {
        const res = await fetch(`/api/generate/status?jobId=${jobId}`);
        const data = await res.json();
        if (!data.success || data.status !== 'ready') {
          throw new Error(data.errorMessage || '이미지 생성 중입니다.');
        }
        setImageUrl(data.imageUrl);
      } catch (err) {
        console.error('Status 조회 오류:', err);
        navigate('/generateinput');
      }
    }
    fetchStatus();
  }, [navigate]);

  // (C) imageUrl 세팅 후 2차: diaries 메타(userText/title/description/date) 조회
  // Firestore 문서에 success 필드가 없으므로, 바로 필드를 읽어옵니다
  useEffect(() => {
    if (!imageUrl) return;

    const jobId = localStorage.getItem('jobId');
    async function fetchDiary() {
      try {
        const res = await fetch(`/api/diaries/${jobId}`);
        if (!res.ok) {
          console.warn('Diary 메타 로드 실패 (상태:', res.status, ')');
          return;
        }
        const diary = await res.json();
        if (!diary) {
          console.warn('diary 문서가 비어있습니다.');
          return;
        }
        // userText 설정
        if (diary.userText) {
          setUserText(diary.userText);
        }
        // title 설정
        if (diary.title) {
          setTitle(diary.title);
        }
        // description 설정 (없으면 플레이스홀더)
        if (diary.description) {
          setDescription(diary.description);
        } else {
          setDescription('Lorem ipsum dolor sit amet, consectetur adipiscing elit.');
        }
        // date 설정
        if (diary.updatedAt) {
          const ts = diary.updatedAt.seconds
            ? diary.updatedAt.seconds * 1000
            : diary.updatedAt;
          const d = new Date(ts);
          setDate(
            d.toLocaleString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: 'numeric',
              minute: '2-digit'
            })
          );
        }
      } catch (err) {
        console.error('Diary 메타 조회 오류:', err);
      }
    }
    fetchDiary();
  }, [imageUrl]);

  // (D) 로딩 상태: imageUrl 아직 세팅되지 않음
  if (!imageUrl) {
    return (
      <div style={styles.loading}>
        <p>이미지 로딩 중...</p>
      </div>
    );
  }

  // (E) 렌더링: 좌측 텍스트, 우측 이미지
  return (
    <div style={styles.container}>
      {/* 좌우 50:50 레이아웃 */}
      <div style={styles.content}>
        {/* 좌측: 텍스트 영역 */}
        <div style={styles.leftPane}>
          {/* 1) Prompt */}
          <div style={styles.promptBlock}>
            <p>{userText}</p>
          </div>

          {/* 2) Nickname + Date */}
          <div style={styles.userInfoRow}>
            <div style={styles.nicknameText}>
              Archiver —<br />{nickname}
            </div>
            <div style={styles.dateText}>
              {date.split(', ').map((part, i) => (
                <React.Fragment key={i}>
                  {part}
                  <br />
                </React.Fragment>
              ))}
            </div>
          </div>

          {/* 3) Diary Title */}
          <div style={styles.titleBlock}>
            <div style={styles.titleText}>{title}</div>
          </div>

          {/* 4) Description */}
          <div style={styles.descriptionBlock}>
            <p style={styles.descriptionText}>{description}</p>
          </div>
        </div>

        {/* 우측: 이미지 영역 */}
        <div style={styles.rightPane}>
          <img src={imageUrl} alt="Generated" style={styles.image} />
        </div>
      </div>
    </div>
  );
}

const styles = {
  // 컨테이너: 헤더 제외, 본문만 담당
  container: {
    display: 'flex',
    flex: 1
  },
  content: {
    display: 'flex',
    flex: 1
  },

  // 좌측 패널 (50%)
  leftPane: {
    width: '50%',
    padding: '32px',
    boxSizing: 'border-box',
    display: 'flex',
    flexDirection: 'column'
  },

  // 1) Prompt
  promptBlock: {
    width: '351px',
    maxHeight: '140px',
    overflow: 'hidden',
    color: 'var(--neutral-neutral-1-main-text, #383325)',
    textAlign: 'right',
    fontFamily: 'Pretendard, sans-serif',
    fontSize: '16px',
    fontStyle: 'normal',
    fontWeight: 400,
    lineHeight: '16px',
    letterSpacing: '-1px',
    textTransform: 'capitalize',
    marginBottom: '30px',
    marginRight: '80px'
  },

  // 2) Nickname + Date
  userInfoRow: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: '200px',
    marginBottom: '80px'
  },
  nicknameText: {
    fontFamily: 'Pretendard, sans-serif',
    fontSize: '32px',
    fontStyle: 'normal',
    fontWeight: 600,
    lineHeight: '32px',
    color: 'var(--neutral-neutral-1-main-text, #383325)'
  },
  dateText: {
    fontFamily: 'Pretendard, sans-serif',
    fontSize: '32px',
    fontStyle: 'normal',
    fontWeight: 600,
    lineHeight: '32px',
    textAlign: 'right',
    color: 'var(--neutral-neutral-1-main-text, #383325)'
  },

  // 3) Diary Title
  titleBlock: {
    display: 'flex',
    justifyContent: 'flex-end',
    marginTop: '300px',
    marginBottom: '80px'
  },
  titleText: {
    color: 'var(--neutral-neutral-1-main-text, #383325)',
    textAlign: 'right',
    fontFamily: 'Pretendard, sans-serif',
    fontSize: '32px',
    fontStyle: 'normal',
    fontWeight: 500,
    lineHeight: '24px',
    textTransform: 'capitalize'
  },

  // 4) Description
  descriptionBlock: {
    display: 'flex',
    justifyContent: 'flex-end',
    marginTop: '80px',
    marginRight: '80px'
  },
  descriptionText: {
    color: 'var(--neutral-neutral-1-main-text, #383325)',
    textAlign: 'right',
    fontFamily: 'Pretendard, sans-serif',
    fontSize: '16px',
    fontStyle: 'normal',
    fontWeight: 400,
    lineHeight: '24px',
    textTransform: 'capitalize'
  },

  // 우측 패널 (50%)
  rightPane: {
    width: '50%',
    background: '#fafafa',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  image: {
    maxWidth: '100%',
    maxHeight: '100%',
    objectFit: 'contain'
  },

  // 로딩 상태
  loading: {
    display: 'flex',
    height: '100vh',
    alignItems: 'center',
    justifyContent: 'center'
  }
};

export default GenerateOutput;