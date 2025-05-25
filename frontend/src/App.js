// src/App.js
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { authService } from './firebase';

import Header from './Components/Header';
import LandingHome from './pages/LandingHome';
import GenerateLanding from './pages/GenerateLanding';
import GenerateInput from './pages/GenerateInput';
import GenerateWaiting from './pages/GenerateWaiting';
import GenerateOutput from './pages/GenerateOutput';
import Login from './pages/Login';

function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(authService, (u) => {
      setUser(u);
    });
    return () => unsubscribe();
  }, []);

  const handleLogOut = async () => {
    try {
      await authService.signOut();
      setUser(null);
      alert('로그아웃 되었습니다.');
    } catch (error) {
      console.error('로그아웃 실패:', error);
    }
  };

  return (
    <Router>
      <Header user={user} onLogOut={handleLogOut} />

      <Routes>
        <Route path="/" element={<LandingHome />} />
        <Route path="/generate" element={<GenerateLanding />} />

        <Route
          path="/generateinput"
          element={user ? <GenerateInput /> : <Navigate to="/login" replace />}
        />
        <Route
          path="/generatewaiting"
          element={user ? <GenerateWaiting /> : <Navigate to="/login" replace />}
        />
        <Route
          path="/generateoutput"
          element={user ? <GenerateOutput /> : <Navigate to="/login" replace />}
        />

        <Route path="/login" element={<Login />} />
      </Routes>
    </Router>
  );
}

export default App;
