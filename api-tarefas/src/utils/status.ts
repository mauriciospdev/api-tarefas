import { TaskStatus } from '@prisma/client';

// Na API o status é "in-progress", mas no Prisma o nome do enum é "in_progress"
// (não dá para usar hífen em nome de enum no Prisma). Estas funções convertem.
export type ApiStatus = 'pending' | 'in-progress' | 'completed';

export function toDbStatus(status: ApiStatus): TaskStatus {
  return status === 'in-progress' ? 'in_progress' : status;
}

export function toApiStatus(status: TaskStatus): ApiStatus {
  return status === 'in_progress' ? 'in-progress' : status;
}
