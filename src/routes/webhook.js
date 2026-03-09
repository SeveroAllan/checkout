const express = require('express');
const router = express.Router();
const asaas = require('../services/asaas');
const meta = require('../services/meta');

// ─── Constantes ───────────────────────────────────────────────────────────────

const CONFIRMED_EVENTS = new Set(['PAYMENT_CONFIRMED', 'PAYMENT_RECEIVED']);

// ─── Validação do token ───────────────────────────────────────────────────────

function validateToken(req, res) {
  const expected = process.env.WEBHOOK_TOKEN;
  const received = req.headers['asaas-access-token'];

  if (!expected) {
    console.warn('⚠️  WEBHOOK_TOKEN não configurado no .env — validação desativada');
    return true;
  }

  if (received !== expected) {
    console.warn(`🚫 Token inválido recebido no webhook: ${received}`);
    res.status(401).send('Unauthorized');
    return false;
  }

  return true;
}

// ─── Handlers ─────────────────────────────────────────────────────────────────

async function onPaymentConfirmed(payment, body) {
  console.log(`\n✅ [WEBHOOK] Pagamento confirmado!`);
  console.log(`   ID:        ${payment.id}`);
  console.log(`   Status:    ${payment.status}`);
  console.log(`   Valor:     R$ ${payment.value}`);
  console.log(`   ClienteID: ${payment.customer}`);

  let email = null;
  let phone = null;

  // 1. Tenta pegar dados do cliente vinculados diretamente ao objeto payment no payload
  // O Asaas costuma enviar um objeto 'customer' com dados básicos se configurado.
  if (body.payment && typeof body.payment.customer === 'object') {
    email = body.payment.customer.email;
    phone = body.payment.customer.mobilePhone || body.payment.customer.phone;
    if (email) console.log(`   💡 Cliente (payload): ${email}`);
  }

  // 2. Busca dados do cliente via API para garantir enriquecimento completo
  try {
    if (!email) {
      console.log(`   🔍 Buscando dados do cliente ${payment.customer} na API Asaas...`);
      const { data: customer } = await asaas.get(`/customers/${payment.customer}`);
      email = customer.email;
      phone = customer.mobilePhone || customer.phone;
      console.log(`   ✅ Cliente (API): ${email}`);
    }

    if (email) {
      await meta.sendEvent({
        eventName: 'Purchase',
        email,
        phone,
        value: payment.value,
        orderId: payment.id,
        testCode: process.env.META_TEST_CODE,
      });
    } else {
      console.warn(`   ⚠️  Não foi possível obter o e-mail do cliente ${payment.customer}. Evento Purchase não disparado.`);
    }
  } catch (err) {
    console.error(`   ❌ Erro ao processar evento Meta para o pagamento ${payment.id}:`, err.response?.data || err.message);
  }

  // TODO: outras ações de negócio aqui (ex: liberar acesso ao produto)
}

function onPaymentOverdue(payment) {
  console.log(`⚠️  Pagamento vencido: ${payment.id} | Valor: R$ ${payment.value}`);
}

function onPaymentDeleted(payment) {
  console.log(`🗑️  Pagamento cancelado/estornado: ${payment.id}`);
}

function onPaymentRefunded(payment) {
  console.log(`↩️  Pagamento reembolsado: ${payment.id} | Valor: R$ ${payment.value}`);
}

// ─── POST /webhook/asaas ──────────────────────────────────────────────────────

router.post('/', express.json(), async (req, res) => {
  if (!validateToken(req, res)) return;

  const { event, payment } = req.body;

  if (!event || !payment) {
    console.warn('⚠️  Payload inválido recebido no webhook');
    return res.status(400).send('Payload inválido');
  }

  console.log(`\n📩 Webhook | Evento: ${event} | ID: ${payment.id} | Status: ${payment.status}`);

  try {
    if (CONFIRMED_EVENTS.has(event)) {
      await onPaymentConfirmed(payment, req.body);
    } else {
      switch (event) {
        case 'PAYMENT_OVERDUE': onPaymentOverdue(payment); break;
        case 'PAYMENT_DELETED': onPaymentDeleted(payment); break;
        case 'PAYMENT_REFUNDED': onPaymentRefunded(payment); break;
        default: console.log(`ℹ️  Evento não tratado: ${event}`);
      }
    }
  } catch (err) {
    console.error(`❌ Erro ao processar webhook ${event}:`, err.message);
  }

  return res.status(200).send('OK');
});

module.exports = router;
