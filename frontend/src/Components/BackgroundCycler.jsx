// src/components/BackgroundCycler.jsx
import React, { useState, useEffect, useRef } from 'react';
import './BackgroundCycler.css';

function BackgroundCycler() {
  const totalImages = 10;
  const [currentIndex, setCurrentIndex] = useState(1);
  const [nextIndex, setNextIndex] = useState(null);
  const [animating, setAnimating] = useState(false);
  const currentIndexRef = useRef(1);

  useEffect(() => {
    // 한 번만 실행: 의존성 배열을 빈 배열([])로 처리
    const interval = setInterval(() => {
      const newIndex = currentIndexRef.current === totalImages ? 1 : currentIndexRef.current + 1;
      setNextIndex(newIndex);
      setAnimating(true);
      // 애니메이션 지속시간 1.5초 후에 currentIndex 업데이트
      setTimeout(() => {
        setCurrentIndex(newIndex);
        currentIndexRef.current = newIndex;
        setAnimating(false);
        setNextIndex(null);
      }, 1500);
    }, 4000);
    return () => clearInterval(interval);
  }, []); // 빈 배열로 설정하여 한 번만 실행

  return (
    <div className="bg-container">
      <div
        className={`bg-image bg-current ${animating ? 'animate-out' : ''}`}
        style={{
          backgroundImage: `url("/images/ref-${currentIndex}-example.png")`,
        }}
      />
      {animating && nextIndex && (
        <div
          className="bg-image bg-next animate-in"
          style={{
            backgroundImage: `url("/images/ref-${nextIndex}-example.png")`,
          }}
        />
      )}
    </div>
  );
}

export default BackgroundCycler;