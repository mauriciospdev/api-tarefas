import { execSync } from 'child_process';

// Aplica as migrations no banco de teste antes de rodar os testes
export default function globalSetup() {
  const url =
    process.env.TEST_DATABASE_URL ||
    'postgresql://postgres:postgres@localhost:5432/tarefas_test?schema=public';

  if (process.env.SKIP_MIGRATE === '1') return;

  execSync('npx prisma migrate deploy', {
    stdio: 'inherit',
    env: { ...process.env, DATABASE_URL: url },
  });
}
