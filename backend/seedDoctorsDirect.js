import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

// Temporary Schemas (same as your actual models)
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['Patient', 'Doctor'], default: 'Patient' },
  phone: String,
  address: String,
  profileImage: String
}, { timestamps: true });

const doctorProfileSchema = new mongoose.Schema({
  doctor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  specialty: { type: String, required: true },
  experience: { type: Number, required: true, min: 0 },
  fees: { type: Number, required: true, min: 0 },
  bio: { type: String, maxlength: 500 },
  qualifications: [{ degree: String, year: Number }],
  availableSlots: [{
    date: { type: Date, required: true },
    time: { type: String, required: true },
    isBooked: { type: Boolean, default: false },
    bookedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  }],
  profileImage: { type: String, default: 'doctor-default.jpg' },
  rating: { type: Number, default: 0, min: 0, max: 5 },
  totalReviews: { type: Number, default: 0 },
  isOnline: { type: Boolean, default: false }
}, { timestamps: true });

const User = mongoose.model('User', userSchema);
const DoctorProfile = mongoose.model('DoctorProfile', doctorProfileSchema);

const doctorData = [
  // Cardiologists (4)
  { name: 'Dr. Priya Sharma', email: 'priya.sharma@healthsync.com', specialty: 'Cardiologist', experience: 12, fees: 800, bio: 'Senior Cardiologist, heart specialist.', qualifications: [{ degree: 'MBBS', year: 2010 }, { degree: 'MD - Cardiology', year: 2014 }], rating: 4.8, totalReviews: 124, isOnline: true },
  { name: 'Dr. Amit Verma', email: 'amit.verma@healthsync.com', specialty: 'Cardiologist', experience: 15, fees: 1000, bio: 'Interventional Cardiologist.', qualifications: [{ degree: 'MBBS', year: 2007 }, { degree: 'DM - Cardiology', year: 2012 }], rating: 4.9, totalReviews: 200, isOnline: false },
  { name: 'Dr. Sneha Reddy', email: 'sneha.reddy@healthsync.com', specialty: 'Cardiologist', experience: 8, fees: 700, bio: 'Non-invasive cardiology expert.', qualifications: [{ degree: 'MBBS', year: 2014 }, { degree: 'MD - Cardiology', year: 2018 }], rating: 4.6, totalReviews: 75, isOnline: true },
  { name: 'Dr. Rakesh Gupta', email: 'rakesh.gupta@healthsync.com', specialty: 'Cardiologist', experience: 20, fees: 1200, bio: 'Senior consultant, complex heart surgeries.', qualifications: [{ degree: 'MBBS', year: 2002 }, { degree: 'DM - Cardiology', year: 2007 }], rating: 4.9, totalReviews: 350, isOnline: true },
  
  // Dermatologists (4)
  { name: 'Dr. Rajesh Kumar', email: 'rajesh.kumar@healthsync.com', specialty: 'Dermatologist', experience: 8, fees: 600, bio: 'Skin specialist, acne and scar treatment.', qualifications: [{ degree: 'MBBS', year: 2014 }, { degree: 'MD - Dermatology', year: 2018 }], rating: 4.5, totalReviews: 89, isOnline: false },
  { name: 'Dr. Kavita Singh', email: 'kavita.singh@healthsync.com', specialty: 'Dermatologist', experience: 10, fees: 650, bio: 'Cosmetic dermatology and laser treatments.', qualifications: [{ degree: 'MBBS', year: 2012 }, { degree: 'MD - Dermatology', year: 2016 }], rating: 4.7, totalReviews: 110, isOnline: true },
  { name: 'Dr. Neha Malhotra', email: 'neha.malhotra@healthsync.com', specialty: 'Dermatologist', experience: 5, fees: 500, bio: 'Pediatric dermatology.', qualifications: [{ degree: 'MBBS', year: 2017 }, { degree: 'MD - Dermatology', year: 2021 }], rating: 4.3, totalReviews: 40, isOnline: true },
  { name: 'Dr. Sunil Dutt', email: 'sunil.dutt@healthsync.com', specialty: 'Dermatologist', experience: 14, fees: 750, bio: 'Skin allergies and infections.', qualifications: [{ degree: 'MBBS', year: 2008 }, { degree: 'MD - Dermatology', year: 2012 }], rating: 4.8, totalReviews: 160, isOnline: false },
  
  // Neurologists (4)
  { name: 'Dr. Anjali Gupta', email: 'anjali.gupta@healthsync.com', specialty: 'Neurologist', experience: 15, fees: 1000, bio: 'Stroke and epilepsy specialist.', qualifications: [{ degree: 'MBBS', year: 2007 }, { degree: 'MD - Neurology', year: 2011 }, { degree: 'DM - Neurology', year: 2014 }], rating: 4.9, totalReviews: 210, isOnline: true },
  { name: 'Dr. Vikas Jain', email: 'vikas.jain@healthsync.com', specialty: 'Neurologist', experience: 10, fees: 900, bio: 'Headache and migraine expert.', qualifications: [{ degree: 'MBBS', year: 2012 }, { degree: 'MD - Neurology', year: 2016 }], rating: 4.6, totalReviews: 95, isOnline: true },
  { name: 'Dr. Pooja Mehta', email: 'pooja.mehta@healthsync.com', specialty: 'Neurologist', experience: 7, fees: 800, bio: 'Movement disorders.', qualifications: [{ degree: 'MBBS', year: 2015 }, { degree: 'MD - Neurology', year: 2019 }], rating: 4.4, totalReviews: 55, isOnline: false },
  { name: 'Dr. Arjun Nair', email: 'arjun.nair@healthsync.com', specialty: 'Neurologist', experience: 18, fees: 1100, bio: 'Neuro-muscular diseases.', qualifications: [{ degree: 'MBBS', year: 2004 }, { degree: 'DM - Neurology', year: 2009 }], rating: 4.9, totalReviews: 280, isOnline: true },
  
  // Dentists (4)
  { name: 'Dr. Vikram Singh', email: 'vikram.singh@healthsync.com', specialty: 'Dentist', experience: 10, fees: 500, bio: 'Root canal and cosmetic dentistry.', qualifications: [{ degree: 'BDS', year: 2012 }, { degree: 'MDS - Conservative Dentistry', year: 2016 }], rating: 4.3, totalReviews: 45, isOnline: true },
  { name: 'Dr. Ritu Sharma', email: 'ritu.sharma@healthsync.com', specialty: 'Dentist', experience: 6, fees: 400, bio: 'Pediatric dentist.', qualifications: [{ degree: 'BDS', year: 2016 }, { degree: 'MDS - Pedodontics', year: 2020 }], rating: 4.5, totalReviews: 30, isOnline: true },
  { name: 'Dr. Karan Kapoor', email: 'karan.kapoor@healthsync.com', specialty: 'Dentist', experience: 12, fees: 550, bio: 'Oral surgery and implants.', qualifications: [{ degree: 'BDS', year: 2010 }, { degree: 'MDS - Oral Surgery', year: 2014 }], rating: 4.7, totalReviews: 70, isOnline: false },
  { name: 'Dr. Anu George', email: 'anu.george@healthsync.com', specialty: 'Dentist', experience: 4, fees: 350, bio: 'General dentistry.', qualifications: [{ degree: 'BDS', year: 2018 }], rating: 4.2, totalReviews: 20, isOnline: true },
  
  // General Physicians (4)
  { name: 'Dr. Meera Nair', email: 'meera.nair@healthsync.com', specialty: 'General Physician', experience: 20, fees: 400, bio: 'Family physician, all age groups.', qualifications: [{ degree: 'MBBS', year: 2002 }, { degree: 'MD - General Medicine', year: 2006 }], rating: 4.7, totalReviews: 315, isOnline: true },
  { name: 'Dr. Suresh Iyer', email: 'suresh.iyer@healthsync.com', specialty: 'General Physician', experience: 25, fees: 500, bio: 'Internal medicine specialist.', qualifications: [{ degree: 'MBBS', year: 1997 }, { degree: 'MD - Internal Medicine', year: 2001 }], rating: 4.8, totalReviews: 400, isOnline: true },
  { name: 'Dr. Poonam Mishra', email: 'poonam.mishra@healthsync.com', specialty: 'General Physician', experience: 12, fees: 350, bio: 'Preventive health checkups.', qualifications: [{ degree: 'MBBS', year: 2010 }, { degree: 'MD - Preventive Medicine', year: 2014 }], rating: 4.6, totalReviews: 150, isOnline: true },
  { name: 'Dr. Alok Ranjan', email: 'alok.ranjan@healthsync.com', specialty: 'General Physician', experience: 8, fees: 300, bio: 'General practitioner, common illnesses.', qualifications: [{ degree: 'MBBS', year: 2014 }], rating: 4.5, totalReviews: 60, isOnline: false }
];

const seedDoctors = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ DB Connected for seeding...');

    // Clear existing doctor users and profiles
    await User.deleteMany({ role: { $in: ['doctor', 'Doctor'] } });
    await DoctorProfile.deleteMany({});
    console.log('🧹 Cleared existing doctors and profiles');

    const createdUsers = [];
    const defaultPassword = 'password123';

    for (const doc of doctorData) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(defaultPassword, salt);

      const user = await User.create({
        name: doc.name,
        email: doc.email,
        password: hashedPassword,
        role: 'Doctor',
        phone: `98765${Math.floor(100000 + Math.random() * 900000)}`,
        address: 'India',
        profileImage: `${doc.name.toLowerCase().replace(/ /g, '-')}.jpg`
      });

      createdUsers.push({ user, doc });
      console.log(`👤 Created user: ${user.email}`);
    }

    for (const { user, doc } of createdUsers) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dayAfter = new Date();
      dayAfter.setDate(dayAfter.getDate() + 2);

      await DoctorProfile.create({
        doctor: user._id,
        specialty: doc.specialty,
        experience: doc.experience,
        fees: doc.fees,
        bio: doc.bio,
        qualifications: doc.qualifications,
        availableSlots: [
          { date: tomorrow, time: '10:00-11:00', isBooked: false },
          { date: tomorrow, time: '11:00-12:00', isBooked: false },
          { date: dayAfter, time: '14:00-15:00', isBooked: false }
        ],
        profileImage: `${user.name.toLowerCase().replace(/ /g, '-')}-profile.jpg`,
        rating: doc.rating,
        totalReviews: doc.totalReviews,
        isOnline: doc.isOnline
      });

      console.log(`🩺 Created profile for: ${doc.name} (${doc.specialty})`);
    }

    console.log(`🎉 Seeding complete! ${doctorData.length} doctors added.`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
};

seedDoctors();