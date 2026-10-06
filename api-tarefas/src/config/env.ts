import 'dotenv/config';

const databaseUrl = process.env.DATABASE_URL;
const jwtSecret = process.env.JWT_SECRET;

// Se faltar alguma variável importante, a aplicação nem inicia
if (!databaseUrl || !databaseUrl.startsWith('postgres')) {
  console.error('DATABASE_URL não definida ou inválida (precisa começar com postgresql://)');
  process.exit(1);
}

if (!jwtSecret) {
  console.error('JWT_SECRET não definida');
  process.exit(1);
}

export const env = {
  port: Number(process.env.PORT) || 3000,
  databaseUrl,
  jwtSecret,
};
