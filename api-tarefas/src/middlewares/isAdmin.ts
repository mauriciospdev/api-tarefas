import { NextFunction, Request, Response } from 'express';

// Usar depois do middleware "auth"
export function isAdmin(req: Request, res: Response, next: NextFunction) {
  if (req.user.role !== 'admin') {
    res.status(403).json({ message: 'Apenas administradores podem fazer isso' });
    return;
  }
  next();
}
