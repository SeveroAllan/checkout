# 🧪 Testando Evento Meta via Endpoint HTTP

Agora você pode testar disparando uma requisição HTTP simples para o servidor!

## Opção 1: Via curl (Mais Simples)

```bash
curl -X POST "http://localhost:3000/api/meta-test?event=Purchase&testCode=TEST58888"
```

**Resposta esperada:**
```json
{
  "success": true,
  "message": "Evento Purchase disparado com sucesso",
  "data": {
    "eventName": "Purchase",
    "email": "teste@codigopassional.com",
    "phone": "11999999999",
    "value": 97.00,
    "orderId": "test_1710000000",
    "testCode": "TEST58888"
  },
  "nextSteps": [
    "Acesse: https://business.facebook.com/events_manager",
    "Selecione o Pixel: 27522785837335197",
    "Procure na aba \"Teste Seu Pixel\"",
    "Procure pelo código: TEST58888",
    "Verifique se o evento \"Purchase\" foi recebido"
  ]
}
```

## Opção 2: Via Postman

1. **Nova Requisição:**
   - Method: POST
   - URL: `http://localhost:3000/api/meta-test?event=Purchase&testCode=TEST58888`

2. **Clique em "Send"**

## Opção 3: Via Browser

Simplesmente cole na barra de endereços (abre em nova aba):
```
http://localhost:3000/api/meta-test?event=Purchase&testCode=TEST58888
```

Aguarde a página responder com JSON.

## Parâmetros Disponíveis

### Query Params:
- `event` (default: "Purchase"): Nome do evento
  - Valores: "Purchase", "InitiateCheckout", "ViewContent", etc.
- `testCode` (optional): Código de teste do Meta
  - Exemplo: TEST58888

### Exemplos:

```bash
# Teste simples
curl -X POST "http://localhost:3000/api/meta-test?testCode=TEST58888"

# Com evento customizado
curl -X POST "http://localhost:3000/api/meta-test?event=InitiateCheckout&testCode=TEST58888"

# Sem código de teste
curl -X POST "http://localhost:3000/api/meta-test?event=Purchase"
```

## Como Usar:

### 1. Inicie o servidor (se não estiver rodando)
```bash
npm start
```

### 2. Execute o teste
```bash
curl -X POST "http://localhost:3000/api/meta-test?event=Purchase&testCode=TEST58888"
```

### 3. Verifique no Gerenciador de Eventos Meta
1. Acesse: https://business.facebook.com/events_manager
2. Selecione seu Pixel
3. Vá para "Teste Seu Pixel"
4. Procure pelo código TEST58888
5. Verifique se o evento "Purchase" foi recebido

## Se Deu Erro...

### Erro: "success": false
- Verifique se META_ACCESS_TOKEN está válido
- Confira se o token não expirou
- Verifique o console do servidor para mais detalhes

### Erro: Timeout ou Connection Refused
- O servidor não está rodando
- Execute: `npm start`

### Erro: Meta retorna erro
- Verifique se META_PIXEL_ID está correto
- Regenere o token em Meta Ads Manager se necessário

## Debug Avançado

Se você quer ver os logs completos, execute o servidor em modo verbose:

```bash
npm start
```

Então execute o teste em outro terminal:

```bash
curl -X POST "http://localhost:3000/api/meta-test?event=Purchase&testCode=TEST58888"
```

O servidor exibirá:
- Dados do evento sendo enviado
- Resposta da API Meta
- Confirmação se foi recebido

---

**Pronto para testar agora? Execute:**
```bash
curl -X POST "http://localhost:3000/api/meta-test?event=Purchase&testCode=TEST58888"
```
