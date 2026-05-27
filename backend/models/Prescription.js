import mongoose from 'mongoose';

const prescriptionSchema = new mongoose.Schema({
  appointment: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Appointment', 
    required: true 
  },
  patientName: { type: String, required: true },
  doctorName: { type: String, required: true },
  medicines: [{
    name: { type: String, required: true },
    dosage: { type: String, required: true },
    duration: String,
    instructions: String
  }],
  diagnosis: String,
  notes: String,
  followUpDate: Date
}, { timestamps: true });

prescriptionSchema.index({ appointment: 1 });

export default mongoose.model('Prescription', prescriptionSchema);

