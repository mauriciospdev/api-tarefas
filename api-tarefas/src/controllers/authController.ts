import bcrypt from 'bcryptjs';
import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { prisma, userSelect } from '../prisma';
import { loginSchema, registerSchema } from '../schemas';

export async function register(req: Request, res: Response) {
  const { name, email, password } = registerSchema.parse(req.body);

  const userExists = await prisma.user.findUnique({ where: { email } });
  if (userExists) {
    res.status(409).json({ message: 'E-mail já cadastrado' });
    return;
  }

  // O primeiro usuário cadastrado vira administrador, os outros são membros
  const totalUsers = await prisma.user.count();
  const role = totalUsers === 0 ? 'admin' : 'member';

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: { name, email, password: hashedPassword, role },
    select: userSelect,
  });

  res.status(201).json(user);
}

export async function login(req: Request, res: Response) {
  const { email, password } = loginSchema.parse(req.body);

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    res.status(401).json({ message: 'E-mail ou senha inválidos' });
    return;
  }

  const passwordIsValid = await bcrypt.compare(password, user.password);
  if (!passwordIsValid) {
    res.status(401).json({ message: 'E-mail ou senha inválidos' });
    return;
  }

  const token = jwt.sign({ id: user.id }, env.jwtSecret, { expiresIn: '1d' });

  res.json({
    token,
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
  });
}
