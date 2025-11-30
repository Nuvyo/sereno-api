# Arquitetura do Sistema

O Sereno API utiliza arquitetura modular baseada em NestJS, com separação clara entre entidades, serviços, controllers e módulos. O banco de dados é PostgreSQL, acessado via TypeORM. O sistema adota boas práticas de segurança, como hash de senhas com pepper, autenticação por token e uso de middlewares para tratamento de respostas e exceções.

Principais tecnologias:

- NestJS
- TypeORM
- PostgreSQL
- bcrypt
- dotenv
- Internacionalização customizada

Estrutura de pastas:

- src/core: entidades, serviços, pipes, decorators, middleware
- src/modules: módulos de negócio (auth, psychologist, app)
- src/i18n: arquivos de tradução
