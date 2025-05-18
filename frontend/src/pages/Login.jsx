import React, {useState} from "react";
import {signInWithPopup,
         GoogleAuthProvider,
         updateProfile} from "firebase/auth";
import {authService} from "../firebase";
import {useNavigate} from "react-router-dom";
import "./Login.css";



const Login = () => {
    const navigate = useNavigate();
    const [error, setError] = useState("");
    
    const onSocialClick = async (event) => {
        const {target: {name}} = event;
        // 구글 로그인 처리
        let provider;
        if(name === "google") {
            provider = new GoogleAuthProvider();
            try{
                const data = await signInWithPopup(authService, provider);
                console.log(data);
                const user = data.user;
                //email 앞부분만 잘라서 id로 사용
                const email = user.email;
                const customId = email.substring(0, email.indexOf("@"));
                await updateProfile(authService.currentUser, {
                    displayName: customId});
                navigate("/");// 로그인 성공 후에 메인페이지로 이동
            }catch(error) {
                console.log(error.message);
                setError(error.message);
            }
            
        }
    };

    return(
      <div className="login-wrapper">
        <div className="login-container">
          {/* 상단 그라데이션 영역 */}
          <div className="login-header">
            <h2>로그인</h2>
          </div>
          {/* 본문 영역 */}
          <div className="login-body">
            {/* 구글 로그인 버튼 */}
            <button
              className="google-login-btn"
              name="google"
              onClick={onSocialClick}
            >
              {/* 구글 아이콘 (원하는 이미지로 교체 가능) */}
              <img
                src="https://upload.wikimedia.org/wikipedia/commons/8/8d/Google_logo_(2010-2013).svg"
                alt="Google icon"
              />
              Google로 로그인
            </button>
  
            {/* 에러 메시지 출력 */}
            {error && <div className="error-message">{error}</div>}
          </div>
        </div>
      </div>
    
    );
};

export default Login;