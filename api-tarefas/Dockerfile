FROM node:22-slim

WORKDIR /app

# O Prisma precisa do openssl
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

EXPOSE 3000

# Aplica as migrations e inicia a API
CMD ["npm", "run", "start:prod"]
