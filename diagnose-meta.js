#!/usr/bin/env node

/**
 * Script de diagnóstico para testar integração com Meta Conversions API
 * Verifica credenciais, conectividade e valida o payload
 */

require('dotenv').config();
const axios = require('axios');
const crypto = require('crypto');

const PIXEL_ID = process.env.META_PIXEL_ID;
const ACCESS_TOKEN = process.env.META_ACCESS_TOKEN;
const API_VERSION = 'v19.0';
const API_URL = `https://graph.facebook.com/${API_VERSION}/${PIXEL_ID}/events`;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function printSection(title) {
  console.log(`\n${'='.repeat(70)}`);
  console.log(`🔍 ${title}`);
  console.log('='.repeat(70));
}

function sha256(value) {
  return crypto.createHash('sha256').update(value.toLowerCase().trim()).digest('hex');
}

function buildUserData(email, phone) {
  const userData = {};
  if (email) userData.em = [sha256(email)];
  if (phone) userData.ph = [sha256(phone.replace(/\D/g, ''))];
  return userData;
}

// ─── Check Env Vars ───────────────────────────────────────────────────────────

function checkEnvVars() {
  printSection('VERIFICANDO VARIÁVEIS DE AMBIENTE');
  
  let ok = true;
  
  if (!PIXEL_ID) {
    console.log('❌ META_PIXEL_ID não configurado');
    ok = false;
  } else {
    console.log(`✅ META_PIXEL_ID: ${PIXEL_ID}`);
  }
  
  if (!ACCESS_TOKEN) {
    console.log('❌ META_ACCESS_TOKEN não configurado');
    ok = false;
  } else {
    const preview = ACCESS_TOKEN.substring(0, 20) + '...' + ACCESS_TOKEN.substring(ACCESS_TOKEN.length - 10);
    console.log(`✅ META_ACCESS_TOKEN: ${preview}`);
  }
  
  const testCode = process.env.META_TEST_CODE;
  if (testCode) {
    console.log(`✅ META_TEST_CODE: ${testCode}`);
  } else {
    console.log('⚠️  META_TEST_CODE não configurado (será usado padrão)');
  }
  
  return ok;
}

// ─── Check Connectivity ───────────────────────────────────────────────────────

async function checkConnectivity() {
  printSection('VERIFICANDO CONECTIVIDADE COM META');
  
  try {
    const testUrl = `https://graph.facebook.com/${API_VERSION}/${PIXEL_ID}?fields=name&access_token=${ACCESS_TOKEN}`;
    const response = await axios.get(testUrl, { timeout: 5000 });
    
    console.log('✅ Conexão com Meta API bem-sucedida');
    console.log(`   Pixel Name: ${response.data.name || 'N/A'}`);
    return true;
  } catch (err) {
    if (err.response?.status === 401) {
      console.log('❌ Token de acesso inválido ou expirado');
      console.log(`   Response: ${JSON.stringify(err.response.data)}`);
    } else if (err.response?.status === 403) {
      console.log('❌ Acesso negado. Verifique as permissões do token');
      console.log(`   Response: ${JSON.stringify(err.response.data)}`);
    } else if (err.response?.status) {
      console.log(`❌ Erro ao conectar: ${err.response.status}`);
      console.log(`   Response: ${JSON.stringify(err.response.data)}`);
    } else if (err.code === 'ECONNABORTED') {
      console.log('❌ Timeout ao conectar com Meta (timeout de 5s)');
    } else if (err.code === 'ENOTFOUND') {
      console.log('❌ Erro de DNS ao conectar com Meta');
    } else {
      console.log(`❌ Erro de conexão: ${err.message}`);
    }
    return false;
  }
}

// ─── Test Purchase Event ───────────────────────────────────────────────────────

async function testPurchaseEvent(testCode) {
  printSection('DISPARANDO EVENTO DE COMPRA (TEST)');
  
  const testData = {
    email: 'teste@codigopassional.com',
    phone: '11999999999',
    value: 97.00,
    orderId: `test_${Math.floor(Date.now() / 1000)}`,
    currency: 'BRL'
  };
  
  const payload = {
    data: [{
      event_name: 'Purchase',
      event_time: Math.floor(Date.now() / 1000),
      action_source: 'website',
      event_id: `${testData.orderId}_Purchase`,
      user_data: buildUserData(testData.email, testData.phone),
      custom_data: {
        value: testData.value,
        currency: testData.currency,
        content_ids: ['codigo-passional'],
        content_type: 'product',
        order_id: testData.orderId,
      },
    }],
  };
  
  if (testCode) {
    payload.test_event_code = testCode;
  }
  
  console.log('📝 Payload a enviar:');
  console.log(JSON.stringify(payload, null, 2));
  
  console.log(`\n📡 Enviando para: ${API_URL}`);
  console.log(`   Token: ${ACCESS_TOKEN.substring(0, 20)}...${ACCESS_TOKEN.substring(ACCESS_TOKEN.length - 10)}`);
  console.log(`   Pixel ID: ${PIXEL_ID}\n`);
  
  try {
    const response = await axios.post(API_URL, payload, {
      params: { access_token: ACCESS_TOKEN },
      timeout: 8000,
    });
    
    console.log(`📍 Status Code: ${response.status}`);
    console.log('📋 Response JSON:');
    console.log(JSON.stringify(response.data, null, 2));
    
    const eventsReceived = response.data.events_received || 0;
    const fbcQuality = response.data.fbc_quality_score || 'N/A';
    
    if (eventsReceived > 0) {
      console.log('\n✅ SUCESSO! Evento recebido.');
      console.log(`   Events Received: ${eventsReceived}`);
      console.log(`   FBC Quality Score: ${fbcQuality}`);
      return true;
    } else {
      console.log('\n⚠️  Resposta OK mas sem eventos recebidos');
      console.log('   Verifique o payload no Gerenciador de Eventos Meta');
      return false;
    }
  } catch (err) {
    console.log(`📍 Status Code: ${err.response?.status || 'N/A'}`);
    
    if (err.response?.data) {
      console.log('📋 Response:');
      console.log(JSON.stringify(err.response.data, null, 2));
      
      const error = err.response.data.error;
      if (error) {
        console.log(`\n❌ Erro na requisição`);
        console.log(`   Code: ${error.code}`);
        console.log(`   Message: ${error.message}`);
        console.log(`   Type: ${error.type}`);
      }
    } else if (err.code === 'ECONNABORTED') {
      console.log('❌ Timeout ao enviar evento (timeout de 8s)');
    } else if (err.code === 'ENOTFOUND') {
      console.log('❌ Erro de DNS ao enviar evento');
    } else {
      console.log(`❌ Erro: ${err.message}`);
    }
    
    return false;
  }
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('\n' + '='.repeat(70));
  console.log('🔧 DIAGNÓSTICO DE INTEGRAÇÃO - META CONVERSIONS API');
  console.log('='.repeat(70));
  
  const testCode = process.argv[2] || process.env.META_TEST_CODE || 'TEST92057';
  
  // Step 1: Verificar variáveis
  if (!checkEnvVars()) {
    printSection('⚠️  ABORTING');
    console.log('Configure as variáveis de ambiente antes de continuar');
    process.exit(1);
  }
  
  // Step 2: Verificar conectividade
  const connected = await checkConnectivity();
  if (!connected) {
    printSection('⚠️  ABORTING');
    console.log('Não conseguiu conectar com a API Meta');
    console.log('Verifique:');
    console.log('  1. Sua conexão com internet');
    console.log('  2. Se o token de acesso é válido');
    console.log('  3. Se o Pixel ID está correto');
    process.exit(1);
  }
  
  // Step 3: Teste evento
  const success = await testPurchaseEvent(testCode);
  
  // Resumo
  printSection('RESUMO DO DIAGNÓSTICO');
  
  if (success) {
    console.log('✅ TUDO FUNCIONANDO!');
    console.log(`\n💡 Próximas etapas:`);
    console.log('   1. Acesse: https://business.facebook.com/events_manager');
    console.log(`   2. Selecione o Pixel: ${PIXEL_ID}`);
    console.log(`   3. Procure na aba 'Teste Seu Pixel' pelo código: ${testCode}`);
    console.log('   4. Verifique se o evento "Purchase" foi recebido\n');
  } else {
    console.log('❌ FALHAS ENCONTRADAS');
    console.log('\nRecommendações:');
    console.log('   1. Verifique as credenciais no arquivo .env');
    console.log('   2. Confirme se o token não expirou');
    console.log('   3. Regenere o token em Meta Ads Manager se necessário');
    console.log('   4. Verifique se o Pixel ID está correto\n');
  }
  
  process.exit(success ? 0 : 1);
}

main().catch(err => {
  console.error('❌ Erro fatal:', err.message);
  process.exit(1);
});
