    // 코드 신중하게!!!!
    import React from 'react';
    import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

    import LandingHome from './pages/LandingHome';
    import GenerateLanding from './pages/GenerateLanding';
    import GenerateInput from './pages/GenerateInput'; 
    import GenerateWaiting from './pages/GenerateWaiting'; 
    import GenerateOutput from './pages/GenerateOutput';
    // 다른 페이지가 있다면 필요 시 import

    function App() {
    return (
        <Router>
        <Routes>
            {/* 최초 시작 페이지 */}
            <Route path="/" element={<LandingHome />} />
            <Route path="/generate" element={<GenerateLanding />} />
            <Route path="/generateinput" element={<GenerateInput />} />
            <Route path="/generatewaiting" element={<GenerateWaiting />} />
            <Route path="/generateoutput" element={<GenerateOutput />} />
        </Routes>
        </Router>
    );
    }

    export default App;