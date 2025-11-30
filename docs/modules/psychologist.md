# Módulo Psychologist

Gerencia listagem e busca de psicólogos cadastrados.

## Endpoints

- `GET /v1/psychologists`: Lista psicólogos públicos, com filtros e paginação
- `GET /v1/psychologists/:id`: Busca psicólogo por ID

## Funcionalidades

- Filtro por nome
- Paginação
- Retorno de dados como nome, custo da sessão, bio, especializações e WhatsApp

## DTO principal

- `FindPsychologistDTO`: id, name, sessionCost, bio, specializations, whatsapp
