import express from 'express';
const router = express.Router();
import DoctorProfile from '../models/DoctorProfile.js';
import { auth, doctorAuth } from '../middleware/auth.js';
import User from '../models/User.js';

// @route  GET api/doctors
// @desc   Search doctors
router.get('/', async (req, res) => {
  try {
    const { specialty, page = 1, limit = 10 } = req.query;
    const query = specialty ? { specialty } : {};
    
    const doctors = await DoctorProfile.find(query)
      .populate('doctor', 'name email avatar')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ rating: -1 });

    const total = await DoctorProfile.countDocuments(query);

    res.json({
      doctors,
      currentPage: parseInt(page),
      totalPages: Math.ceil(total / limit),
      total
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// @route  GET api/doctors/:id/slots?date=YYYY-MM-DD
// @desc   Get available slots for a specific date
router.get('/:id/slots', async (req, res) => {
  try {
    const profile = await DoctorProfile.findById(req.params.id).populate('doctor');
    if (!profile) return res.status(404).json({ error: 'Doctor not found' });

    let availableSlots;

    if (req.query.date) {
      // Parse the requested date as LOCAL midnight to avoid UTC shift issues
      const requestedDate = new Date(`${req.query.date}T00:00:00`);
      availableSlots = profile.availableSlots.filter(slot => {
        // Compare year/month/day only (ignore time component)
        const slotDate = new Date(slot.date);
        return (
          slotDate.getFullYear() === requestedDate.getFullYear() &&
          slotDate.getMonth()   === requestedDate.getMonth()   &&
          slotDate.getDate()    === requestedDate.getDate()    &&
          !slot.isBooked
        );
      });
    } else {
      // No date filter — return all unbooked slots (backwards compat)
      availableSlots = profile.availableSlots.filter(slot => !slot.isBooked);
    }

    res.json({ ...profile.toObject(), availableSlots });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// @route  POST api/doctors/profile
// @desc   Create/update doctor profile (Doctor only)
router.post('/profile', auth, doctorAuth, async (req, res) => {
  try {
    let profile = await DoctorProfile.findOne({ doctor: req.user.id });
    
    if (profile) {
      // Update
      Object.assign(profile, req.body);
    } else {
      // Create
      profile = new DoctorProfile({
        doctor: req.user.id,
        ...req.body,
        availableSlots: [] // Add slots via separate API
      });
    }
    
    await profile.save();
    await profile.populate('doctor');
    
    res.json(profile);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;

