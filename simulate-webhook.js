#!/usr/bin/env node

/**
 * Script para simular um webhook do Asaas localmente
 * Uso: node simulate-webhook.js <PAYMENT_ID> <EVENT_TYPE> [CUSTOMER_EMAIL]
 * Exemplo: node simulate-webhook.js pay_123456 PAYMENT_CONFIRMED teste@email.com
 */

require('dotenv').config();
const axios = require('axios');

const paymentId = process.argv[2] || 'pay_test_123';
const eventType = process.argv[3] || 'PAYMENT_CONFIRMED';
const customerEmail = process.argv[4] || 'teste@codigopassional.com';
const PORT = process.env.PORT || 3000;
const WEBHOOK_TOKEN = process.env.WEBHOOK_TOKEN;

const payload = {
    event: eventType,
    payment: {
        id: paymentId,
        customer: 'cus_test_123',
        value: 24.00,
        billingType: 'PIX',
        status: 'CONFIRMED'
    }
};

// Se for um teste real com paymentId do Asaas, o webhook vai tentar buscar o cliente na API.
// Mas aqui estamos simulando a chegada do POST no nosso servidor.

console.log(`\n🧪 Simulando Webhook do Asaas...`);
console.log(`📡 URL: http://localhost:${PORT}/webhook/asaas`);
console.log(`📦 Evento: ${eventType}`);
console.log(`🆔 Pagamento: ${paymentId}`);
console.log(`🔑 Token: ${WEBHOOK_TOKEN ? 'Enviado' : 'Não configurado'}\n`);

async function sendWebhook() {
    try {
        const response = await axios.post(`http://localhost:${PORT}/webhook/asaas`, payload, {
            headers: {
                'asaas-access-token': WEBHOOK_TOKEN,
                'Content-Type': 'application/json'
            }
        });

        console.log(`✅ Resposta do Servidor: ${response.status} ${response.statusText}`);
        console.log(`📋 Detalhes:`, response.data);
        console.log(`\n💡 Verifique os logs do seu servidor Node.js para ver se o evento Purchase foi disparado para a Meta.`);
    } catch (err) {
        console.error(`❌ Erro ao enviar webhook:`, err.response?.data || err.message);
        if (err.code === 'ECONNREFUSED') {
            console.error(`\n🚨 O servidor não parece estar rodando em http://localhost:${PORT}`);
            console.error(`Execute 'npm run dev' em outro terminal antes de rodar este script.`);
        }
    }
}

sendWebhook();
