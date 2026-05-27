import mongoose from 'mongoose';

const doctorProfileSchema = new mongoose.Schema({
  doctor: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: [true, 'Doctor is required'] 
  },
  specialty: { type: String, required: [true, 'Specialty is required'] },
  experience: { type: Number, required: [true, 'Experience is required'], min: 0 },
  fees: { type: Number, required: [true, 'Fees are required'], min: 0 },
  bio: { type: String, maxlength: 500 },
  qualifications: [{
    degree: String,
    year: Number
  }],
  availableSlots: [{
    date: { type: Date, required: true },
    time: { type: String, required: true }, // e.g., '10:00-11:00'
    isBooked: { type: Boolean, default: false },
    bookedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  }],
  profileImage: { type: String, default: 'doctor-default.jpg' },
  rating: { type: Number, default: 0, min: 0, max: 5 },
  totalReviews: { type: Number, default: 0 },
  isOnline: { type: Boolean, default: false }
}, { timestamps: true });

export default mongoose.model('DoctorProfile', doctorProfileSchema);

