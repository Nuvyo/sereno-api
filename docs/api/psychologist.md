# API de Psicólogos

## Endpoints

### GET /v1/psychologists

- Lista psicólogos públicos
- Parâmetros de query: like (nome), page, take, order
- Resposta: Array de FindPsychologistDTO + total

### GET /v1/psychologists/:id

- Busca psicólogo por ID
- Parâmetro: id (uuid)
- Resposta: FindPsychologistDTO

## Exemplo de resposta

```json
[
  {
    "id": "uuid",
    "name": "Nome Psicólogo",
    "sessionCost": 80,
    "bio": "Breve descrição",
    "specializations": ["anxiety", "depression"],
    "whatsapp": "+5511999999999"
  }
]
```
