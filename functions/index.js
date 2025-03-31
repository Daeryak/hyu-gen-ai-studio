// index.js
const functions = require("firebase-functions");
const admin = require("firebase-admin");
const express = require("express");
const cors = require("cors");
const fetch = require("node-fetch"); // node-fetch v2 사용 중 (npm install node-fetch@2)
const fs = require("fs"); // file system 모듈 서버에서 파일 읽고 쓸 때 필요
const path = require("path"); // path 모듈 선언

// Firebase Admin 초기화
admin.initializeApp();
const db = admin.firestore(); // Firestore 사용

// Express 앱 생성 및 미들웨어 설정
const app = express();
app.use(cors({ origin: true }));
app.use(express.json());

// 디버깅용 로그 미들웨어 추가
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] Incoming request: ${req.method} ${req.url}`);
  next();
});

// 기본 GET 라우트 추가 (테스트용으로 추가함)
app.get("/", (req, res) => {
  res.send("Hello");
});

// Express 내에서는 "/generate"로 정의
// 클라이언트는 fetch('/api/generate')를 호출, Hosting rewrites에 의해 "/api/" 접두사 제거
app.post("/generate", async (req, res) => {
  try {
    // 프론트엔드에서 전송된 데이터 추출
    const { userText, emotionLevel, selectedEmotions } = req.body;

    // prompt 생성 (예시; 필요에 따라 수정)
    const prompt = `abstract image with ${selectedEmotions?.join(", ") || "joy"} at level ${emotionLevel || 50}. user text: ${userText}`;
    console.log("생성할 프롬프트:", prompt);

    // 모델 API 호출 (예: HuggingFace Space API)
    const API_URL = "https://genaipjt-genai.hf.space/generate";
    const payload = { prompt };

    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`모델 API 오류: ${response.statusText}`);
    }

    const data = await response.json();
    const imageBase64 = data?.image; // 모델 API가 반환한 Base64 문자열

    if (!imageBase64) {
      throw new Error("모델 API에서 이미지 데이터가 반환되지 않음");
    }

    // 이 자리에 Firestore 저장 로직 추가해야됨

    // 프론트엔드에 이미지 데이터를 JSON 형태로 응답
    // 성공적으로 이미지가 반환되면 응답
    return res.status(200).json({ success: true, imageBase64 });
  } catch (error) {
    console.error("에러 발생 (/api/generate):", error);
    // BAD REQUEST 또는 이미지 없음 에러 발생 시 fallback 이미지 사용
    if (error.message.includes("BAD REQUEST") || error.message.includes("이미지 데이터가 반환되지 않음")) {
      try {
        // fallback 이미지 파일은 반드시 functions 폴더에 넣어야 된다고 함!!!!
        const fallbackPath = path.join(__dirname, "test-controlnet.png");
        console.log("Fallback 이미지 파일 경로:", fallbackPath);
        const fallbackBuffer = fs.readFileSync(fallbackPath);
        console.log("Fallback 이미지 파일 크기:", fallbackBuffer.length);
        const fallbackBase64 = fallbackBuffer.toString("base64");
        console.log("Fallback 이미지 사용");
        return res.status(200).json({ success: true, imageBase64: fallbackBase64 });
      } catch (fallbackError) {
        console.error("Fallback 이미지 읽기 실패:", fallbackError);
      }
    }
    return res.status(500).json({ success: false, error: error.message });
  }
});

// Firebase Functions로 Express 앱 배포
exports.api = functions.https.onRequest(app);
// 타임아웃을 늘려서 다시 설정해봤음인데 이거 버전이 낮아서 그런가 안되나..?
// exports.api = functions.runWith({ timeoutSeconds: 300 }).https.onRequest(app);
