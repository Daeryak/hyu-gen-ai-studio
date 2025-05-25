// functions/index.js
const functions = require("firebase-functions");
const admin = require("firebase-admin");
const express = require("express");
const cors = require("cors");
const axios = require("axios");      // 자체 AI 호출용

// Firebase Admin SDK 초기화
const serviceAccount = require("./serviceAccountKey.json");
admin.initializeApp({
 credential: admin.credential.cert(serviceAccount),
});
const db = admin.firestore();
const bucket = admin.storage().bucket("genai-cc7f9.firebasestorage.app");

// 감정별 색상 팔레트 (Prompt1 입력 데이터)
const emotion_color_palette = {
 anger: [
  "warm rose","soft coral","muted crimson","dusky apricot",
  "deep amber","dusty maroon","burnt sienna","rust red",
  "faded brick","fiery scarlet","deep vermilion",
  "intense blood red","molten copper"
 ],
 joy: [
  "golden yellow","vibrant orange","pastel pink","cheerful green",
  "bright sky blue","sunset peach","buttercup yellow","melon orange",
  "rosy blush","lemon chiffon","light tangerine","soft cantaloupe"
 ],
 anticipation: [
  "bright gold","soft coral","light lavender","glowing amber",
  "warm peach","radiant white","honey glow","peach fuzz",
  "pale lilac","soft sunrise pink","gleaming topaz",
  "early dawn lavender"
 ],
 surprise: [
  "sky blue","soft lemon","pastel green","light fuchsia",
  "soft apricot","silvery mist","gentle cyan","pale yellow",
  "light magenta","mint teal","lavender blush","fresh lime"
 ],
 sadness: [
  "navy blue","cool gray","dusky purple","deep teal",
  "stormy sky","muted blue","slate gray","dusty blue",
  "midnight teal","ashen blue","faded navy","twilight indigo"
 ],
 disgust: [
  "soft moss green","muted olive","dusty chartreuse","pale sage",
  "faded mustard","misty teal","swamp mist","weathered khaki",
  "wilted sage","light mossy stone","dimmed gold","soft rotting green"
 ],
 fear: [
  "smoky black","muted plum","soft blood red","ashen lavender",
  "misty green","deep dusk blue","charcoal mist","faded violet",
  "dusky rose red","hazy indigo","phantom mist","shadow gray"
 ],
 trust: [
  "warm beige","creamy white","light sage","dusty blue",
  "powder blue","faded seafoam","pastel moss","horizon blue",
  "gentle almond","whispering cream","early morning blue","quiet mint"
 ]
};

// 이미지 생성용 프롬프트 템플릿 (Prompt1)
const prompt_templates = [
 "A gentle abstract symphony where {}, {}, and {} softly swirl together, blending in a calm rhythm of emotion with no sharp edges.",
 "A quiet field of delicate pigments — {}, {}, and {} — drifting together in a light, airy blend of color and feeling.",
 "A soft, flowing canvas where {}, {}, and {} gently dissolve into each other like slow waves of thought across a hazy horizon.",
 "A subtle blend of {}, {}, and {} floating weightlessly, like tender emotion dissolving into a glowing, endless mist.",
 "A delicate abstraction where {}, {}, and {} mingle like soft whispers in the air, forming light, layered textures of serenity and warmth."
];

// 감정별 배경 스타일 (Prompt2 데이터)
const emotion_background_styles = {
 anger:        ", with a seething crimson backdrop engulfed in dark smoke and glowing embers of rage",
 joy:          ", beneath a radiant sunrise backdrop filled with golden light, soft pastel hues, and a gentle sense of celebration",
 anticipation: ", with a luminous gradient background that suggests a sense of rising energy",
 fear:         ", surrounded by a shadowy mist with dim, pulsating glows and distorted outlines that echo a deep, instinctive dread",
 surprise:     ", bursting into a cascade of flickering lights and shifting pastel flashes, capturing a sudden, playful moment of wonder",
 disgust:      ", unfolding through a restless gradient of conflicting hues that bleed into one another, forming a warped and lingering sense of unease",
 trust:        ", resting on a serene, gentle landscape bathed in soft blues and muted greens that suggest quiet stability",
 sadness:      ", beneath a muted sky of drizzling blues and soft grays, evoking a deep, contemplative melancholy"
};

// openAI api 429 오류 시 백오프로 최대 3회 재시도
async function retryWithBackoff(fn, args, retries = 3, delay = 1000) {
  try {
    return await fn(...args);
  } catch (err) {
    // 429 또는 DNS 오류 등 재시도 대상일 때
    if (retries > 0 && (err.response?.status === 429 || err.code === 'ENOTFOUND')) {
      await new Promise(r => setTimeout(r, delay));
      return retryWithBackoff(fn, args, retries - 1, delay * 2);
    }
    throw err;
  }
}

// GPT 호출 함수 1) userText -> prompt1 생성
async function callOpenAIForPrompt1(userText) {
  const { Configuration, OpenAIApi } = require("openai");
  // 2) 환경변수(Functions config)에서 키 꺼내기
  const openaiKey = process.env.OPENAI_API_KEY;
  const openai    = new OpenAIApi(new Configuration({ apiKey: openaiKey }));
  const systemPrompt = `
You are a color and template selector.
emotion_color_palette = ${JSON.stringify(emotion_color_palette, null, 2)}
prompt_templates = ${JSON.stringify(prompt_templates, null, 2)}
`;
  // 3) 사용자 텍스트 → prompt1 생성
  const userPrompt = `
# Text to analyze:
"${userText}"

# Instructions:
1) Identify the primary emotion and its intensity (0-100).
2) From the palette for that emotion, select 3 colors.
3) From the list of templates, choose the one that fits best.
4) Insert the 3 selected colors into the template's placeholders in order.
5) Return ONLY valid JSON in the following format.:
   { "prompt": "final rendered sentence" }

# Caution:
Return ONLY valid JSON, without any markdown or code fences.
    `;

  const resp = await retryWithBackoff(
    openai.createChatCompletion.bind(openai),
    [{
      model:       "gpt-4o-mini",
      messages:    [{ role:"system", content:systemPrompt },{ role:"user", content:userPrompt }],
      temperature: 0.7
    }]
  );

  const content = resp.data.choices[0].message.content.trim();
  const json    = JSON.parse(content);
  return json.prompt;
}

// Prompt2 생성 함수: 감정 키 → 배경 스타일
// emotion_key와 스타일을 합쳐서 완전한 prompt2를 반환하도록 수정하였음.
function makePrompt2(emotionKey) {
  const key = (emotionKey || '').trim().toLowerCase();
  const style = emotion_background_styles[key] || "";
  // "emotion, with …" 형태로 합침
  return `${key}${style}`;
}

// 내부 AI 호출 함수: prompt1, prompt2 → base64 이미지
async function callInternalImageAPI({ prompt1, prompt2 }) {
  const fn = async () => {
    const resp = await axios.post(
      "https://genaipjt-genai.hf.space/generate",
      { prompt: prompt1, prompt_2: prompt2 },
      { headers: { "Content-Type": "application/json" } }
    );
    if (!resp.data.image) throw new Error("이미지를 반환받지 못했습니다");
    return resp.data.image;
  };
  // 재시도 적용
  return retryWithBackoff(fn, []);
}


// =====================================================================


// GPT 호출 함수 2: prompt1, prompt2, imageUrl → title, description 생성
async function callOpenAIForTitleDesc({ prompt1, prompt2, imageUrl, userText, emotionLevel, selectedEmotions }) {
  const { Configuration, OpenAIApi } = require("openai");
  const openaiKey = process.env.OPENAI_API_KEY;
  const openai    = new OpenAIApi(new Configuration({ apiKey: openaiKey }));

  const systemPrompt = `
Now, You're an artist who has listened to the user's text, type of emotion, and level of emotion and drew a picture of color and condensation like this Image. And you're in a situation where you have to talk about the title of this work, the creative intention, purpose, and explanation.
So You have to generate a creative, poetic and literary title and description for image.
Generate a diverse and imaginative title (not repetitive formulas) and a fitting description.
With the prompt1, prompt2, image rovided, make more freely literary and creative explanations. Make more creative titles to match the explanation.
Especially considering userText, emotionLevel, selectedEmotions so that the user can understand and sympathize with why the image is expressed like this. User needs literary and artistic explanations and work names based on the user's case.
User hope there are more additional explanations for why colors and texture are appearing like this, the intention of the visual expression, and the direction of the production.
Return JSON: { "title": "...", "description": "..." }`;
//   const systemPrompt = `
// You are an imaginative artist and poet. Given:
// - prompt1 (the three-color abstraction line),
// - prompt2 (the chosen background style),
// - imageUrl,
// - userText,
// - emotionLevel,
// - selectedEmotions,

// your task is to propose:
// 1. A creative, non-formulaic title.
// 2. A literary, art-critical description explaining:
//    • Why these specific colors and textures appear.
//    • Your creative intention and emotional purpose.
//    • How userText, emotionLevel, and selectedEmotions informed your choices.

// Return ONLY valid JSON, without any markdown or code fences, in the format:
// {
//   "title": "...",
//   "description": "..."
// }
//   `;
  const userPrompt = `
userText: "${userText}" 
selectedEmotions: "${selectedEmotions}" 
emotionLevel: "${emotionLevel}"
prompt1: "${prompt1}"
prompt_2: "${prompt2}"
imageUrl: "${imageUrl}"

한국어로 답변하세요.`;

  const resp = await retryWithBackoff(
    openai.createChatCompletion.bind(openai),
    [{
      model:       "gpt-4o-mini",
      messages:    [{ role:"system", content:systemPrompt },{ role:"user", content:userPrompt }],
      temperature: 1.0
    }]
  );

  const content = resp.data.choices[0].message.content.trim();
  return JSON.parse(content);
}

// Express 앱 초기화 및 미들웨어 설정
const app = express();
app.use(cors({ origin: true }));
app.use(express.json());

// 인증 미들웨어: Firebase ID 토큰 검증
async function authenticate(req, res, next) {
 const header = req.get("Authorization") || "";
 const match = header.match(/^Bearer (.+)$/);
 if (!match) return res.status(401).json({ success: false, error: "토큰이 없음" });
 try {
  const decoded = await admin.auth().verifyIdToken(match[1]);
  req.userId = decoded.uid;
  next();
 } catch (err) {
  console.error("인증 오류:", err);
  res.status(401).json({ success: false, error: "유효하지 않은 토큰" });
 }
}

// 요청 로깅 미들웨어
app.use((req, res, next) => {
 console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
 next();
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/generate
// ─────────────────────────────────────────────────────────────────────────────
// 기존 app.post("/api/generate" …) 부분을 이 전체 코드를 덮어쓰기
app.post("/api/generate", authenticate, async (req, res) => {
  try {
    const userId = req.userId;
    const { userText, emotionLevel, selectedEmotions } = req.body;

    // 1) prompt1 생성 (GPT)
    const prompt1 = await callOpenAIForPrompt1(userText + " with level " + emotionLevel + " for " + selectedEmotions);

    // 2) prompt2 생성 (selectedEmotions 중 랜덤 선택)
    const randomIndex = Math.floor(Math.random() * (selectedEmotions.length || 1));
    const emotionKey  = selectedEmotions[randomIndex] || "joy";
    const prompt2     = makePrompt2(emotionKey);

    // 3) jobs 컬렉션에 prompt1·prompt2 저장
    const jobRef = await db.collection("jobs").add({
      prompt:    prompt1,
      prompt_2:  prompt2,
      status:    "pending",
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
    const jobId = jobRef.id;

    // 4) diaries 컬렉션 초기 레코드
    await db.collection("diaries").doc(jobId).set({
      userId,
      userText,
      emotionLevel,
      selectedEmotions,
      prompt:       prompt1,
      prompt_2:     prompt2,
      imageUrl:     null,
      title:        null,
      description:  null,
      status:       "pending",
      errorMessage: null,
      createdAt:    admin.firestore.FieldValue.serverTimestamp(),
      updatedAt:    null
    });

    // 5) 비동기로 이미지·메타 생성
    setTimeout(async () => {
      const doneAt = admin.firestore.FieldValue.serverTimestamp();
      try {
        // 이미지 생성 및 업로드
        const imageBase64 = await callInternalImageAPI({ prompt1, prompt2 });
        const buffer = Buffer.from(imageBase64, "base64");
        const file = bucket.file(`jobs/${jobId}.png`);
        await file.save(buffer, { metadata: { contentType: "image/png" } });
        await file.makePublic();
        const imageUrl = `https://storage.googleapis.com/${bucket.name}/jobs/${jobId}.png`;

        // 제목/설명 생성
        const { title, description } = await callOpenAIForTitleDesc({ prompt1, prompt2, imageUrl, userText, emotionLevel, selectedEmotions });

        // Firestore 업데이트
        await jobRef.update({ status: "ready", imageUrl, updatedAt: doneAt });
        await db.collection("diaries").doc(jobId).update({
          status:      "ready",
          imageUrl,
          title,
          description,
          updatedAt:   doneAt
        });
      } catch (err) {
        console.error(`Job ${jobId} 처리 오류:`, err);
        const update = { status: "error", errorMessage: err.message, updatedAt: doneAt };
        await jobRef.update(update);
        await db.collection("diaries").doc(jobId).update(update);
      }
    }, 1000);

    // 6) 응답
    return res.json({ success: true, jobId });
  } catch (e) {
    console.error("/api/generate 오류:", e);
    return res.status(500).json({ success: false, error: e.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/generate/status
// - 클라이언트는 jobId만 쿼리 파라미터로 보냄
// - 내부에서 두 개의 문서(jobs, diaries)를 꺼내서 합쳐준 형태로 json으로 돌려줌
// ─────────────────────────────────────────────────────────────────────────────
app.get("/api/generate/status", async (req, res) => {
 try {
  const jobId = req.query.jobId;
  if (!jobId) return res.status(400).json({ success: false, error: "jobId가 필요합니다" });
  
  // 1) jobs 문서
  const jobSnap = await db.collection("jobs").doc(jobId).get();
  if (!jobSnap.exists) return res.status(404).json({ success: false, error: "Job이 없습니다" });
  const { status, imageUrl, errorMessage } = jobSnap.data();

  // 2) diaries 문서
  const diarySnap = await db.collection("diaries").doc(jobId).get();
  let diaryData = null;
  if (diarySnap.exists) {
    diaryData = diarySnap.data();
  }
  return res.json({
    success: true,
    status,
    imageUrl,
    errorMessage,
    diary: diaryData  // ← 메타 전체를 포함
  });
  } catch (e) {
    console.error("/api/generate/status 오류:", e);
    res.status(500).json({ success:false, error:e.message });
  }
});

// Firebase Function으로 Express 앱 내보내기
exports.api = functions.https.onRequest(app);