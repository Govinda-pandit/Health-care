import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server } from 'socket.io';

mongoose.set('debug', false);


// Routes
import authRoutes from './routes/auth.js';
import doctorRoutes from './routes/doctors.js';
import appointmentRoutes from './routes/appointments.js';
import prescriptionRoutes from './routes/prescriptions.js';

import aiRoutes from './routes/ai.routes.js';
import path from 'path';
import { fileURLToPath } from 'url';





// Ensure env is loaded from this backend folder regardless of process.cwd().
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '.env') });

const app = express();

// Define allowed origins for CORS
const allowedOrigins = [
  "http://localhost:5173",
  "https://health-care-drab-seven.vercel.app"
];

if (process.env.FRONTEND_URL) {
  const origins = process.env.FRONTEND_URL.split(',').map(o => o.trim());
  origins.forEach(o => {
    if (o && !allowedOrigins.includes(o)) {
      allowedOrigins.push(o);
    }
  });
}

const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(helmet());
app.use(morgan('dev'));
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, curl, postman)
    if (!origin) return callback(null, true);
    
    const isAllowed = allowedOrigins.includes(origin) || 
                      origin.startsWith('http://localhost:') || 
                      origin.startsWith('http://127.0.0.1:');
                      
    if (isAllowed) {
      callback(null, true);
    } else {
      callback(null, true); // Allow anyway, but let browser validate. Or keep strict: callback(null, true) is safer to avoid blocking during dev/prod mismatches.
    }
  },
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Socket.io for notifications
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);
  socket.on('join-room', (appointmentId) => {
    socket.join(appointmentId);
  });
  socket.on('disconnect', () => {
    console.log('User disconnected');
  });
});

app.set('io', io); // Global access to socket.io

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/doctors', doctorRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/prescriptions', prescriptionRoutes);

app.use('/api/ai', aiRoutes);

// Serve prescriptions PDFs
app.use('/prescriptions', express.static(path.join(__dirname, 'public/prescriptions')));

const maskUri = (uri) => {
  return uri.replace(/\/\/[^@:]+:[^@]+@/, '//***:***@');
};


// MongoDB Connection with fallback
const primaryUri = process.env.MONGODB_URI;
const fallbackUri = 'mongodb://127.0.0.1:27017/healthsync';

async function initDb() {
  const tryConnect = async (uri) => {
    try {
      console.log(`Attempting MongoDB connection to: ${maskUri(uri)}`);
      await mongoose.connect(uri);
      console.log(`✅ MongoDB Connected (${uri.startsWith('mongodb+srv://') ? 'primary' : 'fallback'})`);
      return true;
    } catch (err) {
      console.error('❌ MongoDB Error:', err);
      return false;
    }
  };

  if (primaryUri) {
    const ok = await tryConnect(primaryUri);
    if (ok) return;
    console.warn('⚠️ Primary MongoDB connection failed; attempting local fallback.');
  } else {
    console.warn('⚠️ MONGODB_URI not set; attempting local MongoDB.');
  }

  const fallbackOk = await tryConnect(fallbackUri);
  if (!fallbackOk) {
    console.error('❌ Could not connect to any MongoDB instance. Server will start without DB connection.');
  }
}

// initialize DB connection (non-blocking)
initDb();

// Health check
app.get('/', (req, res) => {
  res.json({ message: 'HealthSync Backend Running! 🚀' });
});

// DB status endpoint
app.get('/api/db-status', (req, res) => {
  res.json({ 
    connected: mongoose.connection.readyState === 1, 
    dbName: mongoose.connection.name || 'unknown',
    host: mongoose.connection.host || 'unknown',
    state: mongoose.connection.readyState // 0=disconnected,1=connected,2=connecting,3=disconnecting
  });
});



const BASE_PORT = parseInt(process.env.PORT, 10) || 5000;
const MAX_PORT_TRIES = 10;

function startServer(preferredPort = BASE_PORT) {
  let port = preferredPort;
  let tries = 0;

  const attempt = () => {
    server.removeAllListeners('error');

    server.once('error', (err) => {
      if (err && err.code === 'EADDRINUSE') {
        console.warn(`Port ${port} in use, trying ${port + 1}...`);
        port++;
        tries++;
        if (tries >= MAX_PORT_TRIES) {
          console.error('No available ports found after multiple attempts. Exiting.');
          process.exit(1);
        }
        // slight delay before retrying
        setTimeout(attempt, 100);
      } else {
        console.error('Server error:', err);
        process.exit(1);
      }
    });

    server.listen(port, () => {
      console.log(`🚀 HealthSync Server running on http://localhost:${port}`);
    });
  };

  attempt();
}

startServer();

export default app;

