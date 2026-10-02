import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/env.js';
import { inMemoryDB } from '../db/database.js';

export interface AuthenticatedUser {
  id: string;
  email: string;
  role: 'requester' | 'donor' | 'doctor' | 'admin';
  full_name: string;
  phone: string;
  hospital_id?: string;
  doctor_id?: string;
}

export interface AuthRequest extends Request {
  user?: AuthenticatedUser;
}

export function authenticateToken(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    const payload = jwt.verify(token, config.jwtSecret) as AuthenticatedUser;
    
    // Enrich with doctor or hospital context if doctor
    if (payload.role === 'doctor') {
      const doctor = Array.from(inMemoryDB.doctors.values()).find(d => d.user_id === payload.id);
      if (doctor) {
        payload.doctor_id = doctor.id;
        payload.hospital_id = doctor.hospital_id;
      }
    }

    req.user = payload;
    next();
  } catch (err) {
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
}

export function requireRole(allowedRoles: Array<'requester' | 'donor' | 'doctor' | 'admin'>) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: `Access denied. Role '${req.user.role}' is not authorized for this resource.`
      });
    }

    next();
  };
}
