import { Request, Response } from 'express';
import { AuthService } from '../services/auth.service';
import { ValidationError, AuthenticationError } from '../utils/errors';

// Initialize auth service
const authService = new AuthService();

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const userData = {
      username: req.body.username,
      email: req.body.email,
      password: req.body.password,
    };

    const user = await authService.register(userData);
    res.status(201).json(user);
  } catch (error) {
    if (error instanceof ValidationError) {
      res.status(400).json({ message: error.message });
      return;
    }
    res.status(500).json({ message: 'Server error' });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const credentials = {
      email: req.body.email,
      password: req.body.password,
    };

    const user = await authService.login(credentials);
    res.json(user);
  } catch (error) {
    if (error instanceof AuthenticationError) {
      res.status(401).json({ message: error.message });
      return;
    }
    res.status(500).json({ message: 'Server error' });
  }
};