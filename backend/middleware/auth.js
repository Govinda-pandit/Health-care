import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'No token, authorization denied' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');
    
    if (!user) {
      return res.status(401).json({ error: 'Token is not valid' });
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Token is not valid' });
  }
};

export const doctorAuth = (req, res, next) => {
  if (req.user.role !== 'Doctor') {
    return res.status(403).json({ error: 'Doctor access only' });
  }
  next();
};

export const patientAuth = (req, res, next) => {
  if (req.user.role !== 'Patient') {
    return res.status(403).json({ error: 'Patient access only' });
  }
  next();
};

export default { auth, doctorAuth, patientAuth };

