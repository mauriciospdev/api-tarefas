import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { prisma, userSelect } from '../prisma';

// Verifica o token JWT enviado no header "Authorization: Bearer <token>"
export async function auth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;

  if (!header || !header.startsWith('Bearer ')) {
    res.status(401).json({ message: 'Token não enviado' });
    return;
  }

  let userId: number;
  try {
    const payload = jwt.verify(header.replace('Bearer ', ''), env.jwtSecret) as { id: number };
    userId = payload.id;
  } catch {
    res.status(401).json({ message: 'Token inválido ou expirado' });
    return;
  }

  const user = await prisma.user.findUnique({ where: { id: userId }, select: userSelect });
  if (!user) {
    res.status(401).json({ message: 'Usuário não encontrado' });
    return;
  }

  req.user = user;
  next();
}
