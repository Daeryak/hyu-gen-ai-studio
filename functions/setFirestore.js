// functions/setFirestore.js

/**
 Firestore 초기화 및 예시 데이터 삽입 스크립트
 - 간소화된 스키마: users, diaries 컬렉션
 - 기존 컬렉션은 모두 삭제 후, 샘플 유저와 다이어리만 생성
 */

const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: serviceAccount.project_id,
});

const db = admin.firestore();

// 컬렉션 전체 삭제
async function deleteCollection(path) {
  const snapshot = await db.collection(path).get();
  if (snapshot.empty) return;
  const batch = db.batch();
  snapshot.docs.forEach(doc => batch.delete(doc.ref));
  await batch.commit();
  console.log(`Deleted collection: ${path}`);
}

async function resetFirestore() {
  console.log('Firestore 초기화 시작');

  // 1) 불필요한 컬렉션 삭제
  const oldCollections = ['jobs', 'followers', 'archives', 'reviews', 'analysis'];
  for (const name of oldCollections) {
    await deleteCollection(name);
  }

  // 2) users & diaries 삭제 (새로 생성할 예정)
  await deleteCollection('users');
  await deleteCollection('diaries');

  console.log('기존 데이터 삭제 완료');

  // 3) 샘플 users, diaries 삽입
  await seedExampleData();
  console.log('예시 데이터 삽입 완료');
}

async function seedExampleData() {
  console.log('예시 데이터 삽입 시작');

  // 3-1) users 컬렉션
  // 문서 ID = testUser
  // displayName: 사용자 이름
  // email: 사용자 이메일
  // createdAt: 프로필 생성 시점
  await db.collection('users').doc('testUser').set({
    displayName: '테스트유저',                             // 사용자 표시 이름
    email: 'test@example.com',                           // 이메일
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  }, { merge: true });

  // 3-2) diaries 컬렉션
  // 문서 ID = sampleDiary
  // userId: 작성자 UID
  // userText: 사용자가 입력한 텍스트
  // emotionLevel: 감정 강도
  // selectedEmotions: 감정 종류 배열
  // prompt1, prompt2, fullPrompt: 모델 호출에 사용된 프롬프트
  // imageUrl: 생성된 이미지 URL
  // status: 작업 상태 (pending, ready, error)
  // errorMessage: 실패 시 에러 메시지
  // createdAt: 요청 시각
  // updatedAt: 완료 시각
  await db.collection('diaries').doc('sampleDiary').set({
    userId: 'testUser',                                  // 작성자 UID
    userText: '오늘 정말 행복했어요.',                     // 사용자가 입력한 글
    emotionLevel: 85,                                    // 감정 강도
    selectedEmotions: ['joy'],                           // 선택된 감정 종류
    prompt1: 'A gentle abstract symphony where golden yellow, vibrant orange, and pastel pink softly swirl together, blending in a calm rhythm of emotion with no sharp edges.',  // 템플릿 + 색상
    prompt2: ', beneath a radiant sunrise backdrop filled with golden light, soft pastel hues, and a gentle sense of celebration',  // 배경 스타일
    fullPrompt: 'A gentle abstract symphony where golden yellow, vibrant orange, and pastel pink softly swirl together, blending in a calm rhythm of emotion with no sharp edges., beneath a radiant sunrise backdrop filled with golden light, soft pastel hues, and a gentle sense of celebration. user text: 오늘 정말 행복했어요.', // 전체 프롬프트
    imageUrl: 'https://storage.googleapis.com/your-bucket/sampleDiary.png', // 예시 이미지 URL
    status: 'ready',                                      // 작업 상태
    errorMessage: null,                                  // 에러 있을 시 메시지
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });
}

resetFirestore().catch(err => {
  console.error('Firestore 초기화 중 오류:', err);
  process.exit(1);
});