import express from 'express';
const router = express.Router();
import Appointment from '../models/Appointment.js';
import DoctorProfile from '../models/DoctorProfile.js';
import { auth } from '../middleware/auth.js';

// @route  POST api/appointments/book
// @desc   Book appointment
router.post('/book', auth, async (req, res) => {
  try {
    const { doctorProfileId, date, time } = req.body;

    // Find and check slot
    const doctorProfile = await DoctorProfile.findById(doctorProfileId);
    if (!doctorProfile) {
      return res.status(404).json({ error: 'Doctor not found' });
    }

    const slot = doctorProfile.availableSlots.find(
      s => new Date(s.date).toDateString() === new Date(date).toDateString() &&
           s.time === time && !s.isBooked
    );

    if (!slot) {
      return res.status(400).json({ error: 'Slot not available' });
    }

    // Book slot
    slot.isBooked = true;
    slot.bookedBy = req.user.id;
    await doctorProfile.save();

    // Create appointment
    const meetingId = `healthsync_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const meetingLink = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/video/${meetingId}`;

    const appointment = new Appointment({
      patient: req.user.id,
      doctor: doctorProfile.doctor,
      doctorProfile: doctorProfileId,
      date: new Date(date),
      time,
      meetingId,
      meetingLink,  // ✅ ab database mein bhi save hogi
    });

    await appointment.save();
    await appointment.populate(['patient', 'doctor', 'doctorProfile']);

    res.status(201).json({
      message: 'Appointment booked successfully!',
      appointment,
      meetingLink,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// @route  GET api/appointments/my
// @desc   Get my appointments
router.get('/my', auth, async (req, res) => {
  try {
    const query = req.user.role === 'Doctor' 
      ? { doctor: req.user.id }
      : { patient: req.user.id };

    const appointments = await Appointment.find(query)
      .populate('patient', 'name')
      .populate('doctor', 'name')
      .populate('doctorProfile', 'specialty fees')
      .sort({ date: -1 });

    res.json(appointments);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;

