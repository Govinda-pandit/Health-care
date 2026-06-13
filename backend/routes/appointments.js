import express from 'express';
const router = express.Router();
import Appointment from '../models/Appointment.js';
import DoctorProfile from '../models/DoctorProfile.js';
import { auth } from '../middleware/auth.js';

// ─────────────────────────────────────────────────────────────
// Helper: Compare two dates by UTC year/month/day only
// ─────────────────────────────────────────────────────────────
function sameUTCDate(a, b) {
  const da = new Date(a);
  const db = new Date(b);
  return (
    da.getUTCFullYear() === db.getUTCFullYear() &&
    da.getUTCMonth()    === db.getUTCMonth()    &&
    da.getUTCDate()     === db.getUTCDate()
  );
}

// ─────────────────────────────────────────────────────────────
// @route  POST /api/appointments/book
// @desc   Book an appointment slot
// ─────────────────────────────────────────────────────────────
router.post('/book', auth, async (req, res) => {
  try {
    const { doctorProfileId, date, time } = req.body;

    if (!doctorProfileId || !date || !time) {
      return res.status(400).json({ error: 'doctorProfileId, date, and time are required.' });
    }

    const doctorProfile = await DoctorProfile.findById(doctorProfileId);
    if (!doctorProfile) {
      return res.status(404).json({ error: 'Doctor not found.' });
    }

    // ✅ Fixed: compare UTC dates properly (no toDateString() — avoids IST shift issues)
    const slot = doctorProfile.availableSlots.find(
      (s) => sameUTCDate(s.date, date) && s.time === time && !s.isBooked
    );

    if (!slot) {
      return res.status(400).json({ error: 'Slot not available. It may already be booked or does not exist.' });
    }

    const patientId = req.user._id || req.user.id;

    // Mark slot as booked
    slot.isBooked = true;
    slot.bookedBy = patientId;
    await doctorProfile.save();

    // Create appointment record
    const meetingId = `healthsync_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const meetingLink = `${frontendUrl}/video/${meetingId}`;

    const appointment = new Appointment({
      patient:       patientId,
      doctor:        doctorProfile.doctor,
      doctorProfile: doctorProfileId,
      date:          new Date(date),
      time,
      meetingId,
      meetingLink,
    });

    await appointment.save();
    await appointment.populate([
      { path: 'patient',       select: 'name email' },
      { path: 'doctor',        select: 'name email' },
      { path: 'doctorProfile', select: 'specialty fees' },
    ]);

    res.status(201).json({
      message:     'Appointment booked successfully! 🎉',
      appointment,
      meetingLink,
    });
  } catch (error) {
    console.error('Booking error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ─────────────────────────────────────────────────────────────
// @route  GET /api/appointments/my
// @desc   Get current user's appointments (patient or doctor)
// ─────────────────────────────────────────────────────────────
router.get('/my', auth, async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const query = req.user.role === 'Doctor'
      ? { doctor: userId }
      : { patient: userId };

    const appointments = await Appointment.find(query)
      .populate('patient',       'name email')
      .populate('doctor',        'name email')
      .populate('doctorProfile', 'specialty fees doctor')
      .sort({ date: -1 });

    // Nested populate for doctorProfile.doctor name
    await DoctorProfile.populate(appointments, {
      path: 'doctorProfile.doctor',
      select: 'name',
    });

    res.json(appointments);
  } catch (error) {
    console.error('Fetch appointments error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ─────────────────────────────────────────────────────────────
// @route  PATCH /api/appointments/:id/status
// @desc   Update appointment status (Doctor only)
// ─────────────────────────────────────────────────────────────
router.patch('/:id/status', auth, async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['pending', 'confirmed', 'in-progress', 'completed', 'cancelled'];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: `Invalid status. Valid: ${validStatuses.join(', ')}` });
    }

    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) return res.status(404).json({ error: 'Appointment not found.' });

    const userId = (req.user._id || req.user.id).toString();
    const doctorId = appointment.doctor.toString();
    const patientId = appointment.patient.toString();

    // Only doctor or the patient can update
    if (userId !== doctorId && userId !== patientId) {
      return res.status(403).json({ error: 'Not authorized to update this appointment.' });
    }

    appointment.status = status;
    await appointment.save();

    res.json({ message: 'Status updated.', appointment });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
