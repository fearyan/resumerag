import express, { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import pool from '../database/pool';
import { config } from '../config';
import { AppError, asyncHandler } from '../middleware/errorHandler';

const router = express.Router();

// POST /api/auth/register
router.post('/register', asyncHandler(async (req: Request, res: Response) => {
  const { email, password, role = 'user' } = req.body;
  
  // Validation
  if (!email || !password) {
    throw new AppError('FIELD_REQUIRED', 'Email and password are required', 400, !email ? 'email' : 'password');
  }
  
  const emailRegex = /^[\w\.-]+@[\w\.-]+\.\w+$/;
  if (!emailRegex.test(email)) {
    throw new AppError('INVALID_EMAIL', 'Invalid email format', 400, 'email');
  }
  
  if (password.length < 6) {
    throw new AppError('INVALID_PASSWORD', 'Password must be at least 6 characters', 400, 'password');
  }
  
  const validRoles = ['user', 'recruiter', 'admin'];
  if (!validRoles.includes(role)) {
    throw new AppError('INVALID_ROLE', 'Role must be user, recruiter, or admin', 400, 'role');
  }
  
  // Check if user exists
  const existingUser = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
  if (existingUser.rows.length > 0) {
    throw new AppError('USER_EXISTS', 'User with this email already exists', 409, 'email');
  }
  
  // Hash password
  const passwordHash = await bcrypt.hash(password, 10);
  
  // Create user
  const result = await pool.query(
    'INSERT INTO users (email, password_hash, role) VALUES ($1, $2, $3) RETURNING id, email, role, created_at',
    [email, passwordHash, role]
  );
  
  const user = result.rows[0];
  
  // Generate JWT
  const token = jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    config.jwtSecret,
    { expiresIn: '7d' }
  );
  
  res.status(201).json({
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
    },
    token,
  });
}));

// POST /api/auth/login
router.post('/login', asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;
  
  // Validation
  if (!email || !password) {
    throw new AppError('FIELD_REQUIRED', 'Email and password are required', 400, !email ? 'email' : 'password');
  }
  
  // Find user
  const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
  
  if (result.rows.length === 0) {
    throw new AppError('INVALID_CREDENTIALS', 'Invalid email or password', 401);
  }
  
  const user = result.rows[0];
  
  // Verify password
  const isValid = await bcrypt.compare(password, user.password_hash);
  
  if (!isValid) {
    throw new AppError('INVALID_CREDENTIALS', 'Invalid email or password', 401);
  }
  
  // Generate JWT
  const token = jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    config.jwtSecret,
    { expiresIn: '7d' }
  );
  
  res.json({
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
    },
    token,
  });
}));

export default router;
