#!/usr/bin/env node
require('dotenv').config();

console.log('🔍 Variáveis de Ambiente Carregadas:\n');
console.log('ASAAS_ENV:', process.env.ASAAS_ENV);
console.log('ASAAS_KEY:', process.env.ASAAS_KEY ? process.env.ASAAS_KEY.substring(0, 20) + '...' : 'NOT SET');
console.log('META_PIXEL_ID:', process.env.META_PIXEL_ID);
console.log('META_ACCESS_TOKEN:', process.env.META_ACCESS_TOKEN ? process.env.META_ACCESS_TOKEN.substring(0, 20) + '...' : 'NOT SET');
console.log('META_TEST_CODE:', process.env.META_TEST_CODE);
console.log('PORT:', process.env.PORT);
console.log('FRONTEND_URL:', process.env.FRONTEND_URL);
console.log('WEBHOOK_TOKEN:', process.env.WEBHOOK_TOKEN ? 'SET' : 'NOT SET');

// Tentar fazer um teste simples
const axios = require('axios');

(async () => {
  console.log('\n📡 Testando conexão com Meta...\n');
  
  try {
    const url = `https://graph.facebook.com/v19.0/${process.env.META_PIXEL_ID}?access_token=${process.env.META_ACCESS_TOKEN}`;
    const response = await axios.get(url, { timeout: 5000 });
    console.log('✅ Sucesso! Resposta da Meta:');
    console.log(JSON.stringify(response.data, null, 2));
  } catch (err) {
    console.log('❌ Erro:');
    if (err.response) {
      console.log('Status:', err.response.status);
      console.log('Data:', JSON.stringify(err.response.data, null, 2));
    } else {
      console.log('Message:', err.message);
    }
  }
})();
