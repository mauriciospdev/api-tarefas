import { prisma } from '../src/prisma';
import { api, authHeader, clearDatabase, createUserAndLogin } from './helpers';

beforeEach(clearDatabase);
afterAll(() => prisma.$disconnect());

describe('Times', () => {
  it('admin cria, edita e exclui time', async () => {
    const admin = await createUserAndLogin('Admin', 'admin@email.com');

    const created = await api()
      .post('/teams')
      .set(authHeader(admin.token))
      .send({ name: 'Backend', description: 'Time da API' });
    expect(created.status).toBe(201);

    const updated = await api()
      .put(`/teams/${created.body.id}`)
      .set(authHeader(admin.token))
      .send({ name: 'Backend 2' });
    expect(updated.body.name).toBe('Backend 2');

    const deleted = await api().delete(`/teams/${created.body.id}`).set(authHeader(admin.token));
    expect(deleted.status).toBe(204);
  });

  it('membro não pode criar time', async () => {
    await createUserAndLogin('Admin', 'admin@email.com');
    const member = await createUserAndLogin('Membro', 'membro@email.com');

    const response = await api()
      .post('/teams')
      .set(authHeader(member.token))
      .send({ name: 'Time do membro' });

    expect(response.status).toBe(403);
  });

  it('admin adiciona e remove membros do time', async () => {
    const admin = await createUserAndLogin('Admin', 'admin@email.com');
    const member = await createUserAndLogin('Membro', 'membro@email.com');
    const team = await api().post('/teams').set(authHeader(admin.token)).send({ name: 'Time' });

    const added = await api()
      .post(`/teams/${team.body.id}/members`)
      .set(authHeader(admin.token))
      .send({ userId: member.id });
    expect(added.status).toBe(201);

    const duplicated = await api()
      .post(`/teams/${team.body.id}/members`)
      .set(authHeader(admin.token))
      .send({ userId: member.id });
    expect(duplicated.status).toBe(409);

    const removed = await api()
      .delete(`/teams/${team.body.id}/members/${member.id}`)
      .set(authHeader(admin.token));
    expect(removed.status).toBe(204);
  });

  it('membro não pode adicionar membros', async () => {
    const admin = await createUserAndLogin('Admin', 'admin@email.com');
    const member = await createUserAndLogin('Membro', 'membro@email.com');
    const team = await api().post('/teams').set(authHeader(admin.token)).send({ name: 'Time' });

    const response = await api()
      .post(`/teams/${team.body.id}/members`)
      .set(authHeader(member.token))
      .send({ userId: member.id });

    expect(response.status).toBe(403);
  });

  it('membro lista os membros do próprio time, mas não de outro', async () => {
    const admin = await createUserAndLogin('Admin', 'admin@email.com');
    const member = await createUserAndLogin('Membro', 'membro@email.com');
    const myTeam = await api().post('/teams').set(authHeader(admin.token)).send({ name: 'Meu' });
    const otherTeam = await api()
      .post('/teams')
      .set(authHeader(admin.token))
      .send({ name: 'Outro' });
    await api()
      .post(`/teams/${myTeam.body.id}/members`)
      .set(authHeader(admin.token))
      .send({ userId: member.id });

    const mine = await api().get(`/teams/${myTeam.body.id}/members`).set(authHeader(member.token));
    const other = await api()
      .get(`/teams/${otherTeam.body.id}/members`)
      .set(authHeader(member.token));

    expect(mine.status).toBe(200);
    expect(mine.body).toHaveLength(1);
    expect(other.status).toBe(403);
  });
});
