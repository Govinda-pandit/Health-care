import express from 'express';
import { checkSymptoms, getApiStatus } from '../controllers/symptomChecker.js';

const router = express.Router();

// Main symptom check endpoint
router.post('/check-symptoms', checkSymptoms);

// Monitor Gemini quota usage → GET /api/ai/status
router.get('/status', (req, res) => {
  res.status(200).json(getApiStatus());
});

export default router;
