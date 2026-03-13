#!/usr/bin/env node

/**
 * Script de teste para disparar um evento de compra (Purchase) na Meta Conversions API
 * Uso: node test-meta-purchase.js TEST58888
 */

require('dotenv').config();
const meta = require('./src/services/meta');

const testCode = process.argv[2] || process.env.META_TEST_CODE || 'TEST92057';

console.log('\n🚀 Iniciando teste de evento de compra (Purchase) para Meta Ads');
console.log(`📋 Código de teste: ${testCode}\n`);

// Dados simulados para o teste
const testData = {
  eventName: 'Purchase',
  email: 'teste@codigopassional.com',
  phone: '11999999999',
  value: 97.00,
  orderId: `test_${Date.now()}`,
  currency: 'BRL',
  testCode: testCode,
};

console.log('📊 Dados do evento:');
console.log(`   Event Name: ${testData.eventName}`);
console.log(`   Email: ${testData.email}`);
console.log(`   Phone: ${testData.phone}`);
console.log(`   Value: R$ ${testData.value}`);
console.log(`   Currency: ${testData.currency}`);
console.log(`   Order ID: ${testData.orderId}`);
console.log(`   Test Code: ${testData.testCode}`);
console.log('');

(async () => {
  try {
    await meta.sendEvent(testData);
    console.log('✅ Teste concluído com sucesso!');
    console.log('\n💡 Próximas etapas:');
    console.log('   1. Acesse o Gerenciador de Eventos Meta Ads');
    console.log(`   2. Procure pelo código de teste: ${testCode}`);
    console.log('   3. Verifique se o evento "Purchase" foi recebido');
    console.log('   4. Valide os dados (email hasheado, valor, moeda, etc.)');
  } catch (err) {
    console.error('❌ Erro ao disparar evento:');
    console.error(err.message);
    process.exit(1);
  }
})();
