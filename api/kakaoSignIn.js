// api/kakaoSignIn.js
import admin from "firebase-admin";

// Firebase Admin 초기화 (한번만)
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
    }),
  });
}

export default async function handler(req, res) {
  try {
    // ping 테스트
    if (req.query.ping) {
      return res.status(200).json({ ok: true });
    }

    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method Not Allowed" });
    }

    const { accessToken } = req.body;
    if (!accessToken) {
      return res.status(400).json({ error: "accessToken required" });
    }

    // 1. 카카오 사용자 정보 요청 (fetch 사용)
    const kakaoRes = await fetch("https://kapi.kakao.com/v2/user/me", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/x-www-form-urlencoded;charset=utf-8",
      },
    });

    if (!kakaoRes.ok) {
      const text = await kakaoRes.text();
      return res.status(400).json({ error: "Kakao API error", detail: text });
    }

    const kakaoUser = await kakaoRes.json();
    const kakaoUid = `kakao:${kakaoUser.id}`;

    // 2. Firebase Custom Token 생성
    const customToken = await admin.auth().createCustomToken(kakaoUid);

    return res.status(200).json({ customToken });
  } catch (err) {
    console.error("Server error:", err);
    return res.status(500).json({ error: "Server error", detail: err.message });
  }
}