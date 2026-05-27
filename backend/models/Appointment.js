import mongoose from 'mongoose';

const appointmentSchema = new mongoose.Schema({
  patient: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  doctor: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  doctorProfile: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'DoctorProfile', 
    required: true 
  },
  date: { type: Date, required: true },
  time: { type: String, required: true },
  status: { 
    type: String, 
    enum: ['pending', 'confirmed', 'in-progress', 'completed', 'cancelled'], 
    default: 'pending' 
  },
  meetingId: { type: String, required: true },
  meetingLink: String,
  notes: String,
  prescription: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Prescription' 
  }
}, { timestamps: true });

export default mongoose.model('Appointment', appointmentSchema);

