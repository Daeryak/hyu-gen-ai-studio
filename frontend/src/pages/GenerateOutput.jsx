import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import Header from '../Components/Header';

function GenerateOutput() {
  const [imageBase64, setImageBase64] = useState(null);
  const [nickname, setNickname] = useState('Example_user');
  const [date, setDate] = useState('');
  // 실제 제목과 설명은 gpt거쳐서 가져오는 로직은 조금 나중에 구현 예정.. 일단 샘플로
  const [title, setTitle] = useState('Untitled');
  const [description, setDescription] = useState('No description available.');
  const navigate = useNavigate();

  useEffect(() => {
    // (예시) localStorage에서 이미지 데이터를 가져옴
    const storedImage = localStorage.getItem('generatedImage');
    if (!storedImage) {
      alert('생성된 이미지가 없습니다. 다시 시도해주세요.');
      navigate('/generate');
    } else {
      setImageBase64(storedImage);
    }

    const storedTitle = localStorage.getItem('generatedTitle') || 'TEST';
    const storedDesc = localStorage.getItem('generatedDesc') || 'AI가 분석한 감정 설명...';
    setTitle(storedTitle);
    setDescription(storedDesc);

    // 현재 날짜 설정
    const now = new Date();
    const options = { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric', 
      hour: 'numeric', 
      minute: '2-digit' 
    };
    const formattedDate = now.toLocaleString('en-US', options);
    setDate(formattedDate);
  }, [navigate]);

  return (
    <div style={styles.container}>
      <Header />

      <div style={styles.contentWrapper}>
        {/* 왼쪽 영역: 텍스트 정보 */}
        <section style={styles.leftSection}>
          <h2 style={styles.nickname}>Archiver — {nickname}</h2>
          <p style={styles.dateText}>{date}</p>
          
          {/* 예시: 작품 제목, 설명 */}
          <h3 style={styles.title}>{title}</h3>
          <p style={styles.description}>{description}</p>

          {/* 여기에 공유 버튼, 아카이브 저장 버튼 등 추가 가능 */}
        </section>

        {/* 오른쪽 영역: 이미지 표시 */}
        <section style={styles.rightSection}>
          {imageBase64 ? (
            <img
              src={`data:image/png;base64,${imageBase64}`}
              alt="Generated"
              style={styles.generatedImage}
            />
          ) : (
            <p>이미지 로딩 중...</p>
          )}
        </section>
      </div>
    </div>
  );
}

/** 간단한 스타일 예시 */
const HEADER_HEIGHT = 60;
const styles = {
  container: {
    position: 'relative',
    minHeight: '100vh',
    fontFamily: 'Pretendard, sans-serif',
    backgroundColor: '#fff',
  },
  contentWrapper: {
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
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    gap: '1rem',
  },
  rightSection: {
    flex: 1,
    padding: '2rem',
    boxSizing: 'border-box',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  nickname: {
    fontSize: '1.2rem',
    fontWeight: 600,
    margin: 0,
    marginBottom: '0.3rem',
  },
  dateText: {
    margin: 0,
    fontSize: '0.9rem',
    color: '#666',
  },
  title: {
    fontSize: '1.5rem',
    fontWeight: 700,
    margin: '1rem 0 0.5rem 0',
  },
  description: {
    fontSize: '1rem',
    color: '#333',
    lineHeight: 1.4,
  },
  generatedImage: {
    maxWidth: '100%',
    maxHeight: '100%',
    objectFit: 'cover',
    borderRadius: '8px',
  },
};

export default GenerateOutput;