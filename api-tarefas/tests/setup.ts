// Os testes usam um banco separado (tarefas_test) para não apagar os dados de desenvolvimento
process.env.DATABASE_URL =
  process.env.TEST_DATABASE_URL ||
  'postgresql://postgres:postgres@localhost:5432/tarefas_test?schema=public';
process.env.JWT_SECRET = 'segredo-para-testes';
