import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import { env } from './config/env';

const adapter = new PrismaPg({ connectionString: env.databaseUrl });

export const prisma = new PrismaClient({ adapter });

// Campos do usuário que podem ser devolvidos (sem a senha)
export const userSelect = { id: true, name: true, email: true, role: true };
