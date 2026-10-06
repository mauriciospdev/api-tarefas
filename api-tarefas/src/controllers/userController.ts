import { Request, Response } from 'express';
import { prisma, userSelect } from '../prisma';
import { idSchema, roleSchema } from '../schemas';

export async function listUsers(req: Request, res: Response) {
  const users = await prisma.user.findMany({ select: userSelect, orderBy: { id: 'asc' } });
  res.json(users);
}

// Admin muda o papel (admin/member) de um usuário
export async function changeRole(req: Request, res: Response) {
  const id = idSchema.parse(req.params.id);
  const { role } = roleSchema.parse(req.body);

  if (id === req.user.id) {
    res.status(400).json({ message: 'Você não pode mudar o seu próprio papel' });
    return;
  }

  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) {
    res.status(404).json({ message: 'Usuário não encontrado' });
    return;
  }

  const updatedUser = await prisma.user.update({
    where: { id },
    data: { role },
    select: userSelect,
  });

  res.json(updatedUser);
}
