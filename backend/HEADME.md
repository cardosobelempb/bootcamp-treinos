# 🏋️ BootcampFit — Fullstack Application

Aplicação Fullstack desenvolvida com foco em:

- 🧱 Arquitetura limpa
- 🔐 Autenticação moderna
- 📦 Código escalável
- 🧪 Base pronta para testes
- 📊 Documentação automática
- 🧠 Type safety ponta a ponta

---

# 🏗 Arquitetura do Projeto

```bash
bootcampfit/
│
├── backend/    → API REST (Fastify + Prisma + Better Auth)
├── frontend/   → Aplicação Web (React + TypeScript)
│
└── README.md
```

---

# 🔵 Backend

---

## 🧰 Stack

- Node.js
- TypeScript 5.x
- Fastify 5.x
- Prisma ORM 7.x
- PostgreSQL
- Zod
- Swagger
- Better Auth
- ESLint + Prettier

---

## 🚀 Setup do Backend

```bash
cd backend
npm init -y
```

---

## 📦 Instalação das Dependências

### 🔹 Core

```bash
npm install fastify@5.7.4
npm install dotenv@17.3.1
npm install zod@4.3.6 fastify-type-provider-zod@6.1.0
npm install @fastify/swagger@9.7.0 @fastify/swagger-ui@5.2.5
```

---

### 🔐 Autenticação

```bash
npm install better-auth@1.4.18
```

> Better Auth será responsável por:

- Login
- Registro
- Gestão de sessão
- Tokens seguros

---

### 🛢 Banco de Dados

```bash
npm install prisma@7.4.0 -D
npm install @prisma/client@7.4.0 @prisma/adapter-pg@7.4.0 pg
npm install @types/pg -D
```

Inicializar:

```bash
npx prisma init
npx prisma push
```

---

### 🧠 TypeScript

```bash
npm i typescript@5.9.3 @types/node@24 -D
npx tsc --init
npm i tsx@4.21.0 -D
```

---

### 🧹 ESLint + Prettier

```bash
npm i eslint@9.39.2 -D
npm i prettier@3.8.1 -D
npm i eslint-config-prettier@10.1.8 -D
npm i eslint-plugin-simple-import-sort@12.1.1 -D
```

Wizard:

```bash
npm create @eslint/config@1.11.0
```

---

## ⚙️ Variáveis de Ambiente

Criar `.env`:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/bootcampfit"
PORT=3333
BETTER_AUTH_SECRET="super_secret_key"
```

⚠ Nunca versionar `.env`
Crie `.env.example` no repositório.

---

## 📁 Estrutura Backend

```bash
backend/
├── src/
│   ├── modules/
│   │   ├── auth/
│   │   ├── user/
│   │   └── workout/
│   │
│   ├── config/
│   ├── plugins/
│   ├── app.ts
│   └── server.ts
│
├── prisma/
├── .env
└── package.json
```

---

## ▶ Rodando o Backend

```bash
npm run dev
```

Swagger disponível em:

```
http://localhost:3333/docs
```

---

# 🟣 Frontend

---

## 🚀 Criando com Vite + React + TS

```bash
npm create vite@latest frontend
```

Selecionar:

- React
- TypeScript

Depois:

```bash
cd frontend
npm install
```

---

## 📦 Configurar comunicação com backend

Criar:

`frontend/src/services/api.ts`

```ts
import axios from "axios";

export const api = axios.create({
  baseURL: "http://localhost:3333",
  withCredentials: true,
});
```

---

## ▶ Rodando Frontend

```bash
npm run dev
```

---

# 🔐 Fluxo de Autenticação (Better Auth)

### 📌 Estratégia

- Registro → cria usuário no banco
- Login → gera sessão/token
- Middleware → protege rotas privadas
- Logout → invalida sessão

### 📌 Recomendações

- Criar módulo `auth/`
- Separar controller, service e schema
- Usar Zod para validação
- Criar middleware de autenticação

---

# 🧠 Boas Práticas Aplicadas

| Prática                    | Justificativa             |
| -------------------------- | ------------------------- |
| Separação backend/frontend | Deploy independente       |
| TypeScript                 | Segurança de tipo         |
| Prisma                     | Produtividade e segurança |
| Zod                        | Validação robusta         |
| Better Auth                | Segurança moderna         |
| Swagger                    | Contrato documentado      |
| ESLint                     | Código consistente        |
