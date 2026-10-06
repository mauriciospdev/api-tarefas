// Faz o TypeScript saber que o middleware de autenticação coloca o usuário em req.user
declare namespace Express {
  interface Request {
    user: {
      id: number;
      name: string;
      email: string;
      role: 'admin' | 'member';
    };
  }
}
