import { z } from 'zod';

export const idSchema = z.coerce.number().int().positive();

const statusSchema = z.enum(['pending', 'in-progress', 'completed']);
const prioritySchema = z.enum(['high', 'medium', 'low']);

export const registerSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.email().trim().toLowerCase().max(150),
  password: z.string().min(6).max(72),
});

export const loginSchema = z.object({
  email: z.email().trim().toLowerCase(),
  password: z.string().min(1),
});

export const roleSchema = z.object({
  role: z.enum(['admin', 'member']),
});

export const teamSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional(),
});

export const memberSchema = z.object({
  userId: idSchema,
});

export const createTaskSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().optional(),
  priority: prioritySchema.default('medium'),
  teamId: idSchema,
  assignedTo: idSchema.nullable().optional(),
});

export const updateTaskSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().nullable().optional(),
  priority: prioritySchema.optional(),
  status: statusSchema.optional(),
});

export const assignTaskSchema = z.object({
  assignedTo: idSchema.nullable(),
});

export const listTasksQuerySchema = z.object({
  status: statusSchema.optional(),
  priority: prioritySchema.optional(),
});
