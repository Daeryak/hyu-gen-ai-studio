    // 코드 신중하게!!!!
    import React from 'react';
    import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
//아래부터
    import Header from './Components/Header'; // Header 컴포넌트 import
    import { useState, useEffect } from 'react';
    import { onAuthStateChanged } from 'firebase/auth';
    import { authService } from './firebase'; // firebase.js에서 authService를 import
//여기까지 추가
    import LandingHome from './pages/LandingHome';
    import GenerateLanding from './pages/GenerateLanding';
    import GenerateInput from './pages/GenerateInput'; 
    import GenerateWaiting from './pages/GenerateWaiting'; 
    import GenerateOutput from './pages/GenerateOutput';
    import Login from './pages/Login';
    // 다른 페이지가 있다면 필요 시 import

    function App(){
        const [isLoggedIn, setIsLoggedIn] = useState(false); // 로그인 상태를 관리하는 state

        useEffect(() => {
            const unsubscribe = onAuthStateChanged(authService, (user) => {
                if (user) {
                    setIsLoggedIn(true); // 사용자가 로그인하면 true로 설정
                } else {
                    setIsLoggedIn(false); // 사용자가 로그아웃하면 false로 설정
                }
            });
            return () => unsubscribe(); // 컴포넌트 언마운트 시 구독 해제
        }, []);
        
        const handleLogOut = async() => {
            try {
                await authService.signOut(); // Firebase Auth에서 로그아웃
                setIsLoggedIn(false); // 로그인 상태를 false로 설정
                alert("로그아웃 되었습니다."); // 로그아웃 알림
            } catch (error) {
                console.error("로그아웃 실패:", error);
            }
        };
        return (
            <Router>
              <Header isLoggedIn={isLoggedIn} onLogOut={handleLogOut} />
              <Routes>
                <Route path="/" element={<LandingHome />} />
                <Route path="/generate" element={<GenerateLanding />} />
                <Route path="/generateinput" element={<GenerateInput />} />
                <Route path="/generatewaiting" element={<GenerateWaiting />} />
                <Route path="/generateoutput" element={<GenerateOutput />} />
                <Route path="/login" element={<Login />} />
              </Routes>
            </Router>
        );
    }

    export default App;