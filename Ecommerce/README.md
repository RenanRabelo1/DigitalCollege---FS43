# Lumina E-commerce

Projeto acadêmico completo em HTML, CSS e JavaScript no frontend, com API REST em Node.js/Express e PostgreSQL hospedado no Neon.

## Requisitos

- Node.js 20 ou superior
- Projeto PostgreSQL criado no Neon
- Connection string do Neon com `sslmode=require`

## Configuração

1. Entre no Neon, abra o projeto e copie a connection string em **Connect**.
2. Abra `backend/.env` e preencha:

```env
DATABASE_URL=postgresql://usuario:senha@host.neon.tech/neondb?sslmode=require&channel_binding=require
JWT_SECRET=uma-chave-aleatoria-com-pelo-menos-32-caracteres
```

3. Instale as dependências e prepare o banco:

```powershell
cd backend
npm.cmd install
npm.cmd run db:setup
```

4. Inicie o projeto:

```powershell
npm.cmd run dev
```

5. Acesse `http://localhost:3000`. O Express serve o frontend e a API no mesmo processo.

## Usuário inicial

- E-mail: `marianasilva@example.com`
- Senha: `Lumina123!`

O usuário é criado pelo `database/seed.sql`. A senha é transformada em hash pelo PostgreSQL com `pgcrypto` e conferida pela API com bcrypt.

## Rotas da API

| Método | Rota | Autenticação | Finalidade |
| --- | --- | --- | --- |
| GET | `/api/health` | Não | Verificar API e banco |
| POST | `/api/auth/register` | Não | Cadastrar usuário |
| POST | `/api/auth/login` | Não | Autenticar e receber JWT |
| GET | `/api/auth/me` | Sim | Consultar usuário atual |
| PUT | `/api/auth/me` | Sim | Atualizar dados do usuário |
| GET | `/api/categories` | Não | Listar categorias |
| POST | `/api/categories` | Sim | Criar categoria |
| GET | `/api/products` | Não | Listar, buscar, filtrar e ordenar produtos |
| GET | `/api/products/best-sellers` | Não | Listar mais vendidos |
| GET | `/api/products/mine` | Sim | Listar produtos do usuário autenticado |
| GET | `/api/products/:id` | Não | Exibir detalhes públicos do produto |
| POST | `/api/products` | Sim | Cadastrar produto para o usuário atual |
| PUT | `/api/products/:id` | Sim | Editar somente produto do usuário atual |
| DELETE | `/api/products/:id` | Sim | Excluir somente produto do usuário atual |

Exemplo de busca: `GET /api/products?search=headphone&category=Eletrônicos&sort=price_asc`.

## Regras implementadas

- “Mais vendidos” usa `quantidade_vendas` em ordem decrescente. A avaliação média e a data de cadastro são critérios de desempate.
- A busca consulta o nome do produto e também descrição e categoria.
- Cadastro, edição, exclusão e listagem privada exigem JWT.
- Edição e exclusão usam simultaneamente o ID do produto e o ID do usuário autenticado, impedindo acesso a produtos de outra pessoa.
- Todo produto pertence a uma categoria. Um novo nome de categoria enviado no cadastro é criado dentro da mesma transação.
- Nome, descrição, preço, categoria e URL de imagem são obrigatórios.
- A API devolve erros JSON com código, mensagem clara e erros específicos por campo quando aplicável.
- O Dashboard consome os dados do usuário autenticado e somente os produtos dele.

## Banco de dados

- `database/schema.sql`: tabelas, relacionamentos, validações, índices e gatilhos de atualização.
- `database/seed.sql`: categorias, usuários e produtos iniciais.

Os scripts podem ser executados pelo comando `npm run db:setup` ou colados no SQL Editor do Neon, primeiro o schema e depois o seed.

## Observação sobre segurança

Não publique `backend/.env`. O arquivo está ignorado pelo Git. Em produção, use uma chave JWT exclusiva e restrinja `FRONTEND_ORIGINS` ao endereço real do frontend.

Referências: [Neon connection strings](https://neon.com/docs/connect/connect-from-any-app), [Express 5](https://expressjs.com/en/5x/api.html) e [node-postgres](https://node-postgres.com/features/queries).
