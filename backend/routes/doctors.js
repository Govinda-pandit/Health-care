import express from 'express';
const router = express.Router();
import DoctorProfile from '../models/DoctorProfile.js';
import { auth, doctorAuth } from '../middleware/auth.js';
import User from '../models/User.js';

// ─────────────────────────────────────────────────────────────
// @route  GET /api/doctors
// @desc   Search / list all doctors (public)
// ─────────────────────────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const { specialty, page = 1, limit = 20 } = req.query;
    const query = specialty ? { specialty } : {};

    const doctors = await DoctorProfile.find(query)
      .populate('doctor', 'name email avatar')
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit))
      .sort({ rating: -1 });

    const total = await DoctorProfile.countDocuments(query);

    res.json({
      doctors,
      currentPage: parseInt(page),
      totalPages: Math.ceil(total / limit),
      total,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ─────────────────────────────────────────────────────────────
// @route  GET /api/doctors/:id/slots?date=YYYY-MM-DD
// @desc   Get available (unbooked) slots for a doctor on a date (public)
// ─────────────────────────────────────────────────────────────
router.get('/:id/slots', async (req, res) => {
  try {
    const profile = await DoctorProfile.findById(req.params.id).populate('doctor', 'name');
    if (!profile) return res.status(404).json({ error: 'Doctor not found' });

    let availableSlots;

    if (req.query.date) {
      // Parse as local midnight — avoids UTC/IST shift
      const [y, m, d] = req.query.date.split('-').map(Number);

      availableSlots = profile.availableSlots.filter((slot) => {
        const sd = new Date(slot.date);
        return (
          sd.getUTCFullYear() === y &&
          sd.getUTCMonth() + 1 === m &&
          sd.getUTCDate() === d &&
          !slot.isBooked
        );
      });
    } else {
      availableSlots = profile.availableSlots.filter((s) => !s.isBooked);
    }

    res.json({ availableSlots });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ─────────────────────────────────────────────────────────────
// @route  GET /api/doctors/my-profile
// @desc   Get logged-in doctor's own profile + all slots
// ─────────────────────────────────────────────────────────────
router.get('/my-profile', auth, doctorAuth, async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const profile = await DoctorProfile.findOne({ doctor: userId }).populate('doctor', 'name email');
    if (!profile) return res.status(404).json({ error: 'Profile not found. Please create one first.' });
    res.json(profile);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ─────────────────────────────────────────────────────────────
// @route  POST /api/doctors/profile
// @desc   Create or update doctor profile (WITHOUT touching slots)
// ─────────────────────────────────────────────────────────────
router.post('/profile', auth, doctorAuth, async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;

    // Remove availableSlots from body — slots managed by dedicated routes
    const { availableSlots: _ignored, ...profileData } = req.body;

    let profile = await DoctorProfile.findOne({ doctor: userId });

    if (profile) {
      Object.assign(profile, profileData);
    } else {
      profile = new DoctorProfile({
        doctor: userId,
        ...profileData,
        availableSlots: [],
      });
    }

    await profile.save();
    await profile.populate('doctor', 'name email');

    res.json(profile);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ─────────────────────────────────────────────────────────────
// @route  POST /api/doctors/slots/add
// @desc   Add availability slots for the logged-in doctor
// Body:   { slots: [{ date: "YYYY-MM-DD", time: "09:00 AM" }, ...] }
// ─────────────────────────────────────────────────────────────
router.post('/slots/add', auth, doctorAuth, async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const { slots } = req.body;

    if (!Array.isArray(slots) || slots.length === 0) {
      return res.status(400).json({ error: 'slots array is required and must not be empty.' });
    }

    let profile = await DoctorProfile.findOne({ doctor: userId });

    if (!profile) {
      return res.status(404).json({
        error: 'Doctor profile not found. Please create your profile first.',
      });
    }

    // Build new slot objects, skipping duplicates (same date+time already exists unbooked)
    const newSlots = [];
    for (const s of slots) {
      if (!s.date || !s.time) continue;

      // Store as UTC midnight so slot.date.getUTCDate() always matches correctly
      const [y, m, d] = s.date.split('-').map(Number);
      const slotDateUTC = new Date(Date.UTC(y, m - 1, d));

      // Duplicate check: skip if same date+time already present (booked or unbooked)
      const alreadyExists = profile.availableSlots.some((existing) => {
        const ed = new Date(existing.date);
        return (
          ed.getUTCFullYear() === y &&
          ed.getUTCMonth() + 1 === m &&
          ed.getUTCDate() === d &&
          existing.time === s.time
        );
      });

      if (!alreadyExists) {
        newSlots.push({ date: slotDateUTC, time: s.time, isBooked: false });
      }
    }

    if (newSlots.length === 0) {
      return res.status(400).json({ error: 'All provided slots already exist.' });
    }

    profile.availableSlots.push(...newSlots);
    await profile.save();

    res.json({
      message: `${newSlots.length} slot(s) added successfully!`,
      addedCount: newSlots.length,
      availableSlots: profile.availableSlots,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ─────────────────────────────────────────────────────────────
// @route  DELETE /api/doctors/slots/:slotId
// @desc   Remove a specific slot (only if not booked)
// ─────────────────────────────────────────────────────────────
router.delete('/slots/:slotId', auth, doctorAuth, async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const profile = await DoctorProfile.findOne({ doctor: userId });

    if (!profile) return res.status(404).json({ error: 'Doctor profile not found.' });

    const slot = profile.availableSlots.id(req.params.slotId);
    if (!slot) return res.status(404).json({ error: 'Slot not found.' });
    if (slot.isBooked) return res.status(400).json({ error: 'Cannot delete a booked slot.' });

    profile.availableSlots.pull(req.params.slotId);
    await profile.save();

    res.json({ message: 'Slot removed successfully.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
