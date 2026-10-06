import { Prisma, Task } from '@prisma/client';
import { Request, Response } from 'express';
import { prisma } from '../prisma';
import {
  assignTaskSchema,
  createTaskSchema,
  idSchema,
  listTasksQuerySchema,
  updateTaskSchema,
} from '../schemas';
import { isInTeam } from '../services/teamService';
import { toApiStatus, toDbStatus } from '../utils/status';

// Troca o status do banco ("in_progress") pelo da API ("in-progress")
function formatTask(task: Task) {
  return { ...task, status: toApiStatus(task.status) };
}

// Busca a tarefa, mas só se o usuário puder ver (admin vê tudo, membro só do time dele)
async function findTaskForUser(id: number, user: Request['user']) {
  const task = await prisma.task.findUnique({ where: { id } });

  if (!task) return null;

  if (user.role !== 'admin' && !(await isInTeam(user.id, task.teamId))) {
    return null;
  }

  return task;
}

// Só admin
export async function createTask(req: Request, res: Response) {
  const data = createTaskSchema.parse(req.body);

  const team = await prisma.team.findUnique({ where: { id: data.teamId } });
  if (!team) {
    res.status(404).json({ message: 'Time não encontrado' });
    return;
  }

  if (data.assignedTo && !(await isInTeam(data.assignedTo, data.teamId))) {
    res.status(400).json({ message: 'O responsável precisa ser membro do time' });
    return;
  }

  const task = await prisma.task.create({
    data: {
      title: data.title,
      description: data.description,
      priority: data.priority,
      teamId: data.teamId,
      assignedTo: data.assignedTo,
      status: 'pending',
      // já cria o primeiro registro do histórico
      history: { create: { changedBy: req.user.id, oldStatus: null, newStatus: 'pending' } },
    },
  });

  res.status(201).json(formatTask(task));
}

export async function listTasks(req: Request, res: Response) {
  const { status, priority } = listTasksQuerySchema.parse(req.query);

  const where: Prisma.TaskWhereInput = {};

  if (status) where.status = toDbStatus(status);
  if (priority) where.priority = priority;

  // Membro só vê as tarefas dos times em que está
  if (req.user.role !== 'admin') {
    where.team = { members: { some: { userId: req.user.id } } };
  }

  const tasks = await prisma.task.findMany({ where, orderBy: { id: 'asc' } });

  res.json(tasks.map(formatTask));
}

export async function getTask(req: Request, res: Response) {
  const id = idSchema.parse(req.params.id);

  const task = await findTaskForUser(id, req.user);
  if (!task) {
    res.status(404).json({ message: 'Tarefa não encontrada' });
    return;
  }

  res.json(formatTask(task));
}

// Admin edita qualquer tarefa, membro só as tarefas dele
export async function updateTask(req: Request, res: Response) {
  const id = idSchema.parse(req.params.id);
  const data = updateTaskSchema.parse(req.body);

  const task = await findTaskForUser(id, req.user);
  if (!task) {
    res.status(404).json({ message: 'Tarefa não encontrada' });
    return;
  }

  if (req.user.role !== 'admin' && task.assignedTo !== req.user.id) {
    res.status(403).json({ message: 'Você só pode editar as tarefas atribuídas a você' });
    return;
  }

  const newStatus = data.status ? toDbStatus(data.status) : undefined;
  const statusChanged = newStatus !== undefined && newStatus !== task.status;

  const updatedTask = await prisma.task.update({
    where: { id },
    data: {
      title: data.title,
      description: data.description,
      priority: data.priority,
      status: newStatus,
      // se o status mudou, salva no histórico
      ...(statusChanged && {
        history: { create: { changedBy: req.user.id, oldStatus: task.status, newStatus } },
      }),
    },
  });

  res.json(formatTask(updatedTask));
}

// Só admin
export async function deleteTask(req: Request, res: Response) {
  const id = idSchema.parse(req.params.id);

  const task = await prisma.task.findUnique({ where: { id } });
  if (!task) {
    res.status(404).json({ message: 'Tarefa não encontrada' });
    return;
  }

  await prisma.task.delete({ where: { id } });

  res.status(204).send();
}

// Só admin
export async function assignTask(req: Request, res: Response) {
  const id = idSchema.parse(req.params.id);
  const { assignedTo } = assignTaskSchema.parse(req.body);

  const task = await prisma.task.findUnique({ where: { id } });
  if (!task) {
    res.status(404).json({ message: 'Tarefa não encontrada' });
    return;
  }

  if (assignedTo !== null && !(await isInTeam(assignedTo, task.teamId))) {
    res.status(400).json({ message: 'O responsável precisa ser membro do time da tarefa' });
    return;
  }

  const updatedTask = await prisma.task.update({ where: { id }, data: { assignedTo } });

  res.json(formatTask(updatedTask));
}

export async function getTaskHistory(req: Request, res: Response) {
  const id = idSchema.parse(req.params.id);

  const task = await findTaskForUser(id, req.user);
  if (!task) {
    res.status(404).json({ message: 'Tarefa não encontrada' });
    return;
  }

  const history = await prisma.taskHistory.findMany({
    where: { taskId: id },
    orderBy: { id: 'asc' },
  });

  res.json(
    history.map((item) => ({
      ...item,
      oldStatus: item.oldStatus ? toApiStatus(item.oldStatus) : null,
      newStatus: toApiStatus(item.newStatus),
    })),
  );
}
