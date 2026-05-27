import Groq from "groq-sdk";

// ════════════════════════════════════════════════════════════
// Groq AI Free Tier Limits (llama-3.3-70b-versatile):
//   RPM  = 30  requests per minute
//   RPD  = 14400 requests per day (super generous)
// ════════════════════════════════════════════════════════════

const MODEL = "llama-3.3-70b-versatile";
const CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes
const PER_IP_RPM_MAX = 5;



// ─── Per-IP Rate Limiter ──────────────────────────────────────
const ipLimitMap = new Map();

function checkPerIpLimit(ip) {
  const now = Date.now();
  const rec = ipLimitMap.get(ip) || { count: 0, windowStart: now };

  if (now - rec.windowStart >= 60_000) {
    rec.count = 0;
    rec.windowStart = now;
  }

  rec.count++;
  ipLimitMap.set(ip, rec);

  if (rec.count > PER_IP_RPM_MAX) {
    const waitMs = 60_000 - (now - rec.windowStart);
    return { blocked: true, waitMs };
  }
  return { blocked: false };
}

// ─── In-Memory Cache ──────────────────────────────────────────
const responseCache = new Map();

function getCached(key) {
  const entry = responseCache.get(key);
  if (entry && Date.now() - entry.ts < CACHE_TTL_MS) return entry.data;
  return null;
}

function setCache(key, data) {
  responseCache.set(key, { data, ts: Date.now() });
  // Auto-cleanup old entries
  if (responseCache.size > 200) {
    const oldest = [...responseCache.entries()].sort((a, b) => a[1].ts - b[1].ts)[0];
    if (oldest) responseCache.delete(oldest[0]);
  }
}

function normalizeKey(symptom) {
  return symptom.toLowerCase().trim().replace(/\s+/g, " ");
}

export function getApiStatus() {
  return {
    model: MODEL,
    provider: "Groq (Free)",
    cacheSize: responseCache.size,
  };
}

// ─── Main Controller ──────────────────────────────────────────
export const checkSymptoms = async (req, res) => {
  const clientIp = req.headers["x-forwarded-for"]?.split(",")[0] || req.socket.remoteAddress || "unknown";

  try {
    const { symptom } = req.body;

    if (!symptom || symptom.trim() === "") {
      return res.status(400).json({ error: "Please provide symptoms" });
    }
    const trimmed = symptom.trim();
    if (trimmed.length < 3) return res.status(400).json({ error: "Symptom too short (min 3 chars)" });
    if (trimmed.length > 400) return res.status(400).json({ error: "Symptom too long (max 400 chars)" });

    const cacheKey = normalizeKey(trimmed);
    const cached = getCached(cacheKey);
    if (cached) {
      console.log(`⚡ Cache HIT: "${cacheKey}"`);
      return res.status(200).json({ ...cached, cached: true });
    }

    const ipCheck = checkPerIpLimit(clientIp);
    if (ipCheck.blocked) {
      const waitSec = Math.ceil(ipCheck.waitMs / 1000);
      return res.status(429).json({
        error: `Too many requests from your device. Please wait ${waitSec}s.`,
        retryAfterSeconds: waitSec,
        specialist: "General Physician", emoji: "🩺",
        reason: "You've made too many requests. Please wait a moment.",
      });
    }

    if (!process.env.GROQ_API_KEY || process.env.GROQ_API_KEY.includes("your_" + "groq")) {
      console.error("GROQ_API_KEY is invalid or missing in .env");
      return res.status(500).json({
        specialist: "General Physician", emoji: "🩺",
        reason: "System is missing a valid Groq API configuration. Please check your .env file.",
      });
    }

    console.log(`🤖 Groq call for: "${cacheKey}"`);
    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

    const prompt = `You are a medical assistant. Based on the symptom, suggest ONE specialist from: Cardiologist, Dermatologist, Neurologist, Dentist, General Physician, Ophthalmologist, ENT Specialist, Orthopedist, Gynecologist, Psychiatrist, Urologist, Gastroenterologist.

Return ONLY exactly this valid JSON (no markdown block, no extra text):
{"specialist":"Name","emoji":"emoji","reason":"Short reason."}

Symptom: "${trimmed}"`;

    const chatCompletion = await groq.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: MODEL,
      temperature: 0.3,
      max_tokens: 150,
      response_format: { type: "json_object" },
    });

    const text = chatCompletion.choices[0]?.message?.content || "";
    const data = JSON.parse(text);

    if (!data.specialist || !data.emoji || !data.reason) {
      throw new Error("Invalid AI response structure");
    }

    const responseData = {
      specialist: data.specialist,
      emoji: data.emoji || "🩺",
      reason: data.reason,
    };

    setCache(cacheKey, responseData);
    console.log(`💾 Cached: "${cacheKey}"`);

    return res.status(200).json(responseData);

  } catch (err) {
    console.error("AI Error:", err.message);

    return res.status(500).json({
      specialist: "General Physician",
      emoji: "🩺",
      reason: "Unable to analyze right now. Please consult a General Physician.",
    });
  }
};