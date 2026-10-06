import { Request, Response } from 'express';
import { prisma, userSelect } from '../prisma';
import { idSchema, memberSchema, teamSchema } from '../schemas';
import { isInTeam } from '../services/teamService';

export async function createTeam(req: Request, res: Response) {
  const data = teamSchema.parse(req.body);

  const team = await prisma.team.create({ data });

  res.status(201).json(team);
}

export async function listTeams(req: Request, res: Response) {
  const teams = await prisma.team.findMany({ orderBy: { id: 'asc' } });
  res.json(teams);
}

export async function updateTeam(req: Request, res: Response) {
  const id = idSchema.parse(req.params.id);
  const data = teamSchema.parse(req.body);

  const team = await prisma.team.findUnique({ where: { id } });
  if (!team) {
    res.status(404).json({ message: 'Time não encontrado' });
    return;
  }

  const updatedTeam = await prisma.team.update({ where: { id }, data });

  res.json(updatedTeam);
}

export async function deleteTeam(req: Request, res: Response) {
  const id = idSchema.parse(req.params.id);

  const team = await prisma.team.findUnique({ where: { id } });
  if (!team) {
    res.status(404).json({ message: 'Time não encontrado' });
    return;
  }

  // Os membros e as tarefas do time são apagados junto (onDelete: Cascade no schema)
  await prisma.team.delete({ where: { id } });

  res.status(204).send();
}

export async function addMember(req: Request, res: Response) {
  const teamId = idSchema.parse(req.params.id);
  const { userId } = memberSchema.parse(req.body);

  const team = await prisma.team.findUnique({ where: { id: teamId } });
  if (!team) {
    res.status(404).json({ message: 'Time não encontrado' });
    return;
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    res.status(404).json({ message: 'Usuário não encontrado' });
    return;
  }

  if (await isInTeam(userId, teamId)) {
    res.status(409).json({ message: 'Esse usuário já está no time' });
    return;
  }

  const member = await prisma.teamMember.create({ data: { teamId, userId } });

  res.status(201).json(member);
}

export async function removeMember(req: Request, res: Response) {
  const teamId = idSchema.parse(req.params.id);
  const userId = idSchema.parse(req.params.userId);

  if (!(await isInTeam(userId, teamId))) {
    res.status(404).json({ message: 'Esse usuário não está no time' });
    return;
  }

  // As tarefas do time que estavam com esse usuário ficam sem responsável
  await prisma.task.updateMany({
    where: { teamId, assignedTo: userId },
    data: { assignedTo: null },
  });
  await prisma.teamMember.delete({ where: { userId_teamId: { userId, teamId } } });

  res.status(204).send();
}

// Admin vê os membros de qualquer time, membro só vê os do time dele
export async function listMembers(req: Request, res: Response) {
  const teamId = idSchema.parse(req.params.id);

  const team = await prisma.team.findUnique({ where: { id: teamId } });
  if (!team) {
    res.status(404).json({ message: 'Time não encontrado' });
    return;
  }

  if (req.user.role !== 'admin' && !(await isInTeam(req.user.id, teamId))) {
    res.status(403).json({ message: 'Você não faz parte deste time' });
    return;
  }

  const members = await prisma.teamMember.findMany({
    where: { teamId },
    include: { user: { select: userSelect } },
    orderBy: { id: 'asc' },
  });

  res.json(members.map((member) => member.user));
}
