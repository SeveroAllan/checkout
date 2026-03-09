const express = require('express');
const router = express.Router();
const meta = require('../services/meta');

/**
 * POST /api/meta-test
 * 
 * Endpoint para testar disparo de eventos Meta
 * 
 * Query params:
 *   event: 'Purchase' (padrão), 'InitiateCheckout', etc.
 *   testCode: código de teste (ex: TEST58888)
 * 
 * Exemplo:
 *   POST /api/meta-test?event=Purchase&testCode=TEST58888
 */

router.post('/', async (req, res) => {
  const { event = 'Purchase', testCode } = req.query;
  
  console.log('\n🧪 Teste de Evento Meta Iniciado');
  console.log(`   Event: ${event}`);
  console.log(`   Test Code: ${testCode || '(não informado)'}\n`);
  
  // Dados de teste
  const testData = {
    eventName: event,
    email: 'teste@codigopassional.com',
    phone: '11999999999',
    value: 24.00,
    orderId: `test_${Math.floor(Date.now() / 1000)}`,
    currency: 'BRL',
    testCode: testCode,
  };
  
  try {
    // Dispara o evento
    await meta.sendEvent(testData);
    
    return res.json({
      success: true,
      message: `Evento ${event} disparado com sucesso`,
      data: {
        eventName: testData.eventName,
        email: testData.email,
        phone: testData.phone,
        value: testData.value,
        orderId: testData.orderId,
        testCode: testData.testCode,
      },
      nextSteps: [
        'Acesse: https://business.facebook.com/events_manager',
        `Selecione o Pixel: ${process.env.META_PIXEL_ID}`,
        'Procure na aba "Teste Seu Pixel"',
        testCode ? `Procure pelo código: ${testCode}` : 'Procure pelo evento mais recente',
        `Verifique se o evento "${event}" foi recebido`
      ]
    });
  } catch (err) {
    console.error('❌ Erro ao disparar evento:', err.message);
    
    return res.status(400).json({
      success: false,
      error: err.message,
      tips: [
        'Verifique se META_PIXEL_ID está configurado',
        'Verifique se META_ACCESS_TOKEN está válido',
        'Confira se o token não expirou',
        'Verifique os logs do servidor para mais detalhes'
      ]
    });
  }
});

module.exports = router;
