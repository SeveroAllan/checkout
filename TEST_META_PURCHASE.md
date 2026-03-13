# 🧪 Testando Evento de Compra para Meta Ads

## Método 1: Usando curl (Recomendado para testes rápidos)

```bash
curl -X POST "https://graph.facebook.com/v19.0/27522785837335197/events?access_token=EAANywAoKs98BQZBv2jcQXxpL5BPwmXErWTHL8zJh7jLflA9geh5j43ZCZCnaeMVOyU2ehSsUstsTcts0nzZBe1vRyYT88HYfkkhguKaZBozfpYhB4uHXKOKbSNsREg2UcW1BrUZBUecy9HLuso9ylOTMXJjb5C5Cll5DQ3qKxosUKa0TeRqHeI4tXrvL8pJQZDZD" \
  -H "Content-Type: application/json" \
  -d '{
    "data": [{
      "event_name": "Purchase",
      "event_time": 1710000000,
      "action_source": "website",
      "event_id": "test_'$(date +%s)'_Purchase",
      "user_data": {
        "em": ["84e14d4d812574bed58a797b7a4a58fa26ec1f47b9c31ae1c0c7c32f0fa80f0c"],
        "ph": ["5994471aba01112afcc18159f6cc74b4f511b99806da59b3caf5a9c173cacfc5"]
      },
      "custom_data": {
        "value": 97.00,
        "currency": "BRL",
        "content_ids": ["codigo-passional"],
        "content_type": "product",
        "order_id": "test_'$(date +%s)'"
      }
    }],
    "test_event_code": "TEST58888"
  }'
```

## Método 2: Usando Node.js

```bash
node test-meta-purchase.js TEST58888
```

## Método 3: Usando Python

```bash
python test_meta_purchase.py TEST58888
```

## Método 4: Via Postman

1. Crie uma nova requisição POST
2. URL: `https://graph.facebook.com/v19.0/27522785837335197/events`
3. Query Params: `access_token=EAANywAoKs98BQZBv2jcQXxpL5BPwmXErWTHL8zJh7jLflA9geh5j43ZCZCnaeMVOyU2ehSsUstsTcts0nzZBe1vRyYT88HYfkkhguKaZBozfpYhB4uHXKOKbSNsREg2UcW1BrUZBUecy9HLuso9ylOTMXJjb5C5Cll5DQ3qKxosUKa0TeRqHeI4tXrvL8pJQZDZD`
4. Body (JSON Raw):

```json
{
  "data": [
    {
      "event_name": "Purchase",
      "event_time": 1710000000,
      "action_source": "website",
      "event_id": "test_1710000000_Purchase",
      "user_data": {
        "em": ["84e14d4d812574bed58a797b7a4a58fa26ec1f47b9c31ae1c0c7c32f0fa80f0c"],
        "ph": ["5994471aba01112afcc18159f6cc74b4f511b99806da59b3caf5a9c173cacfc5"]
      },
      "custom_data": {
        "value": 97.00,
        "currency": "BRL",
        "content_ids": ["codigo-passional"],
        "content_type": "product",
        "order_id": "test_1710000000"
      }
    }
  ],
  "test_event_code": "TEST58888"
}
```

## Como Validar o Teste

1. **Acesse o Gerenciador de Eventos do Meta Ads Manager**
   - https://business.facebook.com/events_manager

2. **Procure pelo seu Pixel** (27522785837335197)

3. **Procure pelo código de teste** TEST58888 na seção "Teste Seu Pixel"

4. **Valide:**
   - ✅ Evento foi recebido (status "Ativo")
   - ✅ Event Name: "Purchase"
   - ✅ Value: 97.00 BRL
   - ✅ User Data foi enviado corretamente (email/phone hasheado)

## Dados de Teste

- **Email:** teste@codigopassional.com
  - SHA256: `84e14d4d812574bed58a797b7a4a58fa26ec1f47b9c31ae1c0c7c32f0fa80f0c`

- **Phone:** 11999999999
  - SHA256: `5994471aba01112afcc18159f6cc74b4f511b99806da59b3caf5a9c173cacfc5`

- **Value:** R$ 97.00 BRL
- **Product:** Código Passional
- **Test Code:** TEST58888

## Resolvendo Problemas

### Erro: "Invalid access token"
- Verifique se o token não expirou
- Regenere o token no Meta Ads Manager (App Roles > API Tokens)

### Erro: "Invalid pixel ID"
- Confirme se o Pixel ID está correto (27522785837335197)
- Verifique se o App tem acesso ao Pixel

### Evento não aparece no Gerenciador de Eventos
- Verifique se o `test_event_code` está correto (TEST58888)
- Aguarde 5-10 segundos, o Gerenciador pode demorar para atualizar
- Certifique-se de que o token tem escopo `ads_management` e `pages_read_engagement`

## Próximas Etapas

1. ✅ Teste disparado com sucesso (TEST58888)
2. ⏳ Validar no Gerenciador de Eventos Meta
3. 🔄 Implementar disparo automático do evento quando pagamento for confirmado
4. 🚀 Testar em produção com dados reais

---

**Nota:** O evento de compra será disparado automaticamente quando um pagamento for confirmado via webhook do Asaas no arquivo `src/routes/webhook.js`.
