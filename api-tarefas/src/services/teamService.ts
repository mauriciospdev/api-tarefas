import { prisma } from '../prisma';

// Verifica se o usuário faz parte do time
export async function isInTeam(userId: number, teamId: number) {
  const member = await prisma.teamMember.findUnique({
    where: { userId_teamId: { userId, teamId } },
  });
  return member !== null;
}
