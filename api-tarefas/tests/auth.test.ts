import { prisma } from '../src/prisma';
import { api, authHeader, clearDatabase, createUserAndLogin } from './helpers';

beforeEach(clearDatabase);
afterAll(() => prisma.$disconnect());

describe('Autenticação', () => {
  it('o primeiro usuário vira admin e os outros viram member', async () => {
    const first = await api()
      .post('/register')
      .send({ name: 'Maria', email: 'maria@email.com', password: '123456' });
    const second = await api()
      .post('/register')
      .send({ name: 'João', email: 'joao@email.com', password: '123456' });

    expect(first.status).toBe(201);
    expect(first.body.role).toBe('admin');
    expect(first.body.password).toBeUndefined();
    expect(second.body.role).toBe('member');
  });

  it('não deixa cadastrar o mesmo e-mail duas vezes', async () => {
    const body = { name: 'Maria', email: 'maria@email.com', password: '123456' };
    await api().post('/register').send(body);

    const response = await api().post('/register').send(body);

    expect(response.status).toBe(409);
  });

  it('retorna 400 com dados inválidos', async () => {
    const response = await api().post('/register').send({ name: 'M', email: 'abc', password: '1' });

    expect(response.status).toBe(400);
  });

  it('faz login e retorna o token', async () => {
    await createUserAndLogin('Maria', 'maria@email.com');

    const response = await api()
      .post('/login')
      .send({ email: 'maria@email.com', password: '123456' });

    expect(response.status).toBe(200);
    expect(response.body.token).toBeDefined();
  });

  it('retorna 401 com senha errada', async () => {
    await createUserAndLogin('Maria', 'maria@email.com');

    const response = await api()
      .post('/login')
      .send({ email: 'maria@email.com', password: 'errada' });

    expect(response.status).toBe(401);
  });

  it('bloqueia rotas protegidas sem token ou com token inválido', async () => {
    expect((await api().get('/tasks')).status).toBe(401);
    expect((await api().get('/tasks').set(authHeader('token-falso'))).status).toBe(401);
  });

  it('só admin lista usuários', async () => {
    const admin = await createUserAndLogin('Admin', 'admin@email.com');
    const member = await createUserAndLogin('Membro', 'membro@email.com');

    const asAdmin = await api().get('/users').set(authHeader(admin.token));
    const asMember = await api().get('/users').set(authHeader(member.token));

    expect(asAdmin.status).toBe(200);
    expect(asAdmin.body).toHaveLength(2);
    expect(asMember.status).toBe(403);
  });
});
