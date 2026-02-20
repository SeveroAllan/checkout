const express = require('express');
const router = express.Router();
const asaas = require('../services/asaas');

// ─── Helpers ──────────────────────────────────────────────────────────────────

function today() {
  return new Date().toISOString().split('T')[0];
}

function extractAsaasError(error) {
  const data = error.response?.data;
  if (data?.errors?.length) {
    return data.errors.map(e => e.description).join(', ');
  }
  return data?.message || error.message || 'Erro desconhecido';
}

// ─── POST /api/checkout ────────────────────────────────────────────────────────

router.post('/', async (req, res) => {
  const { name, email, cpf, phone, billingType, card, installments } = req.body;

  // Validação básica dos campos obrigatórios
  if (!name || !email || !cpf || !phone || !billingType) {
    return res.status(400).json({ error: 'Campos obrigatórios faltando.' });
  }

  if (!['CREDIT_CARD', 'PIX'].includes(billingType)) {
    return res.status(400).json({ error: 'billingType inválido.' });
  }

  try {
    // ── PASSO 1: Criar ou recuperar cliente ─────────────────────────────────

    // Tenta buscar cliente pelo CPF antes de criar um novo
    let customerId;

    const existing = await asaas.get('/customers', {
      params: { cpfCnpj: cpf.replace(/\D/g, '') },
    });

    if (existing.data?.data?.length > 0) {
      customerId = existing.data.data[0].id;
      console.log(`👤 Cliente existente encontrado: ${customerId}`);
    } else {
      // Cliente não encontrado, criar novo
      const customerName = name || (card ? card.holderName : email.split('@')[0]);

      try {
        const newCustomer = await asaas.post('/customers', {
          name: customerName,
          email,
          cpfCnpj: cpf.replace(/\D/g, ''),
          phone: phone.replace(/\D/g, ''),
          notificationDisabled: false,
        });
        customerId = newCustomer.data.id;
        console.log(`✅ Novo cliente criado: ${customerId}`);
      } catch (err) {
        console.error('Erro ao criar cliente:', err.response?.data || err.message);
        // Tenta recuperar se falhar por duplicação
        if (err.response?.data?.errors?.[0]?.code === 'J_001') {
          // Tenta buscar de novo caso tenha dado erro de duplicidade
          const retry = await asaas.get('/customers', { params: { email } });
          customerId = retry.data?.data?.[0]?.id;
        }
        if (!customerId) {
          const apiMsg = err.response?.data?.errors?.[0]?.description;
          throw new Error(apiMsg || err.message || 'Falha ao criar/identificar cliente Asaas.');
        }
      }
    }

    // ── PASSO 2: Criar cobrança ──────────────────────────────────────────────

    const isCard = billingType === 'CREDIT_CARD';
    const numInstallments = isCard ? parseInt(installments) || 1 : undefined;

    // Valores de exemplo (adapte ao seu produto)
    // Valores de exemplo (adapte ao seu produto)
    const VALUE_CASH = 5.00; // à vista (Pix)
    const VALUE_FULL = 5.00; // total no cartão
    const VALUE_INSTALL = parseFloat((VALUE_FULL / numInstallments).toFixed(2));

    const paymentPayload = {
      customer: customerId,
      billingType,
      dueDate: today(),
      description: 'Código Passional — Guia completo com técnicas de reconstrução de relacionamento.',
    };

    if (isCard) {
      if (numInstallments > 1) {
        paymentPayload.installmentCount = numInstallments;
        paymentPayload.installmentValue = VALUE_INSTALL;
      } else {
        paymentPayload.value = VALUE_FULL;
      }
    } else {
      paymentPayload.value = VALUE_CASH;
    }

    const payment = await asaas.post('/payments', paymentPayload);
    const paymentId = payment.data.id;
    console.log(`💳 Cobrança criada: ${paymentId}`);

    // ── PASSO 3a: Processar cartão de crédito ───────────────────────────────

    if (isCard) {
      if (!card) {
        return res.status(400).json({ error: 'Dados do cartão não informados.' });
      }

      const [expiryMonth, expiryYear] = card.expiry.split('/');

      await asaas.post(`/payments/${paymentId}/payWithCreditCard`, {
        creditCard: {
          holderName: card.holderName,
          number: card.number.replace(/\s/g, ''),
          expiryMonth,
          expiryYear: `20${expiryYear}`,
          ccv: card.cvv,
        },
        creditCardHolderInfo: {
          name: name || card.holderName,
          cpfCnpj: cpf.replace(/\D/g, ''),
          email: email,
          phone: phone.replace(/\D/g, ''),
          // Adapte os campos de endereço se necessário
          postalCode: card.postalCode || '01310100',
          addressNumber: card.addressNumber || '1',
        },
      });

      console.log(`✅ Cartão processado com sucesso para pagamento ${paymentId}`);

      return res.json({
        success: true,
        paymentId,
        status: 'CONFIRMED',
        message: 'Pagamento aprovado com sucesso!',
      });
    }

    // ── PASSO 3b: Gerar QR Code Pix ─────────────────────────────────────────

    if (billingType === 'PIX') {
      const pixRes = await asaas.get(`/payments/${paymentId}/pixQrCode`);
      const { encodedImage, payload, expirationDate } = pixRes.data;

      console.log(`✅ QR Code Pix gerado para pagamento ${paymentId}`);

      return res.json({
        success: true,
        paymentId,
        status: 'PENDING',
        qrCode: encodedImage,   // base64 da imagem
        pixPayload: payload,         // código copia e cola
        expirationDate,
      });
    }

  } catch (error) {
    const msg = extractAsaasError(error);
    console.error(`❌ Erro no checkout: ${msg}`);
    return res.status(400).json({ error: msg });
  }
});

// ─── GET /api/checkout/status/:paymentId ──────────────────────────────────────
// Útil para checar se o Pix foi pago (polling ou webhook)

router.get('/status/:paymentId', async (req, res) => {
  try {
    const payment = await asaas.get(`/payments/${req.params.paymentId}`);
    const { id, status, value, billingType, confirmedDate } = payment.data;

    return res.json({ id, status, value, billingType, confirmedDate });
  } catch (error) {
    return res.status(400).json({ error: extractAsaasError(error) });
  }
});

module.exports = router;
