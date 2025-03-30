/****************************************************
 * setFirestore.js
 * - 최신 DB 구조 반영
 ****************************************************/

const admin = require("firebase-admin");
const serviceAccount = require("./serviceAccountKey.json");

// 1. Firebase Admin 초기화
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: serviceAccount.project_id,
});

const db = admin.firestore();
console.log("Firestore 연결됨. 프로젝트 ID:", admin.app().options.projectId);

// ─────────────────────────────────────────────────────────────────
// (A) 하위 컬렉션이 없는 컬렉션을 통째로 삭제
// ─────────────────────────────────────────────────────────────────
async function deleteCollection(collectionPath) {
  const snapshot = await db.collection(collectionPath).get();
  if (snapshot.empty) {
    console.log(`[${collectionPath}] 컬렉션이 비어있음`);
    return;
  }
  const batch = db.batch();
  snapshot.docs.forEach((doc) => batch.delete(doc.ref));
  await batch.commit();
  console.log(`[${collectionPath}] 컬렉션 전체 문서 삭제 완료`);
}

// ─────────────────────────────────────────────────────────────────
// (B) diaries 컬렉션은 likes 하위 컬렉션이 있음
// ─────────────────────────────────────────────────────────────────
async function deleteDiariesCollection() {
  const diariesRef = db.collection("diaries");
  const diariesSnap = await diariesRef.get();

  if (diariesSnap.empty) {
    console.log("[diaries] 컬렉션이 비어있음");
    return;
  }

  for (const diaryDoc of diariesSnap.docs) {
    const diaryDocRef = diariesRef.doc(diaryDoc.id);

    // diaries/{diaryID}/likes 삭제
    await deleteSubcollection(diaryDocRef, "likes");

    // diaries/{diaryID} 문서 삭제
    await diaryDocRef.delete();
    console.log(`Deleted diary doc: ${diaryDocRef.path}`);
  }

  console.log("[diaries] 컬렉션 삭제 완료");
}

// ─────────────────────────────────────────────────────────────────
// (C) analysis 컬렉션은 emoToImg 하위 컬렉션이 있음
// ─────────────────────────────────────────────────────────────────
async function deleteAnalysisCollection() {
  const analysisRef = db.collection("analysis");
  const analysisSnap = await analysisRef.get();

  if (analysisSnap.empty) {
    console.log("[analysis] 컬렉션이 비어있음");
    return;
  }

  for (const anaDoc of analysisSnap.docs) {
    const anaDocRef = analysisRef.doc(anaDoc.id);

    // analysis/{analysisID}/emoToImg 삭제
    await deleteSubcollection(anaDocRef, "emoToImg");

    // analysis/{analysisID} 문서 삭제
    await anaDocRef.delete();
    console.log(`Deleted analysis doc: ${anaDocRef.path}`);
  }

  console.log("[analysis] 컬렉션 삭제 완료");
}

// ─────────────────────────────────────────────────────────────────
// (D) 특정 문서의 하위 컬렉션을 모두 삭제
// ─────────────────────────────────────────────────────────────────
async function deleteSubcollection(parentDocRef, subcollectionName) {
  const subRef = parentDocRef.collection(subcollectionName);
  const subSnap = await subRef.get();
  if (subSnap.empty) {
    return;
  }
  for (const doc of subSnap.docs) {
    await doc.ref.delete();
    console.log(`Deleted sub-doc: ${doc.ref.path}`);
  }
}

// ─────────────────────────────────────────────────────────────────
// (E) reviews 컬렉션은 문서 ID = userID (단일 레벨)
//     여러 댓글을 array로 저장하므로, 일반 deleteCollection() 사용
// ─────────────────────────────────────────────────────────────────

// ─────────────────────────────────────────────────────────────────
// (F) Firestore 전체 초기화
// ─────────────────────────────────────────────────────────────────
async function resetFirestore() {
  try {
    console.log("Firestore 데이터 초기화 시작");

    // 1) followers, following, archives, users, reviews
    const simpleCollections = ["followers", "following", "archives", "users", "reviews"];
    for (const c of simpleCollections) {
      await deleteCollection(c);
    }

    // 2) diaries (하위 컬렉션 likes)
    await deleteDiariesCollection();

    // 3) analysis (하위 컬렉션 emoToImg)
    await deleteAnalysisCollection();

    console.log("모든 기존 컬렉션 삭제 완료");

    // 4) 예시 데이터 삽입
    await seedFirestoreData();

    console.log("Firestore 데이터 초기화 완료");
  } catch (error) {
    console.error("Firestore 초기화 중 오류 발생:", error);
  }
}

// ─────────────────────────────────────────────────────────────────
// (G) 예시 데이터 삽입
// ─────────────────────────────────────────────────────────────────
async function seedFirestoreData() {
  console.log("Firestore에 테스트 데이터 추가 중");

  // Batch 사용
  const batch = db.batch();

  // 1) followers (docID = testUser)
  const followersRef = db.collection("followers").doc("testUser");
  batch.set(followersRef, {
    followers_array: ["friend123", "friend456"],
    recentDiaries: {
      diaryID: "diary2",
      date: admin.firestore.FieldValue.serverTimestamp(),
    },
  });

  // 2) following (docID = testUser)
  const followingRef = db.collection("following").doc("testUser");
  batch.set(followingRef, {
    following_array: ["friend789"],
  });

  // 3) archives (docID = archive1)
  const archivesRef = db.collection("archives").doc("archive1");
  batch.set(archivesRef, {
    userID: "testUser",
    diaryID: ["diary1", "diary2"],
    visibility: "friends",
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  // 4) users (docID = testUser)
  const userRef = db.collection("users").doc("testUser");
  batch.set(userRef, {
    name: "테스트 유저",
    email: "test@example.com",
    introduction: "안녕하세요! 반갑습니다.",
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  // 5) reviews (docID = testUser)
  const reviewsRef = db.collection("reviews").doc("testUser");
  batch.set(reviewsRef, {
    reviews: [
      {
        diaryID: "diary1",
        createdBy: "testUser",
        content: "정말 멋진 다이어리네요!",
        date: admin.firestore.Timestamp.now(),
      },
      {
        diaryID: "diary2",
        createdBy: "friend123",
        content: "공감이 많이 되었습니다!",
        date: admin.firestore.Timestamp.now(),
      },
    ],
  });

  await batch.commit(); // 1차 커밋

  // ─────────────────────────────────────────────────────────────
  // 6) diaries (docID = diary1)
  //    - 하위 컬렉션 likes
  // ─────────────────────────────────────────────────────────────
  const diaryRef = db.collection("diaries").doc("diary1");
  await diaryRef.set({
    userID: "testUser",
    content: "오늘은 날씨가 정말 좋았어요",
    reviewsID: "review1",
    analysisID: "analysis1",
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    visibility: "public",
  });

  // diaries/{diary1}/likes/{likeDocID}
  const likeDocRef = diaryRef.collection("likes").doc("like1");
  await likeDocRef.set({
    time: admin.firestore.FieldValue.serverTimestamp(),
    likedBy: ["friend123", "friend456"],
  });

  // ─────────────────────────────────────────────────────────────
  // 7) analysis (docID = analysis1)
  //    - 하위 컬렉션 emoToImg
  // ─────────────────────────────────────────────────────────────
  const analysisDocRef = db.collection("analysis").doc("analysis1");
  await analysisDocRef.set({
    diaryID: "diary1",
    userID: "testUser",
    aiAnalysis: "오늘 기분은 80% 정도로 즐거움이었음",
    emotion: "행복",
    imageTitle: "따뜻한 감정의 하루",
  });

  // analysis/{analysis1}/emoToImg/{img1}
  const emoToImgRef = analysisDocRef.collection("emoToImg").doc("img1");
  await emoToImgRef.set({
    prompting: "A warm gradient image representing happiness",
    imgURL: "https://example.com/generated_image.jpg",
    emotion: "행복",
  });

  console.log("Firestore 예시 데이터 삽입 완료!");
}

// 스크립트 실행
resetFirestore();