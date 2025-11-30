# Módulo Auth

Gerencia autenticação, cadastro, atualização e cancelamento de conta de usuários.

## Endpoints

- `POST /v1/auth/signup`: Cadastro de usuário
- `POST /v1/auth/signin`: Login
- `GET /v1/auth/me`: Dados do usuário autenticado
- `PATCH /v1/auth/me`: Atualização de dados do usuário
- `POST /v1/auth/signout`: Logout
- `DELETE /v1/auth/cancel-account`: Cancelamento de conta

## Funcionalidades

- Validação de dados com mensagens traduzidas
- Autenticação via token de sessão
- Hash de senha com pepper
- Middleware para tratamento de respostas e exceções

## DTOs principais

- `SignupDTO`, `SigninDTO`, `UpdateMeDTO`, `MeResponseDTO`, `BaseMessageDTO`
