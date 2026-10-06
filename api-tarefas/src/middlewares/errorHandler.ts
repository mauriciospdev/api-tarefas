import { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(err: unknown, req: Request, res: Response, next: NextFunction) {
  // Erro de validação do Zod
  if (err instanceof ZodError) {
    res.status(400).json({
      message: 'Dados inválidos',
      errors: err.issues.map((issue) => ({ campo: issue.path.join('.'), erro: issue.message })),
    });
    return;
  }

  // JSON mal formatado no body
  if (
    typeof err === 'object' &&
    err !== null &&
    'type' in err &&
    err.type === 'entity.parse.failed'
  ) {
    res.status(400).json({ message: 'JSON inválido' });
    return;
  }

  console.error(err);
  res.status(500).json({ message: 'Erro interno do servidor' });
}
