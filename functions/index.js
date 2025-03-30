// index.js
const functions = require("firebase-functions");
const admin = require("firebase-admin");
const express = require("express");
const cors = require("cors");
const fetch = require("node-fetch"); // node-fetch 설치 필요

// Firebase Admin 초기화
admin.initializeApp();
const db = admin.firestore(); // Firestore 사용(필요 시 추가 로직 가능)

// Express 앱 생성 및 미들웨어 설정
const app = express();
app.use(cors({ origin: true }));
app.use(express.json());

// POST /api/generate 라우트
// 프론트엔드에서 사용자 입력 데이터를 받아, 내부 모델 API를 호출하고 이미지 데이터를 반환함.
app.post("/api/generate", async (req, res) => {
  try {
    // 프론트엔드에서 전송된 데이터 추출
    const { userText, emotionLevel, selectedEmotions } = req.body;

    // prompt 생성 (예시; 실제 로직은 필요에 따라 수정)
    const prompt = `abstract image with ${selectedEmotions?.join(", ") || "joy"} at level ${emotionLevel || 50}. user text: ${userText}`;
    console.log("생성할 프롬프트:", prompt);

    // 모델 API 호출 (예시: HuggingFace Space API)
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

    // (필요 시) Firestore에 저장하는 로직 추가 가능
    // 예: await db.collection("diaries").doc().set({ ..., imageBase64, ... });

    // 프론트엔드에 이미지 데이터를 JSON 형태로 응답
    return res.status(200).json({
      success: true,
      imageBase64,
    });
  } catch (error) {
    console.error("에러 발생 (/api/generate):", error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

// 추가 라우트가 필요하면 여기에 작성...

// Firebase Functions로 Express 앱 배포
exports.api = functions.https.onRequest(app);
