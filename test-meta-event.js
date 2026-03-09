#!/usr/bin/env node

/**
 * Script universal para testar eventos da Meta Conversions API (CAPI)
 * Uso: node test-meta-event.js <EVENT_NAME> [TEST_CODE]
 * Exemplo: node test-meta-event.js InitiateCheckout TEST58888
 * Exemplo: node test-meta-event.js Purchase TEST58888
 */

require('dotenv').config();
const meta = require('./src/services/meta');

const eventName = process.argv[2];
const testCode = process.argv[3] || process.env.META_TEST_CODE || 'TEST' + Math.floor(10000 + Math.random() * 90000);

if (!eventName) {
  console.error('\n❌ Erro: Nome do evento não informado.');
  console.log('Uso: node test-meta-event.js <EVENT_NAME> [TEST_CODE]');
  console.log('Exemplos:');
  console.log('  node test-meta-event.js InitiateCheckout TEST58888');
  console.log('  node test-meta-event.js Purchase TEST58888\n');
  process.exit(1);
}

console.log(`\n🚀 Iniciando teste de evento: ${eventName}`);
console.log(`📋 Código de teste: ${testCode}\n`);

// Dados simulados para o teste
const testData = {
  eventName: eventName,
  email: 'teste@codigopassional.com',
  phone: '11999999999',
  value: 24.00,
  orderId: `test_${Date.now()}`,
  currency: 'BRL',
  testCode: testCode,
};

console.log('📊 Dados do payload:');
Object.entries(testData).forEach(([key, val]) => {
  console.log(`   ${key}: ${val}`);
});
console.log('');

(async () => {
  try {
    await meta.sendEvent(testData);
    console.log('\n✅ Evento enviado com sucesso para a Meta API!');
    console.log('\n💡 Próximas etapas:');
    console.log('   1. Acesse o Gerenciador de Eventos Meta Ads');
    console.log(`   2. Selecione o Pixel: ${process.env.META_PIXEL_ID}`);
    console.log(`   3. Vá na aba "Testar Eventos"`);
    console.log(`   4. Verifique se o evento "${eventName}" aparece com o código ${testCode}`);
  } catch (err) {
    console.error('\n❌ Erro ao disparar evento:');
    console.error(err.message);
    process.exit(1);
  }
})();
