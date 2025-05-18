// functions/index.js
const functions = require("firebase-functions");
const admin = require("firebase-admin");
const express = require("express");
const cors = require("cors");
const fetch = require("node-fetch"); // node-fetch v2 사용 중

// Admin SDK 초기화
const serviceAccount = require("./serviceAccountKey.json");
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  // storageBucket: "gs://genai-cc7f9.firebasestorage.app" // Firebase Storage 버킷 이름
});

const db = admin.firestore();
const bucket = admin.storage().bucket("genai-cc7f9.firebasestorage.app");

// express 앱 선언
const app = express();
app.use(cors({ origin: true }));
app.use(express.json());

// 인증을 위한 미들웨어 추가 (stackoverflow에서 가져온 코드라 솔직히 잘 모름)
async function authenticate(req, res, next) {
  const header = req.get("Authorization") || "";
  const match = header.match(/^Bearer (.+)$/);
  if (!match)   
    return res.status(401).json({success: false, error: "No token"});
  const idToken = match[1];
  try {
    const decoded = await admin.auth().verifyIdToken(idToken);
    req.userId = decoded.uid;
    next();
  }
  catch(err) {
    console.error("auth error: ", err)
    return res.status(401).json({success: false, error: "Invalid token"});
  }
}

// 디버깅용 로그 미들웨어
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

/**
 POST /api/generate
 - Header: Authorization: Bearer <ID_TOKEN>
 - Body: {userText, emotionLevel, selectedEmotions }
 - jobs, diaries, users 컬렉션에 자동 저장
 */
app.post("/api/generate", authenticate, async (req, res) => {
  try {
    const userId = req.userId; // 토큰에서 꺼낸 uid
    const { userText, emotionLevel, selectedEmotions } = req.body; //userID만 따로 뺌
    const prompt = `abstract image with ${selectedEmotions?.join(", ") || "joy"} at level ${emotionLevel || 50}. user text: ${userText}`;

    // 1) users 컬렉션에 프로필 보장 -> users/userID를 lastSeen에 업데이트
    await db.collection("users").doc(userId).set(
      { lastSeen: admin.firestore.FieldValue.serverTimestamp() }, { merge: true })

    // 2) jobs 컬렉션에 pending job 생성
    const jobRef = await db.collection("jobs").add({
      prompt,
      status: "pending",
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
    const jobId = jobRef.id;

    // 3) diaries 컬렉션에, 호출 요청한 jobID 기반으로 다이어리 생성
    await db.collection("diaries").doc(jobId).set({
      userId,
      userText,
      emotionLevel,
      selectedEmotions,
      prompt,
      imageUrl: null,
      status: "pending",
      errorMessage: null,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: null
    });

    // 4) AI 호출 및 Storage 업로드
    setTimeout(async () => {
      try {
        const API_URL = "https://genaipjt-genai.hf.space/generate";
        const response = await fetch(API_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt })
        });
        if (!response.ok) throw new Error(response.statusText);
        const { image: imageBase64 } = await response.json();
        if (!imageBase64) throw new Error("No image data");

        // Base64 디코딩 후 Storage 업로드
        const buffer = Buffer.from(imageBase64, "base64");
        const file = bucket.file(`jobs/${jobId}.png`);
        await file.save( buffer, { metadata: {contentType:"image/png"} } );
        // (임시) 3일 동안 유효한 읽기용 서명된 URL 생성
        await file.makePublic();
        // const [signedUrl] = await file.getSignedUrl({
        //     action: "read",
        //     expires: Date.now() + 1000*60*60*24*3 //ms환산*초*분*시*일 
        //   });
        const imageUrl = `https://storage.googleapis.com/${bucket.name}/jobs/${jobId}.png`;
        // const imageUrl = signedUrl;
        const doneAt = admin.firestore.FieldValue.serverTimestamp();

        // jobs 업데이트
        await jobRef.update({ status: "ready", imageUrl, updatedAt: doneAt });
        // diaries 업데이트
        await db.collection("diaries").doc(jobId).update({
          status: "ready",
          imageUrl,
          updatedAt: doneAt
        });
      } 
      catch (err) {
        console.error(`Job ${jobId} error:`, err.stack || err);
        const update = {
          status: "error",
          errorMessage: err.message,
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        };
        await jobRef.update(update);
        await db.collection("diaries").doc(jobId).update(update);
      }
    }, 5000);

    res.status(200).json({ success: true, jobId });
  } catch (error) {
    console.error("/api/generate error:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

/**
 GET /api/generate/status?jobId=...
 - jobs 컬렉션에서 status, imageUrl, errorMessage 반환
 */
app.get("/api/generate/status", async (req, res) => {
  try {
    const jobId = req.query.jobId;
    if (!jobId)
      return res.status(400).json({ success: false, error: "jobId is required" });
    const doc = await db.collection("jobs").doc(jobId).get();
    if (!doc.exists) 
      return res.status(404).json({ success: false, error: "Job not found" });
    const { status, imageUrl, errorMessage } = doc.data();
    return res.status(200).json({ success: true, status, imageUrl, errorMessage });
  } 
  catch (error) {
    console.error("/api/generate/status error:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

exports.api = functions.https.onRequest(app);
