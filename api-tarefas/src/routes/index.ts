import { Router } from 'express';
import * as authController from '../controllers/authController';
import * as taskController from '../controllers/taskController';
import * as teamController from '../controllers/teamController';
import * as userController from '../controllers/userController';
import { auth } from '../middlewares/auth';
import { isAdmin } from '../middlewares/isAdmin';

const routes = Router();

routes.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Autenticação
routes.post('/register', authController.register);
routes.post('/login', authController.login);

// Usuários (admin)
routes.get('/users', auth, isAdmin, userController.listUsers);
routes.patch('/users/:id/role', auth, isAdmin, userController.changeRole);

// Times
routes.post('/teams', auth, isAdmin, teamController.createTeam);
routes.get('/teams', auth, isAdmin, teamController.listTeams);
routes.put('/teams/:id', auth, isAdmin, teamController.updateTeam);
routes.delete('/teams/:id', auth, isAdmin, teamController.deleteTeam);
routes.post('/teams/:id/members', auth, isAdmin, teamController.addMember);
routes.delete('/teams/:id/members/:userId', auth, isAdmin, teamController.removeMember);
routes.get('/teams/:id/members', auth, teamController.listMembers);

// Tarefas
routes.post('/tasks', auth, isAdmin, taskController.createTask);
routes.get('/tasks', auth, taskController.listTasks);
routes.get('/tasks/:id', auth, taskController.getTask);
routes.put('/tasks/:id', auth, taskController.updateTask);
routes.delete('/tasks/:id', auth, isAdmin, taskController.deleteTask);
routes.patch('/tasks/:id/assign', auth, isAdmin, taskController.assignTask);
routes.get('/tasks/:id/history', auth, taskController.getTaskHistory);

export default routes;
