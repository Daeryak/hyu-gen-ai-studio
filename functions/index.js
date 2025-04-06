// index.js
const functions = require("firebase-functions");
const admin = require("firebase-admin");
const express = require("express");
const cors = require("cors");
const fetch = require("node-fetch"); // node-fetch v2 사용 중 (npm install node-fetch@2)
const fs = require("fs"); // file system 모듈 서버에서 파일 읽고 쓸 때 필요
const path = require("path"); // path 모듈 선언

// Admin SDK 초기화
var admin = require("firebase-admin");

var serviceAccount = require("path/to/serviceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

// DB
// const db = admin.firestore();

// 전역 변수로 작업 상태 저장 (메모리 기반, mvp용으로)
const jobResults = {};

// Express 앱 생성 및 미들웨어 설정
const app = express();
app.use(cors({ origin: true }));
app.use(express.json());

// 디버깅용 로그 미들웨어 추가
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] Incoming request: ${req.method} ${req.url}`);
  next();
});


// 테스트용 API
// 기본 GET 라우트 추가 (테스트용으로 추가함)
app.get("/", (req, res) => {
  res.send("Hello");
});


// 생성 API
// 클라이언트는 fetch('/api/generate')를 호출
app.post("/api/generate", async (req, res) => {
  // res.send("Test route works!");
  try {
    const { userText, emotionLevel, selectedEmotions } = req.body;
    const prompt = `abstract image with ${selectedEmotions?.join(", ") || "joy"} at level ${emotionLevel || 50}. user text: ${userText}`;
    console.log("생성할 프롬프트:", prompt);

    // 새로운 작업 요청 생성: 간단히 현재 타임스탬프와 랜덤 숫자로 jobId 생성
    const jobId = Date.now().toString() + Math.floor(Math.random() * 1000).toString();
    jobResults[jobId] = { status: "pending", imageBase64: null };
    console.log("작업 요청 생성됨, jobId:", jobId);

    // 비동기 작업 시뮬레이션: 5초 후 외부 모델 API 호출
    setTimeout(async () => {
      try {
        const API_URL = "https://genaipjt-genai.hf.space/generate";
        // 컨트롤넷 이미지 파일 읽기 (functions 폴더 내에 test-controlnet.png 넣어둠)
        const controlImagePath = path.join(__dirname, "test-controlnet.png");
        const controlImageBuffer = fs.readFileSync(controlImagePath);
        const controlImageBase64 = controlImageBuffer.toString("base64");

        // 요청 페이로드에 prompt와 image 포함 (control_image는 data URI 형식)
        const payload = {
          prompt,
          image: controlImageBase64 // 현재 변경된 API 양식 맞춤 (250405)
        };
        console.log("전송할 payload (일부):", JSON.stringify(payload).slice(0, 200) + "...");

        const response = await fetch(API_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });

        if (!response.ok) {
          throw new Error(`모델 API 오류: ${response.statusText}`);
        }

        const data = await response.json();
        let imageBase64 = data?.image;
        if (!imageBase64) {
          throw new Error("모델 API에서 이미지 데이터가 반환되지 않음");
        }

        // 작업 결과 업데이트: 상태를 "ready"로 변경하고 이미지 데이터 저장
        jobResults[jobId] = { status: "ready", imageBase64 };
        console.log(`작업 ${jobId} 완료, 이미지 생성됨.`);
      } catch (err) {
        console.error(`작업 ${jobId} 처리 중 에러:`, err);
        jobResults[jobId] = { status: "error", error: err.message };
      }
    }, 5000); // 5초 후 실행

    return res.status(200).json({ success: true, jobId });
  } catch (error) {
    console.error("작업 요청 처리 중 에러 (/api/generate):", error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

/*
 GET /api/generate/status?jobId=...
 클라이언트가 주기적으로 이 엔드포인트를 호출하여 작업 상태를 확인
 작업 상태가 ready이면 imageBase64 데이터도 함께 반환
 */
app.get("/api/generate/status", (req, res) => {
  try {
    const jobId = req.query.jobId;
    if (!jobId) {
      return res.status(400).json({ success: false, error: "jobId is required" });
    }
    const job = jobResults[jobId];
    if (!job) {
      return res.status(404).json({ success: false, error: "Job not found" });
    }
    return res.status(200).json({ success: true, ...job });
  } catch (error) {
    console.error("작업 상태 조회 에러:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
});


// Firebase Functions로 Express 앱 배포
exports.api = functions.https.onRequest(app);
// 타임아웃을 늘려서 다시 설정해봤음인데 이거 버전이 낮아서 그런가 안되나..?
// exports.api = functions.runWith({ timeoutSeconds: 300 }).https.onRequest(app);
