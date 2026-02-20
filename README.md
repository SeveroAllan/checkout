# 🛒 Checkout Asaas — Node.js + Express

Backend completo para processar pagamentos via **Cartão de Crédito** e **Pix** usando a API do Asaas.

---

## 📁 Estrutura

```
asaas-checkout/
├── public/
│   └── checkout.html          ← Frontend do checkout
├── src/
│   ├── server.js              ← Entry point do servidor
│   ├── services/
│   │   └── asaas.js           ← Cliente HTTP configurado para o Asaas
│   └── routes/
│       ├── checkout.js        ← Lógica de pagamento (cartão + Pix)
│       └── webhook.js         ← Recebe notificações do Asaas
├── .env.example               ← Modelo de variáveis de ambiente
└── package.json
```

---

## 🚀 Como rodar

### 1. Instalar dependências

```bash
npm install
```

### 2. Configurar variáveis de ambiente

```bash
cp .env.example .env
```

Edite o `.env` e preencha:

```env
ASAAS_ENV=sandbox
ASAAS_KEY=$aas_SuaChaveAqui
PORT=3000
FRONTEND_URL=http://localhost:3000
```

> 🔑 Sua chave está em: **Minha Conta → Integrações → Gerar nova chave**
> Para sandbox: https://sandbox.asaas.com

### 3. Iniciar o servidor

```bash
# Desenvolvimento (com auto-reload)
npm run dev

# Produção
npm start
```

Acesse: http://localhost:3000/checkout.html

---

## 🔌 Endpoints

| Método | Rota | Descrição |
|--------|------|-----------|
| `POST` | `/api/checkout` | Processa pagamento (cartão ou Pix) |
| `GET`  | `/api/checkout/status/:id` | Consulta status de um pagamento |
| `POST` | `/webhook/asaas` | Recebe notificações do Asaas |
| `GET`  | `/api/health` | Health check |

---

## 💳 Payload do checkout

### Cartão de Crédito

```json
{
  "name": "João Silva",
  "email": "joao@email.com",
  "cpf": "000.000.000-00",
  "phone": "(11) 99999-9999",
  "billingType": "CREDIT_CARD",
  "installments": "12",
  "card": {
    "holderName": "JOAO SILVA",
    "number": "4111 1111 1111 1111",
    "expiry": "12/28",
    "cvv": "123"
  }
}
```

### Pix

```json
{
  "name": "João Silva",
  "email": "joao@email.com",
  "cpf": "000.000.000-00",
  "phone": "(11) 99999-9999",
  "billingType": "PIX"
}
```

---

## 🧪 Cartões de teste (Sandbox)

| Número | Resultado |
|--------|-----------|
| `4111 1111 1111 1111` | Aprovado |
| `4916 5348 5451 5762` | Aprovado |
| `5184 6191 4678 8398` | Recusado — saldo insuficiente |
| `4000 0000 0000 0002` | Recusado — cartão expirado |

CVV: qualquer 3 dígitos | Validade: qualquer data futura

---

## 📩 Webhook

Configure no painel do Asaas em **Minha Conta → Integrações → Webhooks**:

```
URL: https://seusite.com.br/webhook/asaas
```

Para testar localmente, use o [ngrok](https://ngrok.com):

```bash
ngrok http 3000
# Copie a URL https gerada e configure no painel do Asaas
```

---

## 🌐 Deploy (produção)

1. Suba o código em um servidor (Railway, Render, VPS, etc.)
2. Configure as variáveis de ambiente com `ASAAS_ENV=production`
3. Troque a chave para a de produção (`app.asaas.com`)
4. Atualize o webhook no painel do Asaas para a URL de produção
