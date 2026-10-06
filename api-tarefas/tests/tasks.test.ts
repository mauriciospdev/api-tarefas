import { prisma } from '../src/prisma';
import { api, authHeader, clearDatabase, createUserAndLogin } from './helpers';

beforeEach(clearDatabase);
afterAll(() => prisma.$disconnect());

// Cria: admin, dois membros (ana e bruno) no mesmo time, e um time vazio
async function setup() {
  const admin = await createUserAndLogin('Admin', 'admin@email.com');
  const ana = await createUserAndLogin('Ana', 'ana@email.com');
  const bruno = await createUserAndLogin('Bruno', 'bruno@email.com');

  const team = await api().post('/teams').set(authHeader(admin.token)).send({ name: 'Time' });
  const emptyTeam = await api().post('/teams').set(authHeader(admin.token)).send({ name: 'Vazio' });

  for (const user of [ana, bruno]) {
    await api()
      .post(`/teams/${team.body.id}/members`)
      .set(authHeader(admin.token))
      .send({ userId: user.id });
  }

  return {
    admin,
    ana,
    bruno,
    teamId: team.body.id as number,
    emptyTeamId: emptyTeam.body.id as number,
  };
}

describe('Tarefas', () => {
  it('admin cria tarefa atribuída a um membro do time', async () => {
    const { admin, ana, teamId } = await setup();

    const response = await api()
      .post('/tasks')
      .set(authHeader(admin.token))
      .send({ title: 'Fazer login', teamId, assignedTo: ana.id, priority: 'high' });

    expect(response.status).toBe(201);
    expect(response.body.status).toBe('pending');
    expect(response.body.priority).toBe('high');
    expect(response.body.assignedTo).toBe(ana.id);
  });

  it('não atribui tarefa para quem não está no time', async () => {
    const { admin, ana, emptyTeamId } = await setup();

    const response = await api()
      .post('/tasks')
      .set(authHeader(admin.token))
      .send({ title: 'Tarefa', teamId: emptyTeamId, assignedTo: ana.id });

    expect(response.status).toBe(400);
  });

  it('valida os dados da tarefa', async () => {
    const { admin, teamId } = await setup();

    const response = await api()
      .post('/tasks')
      .set(authHeader(admin.token))
      .send({ title: '', teamId, priority: 'urgente' });

    expect(response.status).toBe(400);
  });

  it('membro não pode criar, excluir nem atribuir tarefas', async () => {
    const { admin, ana, teamId } = await setup();
    const task = await api()
      .post('/tasks')
      .set(authHeader(admin.token))
      .send({ title: 'Tarefa', teamId, assignedTo: ana.id });

    const create = await api()
      .post('/tasks')
      .set(authHeader(ana.token))
      .send({ title: 'X', teamId });
    const remove = await api().delete(`/tasks/${task.body.id}`).set(authHeader(ana.token));
    const assign = await api()
      .patch(`/tasks/${task.body.id}/assign`)
      .set(authHeader(ana.token))
      .send({ assignedTo: ana.id });

    expect(create.status).toBe(403);
    expect(remove.status).toBe(403);
    expect(assign.status).toBe(403);
  });

  it('membro só vê as tarefas do time dele', async () => {
    const { admin, ana, teamId, emptyTeamId } = await setup();
    await api().post('/tasks').set(authHeader(admin.token)).send({ title: 'Do time', teamId });
    await api()
      .post('/tasks')
      .set(authHeader(admin.token))
      .send({ title: 'De outro time', teamId: emptyTeamId });

    const asMember = await api().get('/tasks').set(authHeader(ana.token));
    const asAdmin = await api().get('/tasks').set(authHeader(admin.token));

    expect(asMember.body).toHaveLength(1);
    expect(asMember.body[0].title).toBe('Do time');
    expect(asAdmin.body).toHaveLength(2);
  });

  it('membro edita a própria tarefa, mas não a de outro membro', async () => {
    const { admin, ana, bruno, teamId } = await setup();
    const anaTask = await api()
      .post('/tasks')
      .set(authHeader(admin.token))
      .send({ title: 'Da Ana', teamId, assignedTo: ana.id });
    const brunoTask = await api()
      .post('/tasks')
      .set(authHeader(admin.token))
      .send({ title: 'Do Bruno', teamId, assignedTo: bruno.id });

    const own = await api()
      .put(`/tasks/${anaTask.body.id}`)
      .set(authHeader(ana.token))
      .send({ title: 'Novo título' });
    const other = await api()
      .put(`/tasks/${brunoTask.body.id}`)
      .set(authHeader(ana.token))
      .send({ title: 'Invadindo' });

    expect(own.status).toBe(200);
    expect(own.body.title).toBe('Novo título');
    expect(other.status).toBe(403);
  });

  it('filtra tarefas por status e prioridade', async () => {
    const { admin, teamId } = await setup();
    const h = authHeader(admin.token);
    await api().post('/tasks').set(h).send({ title: 'A', teamId, priority: 'high' });
    const b = await api().post('/tasks').set(h).send({ title: 'B', teamId, priority: 'low' });
    await api().put(`/tasks/${b.body.id}`).set(h).send({ status: 'in-progress' });

    const byStatus = await api().get('/tasks?status=in-progress').set(h);
    const byPriority = await api().get('/tasks?priority=high').set(h);

    expect(byStatus.body.map((t: { title: string }) => t.title)).toEqual(['B']);
    expect(byPriority.body.map((t: { title: string }) => t.title)).toEqual(['A']);
  });

  it('admin atribui a tarefa a outro membro', async () => {
    const { admin, bruno, teamId } = await setup();
    const task = await api()
      .post('/tasks')
      .set(authHeader(admin.token))
      .send({ title: 'T', teamId });

    const response = await api()
      .patch(`/tasks/${task.body.id}/assign`)
      .set(authHeader(admin.token))
      .send({ assignedTo: bruno.id });

    expect(response.status).toBe(200);
    expect(response.body.assignedTo).toBe(bruno.id);
  });

  it('salva o histórico quando o status muda', async () => {
    const { admin, ana, teamId } = await setup();
    const task = await api()
      .post('/tasks')
      .set(authHeader(admin.token))
      .send({ title: 'T', teamId, assignedTo: ana.id });
    const url = `/tasks/${task.body.id}`;

    await api().put(url).set(authHeader(ana.token)).send({ status: 'in-progress' });
    await api().put(url).set(authHeader(ana.token)).send({ title: 'Mudou só o título' });
    await api().put(url).set(authHeader(ana.token)).send({ status: 'completed' });

    const history = await api().get(`${url}/history`).set(authHeader(ana.token));
    const changes = history.body.map((h: { oldStatus: string | null; newStatus: string }) => [
      h.oldStatus,
      h.newStatus,
    ]);

    expect(changes).toEqual([
      [null, 'pending'],
      ['pending', 'in-progress'],
      ['in-progress', 'completed'],
    ]);
    expect(history.body[1].changedBy).toBe(ana.id);
  });
});
