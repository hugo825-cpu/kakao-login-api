// api/kakaoSignIn.js
import admin from 'firebase-admin';

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
}

export default async function handler(req, res) {
  // 헬스체크
  if (req.method === 'GET' && req.query.ping) {
    return res.status(200).json({ ok: true });
  }
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { accessToken } = req.body || {};
    if (!accessToken) return res.status(400).json({ error: 'Missing accessToken' });

    // Kakao 사용자 조회 (axios → fetch)
    const r = await fetch('https://kapi.kakao.com/v2/user/me', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!r.ok) {
      const txt = await r.text();
      return res.status(401).json({ error: 'Invalid Kakao token', detail: txt });
    }
    const kakaoUser = await r.json();
    const kakaoUid = String(kakaoUser.id);

    const customToken = await admin.auth().createCustomToken(kakaoUid, {
      provider: 'kakao',
      nickname: kakaoUser.kakao_account?.profile?.nickname ?? null,
    });

    return res.status(200).json({ customToken });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'INTERNAL', message: String(e) });
  }
}