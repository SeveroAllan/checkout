const crypto = require('crypto');
const axios = require('axios');

// ─── Config ───────────────────────────────────────────────────────────────────

const PIXEL_ID = process.env.META_PIXEL_ID;
const ACCESS_TOKEN = process.env.META_ACCESS_TOKEN;
const API_VERSION = 'v19.0';
const API_URL = `https://graph.facebook.com/${API_VERSION}/${PIXEL_ID}/events`;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function sha256(value) {
    return crypto.createHash('sha256').update(value.toLowerCase().trim()).digest('hex');
}

function buildUserData({ email, phone }) {
    const userData = {};
    if (email) userData.em = [sha256(email)];
    if (phone) userData.ph = [sha256(phone.replace(/\D/g, ''))];
    return userData;
}

// ─── sendEvent ────────────────────────────────────────────────────────────────
// Envia um evento para a Meta Conversions API.
//
// Parâmetros:
//   eventName  — ex: 'Purchase', 'InitiateCheckout'
//   email      — e-mail do cliente (será hasheado)
//   phone      — telefone do cliente (será hasheado, somente dígitos)
//   value      — valor em BRL
//   orderId    — ID do pagamento Asaas (usado para deduplicação com o Pixel)
//   currency   — padrão 'BRL'
//   testCode   — código de teste do Gerenciador de Eventos (ex: 'TEST12345')

async function sendEvent({ eventName, email, phone, value, orderId, currency = 'BRL', testCode }) {
    if (!PIXEL_ID || !ACCESS_TOKEN) {
        console.warn('⚠️  META_PIXEL_ID ou META_ACCESS_TOKEN não configurados — CAPI ignorado.');
        return;
    }

    const payload = {
        data: [{
            event_name: eventName,
            event_time: Math.floor(Date.now() / 1000),
            action_source: 'website',
            event_id: `${orderId}_${eventName}`,   // mesmo event_id do Pixel → deduplicação
            user_data: buildUserData({ email, phone }),
            custom_data: {
                value,
                currency,
                content_ids: ['curso-ingles-completo'],
                content_type: 'product',
                order_id: orderId,
            },
        }],
    };

    if (testCode) payload.test_event_code = testCode;

    try {
        const res = await axios.post(API_URL, payload, {
            params: { access_token: ACCESS_TOKEN },
            timeout: 8000,
        });
        console.log(`📊 Meta CAPI: ${eventName} | events_received: ${res.data.events_received} | fbc_quality: ${res.data.fbc_quality_score ?? 'n/a'}`);
    } catch (err) {
        console.error(`❌ Meta CAPI erro (${eventName}):`, err.response?.data?.error?.message || err.message);
    }
}

module.exports = { sendEvent };
