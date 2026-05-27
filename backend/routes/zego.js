import express from 'express';
import crypto from 'crypto';
import { auth } from '../middleware/auth.js';

const router = express.Router();

/**
 * Generate ZegoCloud Token04 (server-side signed token)
 * Docs: https://docs.zegocloud.com/article/11648
 */
function generateZegoToken(appId, serverSecret, userId, roomId, effectiveTimeInSeconds = 3600) {
  const timestamp = Math.floor(Date.now() / 1000);
  const expire = timestamp + effectiveTimeInSeconds;

  const nonce = crypto.randomInt(1, 2147483647);

  // Payload
  const payload = {
    app_id: parseInt(appId, 10),
    user_id: userId,
    nonce,
    ctime: timestamp,
    expire,
    privilege: { 1: 1, 2: 1 }, // 1=loginRoom, 2=publishStream — both allowed
    stream_id_list: null,
  };

  const payloadStr = JSON.stringify(payload);
  const payloadBase64 = Buffer.from(payloadStr).toString('base64');

  // Signature: HMAC-SHA256 over (appId + userId + nonce + ctime + expire + payloadBase64)
  const signStr = `${appId}${userId}${nonce}${timestamp}${expire}${payloadBase64}`;
  const signature = crypto.createHmac('sha256', serverSecret).update(signStr).digest('hex');

  // Final token: "04" version prefix
  const tokenObj = {
    ver: '04',
    expire,
    hash: signature,
    payload: payloadBase64,
  };

  const tokenStr = Buffer.from(JSON.stringify(tokenObj)).toString('base64');
  return `04${tokenStr}`;
}

// @route  GET /api/zego/token
// @desc   Get a signed ZegoCloud token for the current user
// @access Private
router.get('/token', auth, (req, res) => {
  try {
    const appId = process.env.ZEGO_APP_ID;
    const serverSecret = process.env.ZEGO_SERVER_SECRET;

    if (!appId || !serverSecret) {
      return res.status(500).json({ error: 'ZegoCloud is not configured on the server.' });
    }

    const userId = req.user.id.toString();
    const roomId = req.query.roomId || 'default';

    const token = generateZegoToken(appId, serverSecret, userId, roomId);

    res.json({
      token,
      appId: parseInt(appId, 10),
      userId,
      roomId,
      expire: Math.floor(Date.now() / 1000) + 3600,
    });
  } catch (err) {
    console.error('Zego token generation error:', err);
    res.status(500).json({ error: 'Failed to generate token.' });
  }
});

export default router;
