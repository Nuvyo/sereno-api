# Estrutura do Banco de Dados

Principais entidades:

## User
- id (uuid)
- name (string)
- email (string)
- password (string, hash)
- photo (string, opcional)
- psychologist (boolean)
- public (boolean)
- crp (string)
- validCRP (boolean)
- specializations (array de enum)
- whatsapp (string)
- sessions (relacionamento 1:N com Session)

## Session
- id (uuid)
- token (string, único)
- expiresAt (datetime)
- maxAge (int)
- userId (uuid, FK para User)

## Relacionamentos
- Um usuário pode ter várias sessões (User 1:N Session)
