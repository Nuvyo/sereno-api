# API de Autenticação

## Endpoints

### POST /v1/auth/signup

- Cadastro de usuário (paciente ou psicólogo)
- Body: SignupDTO
- Resposta: BaseMessageDTO

### POST /v1/auth/signin

- Login
- Body: SigninDTO
- Resposta: Session

### GET /v1/auth/me

- Retorna dados do usuário autenticado
- Header: Authorization: Bearer <token>
- Resposta: MeResponseDTO

### PATCH /v1/auth/me

- Atualiza dados do usuário
- Header: Authorization: Bearer <token>
- Body: UpdateMeDTO
- Resposta: BaseMessageDTO

### POST /v1/auth/signout

- Logout
- Header: Authorization: Bearer <token>
- Resposta: BaseMessageDTO

### DELETE /v1/auth/cancel-account

- Cancela a conta do usuário
- Header: Authorization: Bearer <token>
- Resposta: BaseMessageDTO
