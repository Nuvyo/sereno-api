# Módulo App

Responsável por fornecer informações sobre o status do servidor.

## Endpoint

- `GET /`
  - Retorna status do servidor, versão do banco de dados, número de conexões abertas e limite de conexões.

## DTO

- `ServerStatusDTO`: contém informações sobre dependências do sistema, especialmente o banco de dados.

## Exemplo de resposta

```json
{
  "updated_at": "2025-11-29T12:00:00Z",
  "dependencies": {
    "database": {
      "version": "PostgreSQL 15.2",
      "max_connections": 100,
      "opened_connections": 5
    }
  }
}
```
