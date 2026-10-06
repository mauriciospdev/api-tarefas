# API de Gerenciamento de Tarefas

Projeto do desafio de criar uma API de gerenciamento de tarefas com Node.js. Os usuários criam conta, fazem login e gerenciam tarefas dentro de times. Cada tarefa tem status, prioridade, responsável e um histórico de mudanças de status.

**Link do deploy:** https://SEU-SERVICO.onrender.com

## Tecnologias

- Node.js, Express e TypeScript
- PostgreSQL com Prisma
- JWT para autenticação (senhas com bcrypt)
- Zod para validação
- Jest e Supertest para testes
- Docker
- Deploy no Render

## Como rodar o projeto

Precisa ter Node.js e Docker instalados.

```bash
# instalar as dependências
npm install

# criar o arquivo .env (depois edite o JWT_SECRET)
cp .env.example .env

# subir o banco de dados
docker compose up -d db

# gerar o prisma client e criar as tabelas
npx prisma generate
npx prisma migrate deploy

# rodar a API
npm run dev
```

A API fica em `http://localhost:3000`. Para testar: `http://localhost:3000/health`.

Também dá para subir tudo com Docker: `docker compose up --build`.

### Variáveis de ambiente

| Variável       | Descrição                                |
| -------------- | ---------------------------------------- |
| `DATABASE_URL` | Connection string do PostgreSQL          |
| `JWT_SECRET`   | Segredo usado para gerar os tokens JWT   |
| `PORT`         | Porta da API (opcional, o padrão é 3000) |

Se `DATABASE_URL` ou `JWT_SECRET` não estiverem definidas, a API não inicia.

## Como rodar os testes

Os testes usam um banco separado chamado `tarefas_test` (criado automaticamente pelo `docker compose` na primeira vez).

```bash
docker compose up -d db
npm test
```

Se o banco `tarefas` já existia antes, crie o de teste com: `docker compose exec db createdb -U postgres tarefas_test`

## Regras de acesso

- O **primeiro usuário** cadastrado vira **admin**. Os próximos são **member**.
- **Admin:** gerencia usuários, times (criar, editar, excluir, adicionar e remover membros) e todas as tarefas (criar, excluir, atribuir e editar).
- **Member:** vê as tarefas do time dele e só pode editar as tarefas atribuídas a ele.

## Endpoints

Todas as rotas, menos `/health`, `/register` e `/login`, precisam do header `Authorization: Bearer <token>`.

| Método | Rota                         | Quem pode               | O que faz                                                   |
| ------ | ---------------------------- | ----------------------- | ----------------------------------------------------------- |
| POST   | `/register`                  | todos                   | Cria conta (`name`, `email`, `password`)                    |
| POST   | `/login`                     | todos                   | Faz login e retorna o token                                 |
| GET    | `/users`                     | admin                   | Lista usuários                                              |
| PATCH  | `/users/:id/role`            | admin                   | Muda o papel do usuário (`admin` ou `member`)               |
| POST   | `/teams`                     | admin                   | Cria time (`name`, `description`)                           |
| GET    | `/teams`                     | admin                   | Lista times                                                 |
| PUT    | `/teams/:id`                 | admin                   | Edita time                                                  |
| DELETE | `/teams/:id`                 | admin                   | Exclui time                                                 |
| POST   | `/teams/:id/members`         | admin                   | Adiciona membro (`{ "userId": 2 }`)                         |
| DELETE | `/teams/:id/members/:userId` | admin                   | Remove membro                                               |
| GET    | `/teams/:id/members`         | admin e membros do time | Lista membros do time                                       |
| POST   | `/tasks`                     | admin                   | Cria tarefa                                                 |
| GET    | `/tasks`                     | todos                   | Lista tarefas (filtros `?status=` e `?priority=`)           |
| GET    | `/tasks/:id`                 | todos                   | Busca uma tarefa                                            |
| PUT    | `/tasks/:id`                 | admin ou responsável    | Edita tarefa (`title`, `description`, `priority`, `status`) |
| DELETE | `/tasks/:id`                 | admin                   | Exclui tarefa                                               |
| PATCH  | `/tasks/:id/assign`          | admin                   | Atribui tarefa (`{ "assignedTo": 2 }`)                      |
| GET    | `/tasks/:id/history`         | todos                   | Histórico de mudanças de status                             |

Status: `pending`, `in-progress`, `completed`. Prioridade: `high`, `medium`, `low`.

Exemplo de criação de tarefa:

```bash
curl -X POST http://localhost:3000/tasks \
  -H "Authorization: Bearer SEU_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title": "Criar tela de login", "teamId": 1, "assignedTo": 2, "priority": "high"}'
```

## Deploy no Render

1. Crie um banco **PostgreSQL** no Render e copie a **Internal Database URL**.
2. Crie um **Web Service** ligado a este repositório:
   - Build Command: `npm install && npm run build`
   - Start Command: `npm run start:prod`
3. Em Environment, adicione `DATABASE_URL` (a URL do banco) e `JWT_SECRET`.
4. Depois do deploy, acesse `/health` para conferir e coloque o link no topo deste README.
5. Faça o primeiro cadastro em `/register`: esse usuário será o admin.

## Estrutura

```
src/
  config/        variáveis de ambiente
  controllers/   lógica de cada rota
  middlewares/   autenticação, admin e erros
  routes/        rotas
  schemas/       validações com Zod
  services/      funções reutilizadas
  utils/         conversão de status
prisma/          schema e migrations
tests/           testes
```
