import express from 'express';
const router = express.Router();
import Prescription from '../models/Prescription.js';
import Appointment from '../models/Appointment.js';
import { auth, doctorAuth } from '../middleware/auth.js';
import fs from 'fs';
import path from 'path';

// @route  POST api/prescriptions/:appointmentId
// @desc   Create prescription for appointment (Doctor only)
router.post('/:appointmentId', auth, doctorAuth, async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.appointmentId)
      .populate('patient', 'name');

    if (!appointment || appointment.doctor.toString() !== req.user.id.toString()) {
      return res.status(403).json({ error: 'Access denied' });
    }

    if (appointment.status !== 'in-progress' && appointment.status !== 'completed') {
      return res.status(400).json({ error: 'Invalid appointment status' });
    }

    const prescription = new Prescription({
      appointment: req.params.appointmentId,
      patientName: appointment.patient.name,
      doctorName: req.user.name,
      ...req.body
    });

    await prescription.save();
    
    // Update appointment
    appointment.prescription = prescription._id;
    appointment.status = 'completed';
    await appointment.save();

    // Frontend will generate PDF client-side, here just data
    res.json({ 
      message: 'Prescription created!',
      prescriptionId: prescription._id,
      downloadUrl: `/prescriptions/${prescription._id}.pdf` 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// @route  GET api/prescriptions/:id
// @desc   Get prescription by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const prescription = await Prescription.findById(req.params.id)
      .populate('appointment');

    if (!prescription || 
        (prescription.appointment.patient.toString() !== req.user.id.toString() &&
         prescription.appointment.doctor.toString() !== req.user.id.toString())) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json(prescription);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;

