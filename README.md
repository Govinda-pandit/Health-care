# HealthSync - Telemedicine App 🚀

Professional MERN Stack project for final year engineering students.

## Features
- Multi-role auth (Doctor/Patient)
- Real-time video calls (ZegoCloud)
- Appointment booking with slot management
- PDF Prescriptions (jsPDF)
- AI Symptom checker
- Email notifications

## Tech Stack
- **Frontend:** React + Vite + TailwindCSS
- **Backend:** Node.js + Express + MongoDB (Mongoose)
- **Real-time:** Socket.io + ZegoCloud WebRTC
- **Auth:** JWT + bcrypt

## Quick Setup 

```bash
# Clone & Install
git clone <repo> && cd HealthSync
npm run install:all

# Backend (.env required)
cd backend
cp .env.example .env  # Fill MongoDB URI, JWT_SECRET, ZEGO_APP_ID
npm run dev  # port 5000

# Backend (new tab)
cd backend
node --watch server.js # port 5000

# Frontend (new tab)
cd frontend
npm run dev  # port 5173
```



## Environment Variables (.env)

```
MONGODB_URI=mongodb+srv://...
JWT_SECRET=your-super-secret-key
ZEGO_APP_ID=your_zego_app_id
ZEGO_SERVER_SECRET=your_zego_server_secret
EMAIL_USER=your@gmail.com
EMAIL_PASS=app-password
```

## Project Structure
```
├── backend/     # Express APIs
├── frontend/    # React App
├── TODO.md      # Progress tracker
└── README.md
```

## API Endpoints (Swagger/Postman)
- `POST /api/auth/register`
- `GET /api/doctors?specialty=...`
- `POST /api/appointments/book`

## Video Calls
1. Book appointment → Get meetingId
2. Join: `/video/${meetingId}`

## Deployment
- Backend: Railway/Heroku
- Frontend: Vercel/Netlify
- MongoDB: Atlas (free)

**Demo:** [localhost:5173](http://localhost:5173)

Made with ❤️ for major project submission!

