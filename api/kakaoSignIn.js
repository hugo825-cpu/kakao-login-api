import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import axios from "axios";

if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY,
    }),
  });
}

export default async function handler(req, res) {
  try {
    const { accessToken } = req.body;

    // 카카오 유저 정보 확인
    const kakaoRes = await axios.get("https://kapi.kakao.com/v2/user/me", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    const kakaoId = kakaoRes.data.id.toString();

    // Firebase custom token 발급
    const customToken = await getAuth().createCustomToken(kakaoId);

    res.status(200).json({ customToken });
  } catch (error) {
    console.error(error.response?.data || error.message);
    res.status(500).json({ error: "Kakao SignIn failed" });
  }
}