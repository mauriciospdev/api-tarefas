import request from 'supertest';
import { app } from '../src/app';
import { prisma } from '../src/prisma';

export const api = () => request(app);

// Limpa todas as tabelas antes de cada teste
export async function clearDatabase() {
  await prisma.$executeRawUnsafe(
    'TRUNCATE TABLE "tasks_history", "tasks", "team_members", "teams", "users" RESTART IDENTITY CASCADE',
  );
}

// Cria um usuário e faz login. O primeiro usuário criado é admin.
export async function createUserAndLogin(name: string, email: string) {
  const registerResponse = await api().post('/register').send({ name, email, password: '123456' });
  const loginResponse = await api().post('/login').send({ email, password: '123456' });

  return {
    id: registerResponse.body.id as number,
    token: loginResponse.body.token as string,
  };
}

export const authHeader = (token: string) => ({ Authorization: `Bearer ${token}` });
