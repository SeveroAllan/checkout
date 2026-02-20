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

async function onPaymentConfirmed(payment) {
  console.log(`✅ Pagamento confirmado!`);
  console.log(`   ID:      ${payment.id}`);
  console.log(`   Cliente: ${payment.customer}`);
  console.log(`   Valor:   R$ ${payment.value}`);
  console.log(`   Tipo:    ${payment.billingType}`);

  // Busca dados do cliente para enriquecer o evento Meta CAPI
  try {
    const { data: customer } = await asaas.get(`/customers/${payment.customer}`);

    await meta.sendEvent({
      eventName: 'Purchase',
      email: customer.email,
      phone: customer.mobilePhone || customer.phone,
      value: payment.value,
      orderId: payment.id,
    });
  } catch (err) {
    console.error('❌ Erro ao enriquecer evento Meta:', err.message);
  }

  // TODO: outras ações de negócio aqui
  // await sendAccessEmail(payment.customer);
  // await db.markAsPaid(payment.id);
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
      await onPaymentConfirmed(payment);
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
